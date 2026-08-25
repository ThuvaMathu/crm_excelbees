import { z } from "zod";
import { coerceTimestampOptional } from "./date-coerce";

export const dealSchema = z.object({
  title: z.string().trim().min(1, "Deal title is required"),
  stage: z.enum([
    "Pipeline",
    "Follow Up",
    "Schedule Service",
    "Conversation",
    "Won",
    "Lost",
  ]),
  value: z.number().min(0, "Value must be positive"),
  probability: z.number().min(0, "Probability must be at least 0").max(100, "Probability cannot exceed 100"),
  closeDate: coerceTimestampOptional(),
  contactIds: z.array(z.string()),
  companyId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export type DealFormData = z.output<typeof dealSchema>;
export type DealFormInput = z.input<typeof dealSchema>;
