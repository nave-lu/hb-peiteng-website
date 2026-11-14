import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.hbpeiteng.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
