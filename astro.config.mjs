import { defineConfig } from 'astro/config';

// ---------------------------------------------------------------------------
// SITE CONFIG
// ---------------------------------------------------------------------------
// If you are deploying to GitHub Pages at https://<user>.github.io/<repo>/
//   -> set `site` to "https://<user>.github.io" and `base` to "/<repo>".
// If you are deploying to a custom domain (via a CNAME file in /public):
//   -> set `site` to "https://your-domain.com" and leave `base` as "/".
// You only need to touch this file once, when you first set up the repo.
// ---------------------------------------------------------------------------

export default defineConfig({
  // Root user site: https://adithya-jayasundar.github.io/
  site: 'https://adithya-jayasundar.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
