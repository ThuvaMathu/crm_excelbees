import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      }
    : undefined,
  base: { app: "crm-excelbees" },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function logAI(feature: string, params: { model?: string; success: boolean; latencyMs?: number; error?: string }) {
  logger.info({
    module: "ai",
    feature,
    ...params,
  });
}
