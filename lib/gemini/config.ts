export const GEMINI_MODELS = {
  FLASH: "gemini-2.5-flash",
  FLASH_LITE: "gemini-2.5-flash-lite",
} as const;

export const GEMINI_CONFIG = {
  textGeneration: {
    model: GEMINI_MODELS.FLASH,
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
  structuredAnalysis: {
    model: GEMINI_MODELS.FLASH,
    temperature: 0.3,
    maxOutputTokens: 2048,
  },
  searchIntent: {
    model: GEMINI_MODELS.FLASH,
    temperature: 0.0,
    maxOutputTokens: 1024,
  },
} as const;
