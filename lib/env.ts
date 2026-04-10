import { z } from 'zod';

/**
 * Zod-validated environment variables.
 *
 * Import `env` from this module instead of reading `process.env.*` directly.
 * Missing or malformed values fail fast at startup with a readable error.
 *
 * Server-only vars are parsed on the server; public vars on both sides.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BASE_URL: z.string().url(),

  POSTGRES_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  KINDE_CLIENT_ID: z.string().min(1),
  KINDE_CLIENT_SECRET: z.string().min(1),
  KINDE_ISSUER_URL: z.string().url(),
  KINDE_SITE_URL: z.string().url(),
  KINDE_POST_LOGOUT_REDIRECT_URL: z.string().url(),
  KINDE_POST_LOGIN_REDIRECT_URL: z.string().url(),
  KINDE_WEBHOOK_SECRET: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),

  GLITCHTIP_DSN: z.string().url().optional().or(z.literal('')),

  STORAGE_ENDPOINT: z.string().url().optional().or(z.literal('')),
  STORAGE_REGION: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_PUBLIC_URL: z.string().url().optional().or(z.literal('')),

  DEFAULT_LOCALE: z.string().default('en'),
  SUPPORTED_LOCALES: z.string().default('en,fr'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_GLITCHTIP_DSN: z.string().url().optional().or(z.literal('')),
});

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  BASE_URL: process.env.BASE_URL,

  POSTGRES_URL: process.env.POSTGRES_URL,
  REDIS_URL: process.env.REDIS_URL,

  KINDE_CLIENT_ID: process.env.KINDE_CLIENT_ID,
  KINDE_CLIENT_SECRET: process.env.KINDE_CLIENT_SECRET,
  KINDE_ISSUER_URL: process.env.KINDE_ISSUER_URL,
  KINDE_SITE_URL: process.env.KINDE_SITE_URL,
  KINDE_POST_LOGOUT_REDIRECT_URL: process.env.KINDE_POST_LOGOUT_REDIRECT_URL,
  KINDE_POST_LOGIN_REDIRECT_URL: process.env.KINDE_POST_LOGIN_REDIRECT_URL,
  KINDE_WEBHOOK_SECRET: process.env.KINDE_WEBHOOK_SECRET,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,

  GLITCHTIP_DSN: process.env.GLITCHTIP_DSN,

  STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT,
  STORAGE_REGION: process.env.STORAGE_REGION,
  STORAGE_BUCKET: process.env.STORAGE_BUCKET,
  STORAGE_ACCESS_KEY_ID: process.env.STORAGE_ACCESS_KEY_ID,
  STORAGE_SECRET_ACCESS_KEY: process.env.STORAGE_SECRET_ACCESS_KEY,
  STORAGE_PUBLIC_URL: process.env.STORAGE_PUBLIC_URL,

  DEFAULT_LOCALE: process.env.DEFAULT_LOCALE,
  SUPPORTED_LOCALES: process.env.SUPPORTED_LOCALES,

  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_GLITCHTIP_DSN: process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
};

const isServer = typeof window === 'undefined';

const merged = serverSchema.merge(clientSchema);

type MergedEnv = z.infer<typeof merged>;

function parseEnv(): MergedEnv {
  const schema = isServer ? merged : clientSchema;
  const parsed = schema.safeParse(processEnv);

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    console.error('Invalid environment variables:', formatted);
    throw new Error(
      'Invalid environment variables — check your .env file against .env.example'
    );
  }

  return new Proxy(parsed.data as MergedEnv, {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (!isServer && !prop.startsWith('NEXT_PUBLIC_')) {
        throw new Error(
          `Attempted to access server-side env var "${prop}" from the client.`
        );
      }
      return target[prop as keyof MergedEnv];
    },
  });
}

export const env = parseEnv();
