import { Schema, SchemaType } from "@google/generative-ai";

export const emailGenerationSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        subjectLines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        previewText: { type: SchemaType.STRING },
        html: { type: SchemaType.STRING },
        plainText: { type: SchemaType.STRING },
    },
    required: ["subjectLines", "previewText", "html", "plainText"],
};

export const pageMetadataSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        h1Tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        mainTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
    required: ["title", "description", "h1Tags", "mainTopics"],
};

export const extractedKeywordsSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        keywords: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    pageUrl: { type: SchemaType.STRING },
                    primaryKeywords: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                keyword: { type: SchemaType.STRING },
                                occurrences: { type: SchemaType.NUMBER },
                                prominence: { type: SchemaType.NUMBER },
                            },
                        },
                    },
                    secondaryKeywords: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                keyword: { type: SchemaType.STRING },
                                occurrences: { type: SchemaType.NUMBER },
                            },
                        },
                    },
                    searchIntent: { type: SchemaType.STRING },
                    relevanceToUser: { type: SchemaType.STRING },
                    contentStrategy: { type: SchemaType.STRING },
                },
                required: ["pageUrl", "primaryKeywords", "secondaryKeywords", "searchIntent", "relevanceToUser"],
            },
        },
    },
    required: ["keywords"],
};

export const enrichKeywordsSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        keywords: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    keyword: { type: SchemaType.STRING },
                    searchVolume: { type: SchemaType.NUMBER },
                    searchVolumeCategory: { type: SchemaType.STRING, format: "enum", enum: ["low", "medium", "high"] },
                    difficulty: { type: SchemaType.STRING, format: "enum", enum: ["low", "medium", "high"] },
                    trend: { type: SchemaType.STRING, format: "enum", enum: ["rising", "stable", "declining"] },
                    cpc: { type: SchemaType.STRING },
                    topRankingDomains: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                },
                required: ["keyword", "searchVolume", "searchVolumeCategory", "difficulty", "trend", "topRankingDomains"],
            },
        },
    },
    required: ["keywords"],
};

export const aggregateKeywordsSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        keywords: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    primaryKeyword: { type: SchemaType.STRING },
                    variations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    keywordFamily: { type: SchemaType.STRING },
                    searchIntent: { type: SchemaType.STRING },
                    relevanceScore: { type: SchemaType.NUMBER },
                },
                required: ["primaryKeyword", "variations", "keywordFamily", "searchIntent", "relevanceScore"],
            },
        },
    },
    required: ["keywords"],
};

export const finalizeSelectionSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        keywords: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    keyword: { type: SchemaType.STRING },
                    strategicValue: { type: SchemaType.STRING },
                    selectionReason: { type: SchemaType.STRING },
                    targetContentType: { type: SchemaType.STRING },
                    targetWordCount: { type: SchemaType.NUMBER },
                },
                required: ["keyword", "strategicValue", "selectionReason", "targetContentType", "targetWordCount"],
            },
        },
    },
    required: ["keywords"],
};

export const discoverSitemapsSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        categorizedPages: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    url: { type: SchemaType.STRING },
                    category: { type: SchemaType.STRING },
                    title: { type: SchemaType.STRING },
                    priority: { type: SchemaType.NUMBER },
                    isDynamic: { type: SchemaType.BOOLEAN },
                },
                required: ["url", "category", "title", "priority"],
            },
        },
    },
    required: ["categorizedPages"],
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
                    website: { type: SchemaType.STRING },
                    relevanceReason: { type: SchemaType.STRING },
                },
                required: ["name", "website", "relevanceReason"],
            },
        },
    },
    required: ["competitors"],
};

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
                    isValid: { type: SchemaType.BOOLEAN },
                    reason: { type: SchemaType.STRING },
                },
                required: ["name", "website", "isValid", "reason"],
            },
        },
    },
    required: ["competitors"],
};

export const strategyReportSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        executiveSummary: { type: SchemaType.STRING },
        keywordFamilies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        competitorInsights: {
            type: SchemaType.OBJECT,
            properties: {
                allCompetitorsTarget: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                someCompetitorsTarget: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                noCompetitorsTarget: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                competitiveGaps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ["allCompetitorsTarget", "someCompetitorsTarget", "noCompetitorsTarget", "competitiveGaps"],
        },
        contentRecommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        searchIntentDistribution: {
            type: SchemaType.OBJECT,
            properties: {
                informational: { type: SchemaType.OBJECT, properties: { count: { type: SchemaType.NUMBER }, strategy: { type: SchemaType.STRING } }, required: ["count", "strategy"] },
                commercial: { type: SchemaType.OBJECT, properties: { count: { type: SchemaType.NUMBER }, strategy: { type: SchemaType.STRING } }, required: ["count", "strategy"] },
                transactional: { type: SchemaType.OBJECT, properties: { count: { type: SchemaType.NUMBER }, strategy: { type: SchemaType.STRING } }, required: ["count", "strategy"] },
            },
            required: ["informational", "commercial", "transactional"],
        },
        priorityActionPlan: {
            type: SchemaType.OBJECT,
            properties: {
                month1: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                month2to3: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                month4to6: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ["month1", "month2to3", "month4to6"],
        },
        successMetrics: {
            type: SchemaType.OBJECT,
            properties: {
                expectedTrafficIncrease: { type: SchemaType.STRING },
                targetRankings: { type: SchemaType.STRING },
                conversionPotential: { type: SchemaType.STRING },
            },
            required: ["expectedTrafficIncrease", "targetRankings", "conversionPotential"],
        },
        riskAssessment: {
            type: SchemaType.OBJECT,
            properties: {
                cannibalizationRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                optimizationWarnings: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                competitiveThreats: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ["cannibalizationRisks", "optimizationWarnings", "competitiveThreats"],
        },
        nextSteps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
    required: [
        "executiveSummary",
        "keywordFamilies",
        "competitorInsights",
        "contentRecommendations",
        "searchIntentDistribution",
        "priorityActionPlan",
        "successMetrics",
        "riskAssessment",
        "nextSteps",
    ]
};

// ... Fallbacks for existing generic type references if needed ...
export const fallbackSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        result: { type: SchemaType.STRING }
    }
};
