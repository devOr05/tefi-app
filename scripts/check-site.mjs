// What a search engine or an AI assistant gets from the site when it does NOT run JavaScript: the pages, their
// metadata, the text they can read, and robots.txt / sitemap.xml / llms.txt / version.json.
//
//   node scripts/check-site.mjs                                   checks https://tef-iapp.vercel.app
//   node scripts/check-site.mjs http://localhost:4173 https://tef-iapp.vercel.app
//                                 ^ where to fetch from            ^ the public address the pages must declare
//
// Prints PASS / FAIL per check and exits with 1 if any check fails. No dependencies (Node 18+).

const base = (process.argv[2] || 'https://tef-iapp.vercel.app').replace(/\/$/, '');
const site = (process.argv[3] || base).replace(/\/$/, '');

const PAGES = [
  { path: '/', language: 'en', locale: 'en_US' },
  { path: '/es/', language: 'es', locale: 'es_AR' }
];
const PROGRAM_ID = '9UmX9z1Cr2FCidUBgoMJzDCRp5aeTs7xz4umKRnEGnJQ';
const REPOSITORY = 'https://github.com/devOr05/tefi-app';
// WhatsApp does not show a link preview image heavier than this
const MAX_PREVIEW_IMAGE_BYTES = 300_000;

let passed = 0;
let failed = 0;
function check(condition, label, detail = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${!condition && detail ? `  (${detail})` : ''}`);
  if (condition) passed++;
  else failed++;
  return condition;
}

async function get(url) {
  try {
    const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'tefi-check-site' } });
    const bytes = Buffer.from(await response.arrayBuffer());
    return { status: response.status, type: response.headers.get('content-type') || '', robots: response.headers.get('x-robots-tag') || '', bytes, text: bytes.toString('utf8') };
  } catch (e) {
    return { status: 0, type: '', robots: '', bytes: Buffer.alloc(0), text: '', error: String(e) };
  }
}

const decode = text =>
  text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];
const attr = (tag, name) => {
  const found = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return found ? decode(found[1]) : undefined;
};
const meta = (html, key) => {
  for (const tag of tags(html, 'meta')) {
    if ((attr(tag, 'name') || attr(tag, 'property') || '').toLowerCase() === key) return attr(tag, 'content');
  }
  return undefined;
};
const links = (html, rel) => tags(html, 'link').filter(tag => (attr(tag, 'rel') || '').toLowerCase().split(/\s+/).includes(rel));
// From the public address a page declares to the place this run fetches from
const local = url => (url && url.startsWith(site) ? base + url.slice(site.length) : url);

// Text a reader without JavaScript gets: everything in <body> except scripts and styles
function readableText(html) {
  const body = (html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i) || [, ''])[1];
  return decode(
    body
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function pngSize(bytes) {
  const isPng = bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47;
  return isPng ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) } : null;
}

console.log(`Checking ${base}${site !== base ? ` (pages must declare ${site})` : ''} as a reader without JavaScript\n`);

for (const page of PAGES) {
  const name = `${page.path} [${page.language}]`;
  const response = await get(base + page.path);
  const html = response.text;
  if (!check(response.status === 200 && /text\/html/.test(response.type), `${name} answers 200 with HTML`, `status ${response.status} ${response.type}${response.error ? ' ' + response.error : ''}`)) {
    continue;
  }

  const robotsMeta = `${meta(html, 'robots') || ''} ${response.robots}`.toLowerCase();
  check(!/noindex/.test(robotsMeta), `${name} can be indexed (no "noindex")`, robotsMeta.trim());

  const language = attr(tags(html, 'html')[0] || '', 'lang');
  check(language === page.language, `${name} declares its language in <html lang>`, `lang="${language}"`);

  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim());
  check(title.length >= 15 && title.length <= 70, `${name} has a title of 15 to 70 characters`, `${title.length}: "${title}"`);

  const description = meta(html, 'description') || '';
  check(description.length >= 70 && description.length <= 170, `${name} has a description of 70 to 170 characters`, `${description.length} characters`);

  check(/width=device-width/.test(meta(html, 'viewport') || ''), `${name} has a mobile viewport`);

  const canonical = attr(links(html, 'canonical')[0] || '', 'href');
  check(canonical === site + page.path, `${name} declares its own canonical address`, `canonical="${canonical}"`);

  const alternates = Object.fromEntries(links(html, 'alternate').filter(tag => attr(tag, 'hreflang')).map(tag => [attr(tag, 'hreflang'), attr(tag, 'href')]));
  check(
    alternates.en === `${site}/` && alternates.es === `${site}/es/` && alternates['x-default'] === `${site}/`,
    `${name} links both language versions (hreflang en, es, x-default)`,
    JSON.stringify(alternates)
  );

  const og = key => meta(html, `og:${key}`);
  check(
    !!og('title') && !!og('description') && og('type') === 'website' && og('url') === site + page.path && og('locale') === page.locale,
    `${name} has Open Graph title, description, type, url and locale`,
    JSON.stringify({ title: og('title'), type: og('type'), url: og('url'), locale: og('locale') })
  );
  check(meta(html, 'twitter:card') === 'summary_large_image' && !!meta(html, 'twitter:image'), `${name} has a large-image Twitter card`);

  const imageUrl = og('image') || '';
  const image = imageUrl.startsWith(site) ? await get(local(imageUrl)) : { status: 0, type: '', bytes: Buffer.alloc(0) };
  const size = pngSize(image.bytes);
  check(
    image.status === 200 && /^image\//.test(image.type) && image.bytes.length <= MAX_PREVIEW_IMAGE_BYTES && !!size && size.width === 1200 && size.height === 630,
    `${name} has a 1200x630 preview image light enough for WhatsApp`,
    `"${imageUrl}" status ${image.status} ${image.type} ${image.bytes.length} bytes ${size ? `${size.width}x${size.height}` : ''}`
  );

  let structured = null;
  const block = html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  try {
    structured = block ? JSON.parse(block[1]) : null;
  } catch (e) {
    structured = null;
  }
  check(
    !!structured && structured['@context'] === 'https://schema.org' && structured['@type'] === 'WebApplication' && !!structured.name && !!structured.description && structured.url === site + page.path,
    `${name} has valid schema.org structured data (WebApplication)`,
    block ? 'present but incomplete or not valid JSON' : 'no JSON-LD block'
  );

  const text = readableText(html);
  const words = text ? text.split(' ').length : 0;
  check(words >= 150, `${name} has text a reader without JavaScript can read`, `${words} words`);
  check(text.includes(PROGRAM_ID) && html.includes(REPOSITORY), `${name} names the Solana program and links the source code`);
}

const robots = await get(`${base}/robots.txt`);
const robotsLines = robots.text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
const robotsValid = robotsLines.length > 0 && robotsLines.every(line => /^(user-agent|allow|disallow|sitemap|crawl-delay)\s*:/i.test(line));
check(robots.status === 200 && /text\/plain/.test(robots.type) && robotsValid, 'robots.txt exists and every line is a valid rule', `status ${robots.status} ${robots.type}`);
check(robots.status === 200 && !robotsLines.some(line => /^disallow\s*:\s*\/\s*$/i.test(line)), 'robots.txt does not close the site to crawlers');
check(robotsLines.some(line => line.toLowerCase() === `sitemap: ${site}/sitemap.xml`), 'robots.txt points to the sitemap');

const sitemap = await get(`${base}/sitemap.xml`);
const locations = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(found => found[1]);
check(
  sitemap.status === 200 && /xml/.test(sitemap.type) && /<urlset\b/.test(sitemap.text) && PAGES.every(page => locations.includes(site + page.path)),
  'sitemap.xml lists both language versions',
  `status ${sitemap.status} ${sitemap.type} ${JSON.stringify(locations)}`
);

const llms = await get(`${base}/llms.txt`);
check(
  llms.status === 200 && /text\/(plain|markdown)/.test(llms.type) && /^# \S/.test(llms.text) && /\n> \S/.test(llms.text) && llms.text.includes(PROGRAM_ID) && llms.text.includes(REPOSITORY),
  'llms.txt describes the app for AI assistants (title, summary, program and source links)',
  `status ${llms.status} ${llms.type}`
);

const version = await get(`${base}/version.json`);
let build = null;
try {
  build = JSON.parse(version.text);
} catch (e) {
  build = null;
}
check(version.status === 200 && !!build && /^\d+\.\d+\.\d+$/.test(build.version || ''), 'version.json says which version is published', `status ${version.status}`);
if (build) console.log(`      published: v${build.version}${build.commit ? ` · ${build.commit.slice(0, 7)}` : ''}${build.committedAt ? ` · ${build.committedAt}` : ''}`);

console.log(`\n${passed} of ${passed + failed} checks pass${failed ? `, ${failed} fail` : ''}.`);
process.exitCode = failed ? 1 : 0;
