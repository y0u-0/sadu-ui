# Sadu: design brief

Sadu is a component library built on UI SDK (`@ui-sdk/react`, headless behaviors) whose visual language comes from Al Sadu, the Bedouin weaving of Kuwait and the Gulf. UI SDK gives keyboard, focus, ARIA, popups and state. We give the look. The bar is award-winning craft: every component should make a designer stop and look, and still be an honest, usable, accessible control.

## The material

Al Sadu is warp-faced weaving on a ground loom. Patterns are made by the warp threads, so the cloth is a grid of small horizontal floats, staggered row by row. That grid is our pixel. Bands run lengthwise. Weaving advances along the band: new cloth is "beaten in" at the fell by a beater (a gazelle-horn or wooden tool).

- **Colors.** Goat-hair black `#1f1813` (grounds), undyed wool `#f3eada`, bone `#fbf7f0` (surfaces), madder red `#a3231b` (the accent; the only "primary"), saffron `#c98a1e`, indigo `#2a3c63`, camel `#a87a4f`. Wood/horn for beaters and beams: gradient `#ead8b8 → #b98d5b → #7b5631`.
- **Motifs** (`src/sadu/motifs.ts`): `eyoun` (eyes, diamonds), `shajarah` (tree), `uwairjan` (zigzag), `hubub` (grains), `dhurs` (horse teeth, the border band), `dhalla` (triangles). Arabic names are on each motif.
- **Signature moves you can reuse:** a woven *selvedge* strip (dark `dhurs` band) as the top edge of popups; the *beater* sweeping to weave something in (`Reweave`, `Rug`); *bare warp threads* for "not yet" (unfilled, empty, unwoven); *eye diamonds* for marks, bullets, checks and thumbs; *skeins* (twisted-yarn discs) for color; *wood beams* for handles and rails.

## Primitives you must use (read the files)

- `src/sadu/weave.tsx`: `Weave` draws any motif grid as woven cloth (props `grid`, `colors {ground, dye, accent}`, `cell {width,height}`, `bare` for threads only, `offset`). It fills its box and tiles the pattern; it never stretches. `Reweave` re-weaves with a beater sweep when its grid or colors change.
- `src/sadu/rug.tsx`: `Rug` stacks bands into a textile; `mainColors(dye)`.
- `src/sadu/motif-select.tsx`: `MotifSwatch` and the reference for a popup (selvedge, items, highlight, check).
- `src/sadu/palette.ts`, `src/sadu/motifs.ts`: colors and grids. A motif you need that isn't there: define it in your own file with the same `Grid` shape (rows of chars: `.` ground, `x` dye, `k` accent, `w` wool, `b` black), 11 rows for a band.
- Tokens in `src/sadu/sadu.css` `:root` (`--sadu-*`): inks, surfaces, lines, `--sadu-float` popup shadow, `--sadu-travel` and `--sadu-snap` curves, fonts including `--sadu-font-arabic`.
- Reference components already built and polished: `motif-select.tsx`, `loom-slider.tsx`, `skein-radio.tsx`, `sadu-switch.tsx`, `sadu-tabs.tsx`, `eye-rating.tsx`, with styles in `sadu.css`. Match their spacing, type sizes (labels 12.5px/600 `--sadu-ink-2`, control text 14px, popups 14px), radii (controls 10 to 11, popups 14, items 8), focus ring (2px madder, offset 2 to 3).

## Rules

- **UI SDK for all behavior.** Read `node_modules/@ui-sdk/react/docs/components/<name>.md` (Composition, Styling, Data Attributes, API; skip the long examples) before writing. Never hand-roll a role. Import from entries like `@ui-sdk/react/dialog`. Style from `data-slot` and state attributes (`data-open`, `data-checked`, `data-highlighted`, `data-starting-style`, `data-ending-style`...), never inline styles for state. `@ui-sdk/core/web.css` is NOT used: you own every style, so reset UA styles on buttons and inputs, and remember popups are in the top layer (`[popover]` UA styles: set `margin`, `border`, `padding`, `inset` as needed).
- **One Sadu idea per component, done perfectly.** Don't weave everything. Pick the one place the material carries meaning (the fill of a progress bar is cloth being woven; a password's dots are eye diamonds; a drawer unrolls like a rug), make it delightful, keep the rest quiet and product-grade.
- **Accessible.** Name every control. Text 4.5:1, control edges and state 3:1 against bone. Visible focus. Works with keyboard. Works right to left: use logical properties (`inset-inline-start`, `margin-inline`, `padding-inline`), and `:dir(rtl)` where direction matters. Respect `prefers-reduced-motion`.
- **Motion** is quick for feedback (120 to 200ms, `--sadu-snap`), slower only for the weave itself (900 to 1400ms). Popups scale from `--transform-origin` 0.97 → 1 with opacity, 160ms. Nothing pops: exits animate via `data-ending-style`.
- **Code.** TypeScript, React 19. Kebab-case file names. Named exports listed at the end of the file. Explicit return types on exported functions (`ReactElement`). No `any`. **No comments** unless a reader would get it wrong without one (a browser quirk), max two lines. Props: `className` merged, controlled and uncontrolled both supported where UI SDK supports it. Lucide icons (`lucide-react`, size 16, strokeWidth 2) only where an icon is needed; no emoji; no sparkles.
- **Files you own:** for each component `src/sadu/<name>.tsx` and `src/sadu/styles/<name>.css` (imported at the top of its tsx, every rule scoped under the component's own `.sadu-<name>` classes). Plus your gallery file `src/gallery/<batch>.tsx`. Do not edit any other file. If a shared file needs a change, say so in your report.

## Banned (generic UI tells)

- **No edge stripes.** No colored bar, border or inset shadow down one side of a row, card, toast, alert, callout, quote, code line, list item, tree row, menu item or panel. Not on selection, not on status, not on emphasis. It is the most generic "AI dashboard" pattern there is. Show state the Sadu way: a solid fill step (`--sadu-sand`), a weight change, an `Eye` mark, a `.sadu-float-highlight` capsule, or cloth where the value lives. A structural line (a timeline spine, a gutter rule, a resize handle) is allowed only as a 1px `--sadu-edge` thread and never in an accent color.
- No gradient text, no glow, no glassmorphism, no pill badges with dots, no emoji, no sparkles, no "AI" purple, no uppercase eyebrows, no centered hero-with-blurb cards, no gray placeholder bars in finished UI.

## The gallery

`src/gallery/card.tsx` exports `GallerySection` and `Card`. Your gallery file exports one component (named in your brief) that returns a `GallerySection` of `Card`s: one card per component, `name` = the UI SDK component name, `idea` = one short sentence naming the Sadu idea, children = a live, realistic demo (real labels and content about weaving, motifs, wool, tents, majlis, a weaver's orders; never lorem ipsum). Use `wide` on a card that needs room. Popups and dialogs open from a trigger in the card.

View your batch alone at `http://localhost:5191/?gallery=<batch>` (the dev server is already running; if it isn't, start `npx vite --port 5191 --strictPort` in the background from the project root).

## Verify (required, at least three rounds)

1. `npx tsc --noEmit` from the project root. Your files must be clean; ignore errors in files you don't own (another agent may be mid-edit).
2. Screenshot and look: `node /tmp/sadu-tools/shot.mjs "http://localhost:5191/?gallery=<batch>" /tmp/sadu-tools/<batch>-1.png 1280 full < /dev/null`. Steps after the width drive the page: `"click|<css selector>"`, `"key|ArrowDown"`, `"wait|400"`, `"eval|<js>"`, then add `full` for a full-page shot. Read the PNG. Shoot every open popup, focus state, checked/pressed state and an RTL check. The script prints console errors: fix them all.
3. Judge each card like the most exacting designer you know: alignment, even insets, nothing touching, no muddy contrast, pattern crisp (cell sizes that land on whole pixels look best), state readable. Fix the largest fault first, re-shoot.

## Report back

For each component: the file, the Sadu idea in one line, the states you verified, anything you couldn't verify, and any shared-file change you need.
