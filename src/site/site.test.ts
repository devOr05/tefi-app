import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Language } from '../i18n/translations';
import { PROGRAM_ID_STR } from '../solana/program';
import type { BuildInfo } from '../version';
import { PROGRAM_EXPLORER_URL, SITE, SITE_COPY } from './content';
import { LANGUAGES, LANGUAGE_PATHS, PAGE_TITLES, languageFromPath } from './language';
import {
  HEAD_MARKER,
  NOSCRIPT_MARKER,
  OG_LOCALES,
  PREVIEW_IMAGES,
  pageUrl,
  renderHead,
  renderLlms,
  renderNoscript,
  renderPage,
  renderRobots,
  renderSitemap,
  renderVersion,
  structuredData
} from './render';

const build: BuildInfo = { version: '2.1.0', commit: '687581d44d4834d799479bd6e4a32f6fbafe0c99', committedAt: '2026-10-10T16:28:21Z' };
const template = readFileSync('index.html', 'utf8');
const words = (html: string) => html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

describe('idioma según la dirección', () => {
  it('/es/ pide español y la raíz no pide ninguno', () => {
    expect(languageFromPath('/es/')).toBe('es');
    expect(languageFromPath('/es')).toBe('es');
    expect(languageFromPath('/ES/')).toBe('es');
    expect(languageFromPath('/')).toBeNull();
    expect(languageFromPath('/escuela')).toBeNull();
    expect(languageFromPath('/assets/es/')).toBeNull();
  });

  it('cada idioma tiene su dirección y un título de pestaña que un buscador muestra entero', () => {
    expect(LANGUAGE_PATHS).toEqual({ en: '/', es: '/es/' });
    for (const language of LANGUAGES) {
      expect(languageFromPath(LANGUAGE_PATHS[language]) ?? 'en').toBe(language);
      expect(PAGE_TITLES[language].length).toBeGreaterThanOrEqual(15);
      expect(PAGE_TITLES[language].length).toBeLessThanOrEqual(70);
    }
  });
});

describe('lo que el sitio dice de sí mismo', () => {
  it('nombra el mismo programa que usa la app', () => {
    expect(SITE.programId).toBe(PROGRAM_ID_STR);
    expect(PROGRAM_EXPLORER_URL).toContain(`${PROGRAM_ID_STR}?cluster=devnet`);
    expect(SITE.url).toMatch(/^https:\/\/[^/]+$/);
  });

  it('los dos idiomas dicen lo mismo: iguales pasos, preguntas, enlaces y funciones', () => {
    const shape = (language: Language) => {
      const copy = SITE_COPY[language];
      return [copy.steps.length, copy.questions.length, copy.features.length, copy.links.map(link => link.url)];
    };
    expect(shape('es')).toEqual(shape('en'));
  });

  it.each(LANGUAGES)('la descripción en "%s" entra entera en un resultado de búsqueda y en la vista previa de un link', language => {
    const { description } = SITE_COPY[language];
    expect(description.length).toBeGreaterThanOrEqual(70);
    expect(description.length).toBeLessThanOrEqual(170);
  });

  it('las imágenes de vista previa existen, miden 1200x630 y pesan menos de lo que acepta WhatsApp', () => {
    for (const language of LANGUAGES) {
      const png = readFileSync(`public${PREVIEW_IMAGES[language]}`);
      expect(png.readUInt32BE(0)).toBe(0x89504e47);
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
      expect(png.length).toBeLessThanOrEqual(300_000);
    }
  });
});

describe.each(LANGUAGES)('página en "%s"', language => {
  const url = pageUrl(SITE.url, language);
  const page = renderPage(template, SITE.url, language, build);
  const attribute = (pattern: RegExp) => (page.match(pattern) || [])[1];

  it('queda en su idioma, con su título y sin lugares por completar', () => {
    expect(page).toContain(`<html lang="${language}">`);
    expect(page).toContain(`<title>${PAGE_TITLES[language]}</title>`);
    expect(page).not.toContain(HEAD_MARKER);
    expect(page).not.toContain(NOSCRIPT_MARKER);
    expect(page).toContain('<div id="root"></div>');
  });

  it('declara su dirección y enlaza la versión en el otro idioma', () => {
    expect(attribute(/<link rel="canonical" href="([^"]+)"/)).toBe(url);
    expect(page.match(/<link rel="canonical"/g)).toHaveLength(1);
    expect(attribute(/hreflang="en" href="([^"]+)"/)).toBe('https://tef-iapp.vercel.app/');
    expect(attribute(/hreflang="es" href="([^"]+)"/)).toBe('https://tef-iapp.vercel.app/es/');
    expect(attribute(/hreflang="x-default" href="([^"]+)"/)).toBe('https://tef-iapp.vercel.app/');
  });

  it('tiene lo que muestra WhatsApp al compartir el link: título, descripción e imagen', () => {
    const copy = SITE_COPY[language];
    const escaped = copy.description.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    expect(page).toContain(`<meta name="description" content="${escaped}" />`);
    expect(page).toContain(`<meta property="og:description" content="${escaped}" />`);
    expect(attribute(/property="og:title" content="([^"]+)"/)).toBe(PAGE_TITLES[language]);
    expect(attribute(/property="og:url" content="([^"]+)"/)).toBe(url);
    expect(attribute(/property="og:image" content="([^"]+)"/)).toBe(SITE.url + PREVIEW_IMAGES[language]);
    expect(attribute(/property="og:locale" content="([^"]+)"/)).toBe(OG_LOCALES[language]);
    expect(page).toContain('<meta name="twitter:card" content="summary_large_image" />');
  });

  it('lleva datos estructurados válidos de schema.org', () => {
    const json = attribute(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) as string;
    expect(JSON.parse(json)).toEqual(structuredData(SITE.url, language, build));
    expect(JSON.parse(json)).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Tefi.app',
      url,
      inLanguage: language,
      softwareVersion: '2.1.0',
      sameAs: ['https://github.com/devOr05/tefi-app']
    });
  });

  it('sin JavaScript se puede leer qué es la app, cómo funciona y dónde está el código', () => {
    const copy = SITE_COPY[language];
    const text = renderNoscript(SITE.url, language);
    expect(page).toContain(text);
    expect(words(text)).toBeGreaterThanOrEqual(150);
    expect(text).toContain(`<main lang="${language}"`);
    expect(text).toContain(SITE.programId);
    expect(text).toContain(`href="${SITE.repository}"`);
    expect(text).toContain(`href="${pageUrl(SITE.url, language === 'en' ? 'es' : 'en')}"`);
    for (const { question } of copy.questions) expect(text).toContain(question);
  });
});

describe('index.html', () => {
  it('si le falta un lugar para completar, el build falla en vez de publicar una página a medias', () => {
    expect(() => renderPage(template.replace(HEAD_MARKER, ''), SITE.url, 'en', build)).toThrow(/tefi:head/);
    expect(() => renderPage(template.replace(NOSCRIPT_MARKER, ''), SITE.url, 'en', build)).toThrow(/tefi:noscript/);
  });

  it('un texto con comillas o "<" no rompe la página', () => {
    const head = renderHead(SITE.url, 'en', build);
    expect(head).not.toMatch(/content="[^"]*<[^"]*"/);
    expect(renderNoscript(SITE.url, 'en')).toContain('(&quot;el fiado&quot;)');
  });
});

describe('archivos para buscadores y asistentes de IA', () => {
  it('robots.txt deja pasar a todos y apunta al sitemap', () => {
    const lines = renderRobots(SITE.url).split('\n').filter(Boolean);
    expect(lines).toEqual(['User-agent: *', 'Allow: /', 'Sitemap: https://tef-iapp.vercel.app/sitemap.xml']);
  });

  it('sitemap.xml lista las dos versiones con la fecha del commit', () => {
    const sitemap = renderSitemap(SITE.url, build);
    expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(found => found[1])).toEqual(['https://tef-iapp.vercel.app/', 'https://tef-iapp.vercel.app/es/']);
    expect(sitemap.match(/<lastmod>2026-10-10<\/lastmod>/g)).toHaveLength(2);
    expect(sitemap.match(/hreflang="x-default"/g)).toHaveLength(2);
    expect(renderSitemap(SITE.url, { ...build, committedAt: '' })).not.toContain('<lastmod>');
  });

  it('llms.txt sigue el formato de llmstxt.org: título, resumen, y secciones que solo tienen enlaces', () => {
    const llms = renderLlms(SITE.url, build);
    const lines = llms.split('\n');
    expect(lines[0]).toBe('# Tefi.app');
    expect(lines[2]).toBe(`> ${SITE_COPY.en.description}`);
    expect(llms).toContain(`- Program id: ${SITE.programId}`);
    expect(llms).toContain('- Version: 2.1.0 (commit 687581d, 2026-10-10)');

    const sections = llms.split(/\n## /).slice(1);
    expect(sections.map(section => section.split('\n')[0])).toEqual(['Docs', 'Source and on-chain program', 'Optional']);
    for (const section of sections) {
      const items = section.split('\n').slice(1).filter(Boolean);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) expect(item).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)]+\): \S/);
    }
  });

  it('version.json dice qué versión está publicada', () => {
    expect(JSON.parse(renderVersion(build))).toEqual(build);
    expect(JSON.parse(renderVersion({ ...build, modified: true }))).toEqual({ ...build, modified: true });
  });
});
