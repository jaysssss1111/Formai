// formai — collect AI news for the site's news carousel.
// Reads a few RSS/Atom feeds, keeps items that match the studio's topics
// (design, web, code, agents, automation, regulation, AI search), and
// merges them with hand-picked entries in assets/data/news.json.
// Runs in GitHub Actions (see .github/workflows/news.yml). Usage:
//   node tools/fetch-news.mjs [--max 9] [--new 3]
import fs from 'node:fs';

const FILE = 'assets/data/news.json';
const args = process.argv.slice(2);
const MAX = Number(args[args.indexOf('--max') + 1]) || 9;

// Publisher feeds. Each item links back to the original article.
const FEEDS = [
  { source: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/' },
  { source: 'The Verge', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { source: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { source: 'Google', url: 'https://blog.google/technology/ai/rss/' },
  { source: 'OpenAI', url: 'https://openai.com/news/rss.xml' },
  { source: 'MIT Technology Review', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed' }
];

// Topics in priority order: the first match decides the card's cover and label.
const TOPICS = [
  { id: 'design', words: ['design', 'designer', 'figma', 'ux', 'ui ', 'interface', 'brand', 'creative', 'adobe', 'typography'] },
  { id: 'code', words: ['coding', 'developer', 'software development', 'code', 'programming', 'devtools', 'github'] },
  { id: 'agents', words: ['agent', 'agents', 'agentic', 'automation', 'automate', 'workflow', 'assistant'] },
  { id: 'regulation', words: ['ai act', 'regulation', 'regulator', 'compliance', 'eu ', 'european commission', 'gdpr', 'copyright'] },
  { id: 'search', words: ['search', 'seo', 'traffic', 'publishers', 'answer engine'] }
];
const MUST = ['ai', 'artificial intelligence', 'machine learning', 'llm', 'model', 'gpt', 'claude', 'gemini', 'agent'];

const decode = (s) => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;|&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
  .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&hellip;/g, '…')
  .replace(/\s+/g, ' ').trim();
const tag = (xml, name) => { const m = xml.match(new RegExp('<' + name + '\\b[^>]*>([\\s\\S]*?)</' + name + '>', 'i')); return m ? m[1] : ''; };
const link = (xml) => {
  const a = xml.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || xml.match(/<link\b[^>]*href=["']([^"']+)["']/i);
  return a ? a[1] : decode(tag(xml, 'link'));
};
const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)).replace(/[,;:.\s]+$/, '') + '…');

function parse(xml, source) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  return blocks.map((b) => {
    const title = decode(tag(b, 'title'));
    const url = link(b).trim();
    const date = new Date(decode(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date')));
    const summary = clip(decode(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content')), 220);
    return { title, url, source, date: isNaN(date) ? null : date.toISOString().slice(0, 10), summary };
  }).filter((x) => x.title && /^https?:\/\//.test(x.url));
}

function classify(item) {
  const text = (' ' + item.title + ' ' + item.summary + ' ').toLowerCase();
  if (!MUST.some((w) => new RegExp('\\b' + w + '\\b').test(text))) return null;
  for (const t of TOPICS) if (t.words.some((w) => text.includes(w))) return t.id;
  return null;   // AI news, but not about the studio's fields: skip
}

const existing = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : [];
const manual = existing.filter((x) => x.manual);
const seen = new Set(existing.map((x) => x.url));
const found = [];

for (const f of FEEDS) {
  try {
    const res = await fetch(f.url, { headers: { 'User-Agent': 'formai-news-bot (+https://github.com/jaysssss1111/Formai)' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const items = parse(await res.text(), f.source);
    let kept = 0;
    for (const it of items) {
      const topic = classify(it);
      if (!topic) continue;
      found.push(Object.assign(it, { topic }));
      kept++;
    }
    console.log(`${f.source}: ${items.length} items, ${kept} on topic`);
  } catch (e) {
    console.log(`${f.source}: skipped (${e.message})`);
  }
}

// Each run adds up to three new articles (newest first, at most one per
// source per run), on top of what is already there; the oldest drop off at MAX.
const NEW_PER_RUN = Number(args[args.indexOf('--new') + 1]) || 3;
const fresh = found
  .filter((x, i, a) => !seen.has(x.url) && a.findIndex((y) => y.url === x.url) === i)
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));
const added = [];
const usedSource = new Set();
for (const x of fresh) {
  if (added.length >= NEW_PER_RUN) break;
  if (usedSource.has(x.source)) continue;
  usedSource.add(x.source);
  added.push(x);
}
const auto = existing.filter((x) => !x.manual);
const picked = [...added, ...auto]
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  .slice(0, Math.max(0, MAX - manual.length));
const out = [...manual, ...picked];
fs.mkdirSync('assets/data', { recursive: true });
fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n');
console.log(`news.json: ${manual.length} hand-picked + ${picked.length} collected (${added.length} new)`);
