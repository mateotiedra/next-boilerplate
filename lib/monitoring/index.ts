import * as Sentry from '@sentry/nextjs';

const GLITCHTIP_DSN = process.env.GLITCHTIP_DSN || process.env.NEXT_PUBLIC_GLITCHTIP_DSN;

let initialized = false;

/**
 * Initialize monitoring (GlitchTip / Sentry).
 * Call this once at app startup.
 * Safe to call multiple times — will only initialize once.
 */
export function initMonitoring() {
  if (initialized || !GLITCHTIP_DSN) return;

  Sentry.init({
    dsn: GLITCHTIP_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
  });

  initialized = true;
}

/**
 * Capture an exception and send it to GlitchTip.
 */
export function captureException(error: unknown, context?: Record<string, any>) {
  if (!GLITCHTIP_DSN) {
    console.error('[Monitoring disabled]', error);
    return;
  }

  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture a message (info, warning, etc.)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!GLITCHTIP_DSN) {
    console.log(`[Monitoring disabled] [${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Set user context for monitoring (attach user info to future events).
 */
export function setUser(user: { id: string; email?: string; name?: string } | null) {
  Sentry.setUser(user);
}
