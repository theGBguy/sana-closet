import type { APIRoute } from 'astro';
import { getLooks, getProducts } from '../lib/data';

// Small lookup used by the "My Closet" sheet to render saved items.
export const GET: APIRoute = async () => {
  const [looks, products] = await Promise.all([getLooks(), getProducts()]);
  const body = {
    looks: Object.fromEntries(looks.map((l) => [l.id, { t: l.data.title, img: l.data.photos[0], url: `/look/${l.id}/` }])),
    products: Object.fromEntries(
      products.map((p) => [p.id, { t: p.data.title, img: p.data.photo || undefined, band: p.data.price_band, link: p.data.link }]),
    ),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};
