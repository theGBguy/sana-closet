// @ts-check
import { defineConfig } from 'astro/config';

// Hosted on Cloudflare Pages (project "sana-closet"), auto-built on every push to main.
// When a custom domain is added, change `site` to it.
export default defineConfig({
  site: 'https://sanastylebeauty.pages.dev',
  trailingSlash: 'ignore',
});
