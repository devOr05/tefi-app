// Versión de la app que se está viendo: número (package.json), commit y fecha del commit. Quedan fijados al
// compilar (vite.config.ts) y se muestran en todas las pantallas, para saber qué versión tiene abierta cada teléfono.
import type { Language } from './i18n/translations';
import { SITE } from './site/content';

export interface BuildInfo {
  version: string;
  /** Hash completo del commit, o '' si al compilar no se pudo saber */
  commit: string;
  /** Fecha del commit en ISO 8601, o '' */
  committedAt: string;
  /** Compilado en una computadora con cambios que todavía no están en ningún commit */
  modified?: boolean;
}

declare const __TEFI_BUILD__: BuildInfo | undefined;

// En los tests no pasa por Vite y la constante no existe
export const BUILD: BuildInfo =
  typeof __TEFI_BUILD__ !== 'undefined' && __TEFI_BUILD__ ? __TEFI_BUILD__ : { version: '0.0.0', commit: '', committedAt: '' };

export function shortCommit(build: BuildInfo): string {
  return build.commit.slice(0, 7);
}

/** Dirección del commit en GitHub, o null si no se conoce el commit o el build tiene cambios sin commit. */
export function commitUrl(build: BuildInfo): string | null {
  return /^[0-9a-f]{7,40}$/.test(build.commit) && !build.modified ? `${SITE.repository}/commit/${build.commit}` : null;
}

/** Fecha y hora del commit como "2026-10-10 13:28", en la hora del dispositivo salvo que se pida otra zona. */
function commitDate(build: BuildInfo, timeZone?: string): string | null {
  const date = build.committedAt ? new Date(build.committedAt) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone
  }).formatToParts(date);
  const part = (type: string) => parts.find(candidate => candidate.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`;
}

/**
 * Lo que se lee en pantalla: "Versión 2.1.0 · 687581d · 2026-10-10 13:28". Salvo la primera palabra es igual en
 * los dos idiomas, para poder comparar lo que muestran dos teléfonos.
 */
export function versionLabel(build: BuildInfo, language: Language, timeZone?: string): string {
  const parts = [`${language === 'en' ? 'Version' : 'Versión'} ${build.version}`];
  if (build.commit) parts.push(shortCommit(build) + (build.modified ? '+local' : ''));
  const date = commitDate(build, timeZone);
  if (date) parts.push(date);
  return parts.join(' · ');
}
