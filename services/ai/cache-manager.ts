import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import crypto from "crypto";

const CACHE_COLLECTION = "ai_request_cache";

export class CacheManager {
  private static hashKey(key: string): string {
    return crypto.createHash("md5").update(key).digest("hex");
  }

  // Simple in-memory LRU cache (Max 100 items)
  private static memoryCache = new Map<string, { payload: any, expiresAt: number }>();
  private static readonly MEMORY_LIMIT = 100;

  static async get<T>(prompt: string, feature: string): Promise<T | null> {
    const key = this.hashKey(`${feature}:${prompt}`);
    
    // 1. Check Memory Cache
    if (this.memoryCache.has(key)) {
        const item = this.memoryCache.get(key)!;
        if (Date.now() < item.expiresAt) {
            // Move to end (LRU)
            this.memoryCache.delete(key);
            this.memoryCache.set(key, item);
            return item.payload as T;
        } else {
            this.memoryCache.delete(key);
        }
    }

    const docRef = doc(db, CACHE_COLLECTION, key);
    
    try {
      // 2. Check Persistent Cache (Firestore)
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const now = Timestamp.now();
        // Check Expiry
        if (data.expiresAt && data.expiresAt.toMillis() > now.toMillis()) {
          const payload = JSON.parse(data.payload);
          
          // Hydrate Memory Cache
          this.addToMemory(key, payload, data.expiresAt.toMillis());
          
          return payload as T;
        }
      }
    } catch (error) {
      console.warn("[AI Cache] Get failed", error);
    }
    return null;
  }

  static async set(prompt: string, feature: string, payload: any, ttlSeconds: number = 86400): Promise<void> {
    const key = this.hashKey(`${feature}:${prompt}`);
    const expiresAtMs = Date.now() + ttlSeconds * 1000;
    
    // 1. Update Memory
    this.addToMemory(key, payload, expiresAtMs);

    try {
      // 2. Update Firestore
      const expiresAt = new Date(expiresAtMs);
      await setDoc(doc(db, CACHE_COLLECTION, key), {
        feature,
        payload: JSON.stringify(payload),
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt)
      });
    } catch (error) {
      console.warn("[AI Cache] Set failed", error);
    }
  }

  private static addToMemory(key: string, payload: any, expiresAt: number) {
      if (this.memoryCache.size >= this.MEMORY_LIMIT) {
          const firstKey = this.memoryCache.keys().next().value;
          if (firstKey) this.memoryCache.delete(firstKey);
      }
      this.memoryCache.set(key, { payload, expiresAt });
  }
}
