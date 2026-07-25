# How to add or edit content

> **You never need to touch code.** Everything on this site is generated from
> plain text (Markdown) files inside the `src/content/` folder.
> If you can edit a text file and push it to GitHub, you can publish.

---

## Where things live

```
src/content/
  blog/           <- one file per blog post
  projects/       <- one file per project
  resume/
    resume.md     <- your resume, edit in place
  contact/
    contact.md    <- your email + links, edit in place
  site/
    site.md       <- name, tagline, and homepage intro
  _templates/     <- copy these when starting a new post/project
    blog-post.md
    project.md
```

That's the whole world. Nothing else on the site needs to be touched.

---

## 1. Add a new blog post

1. Open `src/content/_templates/blog-post.md`.
2. **Copy** it into `src/content/blog/`.
3. **Rename** the copy to `YYYY-MM-DD-short-title.md`
   (example: `2025-03-14-on-writing.md`).
4. Edit the frontmatter block at the top of the file:

   ```
   ---
   title: "Your post title here"
   date: "2025-03-14"
   summary: "One-line description shown on the blog index page."
   tags: ["writing", "notes"]
   draft: false
   ---
   ```

   - `title` — shown as the headline.
   - `date` — used for sorting; format must be `YYYY-MM-DD` in quotes.
   - `summary` — the short teaser shown in the blog list.
   - `tags` — a list; use `[]` if you don't want any.
   - `draft: true` — hides the post from the site. Set to `false` to publish.

5. Write the post body **below** the second `---`. Use plain Markdown.
6. Commit and push (see [Publishing](#publishing) below).

---

## 2. Add a new project

Same idea as a blog post, but use `src/content/_templates/project.md` and drop
the copy into `src/content/projects/`. Name the file something short like
`my-project-name.md`.

Frontmatter fields:

```
---
title: "Project name"
date: "2025-03-14"
summary: "One-line description."
tags: ["side-project"]
link: "https://github.com/yourname/repo"   # optional external link
draft: false
---
```

---

## 3. Edit your resume

Open `src/content/resume/resume.md` and edit it directly.
Everything below the frontmatter is your resume body in Markdown.

### Offer a downloadable PDF (optional)

If you'd like visitors to download a PDF copy of your resume:

1. Export your resume to PDF from your usual tool (Google Docs, Word, etc.).
2. Save the file into the `public/` folder at the root of the repo, e.g.
   `public/resume.pdf`.
3. In `src/content/resume/resume.md`, set the `pdf` field:
   ```
   pdf: "/resume.pdf"        # must start with a slash, must match the filename
   pdfLabel: "Download PDF"  # button text, edit freely
   ```
4. A "Download PDF" button will appear next to the resume title.
5. To hide the button again, either delete the `pdf` line or set it to `""`.

Updating the PDF later is just: replace `public/resume.pdf` and push.

---

## 4. Edit contact info

Open `src/content/contact/contact.md`. Change the email address and the list of
links in the frontmatter:

```
---
title: "Contact"
email: "you@example.com"
links:
  - label: "GitHub"
    url: "https://github.com/yourname"
  - label: "LinkedIn"
    url: "https://www.linkedin.com/in/yourname"
---
```

To add a new link, just add another `- label: ... / url: ...` pair.
To remove one, delete its two lines.

---

## 5. Edit the homepage tagline / intro

Open `src/content/site/site.md`. Change `name`, `tagline`, and `intro` in the
frontmatter. Optionally write a longer bio paragraph below the frontmatter.

---

## Publishing

Once you've saved your file:

1. Commit and push to the `main` branch.
   - If you're using the GitHub web editor, just click **Commit changes**.
   - If you're using a terminal:
     ```
     git add .
     git commit -m "New post: on writing"
     git push
     ```
2. Go to your repo on GitHub → **Actions** tab.
3. You'll see a workflow named **"Deploy to GitHub Pages"** running.
   - Green check ✅ = live.
   - Red X ❌ = something went wrong; click it to see the error message
     (usually a typo in the frontmatter).
4. The site is live at your GitHub Pages URL, usually within **1–2 minutes**
   of the green check.

---

## Common gotchas

- **Dates must be in quotes.** `date: "2025-03-14"` ✅ — not `date: 2025-03-14`.
- **Tags are a list in square brackets.** `tags: ["a", "b"]` — or `tags: []`.
- **Don't remove the two `---` lines** at the top and bottom of the frontmatter.
- **File names matter.** Use lowercase, hyphens, no spaces.
- **Drafts:** set `draft: true` in the frontmatter to hide a post while you're
  still working on it. It won't appear anywhere on the site until you flip it
  back to `false`.

---

## Running the site on your computer (optional)

You do **not** need to do this to publish — pushing to GitHub is enough.
But if you want to preview locally before pushing:

```
npm install    # one time only
npm run dev    # then open http://localhost:4321
```

That's it. Happy writing.
