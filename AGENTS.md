# Sadu

React components on UI SDK (`@ui-sdk/react`), styled as Al Sadu weaving. Commands are in `package.json`.

## Before you change a component

- Read `docs/design/DESIGN.md` first: the material rules and the "Banned" list apply to every component and page.
- Build from the shared parts: `parts.tsx` (Eye, Cord, Thread, Chip, Kbd, IconButton, WoodButton, BandSwatch, SkeinDot, Lozenge), `popup-surface.tsx` for every popup, `weave.tsx` for cloth, and the tokens in `sadu.css` (colours, heights, radii, focus, `--sadu-dur-*` durations). Reach for a token before a hex value.
- UI SDK owns behaviour. Read `node_modules/@ui-sdk/react/docs/components/<name>.md` and style its `data-slot` and state attributes.
- Labels come from `useLocalized` in `src/sadu/locale.tsx`, so every component speaks English and Arabic. Arabic copy follows the `ux-araby` skill and the glossary in `docs/design/ARABIC.md`.

## How the pieces connect

- `src/gallery/<family>.tsx` is the single source for each component's demo and caption; a Vite plugin reads these files into the catalogue site. The seven signature pieces and the Preferences card are the exception: their demos live in `src/site/catalog/`.
- `scripts/build-registry.mjs` builds the shadcn registry. A new file imported by two or more components belongs in `CORE_FILES` there; the build fails with "Core files import component entries" until it is added.

## Done means green

`npx tsc --noEmit`, `npm test`, `npm run test:e2e` and `npm run build` all pass. Browser tests run against the dev server on port 5191; run `npm run registry` first when site pages look stale. The home page stays mounted, hidden, behind detail pages, so e2e selectors target visible elements.

## Deploy

`npm run deploy` publishes to the owner's personal Cloudflare account through an isolated wrangler login in `~/.config/sadu-cloudflare`. Deploy only through that script.
