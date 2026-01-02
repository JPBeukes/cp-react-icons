import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'static',
  // Configure for GitHub Pages (update with your repo name)
  // site: 'https://YOUR_USERNAME.github.io',
  // base: '/cp-react-icons/',
});

