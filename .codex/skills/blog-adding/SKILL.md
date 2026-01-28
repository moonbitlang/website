---
name: blog-adding
description: Add a new blog post to this Docusaurus site from a staging folder.
---

# Add a Blog Post

Use this skill when the user asks to add a new blog post

## Steps

1. Choose a blog folder name `YYYY-MM-DD-short-slug` (use the current date unless the user specifies one).
2. Create `blog/<folder>/index.md` with front matter:
   - `description`: short summary string
   - `slug`: URL slug without date
   - `image`: `/img/blogs/<folder>/cover.<ext>`
   - `tags`: array (e.g. `[MoonBit]`)
3. Add the H1 title and insert a cover image near the top: `![](./cover.<ext>)`.
4. Copy the staging Markdown content into the blog `index.md` after the front matter and cover.
5. If the post includes videos, follow the existing pattern (see `blog/2024-04-18-ai-coding`):
   - Place `.mp4` (or `.webm`) files in `blog/<folder>/`.
   - Add `import` statements at the top of `index.md`.
   - Use `<video controls src={videoImport} style={{width: '100%'}}></video>` in the body.
6. Copy referenced images/assets into `blog/<folder>/` and ensure all `./image` links resolve.
7. Pick a cover image.
8. Copy the cover into `static/img/blogs/<folder>/cover.<ext>` for the meta image path.
9. If the staging post is English-only, Add a zh placeholder for English-only posts:

   - Create `i18n/zh/docusaurus-plugin-content-blog/<folder>/index.md` with:

     ```
     ---
     unlisted: true
     ---
     ```

   If the staging post includes Chinese content, Repeat steps 2-6 for the Chinese version in `i18n/zh/docusaurus-plugin-content-blog/<folder>/index.md`.

10. Remove the staging folder

## Notes

- No Docusaurus config changes are required; the blog plugin picks up new folders automatically.
- Keep file paths and front matter ASCII-safe; avoid introducing new non-ASCII unless required.
