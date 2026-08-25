import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, Timestamp, QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import type { Note } from "@/types/crm";

const COLLECTION_NAME = "notes";

function orgCacheKey(orgId: string, suffix: string) { return `notes:${orgId}:${suffix}`; }

function rehydrateTs(val: any) {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val;
  if (typeof val === "object" && "seconds" in val) return new Timestamp(val.seconds, val.nanoseconds);
  return null;
}

export type NoteInput = Omit<Note, "id" | "organizationId" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;

export async function createNote(
  data: NoteInput,
  userId: string,
  ownerName: string,
  organizationId: string
) {
  try {
    const noteData: any = {
      ...data,
      organizationId,
      ownerId: userId,
      ownerName,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), noteData);
    await redis.del(orgCacheKey(organizationId, "list:all"));
    return { success: true, id: docRef.id, error: null };
  } catch (error: any) {
    return { success: false, id: null, error: error.message };
  }
}

export async function getNotes(
  organizationId: string,
  filters?: { relatedType?: string; relatedId?: string; search?: string }
) {
  try {
    // No orderBy here — combining where + orderBy requires a composite index
    // that may not exist. Client-side sort runs below instead.
    const constraints: QueryConstraint[] = [
      where("organizationId", "==", organizationId),
    ];

    if (filters?.relatedId) constraints.push(where("relatedTo.id", "==", filters.relatedId));

    const cacheKey = orgCacheKey(organizationId, "list:all");
    const isUnfiltered = !filters || Object.keys(filters).every(k => !(filters as any)[k]);

    if (isUnfiltered) {
      const cached = await redis.get<Note[]>(cacheKey);
      if (cached) {
        const hydrated = cached.map((n: any) => ({
          ...n,
          createdAt: rehydrateTs(n.createdAt),
          updatedAt: rehydrateTs(n.updatedAt),
        }));
        // Pinned notes first, then by createdAt desc (already ordered from cache)
        hydrated.sort((a: Note, b: Note) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
        return { notes: hydrated, error: null };
      }
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const snap = await getDocs(q);
    let notes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Note));

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      notes = notes.filter((n) => n.content.toLowerCase().includes(s));
    }

    // Sort: pinned first, then by createdAt desc
    const createdAt = (n: Note) => n.createdAt?.toMillis?.() || 0;
    notes.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || createdAt(b) - createdAt(a));

    if (isUnfiltered) {
      await redis.set(cacheKey, notes, { ex: 300 });
    }

    return { notes, error: null };
  } catch (error: any) {
    return { notes: [], error: error.message };
  }
}

export async function getNote(noteId: string) {
  try {
    const snap = await getDoc(doc(db, COLLECTION_NAME, noteId));
    if (!snap.exists()) return { note: null, error: "Note not found" };
    return { note: { id: snap.id, ...snap.data() } as Note, error: null };
  } catch (error: any) {
    return { note: null, error: error.message };
  }
}

export async function updateNote(noteId: string, data: Partial<NoteInput>, organizationId: string) {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, noteId), { ...data, updatedAt: Timestamp.now() });
    await redis.del(orgCacheKey(organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteNote(noteId: string, organizationId: string) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, noteId));
    await redis.del(orgCacheKey(organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleNotePin(noteId: string, isPinned: boolean, organizationId: string) {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, noteId), { isPinned, updatedAt: Timestamp.now() });
    await redis.del(orgCacheKey(organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
