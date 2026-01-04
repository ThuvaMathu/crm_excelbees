/**
 * Caching utilities for Keyword Research
 */

import { adminDb as db } from '@/lib/firebase-admin';
import type { BusinessContext } from '@/types/keyword-research';

const CACHE_COLLECTION = 'marketing/keyword/cache';

/**
 * Cache durations in milliseconds
 */
const CACHE_DURATION = {
  BUSINESS_CONTEXT: 7 * 24 * 60 * 60 * 1000, // 7 days
  SITEMAP: 30 * 24 * 60 * 60 * 1000, // 30 days
  PAGE_CONTENT: 14 * 24 * 60 * 60 * 1000, // 14 days
  KEYWORD_METRICS: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/**
 * Get cached business context for a user
 */
export async function getCachedBusinessContext(
  userId: string,
  websiteUrl: string
): Promise<BusinessContext | null> {
  try {
    const cacheKey = `business_context_${userId}_${encodeURIComponent(websiteUrl)}`;
    const cacheDoc = await db.collection(CACHE_COLLECTION).doc(cacheKey).get();

    if (!cacheDoc.exists) {
      return null;
    }

    const data = cacheDoc.data();
    if (!data) return null;

    const cachedAt = data.cachedAt?.toDate();
    if (!cachedAt) return null;

    // Check if cache is still valid
    const now = new Date();
    const age = now.getTime() - cachedAt.getTime();

    if (age > CACHE_DURATION.BUSINESS_CONTEXT) {
      // Cache expired, delete it
      await db.collection(CACHE_COLLECTION).doc(cacheKey).delete();
      return null;
    }

    return data.businessContext as BusinessContext;
  } catch (error) {
    console.error('Error getting cached business context:', error);
    return null;
  }
}

/**
 * Cache business context
 */
export async function cacheBusinessContext(
  userId: string,
  websiteUrl: string,
  context: BusinessContext
): Promise<void> {
  try {
    const cacheKey = `business_context_${userId}_${encodeURIComponent(websiteUrl)}`;
    
    await db.collection(CACHE_COLLECTION).doc(cacheKey).set({
      businessContext: context,
      cachedAt: new Date(),
      userId,
      websiteUrl,
    });
  } catch (error) {
    console.error('Error caching business context:', error);
  }
}

/**
 * Get cached sitemap URLs for a competitor
 */
export async function getCachedSitemap(
  competitorUrl: string
): Promise<string[] | null> {
  try {
    const cacheKey = `sitemap_${encodeURIComponent(competitorUrl)}`;
    const cacheDoc = await db.collection(CACHE_COLLECTION).doc(cacheKey).get();

    if (!cacheDoc.exists) {
      return null;
    }

    const data = cacheDoc.data();
    if (!data) return null;

    const cachedAt = data.cachedAt?.toDate();
    if (!cachedAt) return null;

    // Check if cache is still valid
    const now = new Date();
    const age = now.getTime() - cachedAt.getTime();

    if (age > CACHE_DURATION.SITEMAP) {
      // Cache expired, delete it
      await db.collection(CACHE_COLLECTION).doc(cacheKey).delete();
      return null;
    }

    return data.urls as string[];
  } catch (error) {
    console.error('Error getting cached sitemap:', error);
    return null;
  }
}

/**
 * Cache sitemap URLs
 */
export async function cacheSitemap(
  competitorUrl: string,
  urls: string[]
): Promise<void> {
  try {
    const cacheKey = `sitemap_${encodeURIComponent(competitorUrl)}`;
    
    await db.collection(CACHE_COLLECTION).doc(cacheKey).set({
      urls,
      cachedAt: new Date(),
      competitorUrl,
      urlCount: urls.length,
    });
  } catch (error) {
    console.error('Error caching sitemap:', error);
  }
}

/**
 * Get cached page content
 */
export async function getCachedPageContent(
  pageUrl: string
): Promise<string | null> {
  try {
    const cacheKey = `page_content_${encodeURIComponent(pageUrl)}`;
    const cacheDoc = await db.collection(CACHE_COLLECTION).doc(cacheKey).get();

    if (!cacheDoc.exists) {
      return null;
    }

    const data = cacheDoc.data();
    if (!data) return null;

    const cachedAt = data.cachedAt?.toDate();
    if (!cachedAt) return null;

    // Check if cache is still valid
    const now = new Date();
    const age = now.getTime() - cachedAt.getTime();

    if (age > CACHE_DURATION.PAGE_CONTENT) {
      // Cache expired, delete it
      await db.collection(CACHE_COLLECTION).doc(cacheKey).delete();
      return null;
    }

    return data.content as string;
  } catch (error) {
    console.error('Error getting cached page content:', error);
    return null;
  }
}

/**
 * Cache page content
 */
export async function cachePageContent(
  pageUrl: string,
  content: string
): Promise<void> {
  try {
    const cacheKey = `page_content_${encodeURIComponent(pageUrl)}`;
    
    await db.collection(CACHE_COLLECTION).doc(cacheKey).set({
      content,
      cachedAt: new Date(),
      pageUrl,
      contentLength: content.length,
    });
  } catch (error) {
    console.error('Error caching page content:', error);
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const now = new Date();
    const snapshot = await db.collection(CACHE_COLLECTION).get();

    const deletePromises: Promise<any>[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const cachedAt = data.cachedAt?.toDate();

      if (!cachedAt) {
        deletePromises.push(doc.ref.delete());
        return;
      }

      const age = now.getTime() - cachedAt.getTime();
      
      // Determine max age based on cache type
      let maxAge = CACHE_DURATION.SITEMAP; // Default
      if (doc.id.startsWith('business_context_')) {
        maxAge = CACHE_DURATION.BUSINESS_CONTEXT;
      } else if (doc.id.startsWith('page_content_')) {
        maxAge = CACHE_DURATION.PAGE_CONTENT;
      }

      if (age > maxAge) {
        deletePromises.push(doc.ref.delete());
      }
    });

    await Promise.all(deletePromises);
    console.log(`Cleaned up ${deletePromises.length} expired cache entries`);
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}
