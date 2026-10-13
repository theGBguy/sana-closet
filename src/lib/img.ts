import sharp from 'sharp';
import path from 'node:path';
import { url } from './data';

/** Width of the smaller copy made for phones (see the integration in astro.config.mjs). */
export const SMALL_W = 420;

type Info = { w: number; h: number; color: string };
const cache = new Map<string, Promise<Info | null>>();

const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/** Size and dominant colour of an image in /public, used to reserve space and tint the placeholder. */
export function imgInfo(src: string): Promise<Info | null> {
  if (!src || /^https?:/.test(src)) return Promise.resolve(null);
  if (!cache.has(src)) {
    const file = path.join(process.cwd(), 'public', src);
    cache.set(
      src,
      (async () => {
        try {
          const img = sharp(file);
          const [{ width = 0, height = 0 }, stats] = await Promise.all([img.metadata(), img.stats()]);
          const { r, g, b } = stats.dominant;
          // Soften toward the paper colour so placeholders never look loud.
          const mix = (c: number, p: number) => c * 0.7 + p * 0.3;
          return { w: width, h: height, color: `#${hex(mix(r, 0xef))}${hex(mix(g, 0xe7))}${hex(mix(b, 0xdc))}` };
        } catch {
          return null;
        }
      })(),
    );
  }
  return cache.get(src)!;
}

/** Path of the phone-sized copy of an uploaded image. */
export const smallPath = (src: string) => {
  const dir = path.posix.dirname(src);
  const base = path.posix.basename(src).replace(/\.[^.]+$/, '');
  return `${dir}/_w${SMALL_W}/${base}.webp`;
};

/** srcset with the phone copy (production builds only; dev has no copies). */
export function srcset(src: string, info: Info | null) {
  if (!import.meta.env.PROD || !info || info.w <= SMALL_W * 1.2 || !src.startsWith('/uploads/')) return undefined;
  return `${url(smallPath(src))} ${SMALL_W}w, ${url(src)} ${info.w}w`;
}
