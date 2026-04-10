/**
 * Centralized i18n config. Kept framework-agnostic so both next-intl
 * middleware and server components can import from one place.
 */

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
