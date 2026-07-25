import { defineCollection, z } from 'astro:content';

// Blog posts — one Markdown file per post in content/blog/
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional().default(''),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
  }),
});

// Projects — one Markdown file per project in content/projects/
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional().default(''),
    tags: z.array(z.string()).optional().default([]),
    link: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

// Single-file collections (resume, site intro, contact) —
// we keep them as their own collections so schema errors are caught at build time.
const resume = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional().default('Resume'),
    updated: z.coerce.date().optional(),
    // Optional: path to a downloadable PDF version of the resume.
    // Put the file in the `public/` folder and set this to e.g. "/resume.pdf".
    // Leave blank / delete the line to hide the download button.
    pdf: z.string().optional(),
    pdfLabel: z.string().optional().default('Download PDF'),
  }),
});

const site = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    // Tagline can be either a single string OR an array of phrases,
    // e.g. ["Research", "Engineering", "Writing"] — each is rendered
    // as its own line with a trailing period.
    tagline: z.union([z.string(), z.array(z.string())]),
    intro: z.string().optional().default(''),
    // Optional single-letter avatar shown as a floating badge in the corner.
    avatarInitial: z.string().optional(),
    // Optional path to a photo shown as a small round portrait next to the
    // hero heading. Put your image file in the `public/` folder and set this
    // to `/your-photo.jpg` (leading slash). Leave blank to hide the photo.
    photo: z.string().optional(),
    photoAlt: z.string().optional().default('Portrait'),
  }),
});

const contact = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional().default('Contact'),
    email: z.string().optional(),
    links: z
      .array(z.object({ label: z.string(), url: z.string() }))
      .optional()
      .default([]),
  }),
});

export const collections = { blog, projects, resume, site, contact };
