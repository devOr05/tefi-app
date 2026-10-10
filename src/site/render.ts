// Arma lo que se publica además de la app: los metadatos y el texto sin JavaScript de cada página, y los
// archivos robots.txt, sitemap.xml, llms.txt y version.json. Funciones puras; las llama el build (vite.config.ts).
import type { Language } from '../i18n/translations';
import type { BuildInfo } from '../version';
import { PROGRAM_EXPLORER_URL, SITE, SITE_COPY } from './content';
import { LANGUAGES, LANGUAGE_PATHS, PAGE_TITLES } from './language';

/** Lugares de index.html donde el build inserta los metadatos y el texto sin JavaScript */
export const HEAD_MARKER = '<!-- tefi:head -->';
export const NOSCRIPT_MARKER = '<!-- tefi:noscript -->';

export const OG_LOCALES: Record<Language, string> = { en: 'en_US', es: 'es_AR' };
/** Imagen de la vista previa del link (1200x630), una por idioma. Se generan con scripts/make-og-images.mjs */
export const PREVIEW_IMAGES: Record<Language, string> = { en: '/og-image.png', es: '/og-image-es.png' };

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const trimSlash = (url: string) => url.replace(/\/$/, '');

export function pageUrl(siteUrl: string, language: Language): string {
  return trimSlash(siteUrl) + LANGUAGE_PATHS[language];
}

/** Datos estructurados de schema.org: lo que un buscador o un asistente lee sin interpretar la página. */
export function structuredData(siteUrl: string, language: Language, build: BuildInfo): Record<string, unknown> {
  const copy = SITE_COPY[language];
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE.name,
    alternateName: 'Tefi',
    url: pageUrl(siteUrl, language),
    description: copy.description,
    inLanguage: language,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    softwareVersion: build.version,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: `${SITE.repository}/blob/main/LICENSE`,
    image: trimSlash(siteUrl) + PREVIEW_IMAGES[language],
    featureList: copy.features,
    sameAs: [SITE.repository]
  };
}

export function renderHead(siteUrl: string, language: Language, build: BuildInfo): string {
  const copy = SITE_COPY[language];
  const title = escapeHtml(PAGE_TITLES[language]);
  const description = escapeHtml(copy.description);
  const url = pageUrl(siteUrl, language);
  const image = trimSlash(siteUrl) + PREVIEW_IMAGES[language];
  const imageAlt = escapeHtml(copy.imageAlt);
  // Dentro de <script> no puede aparecer "</script": se escapa el "<"
  const json = JSON.stringify(structuredData(siteUrl, language, build)).replace(/</g, '\\u003c');

  return [
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    ...LANGUAGES.map(other => `<link rel="alternate" hreflang="${other}" href="${pageUrl(siteUrl, other)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl(siteUrl, 'en')}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${imageAlt}" />`,
    `<meta property="og:locale" content="${OG_LOCALES[language]}" />`,
    ...LANGUAGES.filter(other => other !== language).map(other => `<meta property="og:locale:alternate" content="${OG_LOCALES[other]}" />`),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${imageAlt}" />`,
    `<script type="application/ld+json">${json}</script>`
  ].join('\n    ');
}

/**
 * Lo que ve quien abre la página sin JavaScript: un buscador con IA, un lector de texto o un navegador con
 * JavaScript apagado. Los estilos van en línea porque los de la app borran títulos y listas.
 */
export function renderNoscript(siteUrl: string, language: Language): string {
  const copy = SITE_COPY[language];
  const other = LANGUAGES.find(candidate => candidate !== language) as Language;
  const heading = 'font-weight:800;line-height:1.25;';
  const link = (label: string, url: string) => `<a href="${escapeHtml(url)}" style="color:#008740;font-weight:700;text-decoration:underline">${escapeHtml(label)}</a>`;

  return [
    '<noscript>',
    `  <main lang="${language}" style="max-width:42rem;margin:0 auto;padding:2rem 1.25rem 3rem;line-height:1.6;user-select:text;-webkit-user-select:text">`,
    `    <img src="/icon.svg" alt="Tefi" width="64" height="64" />`,
    `    <h1 style="${heading}font-size:1.6rem;margin:1rem 0 .75rem">${escapeHtml(copy.heading)}</h1>`,
    `    <p>${escapeHtml(copy.lead)}</p>`,
    `    <h2 style="${heading}font-size:1.2rem;margin:1.75rem 0 .5rem">${escapeHtml(copy.howTitle)}</h2>`,
    `    <ol style="list-style:decimal;padding-left:1.4rem">`,
    ...copy.steps.map(step => `      <li style="margin:.4rem 0">${escapeHtml(step)}</li>`),
    `    </ol>`,
    `    <h2 style="${heading}font-size:1.2rem;margin:1.75rem 0 .5rem">${escapeHtml(copy.questionsTitle)}</h2>`,
    ...copy.questions.flatMap(({ question, answer }) => [
      `    <h3 style="${heading}font-size:1rem;margin:1rem 0 .15rem">${escapeHtml(question)}</h3>`,
      `    <p>${escapeHtml(answer)}</p>`
    ]),
    `    <h2 style="${heading}font-size:1.2rem;margin:1.75rem 0 .5rem">${escapeHtml(copy.linksTitle)}</h2>`,
    `    <ul style="list-style:disc;padding-left:1.4rem">`,
    ...copy.links.map(({ label, url }) => `      <li style="margin:.3rem 0">${link(label, url)}${url === PROGRAM_EXPLORER_URL ? `: <code style="word-break:break-all">${SITE.programId}</code>` : ''}</li>`),
    `      <li style="margin:.3rem 0">${link(copy.otherLanguage, pageUrl(siteUrl, other))}</li>`,
    `    </ul>`,
    `    <p style="margin-top:1.75rem;font-weight:700">${escapeHtml(copy.needsJavaScript)}</p>`,
    '  </main>',
    '</noscript>'
  ].join('\n    ');
}

/** index.html compilado -> la página de un idioma, con sus metadatos y su texto sin JavaScript. */
export function renderPage(template: string, siteUrl: string, language: Language, build: BuildInfo): string {
  const replaceOnce = (html: string, pattern: string | RegExp, replacement: string, what: string) => {
    const count = typeof pattern === 'string' ? html.split(pattern).length - 1 : (html.match(new RegExp(pattern.source, 'g')) || []).length;
    if (count !== 1) throw new Error(`index.html: expected exactly one ${what}, found ${count}`);
    // Con una función el texto insertado no interpreta "$&" ni "$1"
    return html.replace(pattern, () => replacement);
  };

  let html = template;
  html = replaceOnce(html, /<html lang="[a-zA-Z-]+">/, `<html lang="${language}">`, '<html lang>');
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escapeHtml(PAGE_TITLES[language])}</title>`, '<title>');
  html = replaceOnce(html, HEAD_MARKER, renderHead(siteUrl, language, build), HEAD_MARKER);
  html = replaceOnce(html, NOSCRIPT_MARKER, renderNoscript(siteUrl, language), NOSCRIPT_MARKER);
  return html;
}

export function renderRobots(siteUrl: string): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${trimSlash(siteUrl)}/sitemap.xml`, ''].join('\n');
}

export function renderSitemap(siteUrl: string, build: BuildInfo): string {
  const lastModified = /^\d{4}-\d{2}-\d{2}/.test(build.committedAt) ? build.committedAt.slice(0, 10) : '';
  const alternates = [
    ...LANGUAGES.map(language => `    <xhtml:link rel="alternate" hreflang="${language}" href="${pageUrl(siteUrl, language)}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(siteUrl, 'en')}" />`
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...LANGUAGES.flatMap(language => [
      '  <url>',
      `    <loc>${pageUrl(siteUrl, language)}</loc>`,
      ...(lastModified ? [`    <lastmod>${lastModified}</lastmod>`] : []),
      ...alternates,
      '  </url>'
    ]),
    '</urlset>',
    ''
  ].join('\n');
}

/** llms.txt (llmstxt.org): la descripción del sitio en Markdown para asistentes de IA. Va en inglés. */
export function renderLlms(siteUrl: string, build: BuildInfo): string {
  const copy = SITE_COPY.en;
  const site = trimSlash(siteUrl);
  const commit = build.commit ? ` (commit ${build.commit.slice(0, 7)}${build.committedAt ? `, ${build.committedAt.slice(0, 10)}` : ''})` : '';

  return [
    `# ${SITE.name}`,
    '',
    `> ${copy.description}`,
    '',
    copy.lead,
    '',
    `${copy.howTitle}:`,
    '',
    ...copy.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    `${copy.questionsTitle}:`,
    '',
    ...copy.questions.map(({ question, answer }) => `- **${question}** ${answer}`),
    '',
    'Facts:',
    '',
    `- App: ${pageUrl(site, 'en')} (English) and ${pageUrl(site, 'es')} (Spanish)`,
    '- Network: Solana devnet, a test network. It is a prototype: not for real money.',
    `- Program id: ${SITE.programId}`,
    `- Version: ${build.version}${commit}`,
    `- License: ${SITE.license}`,
    '',
    '## Docs',
    '',
    `- [README](${SITE.repository}/blob/main/README.md): the problem, how the two-phone co-signature works, the stack and the devnet transactions that show it`,
    `- [Changelog](${SITE.repository}/blob/main/CHANGELOG.md): what changed in each version`,
    '',
    '## Source and on-chain program',
    '',
    `- [GitHub repository](${SITE.repository}): the Anchor program, the web app and the tests`,
    `- [Tefi program on Solana Explorer](${PROGRAM_EXPLORER_URL}): the program deployed on devnet`,
    '',
    '## Optional',
    '',
    `- [Versión en español](${pageUrl(site, 'es')}): the same page in Spanish`,
    ''
  ].join('\n');
}

/** version.json: qué versión está publicada, para consultarla sin abrir la app. */
export function renderVersion(build: BuildInfo): string {
  const published = { version: build.version, commit: build.commit, committedAt: build.committedAt, ...(build.modified ? { modified: true } : {}) };
  return JSON.stringify(published, null, 2) + '\n';
}
