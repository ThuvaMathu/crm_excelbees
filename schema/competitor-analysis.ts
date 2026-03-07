import { Schema, SchemaType } from "@google/generative-ai";

export const competitorProfileSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        name: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
        strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        weaknesses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        pricingStrategy: { type: SchemaType.STRING },
        differentiation: { type: SchemaType.STRING },
        threatLevel: { type: SchemaType.STRING },
        threatExplanation: { type: SchemaType.STRING },
    },
    required: ["name", "summary", "strengths", "weaknesses", "pricingStrategy", "differentiation", "threatLevel", "threatExplanation"],
};

export const opportunitySchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        type: { type: SchemaType.STRING },
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        howToExploit: { type: SchemaType.STRING },
        effort: { type: SchemaType.STRING },
    },
    required: ["type", "title", "description", "howToExploit", "effort"],
};

export const recommendationSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        category: { type: SchemaType.STRING },
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        howToExecute: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        expectedImpact: { type: SchemaType.STRING },
    },
    required: ["category", "title", "description", "howToExecute", "expectedImpact"],
};

export const monitoringPlanSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        trackingFrequency: { type: SchemaType.STRING },
        competitorsToWatch: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        keyMetrics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
    required: ["trackingFrequency", "competitorsToWatch", "keyMetrics"],
};

export const reportSectionsSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        executiveSummary: { type: SchemaType.STRING },
        marketPositioning: { type: SchemaType.STRING },
        competitorProfiles: { type: SchemaType.ARRAY, items: competitorProfileSchema },
        opportunities: { type: SchemaType.ARRAY, items: opportunitySchema },
        threats: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        recommendations: { type: SchemaType.ARRAY, items: recommendationSchema },
        monitoringPlan: monitoringPlanSchema,
        keyTakeaways: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
    required: ["executiveSummary", "marketPositioning", "competitorProfiles", "opportunities", "threats", "recommendations", "monitoringPlan", "keyTakeaways"],
};

export const businessProfileSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        industry: { type: SchemaType.STRING },
        mainServices: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        targetAudience: { type: SchemaType.STRING },
        valueProposition: { type: SchemaType.STRING },
        businessType: { type: SchemaType.STRING, description: "e.g. B2B, B2C" }
    },
    required: ["industry", "mainServices", "targetAudience", "valueProposition", "businessType"]
};

export const autoDiscoverCompetitorsSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        competitors: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    website: { type: SchemaType.STRING }
                },
                required: ["name", "website"]
            }
        }
    },
    required: ["competitors"]
};

export const fallbackCompetitorArraySchema = autoDiscoverCompetitorsSchema;

export const validateCompetitorsSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        competitors: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    website: { type: SchemaType.STRING },
                    isValid: { type: SchemaType.BOOLEAN }
                },
                required: ["name", "website", "isValid"]
            }
        }
    },
    required: ["competitors"]
};

export const validationCompetitorIndicesSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        validCompetitorIndices: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER }
        }
    },
    required: ["validCompetitorIndices"]
};

export const strategyReportSchema = reportSectionsSchema;

export const competitorAnalysisSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        weaknesses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        keyFeatures: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        targetAudience: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        pricingStrategy: { type: SchemaType.STRING },
        marketingChannels: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: ["strengths", "weaknesses", "keyFeatures", "targetAudience"]
};

export const emailGenerationSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        subject: { type: SchemaType.STRING },
        body: { type: SchemaType.STRING }
    },
    required: ["subject", "body"]
};
