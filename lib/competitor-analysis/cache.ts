/**
 * Caching utilities for competitor analysis
 * Implements 24-hour website cache and 1-week analysis cache
 */

import { adminDb as db } from '@/lib/firebase-admin';
import type { CompetitorCache } from '@/types/competitor-analysis';

const CACHE_COLLECTION = 'marketing/competitor/cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached website content if valid
 */
export async function getCachedWebsiteContent(url: string): Promise<string | null> {
  try {
    const q = await db.collection(CACHE_COLLECTION)
      .where('competitorUrl', '==', url)
      .limit(1)
      .get();

    if (q.empty) {
      return null;
    }

    const doc = q.docs[0];
    const data = doc.data() as CompetitorCache;
    
    // Check expiration
    const now = new Date();
    // Firestore returns Timestamp, but type says Date. Handle both.
    const expiresAt = (data.expiresAt as any).toDate ? (data.expiresAt as any).toDate() : data.expiresAt;

    if (now > expiresAt) {
      // Clean up expired cache asynchronously
      db.collection(CACHE_COLLECTION).doc(doc.id).delete().catch(console.error);
      return null;
    }

    return data.scrapedContent;
  } catch (error) {
    console.error('Cache retrieval failed:', error);
    return null; // Fail safe, just return null
  }
}

/**
 * Cache website content
 */
export async function cacheWebsiteContent(url: string, content: string): Promise<void> {
  try {
    // Check if already exists to update instead of add (avoid duplicates)
    const q = await db.collection(CACHE_COLLECTION)
      .where('competitorUrl', '==', url)
      .limit(1)
      .get();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);
    
    const cacheData: Omit<CompetitorCache, 'id'> = {
      competitorUrl: url,
      scrapedContent: content,
      cachedAt: now,
      expiresAt: expiresAt,
    };

    if (!q.empty) {
      await q.docs[0].ref.update(cacheData);
    } else {
      await db.collection(CACHE_COLLECTION).add(cacheData);
    }
  } catch (error) {
    console.error('Cache storage failed:', error);
    // Non-blocking error
  }
}

/**
 * Invalidate cache for a specific URL
 */
export async function invalidateCache(url: string): Promise<void> {
  try {
    const q = await db.collection(CACHE_COLLECTION)
      .where('competitorUrl', '==', url)
      .get();

    const batch = db.batch();
    q.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Cache invalidation failed:', error);
  }
}

/**
 * Clean up all expired cache entries
 * Can be called by a cron job
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const now = new Date();
    
    const expiredDocs = await db.collection(CACHE_COLLECTION)
      .where('expiresAt', '<', now)
      .get();

    if (expiredDocs.empty) {
      return;
    }

    console.log(`Cleaning up ${expiredDocs.size} expired cache entries...`);

    // Delete in batches of 500
    const batch = db.batch();
    let count = 0;

    expiredDocs.docs.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();
    console.log(`Cleaned up ${count} entries`);
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ total: number; expired: number }> {
  try {
    const allDocs = await db.collection(CACHE_COLLECTION).count().get();
    
    const now = new Date();
    const expiredDocs = await db.collection(CACHE_COLLECTION)
      .where('expiresAt', '<', now)
      .count()
      .get();

    return {
      total: allDocs.data().count,
      expired: expiredDocs.data().count,
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return { total: 0, expired: 0 };
  }
}
