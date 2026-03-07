import { Schema, SchemaType } from "@google/generative-ai";

export const calendarPlanSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        plans: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                    type: { type: SchemaType.STRING },
                    start: { type: SchemaType.STRING },
                    end: { type: SchemaType.STRING },
                    allDay: { type: SchemaType.BOOLEAN },
                    priority: { type: SchemaType.STRING },
                    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    checklist: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                },
                required: ["title", "start", "end", "type"],
            },
        },
    },
    required: ["plans"],
};
