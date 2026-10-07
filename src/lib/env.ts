import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  VITE_ENVIRONMENT: z.string().default('development'),
});

export const env = envSchema.parse(import.meta.env);
