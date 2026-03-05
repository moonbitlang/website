# rabbita-home

MoonBit-powered homepage, built with [Rabbita](https://github.com/Yoorkin/rabbita).

## Project layout

```
rabbita-home/
├── main/
│   ├── main.mbt          # App entry, views, routing, update logic
│   ├── data.mbt          # All static data (voices, features, roadmap, etc.)
│   ├── recent_blogs.mbt  # Auto-generated, do not edit by hand
│   └── moon.pkg.json     # MoonBit package config
├── styles.css            # All CSS (tokens, components, animations)
├── moon.mod.json         # MoonBit module config and dependencies
├── vite.config.js        # Vite config (dev/watch/build modes)
├── package.json          # npm scripts
└── index.html            # Vite build entry (required, do not delete)
```

## How it integrates with the website

`src/pages/index.tsx` loads two static files at runtime:

* `/rabbita-home/main.js` (compiled MoonBit bundle)
* `/rabbita-home/styles.css` (component styles)

These are served from `static/rabbita-home/` by Docusaurus.

## Build modes

### Dev server (hot reload)

Build commands are documented in the website root README:
[../../../README.md](../../../README.md#working-with-new-homepage)

The Docusaurus dev server hot-reloads the page when `static/rabbita-home/` files change.

### Full website build (production)

Build commands are documented in the website root README:
[../../../README.md](../../../README.md#working-with-new-homepage)

This runs `scripts/build-rabbita-home.mjs` before Docusaurus, which:

1. Runs `pnpm install` in `rabbita-home/`
2. Runs `vite build --base /rabbita-home/`, triggering `moon build` via `@rabbita/vite`, bundling output to `rabbita-home/dist/`
3. Copies the output to `static/rabbita-home/`, renaming hashed files to `main.js` / `styles.css`
4. Runs `docusaurus build`

## Editing content

All static data lives in `main/data.mbt` :

* **Hero code tabs**: `code_tabs : Array[TabEntry]`
* **Why MoonBit features**: `feature_rows : Array[FeatureRow]`
* **Community voices**: `voices : Array[Voice]` (supports multilingual with `quote_original : String?` for hover reveal)
* **Showcase projects**: `projects : Array[Project]`
* **Contributors**: `contribs : Array[Contrib]`
* **Roadmap**: `milestones : Array[Milestone]`
* **News items**: `news_items` in `recent_blogs.mbt` (auto-generated, see above)

Images should be placed in `static/img/` (website root) and referenced as `/img/...` .
