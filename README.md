adithya-jayasundar.github.io
My personal notebook — a quiet, editorial home for writing, projects, and a working resume.

🌐 Live at adithya-jayasundar.github.io

What this is
A minimal, content-first personal website. Everything on it — blog posts, projects, resume, contact info — is written in plain Markdown and versioned in this repo. No CMS, no database, no admin panel. Just files.

The design borrows from print: serif headings, a single reading column, hairline rules, generous whitespace. It's meant to fade into the background so the writing does the talking.

Structure
src/content/
  blog/         # one Markdown file per post
  projects/     # one Markdown file per project
  resume/       # resume.md
  contact/      # contact.md
  site/         # homepage tagline, name, intro
  _templates/   # starter files for new posts / projects
New content = a new .md file. That's the whole publishing workflow. Details in HOW_TO_ADD_CONTENT.md.

Built with
Astro with content collections and static output
Vanilla CSS, system fonts (Iowan Old Style / SF-family sans)
Deployed to GitHub Pages via GitHub Actions
No JavaScript on the client, no analytics, no trackers
Running locally
npm install
npm run dev     # http://localhost:4321
Deploying
Any push to main triggers .github/workflows/deploy.yml, which builds the site and publishes it to GitHub Pages. The live site updates in about a minute.

License
Source code: MIT — feel free to use the scaffolding as a starting point for your own site.

Written content (everything under src/content/): © Adithya Jayasundar, all rights reserved.

Say hi: Contact.
