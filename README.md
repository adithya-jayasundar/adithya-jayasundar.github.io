# Personal Notebook

A quiet, editorial personal website built as a **content-first** static site.
All pages are generated from plain Markdown files in `src/content/`. There is
no database, no CMS, and no code you need to touch to publish.

Built with [Astro](https://astro.build/) and deployed automatically to
**GitHub Pages** via GitHub Actions.

---

## For maintainers: how to publish

See **[HOW_TO_ADD_CONTENT.md](./HOW_TO_ADD_CONTENT.md)**. It covers everything
non-technical (adding a blog post, editing your resume, etc.).

---

## Why Astro (not Next.js)?

- Native Markdown + frontmatter support via content collections — no glue code
  to maintain.
- Ships zero JavaScript by default → fast, tiny, ideal for GitHub Pages.
- One-line config for the GitHub Pages base path (`base` in `astro.config.mjs`).
- Smaller config surface area = less for a non-engineer to ever have to touch.

---

## First-time setup (do this once)

### 1. Install dependencies and preview locally

```bash
npm install
npm run dev
```

Open <http://localhost:4321>. Edit any file in `src/content/` and it will
hot-reload.

### 2. Configure the site URL

Open `astro.config.mjs`. You'll see:

```js
site: 'https://example.github.io',
base: '/',
```

Pick **one** of the following:

#### (A) Deploying to `https://<user>.github.io/<repo>/`

Set:

```js
site: 'https://<your-github-username>.github.io',
base: '/<your-repo-name>',
```

#### (B) Deploying to a custom domain (e.g. `https://yourname.com`)

Set:

```js
site: 'https://yourname.com',
base: '/',
```

Then create a file at `public/CNAME` containing a single line:

```
yourname.com
```

(Astro copies everything in `public/` to the site root, so this becomes the
`CNAME` file GitHub Pages needs. Also set the custom domain in your repo's
**Settings → Pages → Custom domain**, and configure the DNS records with your
domain registrar per
<https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site>.)

### 3. Push the repo to GitHub

Create an empty repo on GitHub, then:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

### 4. Enable GitHub Pages via Actions

In your GitHub repo:

1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **"GitHub Actions"**.
3. That's it — no other Pages settings to change.

### 5. First deploy

The included workflow at `.github/workflows/deploy.yml` runs automatically on
every push to `main`. Watch it in the **Actions** tab. When it turns green,
your site is live at:

- `https://<user>.github.io/<repo>/` (project site), or
- `https://yourname.com` (if you set up a CNAME).

Typical build + deploy time: **~1–2 minutes**.

---

## Project structure

```
.
├── .github/workflows/deploy.yml   # CI: builds & deploys on push to main
├── astro.config.mjs               # site URL + base path config
├── package.json
├── public/
│   └── .nojekyll                  # tells GitHub Pages not to run Jekyll
├── src/
│   ├── content/                   # 📝 ALL YOUR CONTENT LIVES HERE
│   │   ├── blog/
│   │   ├── projects/
│   │   ├── resume/resume.md
│   │   ├── contact/contact.md
│   │   ├── site/site.md
│   │   ├── _templates/            # copy from here when creating new content
│   │   └── config.ts              # frontmatter schemas (rarely touched)
│   ├── layouts/BaseLayout.astro   # header, footer, nav
│   ├── lib/format.ts              # date + URL helpers
│   ├── pages/                     # routes (auto-generated from content)
│   │   ├── index.astro
│   │   ├── blog/index.astro
│   │   ├── blog/[...slug].astro
│   │   ├── projects/index.astro
│   │   ├── projects/[...slug].astro
│   │   ├── resume.astro
│   │   ├── contact.astro
│   │   └── 404.astro
│   └── styles/global.css
├── HOW_TO_ADD_CONTENT.md
└── README.md
```

---

## Scripts

- `npm run dev` — local preview at <http://localhost:4321>
- `npm run build` — build static site into `dist/`
- `npm run preview` — preview the built site locally
