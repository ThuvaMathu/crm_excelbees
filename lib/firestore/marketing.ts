import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  MarketingCampaign, 
  MarketingCompetitor, 
  MarketingKeyword, 
  MarketingContentItem,
  MarketingEmailCampaign,
  MarketingSocialPost,
  MarketingAdCopy,
  MarketingLandingPage,
  MarketingSEOAudit
} from "@/types/marketing";

// --- Collection Refs (Schema) ---
const CAMPAIGNS_COLLECTION = "marketing_campaigns";
const COMPETITORS_COLLECTION = "marketing_competitors";
const KEYWORDS_COLLECTION = "marketing_keywords";
const CONTENT_COLLECTION = "marketing_content_calendar";
const EMAIL_Collection = "marketing_email_campaigns";
const SOCIAL_COLLECTION = "marketing_social_posts";
const ADS_COLLECTION = "marketing_ad_copies";
const LANDING_PAGES_COLLECTION = "marketing_landing_pages";
const SEO_AUDITS_COLLECTION = "marketing_seo_audits";

// --- 1. Campaigns ---
export async function getCampaigns(workspaceId: string) {
  const q = query(
    collection(db, CAMPAIGNS_COLLECTION), 
    where("workspaceId", "==", workspaceId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingCampaign));
}

export async function createCampaign(data: Omit<MarketingCampaign, "id" | "createdAt" | "updatedAt">) {
  return await addDoc(collection(db, CAMPAIGNS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

// --- 2. Competitors ---
export async function getCompetitors(workspaceId: string) {
  const q = query(
    collection(db, COMPETITORS_COLLECTION), 
    where("workspaceId", "==", workspaceId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingCompetitor));
}

// --- 3. Keywords ---
export async function getTrackedKeywords(workspaceId: string) {
  const q = query(
    collection(db, KEYWORDS_COLLECTION), 
    where("workspaceId", "==", workspaceId),
    where("status", "==", "tracked"),
    orderBy("trackedSince", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingKeyword));
}

// --- 4. Content Calendar ---
export async function getContentCalendar(workspaceId: string, start: Date, end: Date) {
  // Firestore composite index might be needed for date filtering
  const q = query(
    collection(db, CONTENT_COLLECTION), 
    where("workspaceId", "==", workspaceId),
    where("scheduledDate", ">=", Timestamp.fromDate(start)),
    where("scheduledDate", "<=", Timestamp.fromDate(end))
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingContentItem));
}

// --- 5. Social Posts ---
export async function getSocialPosts(workspaceId: string) {
  const q = query(
    collection(db, SOCIAL_COLLECTION),
    where("workspaceId", "==", workspaceId),
    orderBy("scheduledTime", "desc"),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingSocialPost));
}

// --- Generic Helper ---
export async function getMarketingStats(workspaceId: string) {
    // Placeholder for aggregated stats query
    return {
        campaigns: (await getCampaigns(workspaceId)).length,
        keywords: (await getTrackedKeywords(workspaceId)).length,
        competitors: (await getCompetitors(workspaceId)).length
    };
}
