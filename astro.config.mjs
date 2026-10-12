// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site. The account's Pages domain (chiranjeevipandey.com.np) serves it at /sana-closet/
// When a custom domain is added: set `site` to it and remove `base`.
export default defineConfig({
  site: 'https://chiranjeevipandey.com.np',
  base: '/sana-closet',
  trailingSlash: 'ignore',
});
