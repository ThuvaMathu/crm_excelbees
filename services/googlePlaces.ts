/**
 * Google Places API Service
 * For discovering local competitors
 */

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export interface PlaceResult {
  name: string;
  place_id: string;
  rating?: number;
  user_ratings_total?: number;
  formatted_address?: string;
}

export interface PlaceDetails {
  name: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  formatted_address?: string;
  place_id: string;
}

export interface GooglePlacesCompetitor {
  name: string;
  website: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
}

/**
 * Search for businesses using Google Places Text Search
 * @param query - Search query (e.g., "Digital Marketing Agency in Brisbane, Australia")
 * @param location - Optional location bias
 * @returns Array of place results
 */
export async function searchPlaces(
  query: string,
  location?: string
): Promise<PlaceResult[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: location ? `${query} in ${location}` : query,
      key: GOOGLE_PLACES_API_KEY,
    });

    const response = await fetch(`${PLACES_TEXT_SEARCH_URL}?${params}`);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.results || [];
  } catch (error) {
    console.error('Failed to search places:', error);
    return [];
  }
}

/**
 * Get detailed information about a place
 * @param placeId - The place ID from text search
 * @returns Place details including website
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'name,website,rating,user_ratings_total,formatted_address',
      key: GOOGLE_PLACES_API_KEY,
    });

    const response = await fetch(`${PLACES_DETAILS_URL}?${params}`);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.result;
  } catch (error) {
    console.error(`Failed to get details for place ${placeId}:`, error);
    return null;
  }
}

/**
 * Discover competitors using Google Places API
 * @param industry - Industry/business type
 * @param location - Location to search in
 * @param maxResults - Maximum number of competitors to return (default: 15)
 * @returns Array of competitors with websites
 */
export async function discoverCompetitors(
  industry: string,
  location: string,
  maxResults: number = 15
): Promise<GooglePlacesCompetitor[]> {
  // Search for places
  const places = await searchPlaces(industry, location);
  
  if (places.length === 0) {
    return [];
  }

  // Get details for each place (including website)
  const detailsPromises = places
    .slice(0, maxResults * 2) // Get more than needed to account for places without websites
    .map(place => getPlaceDetails(place.place_id));
  
  const allDetails = await Promise.all(detailsPromises);

  // Filter out places without websites and format results
  const competitors: GooglePlacesCompetitor[] = allDetails
    .filter((details): details is PlaceDetails => 
      details !== null && !!details.website
    )
    .map(details => ({
      name: details.name,
      website: details.website!,
      rating: details.rating,
      reviewCount: details.user_ratings_total,
      address: details.formatted_address,
    }))
    .slice(0, maxResults); // Limit to requested number

  // Sort by rating and review count
  competitors.sort((a, b) => {
    const aScore = (a.rating || 0) * Math.log10((a.reviewCount || 1) + 1);
    const bScore = (b.rating || 0) * Math.log10((b.reviewCount || 1) + 1);
    return bScore - aScore;
  });

  return competitors;
}

/**
 * Check if Google Places API is configured
 */
export function isGooglePlacesConfigured(): boolean {
  return !!GOOGLE_PLACES_API_KEY;
}
