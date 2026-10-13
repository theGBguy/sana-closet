// Cloudflare Pages Function: private click report at /stats?key=...
// The key is the STATS_KEY variable on the Pages project.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const title = (slug) => slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  if (!env.STATS_KEY || key !== env.STATS_KEY) return new Response('Not found', { status: 404 });

  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10) || 30));
  const since = Date.now() - days * 864e5;
  const q = (sql) => env.DB.prepare(sql).bind(since).all().then((r) => r.results || []);
  const [total, products, looks, countries] = await Promise.all([
    q('SELECT COUNT(*) AS n FROM clicks WHERE ts >= ?'),
    q('SELECT product AS k, COUNT(*) AS n FROM clicks WHERE ts >= ? GROUP BY product ORDER BY n DESC LIMIT 30'),
    q("SELECT look AS k, COUNT(*) AS n FROM clicks WHERE ts >= ? AND look IS NOT NULL GROUP BY look ORDER BY n DESC LIMIT 20"),
    q("SELECT COALESCE(country, '?') AS k, COUNT(*) AS n FROM clicks WHERE ts >= ? GROUP BY country ORDER BY n DESC LIMIT 8"),
  ]);
  const n = total[0]?.n || 0;
  const table = (rows, link) =>
    rows.length
      ? `<table>${rows.map((r) => `<tr><td>${link ? `<a href="${link(r.k)}">${esc(title(r.k))}</a>` : esc(r.k)}</td><td>${r.n}</td></tr>`).join('')}</table>`
      : '<p class="m">No clicks yet.</p>';
  const tabs = [7, 30, 90].map((d) => `<a class="${d === days ? 'on' : ''}" href="?key=${encodeURIComponent(key)}&days=${d}">${d} days</a>`).join('');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Clicks · SANA</title>
<style>
body{margin:0;background:#F6F1EA;color:#2A201B;font:15px/1.5 "Helvetica Neue",Arial,sans-serif}
main{max-width:640px;margin:0 auto;padding:28px 20px 60px}
h1{font:400 40px/1 Georgia,serif;margin:6px 0 4px}h2{font:400 24px/1 Georgia,serif;margin:34px 0 10px}
.l,.tabs a{font-size:11px;letter-spacing:.16em;text-transform:uppercase}.m{color:#74655A}
.tabs{display:flex;gap:18px;margin:18px 0 0}.tabs a{color:#74655A;text-decoration:none;padding-bottom:4px}.tabs a.on{color:#2A201B;border-bottom:1px solid #2A201B}
table{width:100%;border-collapse:collapse;border-top:1px solid #2A201B}td{padding:11px 0;border-bottom:1px solid #DED3C5}td:last-child{text-align:right;font-variant-numeric:tabular-nums}
a{color:inherit}
</style></head><body><main>
<span class="l m">Amazon clicks</span>
<h1>${n} <em style="font-size:.6em;color:#74655A">in ${days} days</em></h1>
<nav class="tabs">${tabs}</nav>
<h2>Products</h2>${table(products)}
<h2>From these looks</h2>${table(looks, (k) => `/look/${encodeURIComponent(k)}/`)}
<h2>Countries</h2>${table(countries)}
<p class="m" style="margin-top:28px;font-size:13px">A click means someone opened the Amazon page. Sales and earnings are in your Amazon Associates reports.</p>
</main></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
