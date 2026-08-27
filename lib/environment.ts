/**
 * Environment detection utility
 * Provides safe access to environment variables with proper validation
 */

import { isDev } from "@/lib/env";

export const isDevelopment = process.env.NODE_ENV === 'development';
// "Production-like" now means anything other than APP_ENVIRONMENT=dev — both
// prd and maintenance require real config (e.g. NEXT_PUBLIC_APP_URL) to be set.
export const isProduction = !isDev;
export const isTest = process.env.NODE_ENV === 'test';

/**
 * Get the application URL with proper fallback handling
 * Throws an error in production if the URL is not set
 * Allows localhost in development for local testing
 */
export const getAppUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    if (isProduction) {
      throw new Error('NEXT_PUBLIC_APP_URL is required in production. Please set this environment variable in AWS Amplify.');
    }
    // Allow localhost in development
    return 'http://localhost:3000';
  }
  return url;
};

/**
 * Get a required environment variable
 * Throws an error if the variable is not set
 */
export const requireEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
};

/**
 * Get an optional environment variable with a default value
 */
export const getEnvVar = (name: string, defaultValue: string = ''): string => {
  return process.env[name] || defaultValue;
};

/**
 * Get a numeric environment variable
 * Returns null if not set or invalid
 */
export const getEnvVarNumber = (name: string): number | null => {
  const value = process.env[name];
  if (!value) return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
};

/**
 * Get a boolean environment variable
 * Returns false if not set or invalid
 */
export const getEnvVarBoolean = (name: string): boolean => {
  const value = process.env[name];
  if (!value) return false;
  return value.toLowerCase() === 'true' || value === '1';
};
