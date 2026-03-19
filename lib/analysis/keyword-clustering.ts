/**
 * Keyword Clustering Service
 *
 * Implements DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 * for semantic keyword grouping. Then uses Gemini to label clusters.
 */

import { generateEmbeddings as generateEmbeddingsImpl } from "./embedding-service";
import { genAI } from "@/lib/ai/gemini";
import { AI_MODELS } from "@/lib/ai/config";

export interface EnrichedKeyword {
  keyword: string;
  searchIntent: string;
  searchVolume: number;
  cpc: number;
  difficulty: number;
  trend: "up" | "down" | "stable";
  seedKeyword: boolean; // true if from initial seed
}

export interface ClusterCenter {
  id: number;
  keywords: string[];
}

export interface KeywordCluster {
  clusterId: string;
  keywords: EnrichedKeyword[];
  label: string;
  topic: string;
  funnelStage: "awareness" | "consideration" | "conversion";
  opportunityScore: number;
  createdAt: Date;
}

/**
 * Generate embeddings for texts using Gemini
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return await generateEmbeddingsImpl(texts);
}

/**
 * DBSCAN Algorithm Implementation
 * Based on: "A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise"
 * Ester et al., 1996
 */
interface DBSCANConfig {
  epsilon: number; // Neighborhood radius
  minPts: number; // Minimum points to form cluster
  noiseKey: number; // Number of neighbors for noise calculation
}

interface DBSCANResult {
  labels: number[];
  clusterCount: number;
}

function dbscan(
  points: any[],
  distances: number[][],
  config: DBSCANConfig
): DBSCANResult {
  const { epsilon, minPts, noiseKey } = config;
  const n = points.length;
  const labels = new Array(n).fill(-1);
  let clusterId = 0;

  // Compute neighborhood size for each point
  for (let i = 0; i < n; i++) {
    // Find neighbors within epsilon
    const neighbors: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      // Distance matrix is symmetric, only compute upper triangle
      const dist = i < j ? distances[i][j] : distances[j][i];
      if (dist <= epsilon) {
        neighbors.push(j);
      }
    }

    if (neighbors.length < minPts) {
      labels[i] = 0; // Noise point
      continue;
    }

    // Determine if point is a core point (not within epsilon of any higher-density point)
    let isCore = true;
    for (const neighbor of neighbors) {
      const neighborNeighbors: number[] = [];
      for (let k = 0; k < n; k++) {
        if (k === i || k === neighbor) continue;
        const dist = i < k ? distances[i][k] : distances[k][i];
        if (dist <= epsilon) {
          neighborNeighbors.push(k);
        }
      }

      if (neighborNeighbors.length >= noiseKey) {
        isCore = false;
        break;
      }
    }

    if (isCore) {
      labels[i] = ++clusterId; // Start new cluster
    }
  }

  // Assign border points to nearest cluster
  for (let i = 0; i < n; i++) {
    if (labels[i] !== 0) continue; // Skip noise points

    // Find nearest core point
    let nearestDist = Infinity;
    let nearestCluster = -1;

    for (let j = 0; j < n; j++) {
      if (i === j || labels[j] <= 0) continue;
      const dist = i < j ? distances[i][j] : distances[j][i];
      if (dist <= epsilon && dist < nearestDist) {
        nearestDist = dist;
        nearestCluster = labels[j];
      }
    }

    if (nearestCluster >= 1) {
      labels[i] = nearestCluster;
    }
  }

  return { labels, clusterCount: clusterId };
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < a.length; i++) {
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

/**
 * Calculate distance matrix for a set of embeddings
 */
function calculateDistanceMatrix(embeddings: number[][]): number[][] {
  const n = embeddings.length;
  const distances: number[][] = [];

  for (let i = 0; i < n; i++) {
    distances[i] = [];
    for (let j = i + 1; j < n; j++) {
      distances[i][j] = 1 - cosineSimilarity(embeddings[i], embeddings[j]);
    }
  }

  return distances;
}

/**
 * Cluster keywords using DBSCAN
 */
export async function clusterKeywords(
  keywords: EnrichedKeyword[]
): Promise<KeywordCluster[]> {
  if (keywords.length === 0) return [];

  console.log(`[Clustering] Clustering ${keywords.length} keywords...`);

  // 1. Generate embeddings for all keywords
  const texts = keywords.map(k => `${k.keyword} ${k.searchIntent}`);
  const embeddings = await generateEmbeddings(texts);

  if (embeddings.length === 0) {
    console.error("No embeddings generated");
    return [];
  }

  // 2. Calculate distance matrix
  const distances = calculateDistanceMatrix(embeddings);

  // 3. Run DBSCAN
  const indices = Array.from({ length: keywords.length }, (_, i) => i);
  const { labels, clusterCount } = dbscan(indices, distances, {
    epsilon: 0.3, // Cosine distance threshold
    minPts: 3, // Minimum neighbors to form cluster
    noiseKey: 4, // Minimum neighbors for noise calculation
  });

  console.log(`[Clustering] Found ${clusterCount} clusters`);

  // 4. Group keywords by cluster
  const clusterMap = new Map<number, EnrichedKeyword[]>();

  for (let i = 0; i < indices.length; i++) {
    const clusterId = labels[i];
    if (clusterId <= 0) continue; // Skip noise

    if (!clusterMap.has(clusterId)) {
      clusterMap.set(clusterId, []);
    }
    clusterMap.get(clusterId)!.push(keywords[i]);
  }

  // 5. Label each cluster using Gemini
  const labeledClusters: KeywordCluster[] = [];

  for (const [clusterId, clusterKeywords] of clusterMap.entries()) {
    if (clusterKeywords.length === 0) continue;

    const label = await labelCluster(clusterKeywords);
    const topic = await extractTopic(clusterKeywords);

    // Calculate opportunity score (average)
    const avgScore = clusterKeywords.reduce((sum, k) => {
      const score = (k.searchVolume * k.cpc) / Math.max(k.difficulty, 1);
      return sum + score;
    }, 0) / clusterKeywords.length;

    // Normalize to 0-100
    const opportunityScore = Math.min(100, Math.round(avgScore / 50));

    labeledClusters.push({
      clusterId: `cluster-${clusterId}`,
      keywords: clusterKeywords,
      label,
      topic,
      funnelStage: "awareness", // Default, will be refined by labeling
      opportunityScore,
      createdAt: new Date(),
    });
  }

  console.log(`[Clustering] Created ${labeledClusters.length} keyword clusters`);

  return labeledClusters;
}

/**
 * Label a cluster using Gemini
 */
async function labelCluster(keywords: EnrichedKeyword[]): Promise<string> {
  if (keywords.length === 0) return "Unlabeled";

  // Sample some keywords to send to Gemini
  const sample = keywords
    .slice(0, Math.min(10, keywords.length))
    .map(k => `- ${k.keyword} (Vol: ${k.searchVolume}, CPC: $${k.cpc}, Diff: ${k.difficulty})`)
    .join("\n");

  try {
    const result = await genAI({
      model: AI_MODELS.GEMINI_PRO,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze the following group of related keywords and provide a descriptive label (2-5 words) for the topic they represent:

${sample}

Also categorize the funnel stage:
- awareness: informational stage, user learning about a problem
- consideration: user comparing options
- conversion: user ready to make a purchase decision

Respond in JSON format:
{
  "label": "descriptive label",
  "funnelStage": "awareness" | "consideration" | "conversion"
}`,
            }
          ],
        },
      ],
    });

    if (!result.response?.text()) {
      return "Unlabeled";
    }

    const parsed = JSON.parse(result.response.text());
    return parsed.label || "Unlabeled";
  } catch (error) {
    console.error("Cluster labeling error:", error);
    return "Unlabeled";
  }
}

/**
 * Extract main topic from cluster
 */
async function extractTopic(keywords: EnrichedKeyword[]): Promise<string> {
  if (keywords.length === 0) return "General";

  // Use top keywords by search volume
  const topKeywords = keywords
    .sort((a, b) => b.searchVolume - a.searchVolume)
    .slice(0, 3)
    .map(k => k.keyword)
    .join(", ");

  try {
    const result = await genAI({
      model: AI_MODELS.GEMINI_PRO,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Identify the main topic (1-3 words) for these keywords: ${topKeywords}

Respond with only the topic name.`,
            }
          ],
        },
      ],
    });

    if (!result.response?.text()) {
      return "General";
    }

    const parsed = JSON.parse(result.response.text());
    return parsed.topic || "General";
  } catch (error) {
    console.error("Topic extraction error:", error);
    return "General";
  }
}

/**
 * Create a cluster label for display (more concise than topic)
 */
export function createClusterLabel(
  label: string,
  topic: string,
  funnelStage: string
): string {
  // Create a readable label from of topic
  const stageLabels: Record<string, string> = {
    awareness: "Info",
    consideration: "Comparing",
    conversion: "Buying",
  };

  if (topic.length <= 30) {
    return topic;
  }

  return `${topic.substring(0, 30)}... ${stageLabels[funnelStage] || ""}`;
}
