import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { tierLabel, translations } from './translations';

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.') ? [full] : [];
  });

describe('la app completa está en español y en inglés', () => {
  it('cada texto del diccionario existe en los dos idiomas y no está vacío', () => {
    expect(Object.keys(translations.en).sort()).toEqual(Object.keys(translations.es).sort());
    for (const language of ['es', 'en'] as const) {
      for (const [key, text] of Object.entries(translations[language])) {
        expect(text.trim(), `${language}.${key}`).not.toBe('');
      }
    }
  });

  it('todas las claves t(...) que usa la interfaz están en el diccionario, y no sobran claves sin uso', () => {
    const used = new Set<string>();
    for (const file of sourceFiles('src')) {
      for (const match of readFileSync(file, 'utf8').matchAll(/\bt\('(\w+)'\)/g)) used.add(match[1]);
    }
    expect([...used].sort()).toEqual(Object.keys(translations.es).sort());
  });

  it('los textos en línea tr(inglés, español) traen los dos idiomas y no repiten el mismo texto', () => {
    const suspicious: string[] = [];
    for (const file of sourceFiles('src')) {
      const source = readFileSync(file, 'utf8');
      // tr('english', 'español') con literales simples: los dos tienen que existir y ser distintos
      for (const match of source.matchAll(/\btr\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g)) {
        const [, english, spanish] = match;
        if (!english.trim() || !spanish.trim() || english === spanish) suspicious.push(`${file}: ${english}`);
      }
    }
    expect(suspicious).toEqual([]);
  });

  it('los niveles del vecino se muestran traducidos', () => {
    expect(tierLabel('Oro', 'es')).toBe('Oro');
    expect(tierLabel('Oro', 'en')).toBe('Gold');
    expect(tierLabel('Plata', 'en')).toBe('Silver');
  });
});
