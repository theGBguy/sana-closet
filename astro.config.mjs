// @ts-check
import { defineConfig } from 'astro/config';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SMALL_W = 420; // keep in sync with src/lib/img.ts

/** After the build, write a small WebP copy of every large upload into uploads/_w420/ for phone grids,
 *  and a JPEG copy into uploads/_og/ for link previews (some apps don't show WebP). */
const phoneImages = {
  name: 'phone-images',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const up = path.join(fileURLToPath(dir), 'uploads');
      const out = path.join(up, `_w${SMALL_W}`);
      await fs.mkdir(out, { recursive: true });
      await fs.mkdir(path.join(up, '_og'), { recursive: true });
      const files = (await fs.readdir(up)).filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f));
      let n = 0;
      await Promise.all(
        files.map(async (f) => {
          const src = path.join(up, f);
          const { width = 0 } = await sharp(src).metadata();
          await sharp(src).resize({ width: 1200, withoutEnlargement: true }).flatten({ background: '#F6F1EA' }).jpeg({ quality: 82 }).toFile(path.join(up, '_og', f.replace(/\.[^.]+$/, '.jpg')));
          if (width <= SMALL_W * 1.2) return;
          await sharp(src).resize({ width: SMALL_W }).webp({ quality: 78 }).toFile(path.join(out, f.replace(/\.[^.]+$/, '.webp')));
          n++;
        }),
      );
      logger.info(`${n} phone-sized images written`);
    },
  },
};

// Hosted on Cloudflare Pages (project "sanastylebeauty"), rebuilt on every push to main.
// When a custom domain is added, change `site` to it.
export default defineConfig({
  site: 'https://sanastylebeauty.pages.dev',
  trailingSlash: 'ignore',
  integrations: [phoneImages],
});
