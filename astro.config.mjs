// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';
import { guideLinks, noteBoxes, wrapTables } from './src/lib/markdown.mjs';

export default defineConfig({
  site: 'https://docs.hypeproxies.com',
  // `preserve` keeps the URLs the Jekyll site published: guides/mac-mini/connecting.md is served at
  // /mac-mini/connecting.html (GitHub Pages also answers /mac-mini/connecting), and a service page
  // at /mac-mini/.
  build: { format: 'preserve' },
  integrations: [react()],
  markdown: {
    // Code colors come from c6 tokens through --astro-code-* (see global.css), not from a theme.
    shikiConfig: { theme: 'css-variables' },
    processor: satteri({ hastPlugins: [noteBoxes, guideLinks, wrapTables] }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
