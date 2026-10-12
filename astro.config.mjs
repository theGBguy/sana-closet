// @ts-check
import { defineConfig } from 'astro/config';

// Hosted on GitHub Pages at https://thegbguy.github.io/sana-closet/
// When a custom domain is added: set `site` to it and remove `base`.
export default defineConfig({
  site: 'https://thegbguy.github.io',
  base: '/sana-closet',
  trailingSlash: 'ignore',
});
