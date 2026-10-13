// Cloudflare Pages Function: records a click on a "Shop on Amazon" link.
// Stores only which product/look/page was clicked, the time and the country (no cookies, no personal data).
const SLUG = /^[a-z0-9-]{1,120}$/;

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const product = String(body.p || '');
    if (!SLUG.test(product)) return new Response(null, { status: 400 });
    const look = SLUG.test(String(body.l || '')) ? String(body.l) : null;
    const page = String(body.path || '').slice(0, 200) || null;
    const country = request.cf?.country || null;
    await env.DB.prepare('INSERT INTO clicks (ts, product, look, page, country) VALUES (?, ?, ?, ?, ?)')
      .bind(Date.now(), product, look, page, country)
      .run();
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
