// formai — prerender the page in English and Finnish for search engines.
// Fills every data-i18n element with its text, sets language, title,
// description, canonical and hreflang links, adds FAQ structured data,
// share image tags and organisation data, and writes <out>/index.html (en),
// <out>/fi/index.html (fi), <out>/404.html and a sitemap.
// Usage: node tools/prerender.mjs <out-dir> <site-url>
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const out = process.argv[2] || '_site';
let site = process.argv[3] || 'https://jaysssss1111.github.io/Formai/';
site = site.replace(/\/+$/, '') + '/';

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync('assets/js/i18n.js', 'utf8'), ctx);
const { T, LEGAL } = ctx.window.FM_I18N;
vm.runInNewContext(fs.readFileSync('assets/js/config.js', 'utf8'), ctx);
const CFG = ctx.window.FM_CONFIG || {};
// Company fields still holding the placeholders from config.js are left out of the structured data.
const real = (v) => (v && !/0000000-0|example\.(com|org|net)|esimerkki/i.test(v) ? v : '');
const template = fs.readFileSync(path.join(out, 'index.html'), 'utf8');

// News cards are drawn by assets/js/news.js from assets/data/news.json.
vm.runInNewContext(fs.readFileSync('assets/js/news.js', 'utf8'), ctx);
const NEWS = fs.existsSync('assets/data/news.json') ? JSON.parse(fs.readFileSync('assets/data/news.json', 'utf8')) : [];

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const TAG = "font-family: 'DM Mono', ui-monospace, monospace; font-size: 12px; font-weight: 400; letter-spacing: 0.12em; text-transform: uppercase; line-height: 1; padding: 8px 12px; border: 1px solid var(--strong); color: var(--muted);";

function render(lang) {
  const tr = Object.assign({}, T[lang], LEGAL[lang]);
  const url = lang === 'fi' ? site + 'fi/' : site;
  let html = template;

  // Text content of empty data-i18n elements.
  html = html.replace(/(<([a-zA-Z][\w-]*)\b[^>]*?\sdata-i18n="([^"]+)"[^>]*>)(<\/\2>)/g, (m, open, tag, key, close) => {
    const v = get(tr, key);
    return typeof v === 'string' ? open + esc(v) + close : m;
  });
  // aria-label from data-i18n-aria-label.
  html = html.replace(/<([a-zA-Z][\w-]*)\b([^>]*?)\sdata-i18n-aria-label="([^"]+)"([^>]*)>/g, (m, tag, a, key, b) => {
    const v = get(tr, key);
    if (typeof v !== 'string' || /\saria-label=/.test(a + b)) return m;
    return `<${tag}${a} data-i18n-aria-label="${key}" aria-label="${esc(v)}"${b}>`;
  });
  // Tag lists.
  html = html.replace(/(<div\b[^>]*\sdata-list="([^"]+)"[^>]*>)\s*(<\/div>)/g, (m, open, key, close) => {
    const list = get(tr, key);
    return Array.isArray(list) ? open + list.map((t) => `<span style="${TAG}">${esc(t)}</span>`).join('') + close : m;
  });

  // AI news: lead story, list and filters in the HTML, data inline so the page needs no extra request.
  if (NEWS.length) {
    html = html.replace('<section id="news" class="fm-grain" hidden', '<section id="news" class="fm-grain"');
    const UI = ctx.window.FM_NEWS_UI;
    html = html.replace('<div class="fm-news-grid" id="fm-news-root"></div>', '<div class="fm-news-grid" id="fm-news-root">' + UI.layout(NEWS, tr, lang, {}) + '</div>');
    html = html.replace('<div class="fm-news-filters" id="fm-news-filters" role="group"></div>',
      '<div class="fm-news-filters" id="fm-news-filters" role="group" aria-label="' + esc(tr.newsFilter) + '">' + UI.filters(NEWS, tr, '') + '</div>');
    html = html.replace('<div class="fm-news-morebar" id="fm-news-morebar"></div>', '<div class="fm-news-morebar" id="fm-news-morebar">' + UI.moreButton(NEWS, tr, {}, 'chip') + '</div>');
  }
  html = html.replace('<script src="assets/js/news.js', '<script>window.FM_NEWS=' + JSON.stringify(NEWS).replace(/</g, '\\u003c') + ';</script>\n<script src="assets/js/news.js');

  // Language, title, description, links.
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}" data-page-lang="${lang}"`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(tr.meta.title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(tr.meta.description)}">`);
  // Every q/a pair, in the order they appear on the page.
  const faqOrder = [...html.matchAll(/data-i18n="faq\.q(\d+)"/g)].map((m) => Number(m[1]));
  const faq = faqOrder.map((n) => ({
    '@type': 'Question', name: tr.faq['q' + n], acceptedAnswer: { '@type': 'Answer', text: tr.faq['a' + n] }
  }));
  const C = CFG.company || {}, social = CFG.social || {};
  const street = real(C.street), city = real(C.city), email = real(C.email), taxID = real(C.businessId);
  const org = { '@type': 'Organization', '@id': site + '#org', name: C.name || 'formai', alternateName: 'formai', url: site,
    logo: site + 'assets/icons/icon-512.png', image: site + `assets/og/formai-${lang}.png`, description: tr.meta.description };
  if (email) org.email = email;
  if (taxID) org.taxID = taxID;
  if (street) {   // only once the real street address is in config.js
    const pc = (city.match(/^\d{5}/) || [''])[0];
    org.address = { '@type': 'PostalAddress', streetAddress: street || undefined, postalCode: pc || undefined, addressLocality: city.replace(/^\d{5}\s*/, '') || undefined, addressCountry: 'FI' };
  }
  const same = Object.values(social).filter((u) => /^https?:\/\//.test(u || ''));
  if (same.length) org.sameAs = same;
  const ld = { '@context': 'https://schema.org', '@graph': [
    org,
    { '@type': 'WebSite', '@id': url + '#site', url, name: 'formai', inLanguage: lang, publisher: { '@id': site + '#org' } },
    { '@type': 'FAQPage', inLanguage: lang, mainEntity: faq }
  ] };
  const ogImage = site + `assets/og/formai-${lang}.png`;
  const head = [
    `<link rel="canonical" href="${url}">`,
    `<link rel="alternate" hreflang="en" href="${site}">`,
    `<link rel="alternate" hreflang="fi" href="${site}fi/">`,
    `<link rel="alternate" hreflang="x-default" href="${site}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="formai">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(tr.meta.title)}">`,
    `<meta property="og:description" content="${esc(tr.meta.description)}">`,
    `<meta property="og:locale" content="${lang === 'fi' ? 'fi_FI' : 'en_GB'}">`,
    `<meta property="og:locale:alternate" content="${lang === 'fi' ? 'en_GB' : 'fi_FI'}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(tr.heroP)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(tr.meta.title)}">`,
    `<meta name="twitter:description" content="${esc(tr.meta.description)}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`
  ].join('\n');
  html = html.replace('</head>', head + '\n</head>');

  // The Finnish page lives one folder down.
  if (lang === 'fi') html = html.replace(/(href|src)="assets\//g, '$1="../assets/');
  return html;
}

const en = render('en');
const fi = render('fi');
fs.writeFileSync(path.join(out, 'index.html'), en);
fs.mkdirSync(path.join(out, 'fi'), { recursive: true });
fs.writeFileSync(path.join(out, 'fi', 'index.html'), fi);

// A branded "page not found" in both languages. GitHub Pages serves it for any missing path,
// so its links use the site's own path from the root rather than relative ones.
const base = new URL(site).pathname;
// The wordmark in the text colour, so it works on the light and the dark background.
const WORDMARK = fs.readFileSync('assets/logos/formai-wordmark-charcoal.svg', 'utf8').replace(/<\?xml[^>]*>/, '').replace(/<title>[^<]*<\/title>/, '').replace('<svg ', '<svg aria-hidden="true" style="height:28px;width:auto;display:block" ').replace(/fill="#141210"/g, 'fill="currentColor"');
const t404 = { en: T.en.notFound, fi: T.fi.notFound };
fs.writeFileSync(path.join(out, '404.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(t404.en.title)} · formai</title>
<link rel="icon" type="image/svg+xml" href="${base}assets/icons/favicon.svg">
<link rel="icon" type="image/png" sizes="48x48" href="${base}assets/icons/favicon-48.png">
<link rel="apple-touch-icon" href="${base}assets/icons/apple-touch-icon.png">
<meta name="theme-color" content="#EDE6D8">
<style>
@font-face{font-family:'DM Sans';font-weight:200;font-display:swap;src:url(${base}assets/fonts/DMSans-200.woff2) format('woff2')}
@font-face{font-family:'DM Sans';font-weight:300;font-display:swap;src:url(${base}assets/fonts/DMSans-300.woff2) format('woff2')}
@font-face{font-family:'DM Mono';font-weight:400;font-display:swap;src:url(${base}assets/fonts/DMMono-400.woff2) format('woff2')}
:root{--surface:#EDE6D8;--ink:#26221E;--muted:#5E564B;--accent:#A8461A;--on-accent:#EDE6D8}
@media (prefers-color-scheme: dark){:root{--surface:#141210;--ink:#EDE6D8;--muted:#A39A8B;--accent:#E2692B;--on-accent:#141210}}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:var(--surface);color:var(--ink);font-family:'DM Sans',system-ui,sans-serif}
main{min-height:100vh;max-width:1200px;margin:0 auto;padding:48px 40px;display:flex;flex-direction:column;justify-content:center;gap:56px}
.brand{display:flex;align-items:center;gap:12px;color:inherit;text-decoration:none;font-size:1.75rem;font-weight:300;letter-spacing:-0.02em}
.code{font-family:'DM Mono',monospace;font-size:0.75rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:40px}
h1{margin:12px 0 16px;font-size:clamp(2.5rem,6vw,4.5rem);line-height:1;font-weight:200;letter-spacing:-0.03em}
p{margin:0 0 24px;font-size:1.0625rem;line-height:1.6;font-weight:300;color:var(--muted);max-width:30em}
a.home{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 20px;background:var(--accent);color:var(--on-accent);text-decoration:none;font-size:1rem}
a.home:hover{filter:brightness(1.08)}a.home:active{transform:translateY(1px)}
a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
svg.eye path.l{stroke:var(--ink)}
@media (max-width:640px){main{padding:32px 20px}}
</style>
</head>
<body>
<main>
<a class="brand" href="${base}" aria-label="formai">${WORDMARK}<svg class="eye" viewBox="0 0 64 64" width="36" height="36" aria-hidden="true"><path class="l" d="M4 32 Q32 8 60 32 Q32 56 4 32 Z" fill="none" stroke-width="3" stroke-miterlimit="2"/><path d="M32 23 L41 32 L32 41 L23 32 Z" fill="#C85A20"/></svg></a>
<div class="cols">
<section lang="en"><span class="code">404</span><h1>${esc(t404.en.title)}</h1><p>${esc(t404.en.text)}</p><a class="home" href="${base}">${esc(t404.en.home)} &rarr;</a></section>
<section lang="fi"><span class="code">404</span><h1>${esc(t404.fi.title)}</h1><p>${esc(t404.fi.text)}</p><a class="home" href="${base}fi/">${esc(t404.fi.home)} &rarr;</a></section>
</div>
</main>
</body>
</html>
`);

const alt = `<xhtml:link rel="alternate" hreflang="en" href="${site}"/><xhtml:link rel="alternate" hreflang="fi" href="${site}fi/"/>`;
fs.writeFileSync(path.join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  `<url><loc>${site}</loc>${alt}</url>\n<url><loc>${site}fi/</loc>${alt}</url>\n</urlset>\n`);
console.log('prerendered en + fi + 404 for', site);
