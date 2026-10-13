import { getCollection, type CollectionEntry } from 'astro:content';
import { BANDS, CATEGORIES, OCCASIONS } from './constants';

export { BANDS, CATEGORIES, OCCASIONS };

export type Product = CollectionEntry<'products'>;
export type Look = CollectionEntry<'looks'>;
export type ResolvedLook = Look & { items: Product[]; band: string };

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a site path or uploaded asset with the deploy base path. */
export const url = (path = '/') => {
  if (/^https?:\/\//.test(path)) return path;
  return BASE + (path.startsWith('/') ? path : '/' + path);
};

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const bandRank = (b: string) => BANDS.indexOf(b as (typeof BANDS)[number]);

/** Label for a look's price tag: a single piece shows its band, several show the upper limit. */
export function lookBand(items: Product[]) {
  if (!items.length) return '';
  if (items.length === 1) return items[0].data.price_band;
  const top = items.reduce((a, p) => Math.max(a, bandRank(p.data.price_band)), 0);
  return ['Pieces under $20', 'Pieces under $30', 'Pieces under $50', 'Pieces $50+'][top];
}

export async function getProducts() {
  const all = await getCollection('products');
  return all.filter((p) => !p.data.hidden).sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export async function getLooks(): Promise<ResolvedLook[]> {
  const products = await getProducts();
  const byId = new Map(products.map((p) => [p.id, p]));
  const looks = (await getCollection('looks')).filter((l) => !l.data.hidden);
  return looks
    .map((l) => {
      const items = (l.data.pieces ?? []).map((id) => byId.get(id)).filter(Boolean) as Product[];
      return Object.assign(l, { items, band: lookBand(items) });
    })
    .sort((a, b) => Number(b.data.featured) - Number(a.data.featured) || b.data.date.getTime() - a.data.date.getTime());
}

export async function getEdits() {
  return (await getCollection('edits')).sort((a, b) => a.data.order - b.data.order);
}

/** Looks and products that belong in an edit with the given tag. */
export async function editContents(tag: string) {
  const [looks, products] = await Promise.all([getLooks(), getProducts()]);
  const has = (t?: string[] | null) => (t ?? []).includes(tag);
  return {
    looks: looks.filter((l) => has(l.data.tags) || l.items.some((p) => has(p.data.tags))),
    products: products.filter((p) => has(p.data.tags)),
  };
}

/** Looks/products for the automatic "Under $30" edit. */
export async function under30() {
  const [looks, products] = await Promise.all([getLooks(), getProducts()]);
  const cheap = (p: Product) => bandRank(p.data.price_band) <= 1;
  return {
    looks: looks.filter((l) => l.items.length && l.items.every(cheap)),
    products: products.filter(cheap),
  };
}

export const occasionSlug = (o: string) => slugify(o);
export const categorySlug = (c: string) => slugify(c);

/** Products suggested to go with `p`: hidden, unknown and self references are dropped. */
export async function getPairs(p: Product, exclude: string[] = []): Promise<Product[]> {
  const byId = new Map((await getProducts()).map((x) => [x.id, x]));
  const seen = new Set<string>([p.id, ...exclude]);
  const out: Product[] = [];
  for (const id of p.data.pairs_with ?? []) {
    const hit = byId.get(id);
    if (hit && !seen.has(hit.id)) { seen.add(hit.id); out.push(hit); }
  }
  return out;
}
