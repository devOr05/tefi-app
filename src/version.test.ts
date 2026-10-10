import { describe, expect, it } from 'vitest';
import { BUILD, BuildInfo, commitUrl, shortCommit, versionLabel } from './version';

const build: BuildInfo = { version: '2.1.0', commit: '687581d44d4834d799479bd6e4a32f6fbafe0c99', committedAt: '2026-10-10T16:28:21Z' };
const ARGENTINA = 'America/Argentina/Buenos_Aires';

describe('versión que muestra la app', () => {
  it('dice el número, el commit y la fecha del commit, en el idioma de la app', () => {
    expect(versionLabel(build, 'es', ARGENTINA)).toBe('Versión 2.1.0 · 687581d · 2026-10-10 13:28');
    expect(versionLabel(build, 'en', ARGENTINA)).toBe('Version 2.1.0 · 687581d · 2026-10-10 13:28');
  });

  it('muestra la hora en la zona horaria de quien la mira', () => {
    expect(versionLabel(build, 'es', 'UTC')).toContain('2026-10-10 16:28');
    expect(versionLabel(build, 'es', 'Europe/Madrid')).toContain('2026-10-10 18:28');
    expect(versionLabel({ ...build, committedAt: '2026-10-10T23:50:00-03:00' }, 'es', 'UTC')).toContain('2026-10-11 02:50');
  });

  it('dos builds de commits distintos nunca se leen igual, aunque nadie haya cambiado el número', () => {
    const next = { ...build, commit: '9fee706e9337ee9166a643973cb758d9e77af0e6' };
    expect(versionLabel(next, 'es', ARGENTINA)).not.toBe(versionLabel(build, 'es', ARGENTINA));
  });

  it('si al compilar no se supo el commit ni la fecha, muestra solo el número', () => {
    expect(versionLabel({ version: '2.1.0', commit: '', committedAt: '' }, 'es')).toBe('Versión 2.1.0');
    expect(versionLabel({ version: '2.1.0', commit: '', committedAt: 'no es una fecha' }, 'en')).toBe('Version 2.1.0');
  });

  it('enlaza al commit exacto en GitHub', () => {
    expect(shortCommit(build)).toBe('687581d');
    expect(commitUrl(build)).toBe('https://github.com/devOr05/tefi-app/commit/687581d44d4834d799479bd6e4a32f6fbafe0c99');
    expect(commitUrl({ ...build, commit: '' })).toBeNull();
    expect(commitUrl({ ...build, commit: 'main"><script>' })).toBeNull();
  });

  it('un build con cambios sin commit lo dice y no enlaza a un commit que no es ese código', () => {
    const local = { ...build, modified: true };
    expect(versionLabel(local, 'es', ARGENTINA)).toContain('687581d+local');
    expect(commitUrl(local)).toBeNull();
  });

  it('fuera del build (tests) hay una versión por defecto', () => {
    expect(BUILD).toEqual({ version: '0.0.0', commit: '', committedAt: '' });
  });
});
