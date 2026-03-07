import { Schema, SchemaType } from "@google/generative-ai";

export const blogSubheadingSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        heading: { type: SchemaType.STRING },
        keyPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        estimatedWordCount: { type: SchemaType.NUMBER },
        keywordsToInclude: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        imageNeeded: { type: SchemaType.BOOLEAN },
        imageDescription: { type: SchemaType.STRING }
    },
    required: ["heading", "keyPoints", "estimatedWordCount", "keywordsToInclude", "imageNeeded"]
};

export const blogSectionSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        section: { type: SchemaType.STRING },
        heading: { type: SchemaType.STRING },
        purpose: { type: SchemaType.STRING },
        subheadings: { type: SchemaType.ARRAY, items: blogSubheadingSchema },
        estimatedWordCount: { type: SchemaType.NUMBER },
        transitionToNext: { type: SchemaType.STRING }
    },
    required: ["section", "heading", "purpose", "subheadings", "estimatedWordCount"]
};

export const seoStrategySchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        primaryKeywordPlacement: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        targetKeywordDensity: { type: SchemaType.STRING },
        internalLinkOpportunities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        externalSourceTypes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: ["primaryKeywordPlacement", "targetKeywordDensity", "internalLinkOpportunities", "externalSourceTypes"]
};

export const ctaPlacementSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        location: { type: SchemaType.STRING },
        type: { type: SchemaType.STRING },
        suggestedText: { type: SchemaType.STRING }
    },
    required: ["location", "type", "suggestedText"]
};

export const visualContentSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        location: { type: SchemaType.STRING },
        type: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        aiImagePrompt: { type: SchemaType.STRING }
    },
    required: ["location", "type", "description"]
};

export const estimatedMetricsSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        totalWordCount: { type: SchemaType.NUMBER },
        readingTime: { type: SchemaType.NUMBER },
        numberOfHeadings: { type: SchemaType.NUMBER },
        numberOfImages: { type: SchemaType.NUMBER },
        numberOfCTAs: { type: SchemaType.NUMBER }
    },
    required: ["totalWordCount", "readingTime", "numberOfHeadings", "numberOfImages", "numberOfCTAs"]
};

export const blogOutlineSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        workingTitle: { type: SchemaType.STRING },
        slug: { type: SchemaType.STRING },
        metaDescription: { type: SchemaType.STRING },
        sections: { type: SchemaType.ARRAY, items: blogSectionSchema },
        seoStrategy: seoStrategySchema,
        ctaPlacement: { type: SchemaType.ARRAY, items: ctaPlacementSchema },
        visualContent: { type: SchemaType.ARRAY, items: visualContentSchema },
        mainImageAIPrompt: { type: SchemaType.STRING },
        contentStrategy: { type: SchemaType.STRING },
        uniqueAngle: { type: SchemaType.STRING },
        estimatedMetrics: estimatedMetricsSchema
    },
    required: [
        "workingTitle",
        "slug",
        "metaDescription",
        "sections",
        "seoStrategy",
        "ctaPlacement",
        "visualContent",
        "mainImageAIPrompt",
        "contentStrategy",
        "uniqueAngle",
        "estimatedMetrics"
    ]
};

