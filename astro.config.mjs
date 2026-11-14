// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://correjocs.cat',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: {
    // Genera /jocs/catan/index.html — funciona a l'Apache de cdmon sense
    // cap regla de reescriptura.
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
