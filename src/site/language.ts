// Idioma y dirección de las páginas publicadas: la raíz es la versión en inglés y /es/ la versión en español.
// Lo usan la app (idioma inicial y título de la pestaña) y el build (páginas, sitemap y metadatos).
import type { Language } from '../i18n/translations';

export const LANGUAGES: Language[] = ['en', 'es'];

export const LANGUAGE_PATHS: Record<Language, string> = { en: '/', es: '/es/' };

export const PAGE_TITLES: Record<Language, string> = {
  en: 'Tefi.app - The corner store credit notebook, co-signed on Solana',
  es: 'Tefi.app - La libreta del fiado del almacén, co-firmada en Solana'
};

/** Idioma que pide la dirección con la que se abrió la app (/es o /es/…), o null si no pide ninguno. */
export function languageFromPath(pathname: string): Language | null {
  return /^\/es(\/|$)/i.test(pathname) ? 'es' : null;
}
