# Sadu: design direction

Written after reading `DESIGN.md`, the code in `src/sadu`, `src/showcase`, `src/app.tsx`, the four screenshots in `/tmp/sadu-tools`, and six of my own captures at 2x and 3x zoom (`/tmp/sadu-tools/fable-1.png` to `fable-6.png`). Where this file and `DESIGN.md` disagree, this file wins and `DESIGN.md` should be updated to match.

The short verdict. The library has one very good idea (the loom slider, where the track is warp and the fill is cloth) and a renderer that draws beadwork. The cloth reads as seed beads or LEGO studs, the motifs are drawn on the wrong lattice and three of the six carry the wrong name, and the page presents all of it inside a fake macOS window on beige. Fix the material first. Every component inherits it.

A note on sources. Motif names and descriptions below follow the Al Sadu Society's own list (Aein, Dhalla, Dhurus El Khail, Hubub, Midhkhar, Ragoum, Shajarah, Uwairjan), Keireine Canavan's research notes from Sadu House, and the Kuwait entry of the Encyclopedia of Crafts in Asia Pacific, which cites Anne-Rhona Crichton's "Al Sadu: The Techniques of Bedouin Weaving". The grids I propose are my drawings from those descriptions. Someone must check them against real pieces at Sadu House or the plates in Crichton before release. I left Midhkhar and Ragoum out because I found no description reliable enough to draw from.

---

## Part 1. Critique of what exists

Ranked by how much each fault costs the whole library.

### 1. The weave reads as beadwork, not warp-faced cloth

Element: `floatsOf` and the backing rects in `src/sadu/weave.tsx`.

What is wrong. Each float is a full capsule (`rx` equals half the height), separated from its neighbours by a 0.45px gap on all sides, over a backing that is the ground colour under 42% black. The result is a dark grout line around every float. At 3x zoom the wool areas look like white tiles in black mortar, and the average colour of a wool stripe drops from `#f3eada` to a dirty grey near `#d5ccbd`. The 7 by 5 cell is 1.4 to 1, the proportion of a brick. Warp-faced cloth has no visible backing at all. The warps sit so close that they hide the weft, and each float is a long narrow grain.

What it should be.

- Cell proportion 8 by 3 CSS pixels (2.67 to 1) as the default. Floats in real Sadu are roughly 2.5 to 3 times longer than they are thick.
- No vertical gap. Rows touch.
- A 1px dimple between successive floats in a row, drawn in the float's own colour at 22% black, never in the ground colour. White wool then has soft grey dimples, not black mortar.
- Corner radius 1.25px on a 3px float, about 40% of the height. The ends taper where the yarn dives under the weft. They are not round.
- Delete the 42% black backing rect.
- Draw it as three layers so the hero stops emitting thousands of capsules. Layer one is flat colour runs (adjacent floats of one colour in a row merge into one rect). Layer two is the dimple pattern, a tile `cell.width` wide and two rows tall with one 1px line per row, offset by half a cell on the odd row. Layer three is the thread shade, one gradient per row with white at 10% over the top third and black at 16% over the bottom third.

### 2. Motifs are drawn on a square grid and rendered on a half-drop grid, and three carry the wrong name

Element: `src/sadu/motifs.ts`.

What is wrong with the geometry. `Weave` shifts every odd row by half a cell. The motif functions ignore that. `eyoun` uses Manhattan distance on a square grid, so its diagonals step two cells per row and then get knocked sideways by the stagger. Every diamond in the hero has a ragged, lopsided edge. `dhurs` uses three-row blocks, and a three-row block on a half-drop lattice bulges into a hexagon. That is why the border reads as honeycomb and bow ties, not as square teeth.

The rule for authors. On a half-drop lattice a clean diagonal grows by one cell per row, not two. For a figure symmetric about a whole-number axis `m`, odd rows take odd counts centred on column `m - 1` and even rows take even counts spanning `m - k` to `m + k - 1`. Blocks need an even number of rows to look square.

What is wrong with fidelity.

- `shajarah` is drawn as a literal fir tree in red. The Shajarah is the central band of a Sadu textile, picked up warp by warp in two colours, usually black and white. It holds a row of pictographs (combs, earrings, scissors, hourglasses, eyes) that the weaver improvises, so no two are alike. It is called "the tree". It does not depict one.
- `dhalla` is drawn as solid triangles and `DESIGN.md` glosses it as triangles. Dhalla means ribs. It is the first pattern a weaver learns, thin bars crossing the band.
- `uwairjan` is drawn as a thick zigzag line. Sources describe it as rows of triangles facing each other, built from dots of paired warps. The zigzag is the ground left between the triangles.
- `eyoun` should be labelled Ain (عين) to match the Society's own name. Keep the id if renaming is costly.
- `hubub` draws two-by-two blocks that read as dice. Seeds are single floats.

Replacement grids. All are 11 rows. Border motifs tile at 4 or 8 columns so that 8 columns always holds whole repeats.

Ain, the eye (8 columns):

```
........
...x....
...xx...
..xkx...
..xkkx..
.xkbkx.k
..xkkx..
..xkx...
...xx...
...x....
........
```

Uwairjan, facing triangles (8 columns):

```
xxxxxxx.
xxxxxx..
.xxxxx..
.xxxx...
..xxx..k
..xx..kk
k..x..kk
k....kkk
kk...kkk
kk..kkkk
kkk.kkkk
```

Dhurus al-khail, horse teeth (8 columns). Two jaws of four-row teeth either side of a centre line:

```
kkkkkkkk
xxxx....
xxxx....
xxxx....
xxxx....
kkkkkkkk
....xxxx
....xxxx
....xxxx
....xxxx
kkkkkkkk
```

Dhalla, ribs (4 columns). The stagger gives each bar the toothed edge real ribs have:

```
....
xx..
xx..
xx..
xx..
xx..
xx..
xx..
xx..
xx..
....
```

Hubub, seeds (4 columns):

```
....
....
x...
....
..k.
....
x...
....
..k.
....
....
```

Shajarah, the centre band (24 columns). Hourglass, eye, earrings, comb. Use it with goat-hair ground, wool as `k` and one dye as `x`:

```
........................
kkkkk....k....k.........
.kkkk....kk...kk..kkkkk.
.kkk....kxk...k...kkkkk.
..kk....kxxk......k.k.k.
..x....kx.xk..x...k.k.k.
..kk....kxxk......k.k.k.
.kkk....kxk...k...k.k.k.
.kkkk....kk...kk..k.k.k.
kkkkk....k....k.........
........................
```

One step further for Shajarah. Because the real band is improvised, export `shajarah(seed)` that orders the four pictographs from a seeded shuffle and varies the gaps between 2 and 3 columns. Every rug in the library then has its own centre band, which is true to the craft and costs twenty lines.

### 3. The rug is a stack of patterns with no plain field and no symmetry

Element: `bandsOf` in `src/sadu/rug.tsx`.

What is wrong. The rug runs edge, red, teeth, main, teeth, red, wool, triangles, then a repeating tail. Five of the first eight bands are patterned and nothing mirrors. It looks like a knitted jumper. A Sadu textile is mostly plain warp stripes in red, black and white. Pattern strips are narrow punctuation. The whole piece mirrors about the central Shajarah.

What it should be. One recipe, 77 rows, mirrored about row 39, 57% plain:

| Rows | Band |
| --- | --- |
| 2 | goat hair |
| 8 | dye field (madder by default) |
| 3 | wool, goat hair, wool pinstripes |
| 11 | the picked border motif on goat hair |
| 3 | wool, goat hair, wool pinstripes |
| 4 | dye field |
| 2 | goat hair |
| 11 | Shajarah, always goat hair and wool with one dye spot |
| then | the first seven bands in reverse |

At 3px rows the rug is 231px tall. At 4px rows it is 308px and fits the hero. The motif picker changes the two flanking strips. The wool picker changes the dye fields and the dye spot. The Shajarah never changes. Remove Shajarah from `PICKABLE` and add Dhalla and Dhurus.

### 4. The weave falls apart at small sizes because cells are fractional and there is no level of detail

Elements: every `cell` prop in the built components.

What is wrong. Cells in use today are 4 by 2.8, 4 by 2.6, 6 by 3.6, 6 by 3.4, 6 by 4.4, 3 by 1 and 3 by 0.9. None lands on whole pixels, so capsule edges blur. The 28px `MotifSwatch` shows a seven-column crop of a twelve-column motif, a fragment nobody can identify. The popup selvedge (3 by 1) and the tab indicator (3 by 0.9) render as a grey-pink smear. See `bench4.png`, the strip above "Eyoun" in the open list.

What it should be. Three levels and a floor.

| Level | Cell | Band of 11 rows | Drawing | Use |
| --- | --- | --- | --- | --- |
| thread | 10 by 4 | 44px | all three layers plus variance and ply twist | hero and specimen sheet only |
| cloth | 8 by 3 | 33px | all three layers plus variance | default |
| stitch | 6 by 2 | 22px | flat runs and dimples only | inside controls |

Below stitch size nothing is woven. Use the cord (4px) or a thread (1px), both defined in part 2. A `Weave` box is always a whole number of cells tall and wide. Clip the box, never a float.

### 5. Cloth is clipped to rounded corners and floated on drop shadows

Elements: `.sh-patch .sadu-weave` (radius 12), `.sadu-swatch` (radius 5), `.sadu-switch` (radius 9), `.bench-loom__band` (radius 3 and a 6px shadow), `.selvedge` in `page.css` (a 6px shadow under the masthead strip), `.sadu-tabs__indicator` (shadow).

What is wrong. A rounded corner slices floats in half and makes the cloth read as a texture fill on a button. A drop shadow lifts it off the page like a sticker. Cloth has square corners and two kinds of edge. The long edges are bound (selvedge). The short edges are cut warp ends (fringe) or wrapped round a beam.

What it should be. One rule for the whole library. Cloth is never clipped by a radius above 2px and never casts a shadow beyond a 1px contact line (`0 1px 0 rgb(31 24 19 / 0.25)`). Cloth sits inside a rounded surface with a 6px margin, or runs full bleed with square ends.

### 6. The hand-spun variance is three visible rectangles and the sheen makes pills

Element: the `spin` and `sheen` patterns in `weave.tsx`.

What is wrong. `spin` lays three cell-sized rects at 8 to 10% over the cloth on a 7 by 5 cell tile. They ignore the half-drop, so each one straddles two floats on odd rows, and the tile repeats every 49px. At 3x zoom they are plain grey smudges on the white stripes (`fable-1.png`). `sheen` applies a full top-to-bottom gradient to every row, which rounds each row into a tube and adds to the bead look.

What it should be.

- Thread tone. Each row gets a fixed lightness offset from the table `0, -3, +2, -1, +3, -2, 0, +1, -3, +2, -1` percent, applied across the whole row. Yarn varies by thread, not by patch.
- Slubs. About one float in 40, chosen by a seeded hash, is 6% lighter and 1px longer. The tile is 37 columns wide so the repeat never shows.
- Abrash. One horizontal gradient repeating every 480px, black at 0% rising to 6% and back, over dyed bands only. Natural dye lots drift like this.
- Ply twist. At thread level only, one diagonal hairline per float at 10% black.
- Each band takes a `seed` so two bands side by side differ.

### 7. Colour: wool vanishes, indigo vanishes, saffron is mustard, and control edges fail contrast

Elements: `palette.ts`, the `:root` tokens in `sadu.css`.

- Wool cloth `#f3eada` on a bone card `#fbf7f0` is 1.12 to 1. The wool-ground slider in the bench is close to invisible, and its bare warp threads are invisible. Make cloth wool `#e6d9bf` and give every cloth a 1px edge in `--sadu-edge`.
- Indigo `#2a3c63` on goat hair `#1f1813` is 1.6 to 1. Three patches in the motif tile are black squares with a faint blue ghost. Rule: indigo is only ever woven on a wool ground.
- Saffron `#c98a1e` is a mustard. The second colour of Sadu after red is orange. Change it to `#cf7a1b`.
- `--sadu-line` is 14% black, which is 1.33 to 1 on bone. `--sadu-line-strong` is 32%, which is 2.0 to 1. The select trigger, the cards and the empty eye all use them as the control edge. The brief demands 3 to 1. Add `--sadu-edge: #8a7864` (3.96 to 1 on bone, 3.4 to 1 on the sand page) and use it for every control boundary. Keep `--sadu-line` for dividers that carry no meaning.
- Add `--sadu-ink-3: #7d6b58` (4.8 to 1 on bone) for placeholders and ghost text.
- `.sadu-motif__trigger:hover` goes to `#fff`. Pure white is colder than anything else on the page. Use `#fffdf8`.
- The page background `#efe6d6` against bone cards is 1.17 to 1 with a 6% border. Cards barely exist. Give cards a 1px `--sadu-line` border at 20% and drop the page to `#eadfcb`.

### 8. The re-weave is a slow wipe that cuts floats in half

Elements: `sadu-weave-in`, `sadu-beater`, `sadu-rug-beater`.

What is wrong. The reveal is a continuous `clip-path` wipe on an ease curve, so the edge always sits mid-float. It runs 1300ms for every change, however small. In the hero, changing the dye re-sweeps every band at once behind one beater, which is right, but changing the motif sweeps the whole rug too when only two strips changed. The `Reweave` beater is 4px wide and reads as a scroll cursor.

What it should be. See "the beat" in part 2. In short: the reveal advances in whole columns with `steps()`, a band takes 40ms per column capped at 900ms, only changed bands re-weave, the beater is 10px of wood with a 1px dark edge, and it finishes with one tap (back 3px, forward 3px, 120ms). The 1300ms sweep is reserved for the page hero.

### 9. The switch weaves both states and hides both under the thumb

Element: `sadu-switch.tsx`.

What is wrong. Off is grey cloth and on is red cloth. Grey cloth with a grey diamond on the thumb reads as disabled, not off (`fable-6.png`). The thumb covers 24 of 56 pixels, so about four columns of a six-column motif show, cut by a 9px radius. The thumb is a white tile with a vector diamond, which belongs to no material in the system.

What it should be. The switch is a small loom, the same sentence as the slider. Off is bare warp, on is cloth, the thumb is the beater.

- Track 52 by 24, radius 2, 1px `--sadu-edge`. Inside it, 22px of band at stitch level.
- Off: eleven bare threads on bone. On: Dhurus teeth in the dye on wool, woven from the start edge to the thumb.
- Thumb: a wood bar 10 by 28 that overhangs the track by 2px top and bottom, radius 3.
- Travel 240ms on `--sadu-throw`. The cloth reveals in whole columns behind the thumb.
- Disabled: threads dashed, wood at 50% saturation.
- Hit area 52 by 44.

### 10. The tab indicator is mush and too slow

Element: `sadu-tabs.tsx`, `.sadu-tabs__indicator`.

What is wrong. A 10px strip at 3 by 0.9 cells cannot hold an 11-row motif. It has a drop shadow, hangs 5px below the hairline so the list has two bottom edges, and takes 460ms to travel. A tab change is feedback, not a show.

What it should be. The hairline under the tab list is one warp thread (1px, `--sadu-edge`). The indicator is that thread woven into a 6px band of three stitch rows (goat hair, dye, goat hair) sitting on the thread, same width as the tab label. It travels in 280ms on `--sadu-throw`. No shadow. Arabic tab labels are 16px against 15px Latin, which is correct. Keep it.

### 11. The motif select shows unreadable square crops and a generic check

Element: `motif-select.tsx`.

- The swatch is a 28px square. Sadu motifs are bands. Make the swatch 48 by 22 at stitch level, exactly eight columns, which is one repeat of Ain, Uwairjan and Dhurus and two of Dhalla and Hubub. Radius 2.
- The selected item uses a Lucide check. `DESIGN.md` itself says checks are eye diamonds. Use the 10px eye mark from part 2.
- The popup's top strip is the smeared 3 by 1 weave. Replace it with the 4px cord.
- Arabic names are 14px in `--sadu-ink-2` next to 14px Latin, so they look a size smaller and paler. Set Arabic at 15px in `--sadu-ink`.
- The selected skein's ring bleeds 4px past the column and pokes out from under the open popup (`bench4.png`, left edge of the list at the second row). Inset the skein group by 4px.

### 12. The skeins read as striped buttons

Element: `.sadu-skein__yarn`.

What is wrong. One set of parallel diagonal stripes plus a white specular dot makes a boiled sweet. A ball of yarn has wraps crossing at two angles. The targets are 30px with 10px gaps. Only the selected one is named.

What it should be. Two stripe layers, 118 degrees and 28 degrees, the second masked to a lens shape so the wraps cross. Drop the white highlight, keep the inner shade. Size 28px inside a 44px hit area. Show the name of the hovered or focused wool in the head slot, falling back to the selected one. The selected ring stays (2px gap, 2px ink).

### 13. The loom slider and eye rating are close and need finishing

Loom slider, the best piece in the library.

- On a wool ground the bare warp is invisible. Warp threads take the row colour but never lighter than `--sadu-edge`.
- The two end beams and the thumb are the same wood, so the thing you drag looks like the things you cannot. Make the end beams 6px wide and flat (`#b98d5b`, no gradient). Keep the thumb at 14px with its gradient and grain.
- Remove `box-shadow: 0 1px 2px` on `.sadu-loom__cloth`. Add a 1px fell line at the cloth's leading edge.
- Cloth must reveal in whole columns. Snap the indicator width to the cell width.
- Value type: 20px, weight 600, tabular. Unit 12px.

Eye rating.

- The diamonds are smooth 45 degree vectors. Nothing else in the system has a smooth diagonal. Redraw the eye as a stepped diamond on the float lattice: five rows of 1, 2, 3, 2, 1 floats, each float 8 by 4, giving a 24 by 20 mark.
- Thread the eyes on one warp line. Unrated positions show the bare thread with a 4px knot. Rated positions show the eye. This is the same thread-and-cloth sentence as the slider and switch.
- Hover preview and committed value look identical. Preview should be the eye in outline (1.5px madder), committed is filled.

### 14. The showcase undercuts the craft it is selling

Elements: `src/showcase/*`.

- The hero rug sits in a fake macOS window with red, yellow and green traffic lights. A loom is not an app window, and the green and yellow are the only off-palette colours on the page. Remove the window.
- The control panel pads itself with grey skeleton bars (`Bar w={34}`, `Bar w={58}`, `Bar w={44}`). In a hero about craft, placeholder bars read as unfinished. Replace them with real order details: "Order 14", "Majlis divider, 3.2 m", "Due 12 Rajab".
- "It ships with 0 runtime dependencies" is false. `package.json` lists `@ui-sdk/core`, `@ui-sdk/react` and `lucide-react`. Replace the stat with a true one. "11 rows to a band" or the real component count both work.
- The motif tile says "Six motifs from the tent wall" and shows more than twenty random crops in six colourways, several cut mid-figure, several illegible (indigo on black), with a pill label covering the patch below it. Replace it with a specimen sheet: six bands, full width, 33px each, each labelled in Latin and Arabic with a four-word gloss.
- At 390px the hero panel is cropped on its left edge. "Main band" reads "ain band" and "Motif" reads "otif" (`fable-5.png`). The compact layout needs the panel at `left: 16` inside the picture, not behind the beam.
- Copy. "A UI SDK Select and radio group, dressed in Al Sadu" explains the plumbing. Say what the visitor sees: "Pick a motif, watch it weave. The strip re-weaves in the wool you choose."

### 15. Page and type are generic, and the headings are not headings

Elements: `src/app.tsx`, `src/page.css`, the font tokens.

- The masthead is 56px system sans at weight 650 on beige with a patterned strip under it. Nothing about it could not be any other library's landing page.
- `.masthead__title`, `.section__title` and `.gallery-section__title` are `div`s. Use `h1` and `h2`.
- Five gallery sections say "Woven soon." Hide a section until it has cards.
- Labels are 12.5px. Use whole sizes.
- `--sadu-font-arabic` begins with `"SF Arabic"`. A browser cannot load that face by name unless the user installed it. It only worked in the screenshots because `system-ui` came later in the stack. Put `system-ui` first.
- The Arabic wordmark is in madder at weight 600 beside a 650 Latin wordmark, with different x-heights and baselines. It reads as a translation tag. Give it the woven wordmark in part 2.

---

## Part 2. System upgrades

### The material: six things, each with one meaning

Everything in the library is made of these and nothing else. A component may use bone surfaces and ink freely. It gets one of the six as its Sadu idea.

1. **Thread.** A 1px line in `--sadu-edge`. It means "not yet": the unfilled track, the unchecked state, the empty list, the future step. A dashed thread (6 on, 4 off, round caps) means "cannot": disabled or unavailable. This replaces every grey placeholder in the library.
2. **Cloth.** Woven floats. It means "done" or "this much": the fill, the checked state, the completed step. Cloth appears only where a value or a state lives. Never behind text.
3. **Cord.** The selvedge, 4px tall. Two rows of 6 by 2 floats alternating goat hair and wool on the half-drop, which reads as a two-ply twisted cord. It is the bound edge of a piece. Every floating surface hangs from a cord along its top edge, inset 6px from the sides.
4. **Fringe.** Cut warp ends. 1px threads at a 3px pitch, 7 to 10px long from a fixed table (`8, 10, 7, 9, 8, 7, 10, 9`). It marks the short end of a piece cut from the loom. Used on the toast and nowhere else by default.
5. **Wood.** The beater, beams and pegs. Gradient `#ead8b8` to `#b98d5b` to `#7b5631`, a 1px `rgb(31 24 19 / 0.35)` edge, grain lines at 12% white every 6px. It means "grab this": slider thumb, switch thumb, drawer edge, resize handle, scroll thumb, crop pegs, stepper. If the user cannot drag or press it, it is not wood.
6. **Eye.** A stepped diamond of floats in rows of 1, 2, 3, 2, 1. Three sizes: 10px tall (float 4 by 2) for inline marks, 15px (float 6 by 3) for checkbox and radio, 20px (float 8 by 4) for rating. Filled means on. Outline means off or preview. A single row of three floats is the closed eye, used for collapsed and for indeterminate. Eyes replace check icons, bullets, radio dots, disclosure chevrons and status dots. Lucide icons remain for actions (search, close, copy, calendar).

How much cloth a surface gets follows how much it interrupts. A tooltip gets a 2px cord. A popover or menu gets the 4px cord. A dialog gets a 22px band. The page gets the rug.

Shared parts to add before the five batches start, since batch engineers may not edit shared files: `Weave` with the three levels and a `seed`, `Cord`, `Thread`, `Fringe`, `Eye`, a `.sadu-wood` class, a `Stitch` underline (below), and the tokens in this part. Put them in `src/sadu/parts.tsx` and `src/sadu/sadu.css`.

Two small text-level devices built from thread, shared across batches:

- **Stitch underline.** A 2px dashed underline in madder (dash 4, gap 3, round caps) set 3px under the baseline. It marks matched characters in search results and the active trigger query.
- **Float highlight.** A goat-hair capsule, radius half its height, with wool text. It marks the one active segment or cell inside a field: the focused date segment, the selected day, the current page.

### Signature details, decided

- **Selvedge.** The cord above. One per floating surface, always the top edge, always inset 6px.
- **Fringe.** The toast only. Restraint here is what makes it land.
- **Tassels.** None. A tassel is decoration, and every other element in the system means something. Leave it out.
- **Hand-spun irregularity.** Thread tone, slubs and abrash as specified in critique 6, at cloth and thread levels. Nothing at stitch level, where irregularity reads as a rendering bug.
- **The beater** is the motion signature. It appears only while cloth is being made, and it is always wood.
- **The warp as the empty state.** Any list, grid or panel with nothing in it shows five bare threads at a 6px pitch, 120px wide, centred, with one line of 14px text under them. "Nothing woven yet." No illustration, no icon.
- **The unique Shajarah.** Every rug's centre band comes from a seed. Two instances never match.
- **The woven wordmark.** The masthead "السدو" and "Sadu" are woven, drawn as floats at thread level in wool on a goat-hair band 11 rows tall, the Arabic in square Kufic, which sits on a grid by nature. Weavers did weave names, dates and tribal marks into the Shajarah, so this is in keeping. Use it once, on the masthead. An Arabic reader must draw and approve the letterforms. Do not generate them.

### Type direction

System fonts only. A catalogue serif for display, the system sans for everything you operate, and monospace for component names.

```css
--sadu-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI Variable Text", "Segoe UI", Roboto, "Noto Sans", sans-serif;
--sadu-font-display: ui-serif, "New York", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
--sadu-font-mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
--sadu-font-arabic: system-ui, "Segoe UI", "Noto Sans Arabic", "Geeza Pro", Tahoma, sans-serif;
--sadu-font-arabic-display: "Geeza Pro", "Noto Naskh Arabic", "Sakkal Majalla", "Traditional Arabic", serif;
```

Why a serif. The cloth is a hard grid of rectangles. A text serif at display sizes gives the page the voice of a museum catalogue, which is where most people meet Sadu, and it separates this library from every sans-on-beige component site. It costs no download.

How to set it.

- Scale: 12, 13, 14, 16, 20, 28, 44, 72. No half pixels.
- Display (`--sadu-font-display`): 28px and up only. Weight 600, letter-spacing -0.01em, line-height 1.1. Page title 72/72, section titles 28/32, dialog titles 20/26 are the one exception below 28.
- Controls and body (`--sadu-font`): 14/20 at weight 400, control text 500. Labels 12/16 at 600 with letter-spacing 0.01em. Descriptions and errors 13/18.
- Numbers that change are `tabular-nums`. A value with a unit sets the unit at 12px in `--sadu-ink-2`.
- Component names in gallery captions use `--sadu-font-mono` at 12px.
- No uppercase and no small caps anywhere. Arabic has no case, so a signature built on capitals would exist in only one of the two scripts.

Arabic.

- Set Arabic 1px larger than the Latin role below 16px and 1.12 times larger at 16px and above. Line-height 1.6 for body, 1.4 for display.
- Letter-spacing is always 0. Tracking breaks the joins.
- Where Latin is 600, Arabic is 500. Where Latin is 650 or more, Arabic is 700. No synthetic italics.
- Apply through `:lang(ar)` on the token, not per component.
- Western digits by default. `lang="ar-u-nu-arab"` opts into Arabic-Indic digits and the components must not assume digit width.
- Dates in Arabic demos show the Hijri date as a second line formatted with `Intl.DateTimeFormat("ar-KW-u-ca-islamic-umalqura")`. UI SDK's docs mention no Hijri calendar, so this is display only.

### Motion language

Five named motions. Each has one job.

| Name | Curve | Duration | Used for |
| --- | --- | --- | --- |
| `--sadu-snap` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | 120ms hover and press, 160ms check and popup enter, 100ms popup exit | feedback on anything small |
| `--sadu-throw` | `cubic-bezier(0.5, 0, 0.15, 1)` | 240ms up to 80px of travel, 320ms beyond | something that crosses a distance like a shuttle: tab and segment indicators, switch thumb, month change, viewport resize |
| `--sadu-unroll` | `cubic-bezier(0.16, 1, 0.3, 1)` in, `cubic-bezier(0.4, 0, 1, 1)` out | 320ms in, 200ms out | sheets of cloth: drawer, dialog, toast, accordion, collapsible |
| `--sadu-beat` | `steps(n)` where `n` is the number of columns | 40ms per column, capped at 600ms inside a control and 900ms for a band, then one tap of 120ms | cloth being woven |
| `--sadu-pluck` | 3 cycles of `translateY` at 1.5px, 1px, 0.5px | 240ms | an error. The control's thread vibrates like a plucked warp. It replaces every shake. |

The beat in detail. The reveal edge moves one whole column at a time, so no float is ever cut. The beater is wood, 10px wide for a band and the thumb itself in a control. It leads the reveal edge by 2px. On the last column it pulls back 3px and drives forward 3px in 120ms, and the last two columns darken by 6% for 80ms as if packed down. Then the beater fades in 120ms, or stays if it is a thumb.

Rules.

- Cloth weaves only when the user changes a value. Never on mount, never on scroll, never on hover. The page hero is the one exception and may weave once on load at 1300ms.
- One beat at a time per view. If a change affects many bands they share one beater.
- Exits are always faster than entrances.
- No bounce, no overshoot, no infinite loops except an indeterminate progress.
- Popups scale from 0.97 to 1 with opacity from `--transform-origin`, as the brief says.
- Under `prefers-reduced-motion` or `data-motion="reduced"`, the beat, throw, unroll and pluck become a 120ms opacity change. State still changes. Nothing moves.

### Light and dark

Yes, there is a dark theme, and it is the better half. The Bedouin tent is the bait al-sha'ar, the house of hair, woven from black goat hair. Light is the cloth in daylight. Dark is the inside of the tent by lamp.

Name them `data-theme="day"` and `data-theme="tent"`.

| Token | Day | Tent |
| --- | --- | --- |
| page | `#eadfcb` | `#16110d` |
| surface (cards, fields) | `#fbf7f0` | `#1f1813` |
| raised (popups) | `#fbf7f0` | `#2a211a` |
| ink | `#2b221c` | `#f1e7d6` |
| ink-2 | `#6b5a4a` | `#b9a98f` (7.7 to 1) |
| ink-3 | `#7d6b58` | `#9a8a73` |
| edge | `#8a7864` | `#8c7a66` (4.3 to 1) |
| madder for text, focus and edges | `#a3231b` | `#e05a48` (4.8 to 1) |
| madder as cloth | `#a3231b` | `#c43a2c` (3.3 to 1 on surface) |
| popup shadow | `--sadu-float` | `0 0 0 1px rgb(241 231 214 / 0.14), 0 18px 40px -14px rgb(0 0 0 / 0.7)` |

In the tent, wool, saffron, camel and indigo cloth colours stay as they are, thread shade drops from 16% to 10%, and the cord swaps its two colours so wool leads. Wood stays wood. The page showcase should alternate day and tent sections so the visitor sees both without touching a setting.

Forced colours. Cloth is decoration there. Every state that cloth carries must also be carried by an outline, a border or text, and cloth takes `forced-color-adjust: none` only where it is not the sole carrier.

### What must stay quiet

- Text inputs, button faces, menu items, list rows and popup bodies are flat bone with ink. No cloth, no gradient, no texture.
- One of the six materials per component. If a component has the cord because it floats, the cord is its material and it gets nothing else, unless its concept below says otherwise.
- Cloth covers at most a tenth of a control's area, except where cloth is the content (slider, progress, rug, colour preview).
- Madder is the only accent on controls. Saffron, indigo and camel appear in cloth and as data colours, never as button or link colours.
- Shadows: `--sadu-float` on floating surfaces and nothing else. Cards are flat with a hairline.
- Radii: controls 10, popups 14, items 8, cloth 2 or less, wood 3.
- Icons: Lucide at 16 for actions, stroke 2, `--sadu-ink-2`. Never an icon where an eye will do.
- Content is a weaver's working day. Orders, bands, dye lots, skeins, tent sections, the majlis. Names such as Umm Saad, Hessa, Noura, Mariam. Kuwaiti dinars. No lorem ipsum, no "Item 1".

### The page

1. Masthead on the tent ground, full bleed, 360px tall. The woven wordmark, then a one-sentence lede in `--sadu-font-display` at 28/36 in wool.
2. The loom, full bleed, directly under it with no gap. Bare warp runs the full width of the viewport. Cloth is woven from the start edge to 62%, the rug at thread level. A wood beam closes the start edge. The control panel floats over the warp on the far side. The scripted cursor plays as it does now and stops when the visitor's pointer enters, at which point the controls are live. No window, no traffic lights.
3. The specimen sheet. Six bands at cloth level, full content width, each with its name in Latin and Arabic and a short gloss ("Dhalla, ضلعة, ribs").
4. The gallery by batch, with a sticky batch nav. Sections appear only when they have cards.
5. A colophon naming the sources: the Al Sadu Society and Sadu House in Kuwait, the UNESCO listing, Crichton, Canavan. A library that borrows a living craft says where it learned it.

---

## Part 3. A concept for every component

Format for each: the idea, the states, the motion, and what stays plain. "Standard focus" means a 2px ring in the theme's madder at 2px offset. "Standard popup" means bone surface, radius 14, `--sadu-float`, the 4px cord inset 6px along the top, 160ms in and 100ms out from `--transform-origin`. Every component works right to left through logical properties, and anything directional (reveals, throws, chevrons) mirrors under `:dir(rtl)`.

### Batch 1: overlays

#### dialog

- Idea. A piece laid out for the majlis. A 22px band at stitch level sits inside the panel's top edge, inset 6px, showing the motif of the thing being edited (prop `motif`, default Uwairjan). It is the dialog's identity, the way a header icon is elsewhere.
- States. Closed. Open: backdrop goat hair at 48%, no blur. Focus trapped by UI SDK with standard focus on controls. Close button is a plain 28px icon button in the title row.
- Motion. Panel unrolls: `clip-path` from the top edge down with a 6px `translateY`, 320ms `--sadu-unroll`. The band beats in once, 400ms, starting 120ms after open. Exit 200ms, no band animation.
- Plain. Panel bone, radius 16, max width 480, padding 24. Title in display serif 20/26. Body 14/20. Footer buttons right-aligned (start-aligned in RTL), primary last.
- Demo. "Edit main band": motif select, wool skeins, Cancel and Save.

#### alert-dialog

- Idea. Teeth. The top band is Dhurus al-khail in madder and goat hair, 22px. Horse teeth are the one motif that bites, and the library reserves madder teeth for danger.
- States. Open only by trigger, never closes on outside press. Cancel has initial focus. The destructive action is a solid madder button. A non-destructive alert uses the same band in goat hair and wool.
- Motion. No unroll and no weave. The panel arrives with one thump: opacity in 100ms while `translateY` goes from -4px to 0 in 180ms on `--sadu-snap`. An alert should not perform.
- Plain. Same panel as dialog, max width 420. Title states the consequence, the description names the object.
- Demo. "Cut order 14 from the loom? The 46 rows woven so far cannot be put back." Keep weaving, Cut it.

#### drawer

- Idea. A rug unrolled from its beam. The drawer's leading edge is a wood beam, 10px wide and the full height for side drawers, 10px tall and the full width for a bottom sheet. The beam is the grab handle, because wood means grab.
- States. Closed. Open. Dragging (`data-swiping` or the drawer's drag attribute): the beam's shadow deepens to `0 0 18px rgb(31 24 19 / 0.4)` and the backdrop follows the drag. Focus on the beam shows the standard ring and arrow keys move it if UI SDK supports that. A bottom sheet beam carries a 36px darker grip notch at its centre.
- Motion. 320ms `--sadu-unroll` in, 200ms out. The panel is revealed behind the beam, so the beam always sits on the moving edge. On release past the threshold, one 120ms tap as it seats.
- Plain. Panel bone, no radius on the beam side, 16 on the far corners for a sheet. Backdrop goat hair at 40%.
- Demo. "Order 14" detail: client, dimensions, bands list, due date.

#### popover

- Idea. The reference hung panel. It hangs from the 4px cord and that is all. This is the component where the standard popup is defined, so its job is to be exact.
- States. Closed, open, with the trigger showing `data-open` as a sand fill. Standard focus inside.
- Motion. Standard popup.
- Plain. Padding 16 below the cord, width 280 by default, no arrow. `sideOffset` 6.
- Demo. "Band width": a number input for rows and a loom slider.

#### hover-card

- Idea. A swatch card from a sample book. The top of the card is a strip of real cloth at cloth level, 33px tall, with pinked ends: a 3px zigzag cut on both short edges made with `clip-path`, the way fabric samples are cut so they do not fray. Under it, the motif's name in both scripts and what it means.
- States. Opens after 400ms of hover or on keyboard focus of the trigger. Closes 150ms after leaving.
- Motion. Standard popup timing. The strip never animates.
- Plain. No cord, since the strip is its cloth. Width 260, padding 12. Trigger is a text link with a dotted thread underline.
- Demo. Hover "Uwairjan" in a sentence: strip, "Uwairjan, عويرجان", "Facing triangles. Woven beside the Shajarah."

#### tooltip

- Idea. The smallest hung thing. A goat-hair chip whose anchor-facing edge is a 2px cord, one row of 6 by 2 floats alternating wool and goat hair.
- States. Opens after 500ms, at once if another tooltip was open in the last 300ms. Keyboard focus opens it immediately.
- Motion. 120ms in, 80ms out, opacity and 2px of travel from the anchor side. No scale.
- Plain. Goat-hair ground, wool text 12/16 at weight 500, radius 6, padding 5 by 8. Shortcut keys as wool-outlined keycaps at 11px. In the tent theme it flips to wool ground with ink text.
- Demo. Toolbar buttons: "Beat row", "Undo last pick ⌘Z".

#### toast

- Idea. A strip cut from the loom that unravels as its time runs out. The toast is a goat-hair strip with fringe on its trailing short edge. Along its bottom edge runs a 2px line that starts as cloth (one row of floats in wool) and turns to bare thread from the trailing end as the timer runs. When the line is all thread, the toast leaves.
- States. `data-type` info: wool timer. Success: a filled 10px eye before the title. Error: a madder timer and madder teeth mark, and it does not time out. Hover or focus pauses the timer. `data-swiping` follows the pointer. `data-expanded` fans the stack with 8px gaps.
- Motion. Enters from the inline end, 320ms `--sadu-unroll`. Exits 200ms. The fringe lags the body by 40ms on enter and settles. The timer steps one float at a time.
- Plain. Title 14/20 at 600 in wool, description 13/18 in `#b9a98f`, one action as a text button, close as a 24px icon button. Radius 2 on the fringe end, 8 on the other. Max width 360.
- Demo. "Dye lot recorded. Madder, 3 skeins." with Undo.

#### preferences

- Idea. A weaver's sampler. The settings panel is headed by a small test piece of four bands at cloth level, and each band is driven by one preference, so the sampler is the live preview.
- The four rows. Theme (`data-theme`: day, tent, system) flips the sampler's first band between wool ground and goat-hair ground. Dye (`data-dye`: the five wools, chosen with skeins) recolours the second. Motion (`data-motion`: full, reduced) re-weaves the third with the beat on change when full and swaps it at once when reduced. Contrast (`data-contrast`: standard, more) switches the fourth between three colours and two, and thickens every control edge from 1px to 2px across the page. A fifth row, Direction (`dir`: LTR, RTL), flips the whole panel and the sampler's weave direction.
- States. Each row is a label, a one-line description and a segmented control or skein group. Changes apply at once and persist through UI SDK's storage. A "Reset" text button returns to system values.
- Motion. Only the changed band beats, 600ms.
- Plain. The panel is a bone card, 400 wide, rows separated by threads. No toggles for things that are choices of three.
- Demo. The panel itself, placed wide in the gallery, applied to the gallery page.

#### collapsible

- Idea. An eye that opens. The disclosure mark is the 10px eye: closed is the single row of three floats, open is the full diamond.
- States. Closed, open, hover (trigger text goes from `--sadu-ink-2` to `--sadu-ink`), standard focus on the trigger, disabled (dashed thread under the trigger, eye in `--sadu-ink-3`).
- Motion. The eye opens row by row, 120ms. Content height animates 240ms `--sadu-unroll` in and 160ms out, with opacity.
- Plain. Trigger is a text row, 14/20 at 500, eye on the inline end. Content is unstyled.
- Demo. "Dye notes" opening to three lines about the madder bath.

#### accordion

- Idea. Folds in a length of cloth. Items are separated by threads. Opening an item weaves the thread under its header into a 6px band (three stitch rows: goat hair, dye, goat hair). Closing it returns the band to thread. Closed is thread, open is cloth.
- States. Item closed, open, hover (header ground sand), standard focus on the header, disabled (dashed thread). The header also carries the collapsible's eye on its inline end.
- Motion. The band beats in from the start edge, capped at 300ms. Panel height 280ms `--sadu-unroll`. When one item closes as another opens, the bands run together.
- Plain. Header 15/22 at 600, 48px tall, padding 0 by 4. Panel text 14/20 in `--sadu-ink-2`, padding bottom 16.
- Demo. "How a divider is made": Shearing and spinning, Dyeing, Warping the loom, Weaving, Cutting and finishing.

### Batch 2: menus

#### menu

- Idea. Marks are eyes and the menu hangs from the cord. Checkbox items show a filled 10px eye when checked. Radio items show the eye for the chosen one. Separators are threads.
- States. Item rest, highlighted (sand ground, radius 8, moved at once with no slide), pressed (sand darkened 4%), disabled (`--sadu-ink-3`), destructive (madder text, and on highlight a 12% madder ground). Submenu trigger shows a chevron that flips in RTL and keeps its highlight while its submenu is open.
- Motion. Standard popup. Submenus 120ms in. An eye fills row by row in 120ms when checked.
- Plain. Items 36px tall, 14/20, padding 0 by 10, icon slot 16px, shortcut in `--sadu-ink-2` at 12px on the inline end. Group labels 12/16 at 600.
- Demo. Band actions: Duplicate band, Mirror, Show guide threads (checked), Dye submenu, Remove band.

#### menubar

- Idea. Menus hang from a rod. The bar's bottom edge is a 2px wood-coloured rule (`#b98d5b`). An open menu's cord sits flush against it with `sideOffset` 0, so the popup visibly hangs from the bar.
- States. Trigger rest, hover (sand), open (sand, text at 600), standard focus. Arrow keys move between menus per UI SDK.
- Motion. First menu 160ms. Moving between open menus is instant for the trigger and 100ms for the popup.
- Plain. Triggers 14/20 at 500, 32px tall, padding 0 by 10, radius 8. The bar has no background.
- Demo. Loom, Band, Wool, View, Help.

#### navigation-menu

- Idea. An eye rides the cord. The shared viewport hangs from one cord, and a 10px filled eye sits on the cord under the active trigger in place of an arrow. As the user moves between triggers the eye slides along the cord.
- States. Trigger rest, hover, open. Links inside: rest, hover (sand), current page (a 10px eye before the label), standard focus.
- Motion. Viewport width and height 320ms `--sadu-throw`. The eye travels with the same curve. Panels cross-fade 160ms with 8px of travel in the direction of movement.
- Plain. Panel content is a two-column list of links, each with a 48 by 22 band swatch, a title at 14/20 at 600 and a line of description at 13/18.
- Demo. Motifs (the six, with swatches), Materials (Wool, Goat hair, Camel hair, Dyes), Pieces (Tent divider, Cushion, Saddle bag, Rug).

#### command

- Idea. Matches are stitched. In each result the characters that match the query carry the stitch underline. Bold is not used for matching.
- States. Input with a search icon and standard focus. Item rest, highlighted (sand), disabled. Empty: the warp empty state, five threads and "Nothing woven under 'xyz'." Loading: the threads weave across in a loop.
- Motion. List changes are instant. The stitch draws in 120ms. Inside a dialog the palette uses the alert-dialog thump, not the unroll, because it is a tool.
- Plain. Width 560. Input row 48px with a thread under it. Items 40px, icon 16, shortcut keycaps on the inline end. Group labels 12/16. No cord inside a dialog.
- Demo. "Go to order…", "New band", "Change dye lot", "Mirror pattern", "Export draft as PDF", with groups Orders, Loom, Wool.

#### trigger-menu

- Idea. The list hangs by a thread from the caret. A 1px thread, 6px long, drops from the caret to the popup's cord. While the menu is open the trigger character and the query typed after it carry the stitch underline.
- States. Open at the caret, narrowing as the user types. Item highlighted (sand). Empty ("No weaver by that name"). Closed on Escape with the text left as typed.
- Motion. 120ms in, opacity and 4px of travel. No scale, since it sits in running text.
- Plain. Width 240, items 36px. People show the 20px woven avatar. Motifs show the 48 by 22 swatch.
- Demo. A note field: "Ask @Hessa to warp the loom for #uwairjan."

#### toolbar

- Idea. One piece, bound on one edge. The toolbar is a bone strip with a cord along its bottom edge, full width. Groups are separated by vertical threads 16px tall.
- States. Roving focus from UI SDK with the standard ring. Buttons and toggles take their own states.
- Motion. None of its own.
- Plain. Height 44, padding 4, radius 10 on top corners and 2 on the bottom where the cord sits, gap 2. Icon buttons 36px.
- Demo. Undo, Redo, a toggle group (Guide threads, Mirror, Lock band), a motif select, Zoom in and out.

#### toggle and toggle group

- Idea. Pressed is woven. Each toggle has a 4px strip along its bottom edge. Off, the strip is two bare threads. On, it is two rows of stitch cloth in goat hair and the dye. In a group the strips line up into one continuous warp, so the group reads as a single band with some segments woven.
- States. Off, hover (sand ground), pressed (`data-pressed`: cloth strip, text and icon in `--sadu-ink`, weight 600), standard focus, disabled (dashed threads).
- Motion. The strip beats in from the start edge in 160ms and unravels in 120ms.
- Plain. 36px tall, radius 8 on top and 2 on the bottom, icon 16 or label 14/20. Group gap 0 with a thread between items.
- Demo. Band alignment: Start, Centre, End. And multi-select: Guide threads, Mirror, Lock.

#### segmented-control

- Idea. The shuttle carries a thread. The indicator is a flat goat-hair block with wool text. When the selection moves, a 1px madder thread trails from where the indicator was to where it is going, then retracts.
- States. Item rest (`--sadu-ink-2`), hover (`--sadu-ink`), checked (under the indicator, wool text at 600), standard focus on the item, disabled (dashed thread along the bottom of the track).
- Motion. Indicator 240 to 320ms `--sadu-throw`. The trailing thread draws with it and retracts over 200ms after it lands.
- Plain. Track is bone with a 1px `--sadu-edge` border, radius 10, height 36, padding 3. Indicator radius 7. No cloth.
- Demo. Ground: Wool, Goat hair, Camel.

#### button

- Idea. A hem that weaves while it works. The primary button has a 4px hem along its inside bottom edge, two rows of stitch floats alternating madder and dark madder (`#76150f`). At rest it is a quiet woven edge. While loading, the hem becomes bare thread and weaves across in a loop, and the label stays readable.
- States. Variants: primary (madder ground, wool text, hem), secondary (bone, 1px `--sadu-edge`, ink text), ghost (no edge, sand on hover), destructive (bone with madder text, madder ground on hover). Hover darkens the ground 6%. Pressed: `scaleY(0.97)` from the bottom and the hem flattens to 2px, 120ms. Standard focus. Loading: `aria-busy`, hem weaving, pointer events off. Disabled: wool ground, `--sadu-ink-3` text, no hem.
- Motion. `--sadu-snap` 120ms for hover and press. Hem loop 900ms per pass in whole floats.
- Plain. Sizes 28, 36, 44. Radius 10 on top and 4 on the bottom of primary where the hem sits, 10 all round elsewhere. Label 14/20 at 600. Icon 16 with 8px gap.
- Demo. "Save band", "Cancel", "Remove band", and "Sending to loom…" in the loading state.

#### pagination

- Idea. How far along the cloth you are. Page numbers sit on a warp thread. From page one to the current page the thread is woven into a 4px band, and the current number sits in the float highlight.
- States. Page rest, hover (sand), current (`aria-current`, float highlight, not pressable), standard focus, disabled Previous and Next (`--sadu-ink-3`). Ellipsis is three short dashes of thread.
- Motion. The band extends or retracts in whole floats and the highlight moves with it, 280ms `--sadu-throw`.
- Plain. Items 36px square, numbers tabular 14/20. Previous and Next are icon buttons whose chevrons flip in RTL.
- Demo. "Orders, page 4 of 12."

### Batch 3: inputs

#### input

- Idea. A weft thrown across. The field is plain. On focus, a 2px madder thread draws along the inside bottom edge from the start edge to the end, the way a weft crosses the warp.
- States. Rest (bone, 1px `--sadu-edge`, radius 10, height 40). Hover (edge `--sadu-ink-2`). Focus (standard ring plus the thrown thread). Filled (no change). Invalid (edge and thread madder, one pluck). Disabled (dashed edge, wool ground, `--sadu-ink-3` text). Read-only (no edge, thread only).
- Motion. Thread 200ms `--sadu-throw` in, 120ms fade out. Pluck 240ms once on becoming invalid.
- Plain. Text 14/20, padding 0 by 12, placeholder `--sadu-ink-3`. Leading and trailing slots for a 16px icon or unit text.
- Demo. "Client name": Umm Saad Al-Ajmi.

#### textarea

- Idea. The length left to weave. A 4px band runs along the inside bottom edge. It is bare thread at zero characters and weaves toward the end edge as the text approaches `maxLength`. Over the limit it turns to madder teeth.
- States. As input. With no `maxLength` the band is absent and the textarea takes the input's thrown thread. Near the limit (90%) the counter text turns from `--sadu-ink-2` to `--sadu-ink`.
- Motion. The band moves in whole floats with each keystroke, no easing. Pluck on crossing the limit.
- Plain. Auto-grows from 3 rows to 8, then scrolls. Counter "212 / 240" at 12px tabular under the field on the inline end. Resize handle hidden.
- Demo. "Notes for the weaver": "Client wants the centre band narrower than the last piece, and saffron in place of madder for the border."

#### field and label

- Idea. Required is a float and an error is an eye. The required mark after the label is one madder float, 6 by 2, with visually hidden text "required". The error line opens with a 10px madder eye, not a warning icon.
- States. Label 12/16 at 600 in `--sadu-ink-2`, 6px above the control. Description 13/18 in `--sadu-ink-2`, 6px below. Error replaces the description, madder text 13/18. Invalid controls pluck once. Disabled fields set the label to `--sadu-ink-3`. Labels press through to their control.
- Motion. The error line's height and opacity animate 160ms. The eye fills row by row in 120ms.
- Plain. Vertical layout by default, with a horizontal variant for switches and checkboxes at 12px gap. A fieldset legend uses 14/20 at 600.
- Demo. "Rows per band", description "Between 5 and 21. Odd numbers centre the motif.", error "12 is even. Use 11 or 13."

#### number-input

- Idea. A wood stepper. The increment and decrement buttons form one vertical wood block on the inline end, 22px wide and the full inner height, split by a 1px dark line, chevrons engraved in `#3a2817`. It is the one part of the field you operate by pressing and holding, so it is wood.
- States. Rest. Hover on a half lightens it 6%. Pressed darkens it 8% and insets it 1px. `data-at-bound` greys the engraved chevron on that half. `data-scrubbing` (dragging the label through `NumberInputScrubArea`) turns the cursor to a horizontal resize and tints the value madder. Invalid and disabled as input, with the wood desaturated when disabled.
- Motion. Each step nudges the value 2px in the direction of change and back, 120ms. Holding repeats at UI SDK's rate.
- Plain. Field as input, value tabular and end-aligned beside the stepper, unit in `--sadu-ink-2` at 12px.
- Demo. "Rows per band": 11 rows, min 5, max 21, step 2.

#### password-input

- Idea. The eyes are closed. Each hidden character is a 10px filled eye in ink. Revealing the password opens them into characters.
- States. Hidden (eyes). `data-visible` (plain text). The toggle is an icon button whose mark is the eye, closed or open, with the label "Show password" or "Hide password". `data-capslock` shows a line under the field: "Caps Lock is on". Invalid and disabled as input.
- Motion. A typed character lands as an eye, scale 0.6 to 1 in 120ms. Reveal swaps eyes for characters with a 20ms stagger capped at 160ms.
- Plain. Field as input. Build the eyes as an overlay on a transparent-text input set in `--sadu-font-mono` with a fixed 14px advance, so the caret and selection stay native and line up. Check selection highlight and password manager icons before shipping.
- Demo. "Workshop passphrase."

#### otp-input

- Idea. Tied off. Each slot stands on a short thread. An empty slot is a bare 28px thread. A filled slot's thread is woven into a float. When the last digit lands, the threads join into one continuous band under the whole code.
- States. Slot empty, active (thread madder, 2px, caret blinking above it), filled, complete (joined band in goat hair and dye), invalid (band madder, one pluck, the code clears on next key). Disabled (dashed threads). The separator is a 4px knot on the thread line.
- Motion. A digit lands with 2px of upward travel, 120ms. The joining band beats across in 300ms.
- Plain. Slots 40 by 48 with no box, digits 20px tabular at 600, gap 8.
- Demo. "Code from the workshop": six digits in two groups of three.

#### token-input

- Idea. Tokens carry a sample. Each token opens with the material it stands for: a person shows the 16px woven avatar, a motif shows a 24 by 10 strip of its band, a dye shows a 12px skein.
- States. Token rest (bone, 1px `--sadu-edge`, radius 6, height 24). Selected by keyboard (goat-hair ground, wool text). Hover shows the remove button. Invalid token (madder edge). The editor takes the input's states and the thrown thread on focus.
- Motion. A token enters at scale 0.9 to 1 with opacity, 120ms. On removal its width collapses in 160ms.
- Plain. Token text 13/18 at 500, padding 0 by 6, gap 4. The field wraps and grows to four lines.
- Demo. "Brief": "Divider for @Umm Saad in #uwairjan with #madder and #saffron, due before Eid."

#### autocomplete

- Idea. The suggestion is unwoven until you take it. The inline completion appears after the caret in `--sadu-ink-3` with the stitch underline in `--sadu-ink-3`. Accepting it pulls the stitch tight: the underline goes solid for 80ms and fades, and the text turns to ink.
- States. Field as input. List in a standard popup, items 36px, highlighted (sand). The typed part of each suggestion is weight 400 and the rest 600. Empty closes the popup.
- Motion. Accept 200ms. Popup standard.
- Plain. No swatches. This is free text with help.
- Demo. "Dye source": typing "ma" offers "madder root", "madder, second bath".

#### combobox

- Idea. The home of the warp empty state. When nothing matches, the list shows five bare threads and "Nothing woven under 'xyz'." Items otherwise follow the motif select: band swatch, name, Arabic name, and a 10px eye on the selected row.
- States. Field as input with a chevron button. Item rest, highlighted, selected, disabled. Multi-select shows chosen items as tokens in the field. Loading shows the threads weaving across.
- Motion. Standard popup. The list filters at once.
- Plain. Items 40px, swatch 48 by 22, Arabic at 15px on the inline end.
- Demo. "Border motif": Ain, Uwairjan, Dhalla, Hubub, Dhurus al-khail, each with its band.

#### date-input

- Idea. The active segment is a float. The focused day, month or year segment sits in the float highlight, and the highlight slides to the next segment as the user types or arrows across. Empty segments show their placeholder in `--sadu-ink-3` on a dashed thread.
- States. Field as input. Segment rest, focused (float highlight), placeholder, invalid (whole field per input rules). Disabled as input.
- Motion. The highlight moves 160ms `--sadu-throw`. A changed digit nudges 2px in the direction of change.
- Plain. Tabular digits, literal separators from the locale in `--sadu-ink-2`. In Arabic demos a second line shows the Hijri date at 12px.
- Demo. "Due date": 14 / 02 / 2027, with the Hijri date that `Intl` computes for it on a second line in the Arabic card.

#### time-input

- Idea. The day as a band of 24 floats. Under the field sits one row of 24 floats, 6 by 3 with 1px dimples, 144px wide. Night hours are goat hair, daylight hours are wool, and the chosen hour is madder. The user sees where in the day the time falls.
- States. Segments as date-input, including the AM and PM segment. The band follows the hour. Disabled dims the band to dashed thread.
- Motion. The madder float moves in whole steps with the hour, 120ms each.
- Plain. Field as input, 144px minimum so field and band align. Daylight is fixed at 6 to 18. Do not compute sunrise.
- Demo. "Collection time": 4:30 PM.

### Batch 4: pickers

#### calendar

- Idea. Today is an eye, and a range is a thread between two knots. Today carries a 10px outline eye under its number. A selected day sits in the float highlight. In a range, the two ends are float highlights and a 2px madder thread runs under the numbers between them, wrapping at week ends.
- States. Day rest, hover (sand capsule), today, selected, range start and end, in range, outside month (`--sadu-ink-3`), unavailable (dashed thread through the number, not pressable), standard focus on the day. Month and year in the header with Previous and Next icon buttons that flip in RTL.
- Motion. Month change slides the grid 240ms `--sadu-throw` in the reading direction. The range thread draws from the start knot as the pointer moves.
- Plain. Cells 36px, numbers tabular 14/20, weekday initials 12/16 in `--sadu-ink-2`. Week start follows the locale. Friday and Saturday columns are not tinted.
- Demo. "Loom booked": 3 to 11 Rajab, with two unavailable days.

#### date-picker

- Idea. The date is beaten into the field. The picker is a date-input with a calendar in a standard popup. Its own moment is the hand-off: when a day is chosen the popup closes and the field's segments land one after another from the popup's side.
- States. Field per date-input with a calendar icon button on the inline end. Popup open and closed. Presets as a column of ghost buttons on the start side.
- Motion. Segments land with 4px of travel, 30ms stagger, 160ms each, then one 120ms tap on the whole value.
- Plain. Popup padding 12 below the cord. Footer with Clear and Today as text buttons.
- Demo. "Delivery date", presets "In two weeks", "Before Eid", "End of month".

#### color-picker

- Idea. Judge the dye as cloth. The preview is a 33px band, Ain at cloth level, re-dyed live with the chosen colour on goat hair with wool. Colour in Sadu is always read against black and white, so that is how the picker shows it.
- States. Area thumb and slider thumbs are 16px rings, wool with a 1px ink edge, standard focus. Swatches are the five skeins plus saved dyes. The hex field takes input states. Under the hex, a line names the nearest wool: "Closest to madder".
- Motion. The band recolours at once while dragging. On release it beats once, 600ms.
- Plain. Area 200 by 140, radius 8. Hue slider 12px tall, radius 6. Eyedropper is a ghost icon button. The area and sliders are ordinary gradients with no texture.
- Demo. "Border dye", starting at madder.

#### file-input

- Idea. An empty loom. The drop zone is a frame with a wood beam at each end and eight bare warp threads between them. Each file added is woven in as a band: its row is a thread, and upload progress is cloth weaving along it.
- States. Rest: threads at `--sadu-edge`, text "Drop pattern drafts here or browse". Hover: threads `--sadu-ink-2`. `data-dragging` with `data-drag-accept`: threads madder and evenly taut, text "Let go to add 3 drafts". `data-drag-reject`: threads pluck once, text "Only PDF and PNG drafts". Standard focus on the zone. Disabled: dashed threads. File row: uploading (cloth advancing with a 2px wood edge), done (full band, name and size, remove button), failed (madder teeth, Retry).
- Motion. Threads tighten in 160ms. File cloth advances in whole floats. A finished file gets the 120ms tap.
- Plain. Zone 140px tall, radius 10, 1px `--sadu-edge`. File rows 40px, name 14/20, size 12px tabular.
- Demo. "uwairjan-border.pdf, 240 KB", "divider-draft-3.png, 1.2 MB, 62%".

#### image-cropper

- Idea. Staked like a ground loom. The four corner handles are wood pegs, 12px discs, the way a ground loom is pegged at its corners. The thirds grid is drawn as wool threads. The area outside the crop dims to goat hair at 55%.
- States. Selection rest, dragging (threads brighten from 60% to 100%), standard focus on the selection with arrow keys per UI SDK. Peg hover grows it to 14px. Edge handles are 20 by 4 wood bars. Zoom is a plain 4px slider with a wood thumb. Rotate and Flip are ghost icon buttons.
- Motion. Aspect changes animate the selection 240ms `--sadu-throw`. Rotation 240ms.
- Plain. Viewport radius 10 on a goat-hair ground. Aspect presets as a segmented control: "Square", "Cushion 3:2", "Band 4:1".
- Demo. A photo of a tent divider, cropped to a band.

#### listbox

- Idea. Selections join into a seam. Each selected row has a 3px madder stitch bar at its start edge. Adjacent selected rows join into one continuous seam, so a block of selection reads as one stitched run.
- States. Option rest, highlighted (sand), selected (seam, text at 600, 10px eye on the inline end), disabled, standard focus on the list with the active option outlined. Group labels 12/16.
- Motion. A seam segment draws top to bottom in 120ms.
- Plain. Options 40px, 14/20, optional 48 by 22 swatch. The list sits in a bone panel with a 1px `--sadu-edge` border and radius 10.
- Demo. "Bands in this piece", multi-select: Border, Dhalla, Uwairjan, Shajarah, Uwairjan, Dhalla, Border.

#### tree

- Idea. Children hang by threads. Indent guides are warp threads, and each child ties to its guide with a 3px knot. The expand mark is the eye, closed or open, as on the collapsible. The component is fittingly named, since the Shajarah is "the tree".
- States. Node rest, hover (sand), selected (sand with the listbox seam), expanded and collapsed, standard focus, disabled. Leaves have a knot and no eye.
- Motion. Children unroll 200ms and the guide thread draws downward with them. The eye opens in 120ms.
- Plain. Rows 32px, 14/20, 20px indent per level, optional 16px icon.
- Demo. Order 14 > Majlis divider > Border (Dhalla, Hubub), Flank (Uwairjan), Centre (Shajarah: hourglass, eye, earrings, comb).

#### checkbox

- Idea. An eye woven into the box. Checked, the box fills with goat hair and a wool eye appears in it, built from five rows of floats. Indeterminate is the closed eye, one row of three floats.
- States. Unchecked (bone, 1.5px `--sadu-edge`, 18px, radius 5). Hover (edge `--sadu-ink-2`). Checked (`data-checked`). Indeterminate (`data-indeterminate`). Standard focus. Invalid (madder edge). Disabled (dashed edge, eye in `--sadu-ink-3` when checked).
- Motion. The eye weaves top row to bottom, 24ms per row, 120ms in all. It unweaves in 80ms.
- Plain. Label 14/20 with a 10px gap, hit area 44px tall. In a group, a legend and 10px between rows.
- Demo. "Include in the piece": Fringe at both ends (checked), Tassels, Lining. And a parent "All finishing" in the indeterminate state.

#### carousel

- Idea. Cloth wound between two beams. The viewport's two ends are wood beams, 10px wide and the full height, and slides pass under them with a 6px contact shadow, as cloth winds onto a beam.
- States. Previous and Next are 36px icon buttons outside the beams, disabled at the ends unless looping. Indicators are 10px eyes: filled for the current slide, outline for the rest, each a button with a 24px hit area. Standard focus on the viewport and controls. Dragging follows the pointer.
- Motion. Slide change 400ms `--sadu-unroll`. The beams' grain lines shift 6px in the direction of travel while slides move, which reads as rotation.
- Plain. Slides have a 16px gap and radius 2, since they are cloth. Caption under each at 13/18.
- Demo. "Pieces from the workshop": five rugs, each a different border motif and dye, each with its own seeded Shajarah.

### Batch 5: display

#### avatar

- Idea. A wasm, the mark Bedouin families used to brand their camels and sometimes wove into their cloth. The fallback is a woven mark built from the person's name: a 5 by 7 lattice at stitch level, mirrored left to right, in one wool colour on goat hair or wool, chosen by a hash of the name.
- States. Image loaded (`data-loading-status`): the photo. Loading: bare threads. Failed or absent: the wasm. Status is a 10px eye at the bottom end corner, filled for present and outline for away. In a group, avatars overlap by 8px with a 2px surface ring.
- Motion. A loaded image replaces the wasm in whole columns, 200ms.
- Plain. Avatars are square patches with radius 4, in sizes 20, 28, 40 and 64, because cloth is never cut round. Photos take the same shape so the set stays consistent. The name is always available as `aria-label` and in a tooltip, and anywhere an avatar stands alone the name is printed beside it.
- Demo. Hessa, Noura, Mariam, Umm Saad, two with photos and two with marks.

#### separator

- Idea. A thread by default, a cord when it matters. The default separator is a 1px thread in `--sadu-line`. The `cord` variant is the 4px cord, for the one place on a view where two major sections part.
- States. Horizontal and vertical. With a label, the thread runs to either side of 12/16 text with a 12px gap. Decorative separators are hidden from assistive technology per UI SDK.
- Motion. None.
- Plain. Everything. Use the cord at most once per view.
- Demo. A thread between form groups, a labelled thread ("or"), and one cord above a footer.

#### progress

- Idea. Cloth being woven. The track is bare warp, the fill is cloth, and the leading edge is a wood beater. This is the brief's own example and the library's clearest sentence, so it must be exact.
- States. Small: three threads, 6px tall, fill of three stitch rows, a 2px wood edge. Large: eleven threads, 22px tall, the fill a full motif band, a 6px beater. `data-progressing`: beater present. `data-complete`: one tap, then the beater fades in 120ms and a filled 10px eye appears beside the value. `data-indeterminate`: a 48px woven window travels along the warp, 1200ms a pass, linear, in whole floats.
- Motion. The fill advances in whole columns as the value changes, 200ms per change at most.
- Plain. Label 12/16 at 600 on the start side, value 12px tabular on the end side, both above the track.
- Demo. "Weaving order 14": 46 of 96 rows. And "Checking dye lot…" indeterminate.

#### meter

- Idea. Counted floats. A meter is a measure, not a task, so nothing moves and there is no beater. It is one row of 20 separate floats, each 10 by 6 with a 2px gap, filled up to the value.
- States. Filled floats are goat hair in the optimum range, saffron when low, madder when high. The value text always states the reading and its meaning, so colour is never the only signal. Empty floats are outlines in `--sadu-edge`.
- Motion. None. A changed value redraws at once.
- Plain. Label and value above as on progress. Width 238px, or flexible with the float count fixed at 20.
- Demo. "Madder in stock": 14 of 20 skeins. "Saffron in stock": 3 of 20, low.

#### scroll-area

- Idea. A wood thumb on a thread. The scrollbar's track is one thread down its centre. The thumb is a wood bar, 6px wide, radius 3, with a 1px `#7b5631` edge so it holds 3 to 1 against bone.
- States. Per UI SDK's `type`. On hover of the scrollbar the thumb widens to 8px. Dragging darkens it 6%. The thread shows only while the scrollbar is visible.
- Motion. Scrollbar fades in 120ms and out 300ms after 600ms idle. Width change 120ms.
- Plain. The scrollbar insets 2px from the edge. No shadows at the scroll edges. The corner between two scrollbars is empty.
- Demo. "Orders this season": a 220px tall list of fourteen orders.

#### resizable

- Idea. A thread that becomes a beam when you reach for it. At rest the handle is a 1px thread with a 24 by 4 wood grip at its centre. On hover or focus the whole handle thickens to a 4px wood beam. While dragging it is 6px with a deeper shadow.
- States. Rest, hover, dragging, standard focus with arrow keys per UI SDK, disabled (dashed thread, no grip). A panel that snaps closed gives the 120ms tap.
- Motion. Thickness 120ms `--sadu-snap`.
- Plain. The hit area is 12px wide whatever the visual width. Panels are plain. Works vertically.
- Demo. "Pattern draft" on one side, a text grid of the motif, and "Cloth" on the other, the same grid woven.

#### timeline

- Idea. The order so far is cloth. The connector between completed events is a 3px woven strip. Between upcoming events it is a bare thread. Markers are eyes: filled for done, a 15px madder eye for the current step, outline for what is to come.
- States. Item done, current, upcoming. Standard focus on the item, with arrow keys moving between events per UI SDK. A failed step shows madder teeth as its marker.
- Motion. When a step completes, its connector beats in over 300ms and the next eye fills.
- Plain. Vertical. Title 14/20 at 600, time 12px tabular in `--sadu-ink-2`, description 13/18. Marker column 24px wide on the start side.
- Demo. Order 14: Wool sheared, Spun, Dyed in the madder bath, Loom warped, Weaving (current, "46 of 96 rows"), Cut from the loom, Delivered to the majlis.

#### waterfall

- Idea. Idle time is thread and work is cloth. Every row has a bare warp thread across the full time axis. A span is the stretch where that thread is woven, a flat stitch-level bar in the colour of its kind. Waiting reads as thread with no extra drawing.
- States. Row rest, hover (sand), selected (standard ring on the bar), expanded and collapsed with the eye mark. Bars: goat hair for weaving, madder and saffron for their dye baths, camel for spinning, wool with an edge for waiting on a client. A `WaterfallMark` is a vertical madder thread with a knot and a 12px label at the top. Axis gridlines are threads at `--sadu-line`.
- Motion. Expanding a span unrolls its children in 200ms. Bars do not animate on load.
- Plain. Rows 32px, bars 10px tall (five stitch rows), names 14/20, durations 12px tabular. Bars carry no motif, since at this size a pattern is noise.
- Demo. "Order 14, 31 days": Shear and wash, Spin, Dye (Madder bath, Saffron bath), Warp, Weave (Border, Flank, Centre, Flank, Border), Finish, with a mark at "Eid".

### Changes to the six built components

Each is detailed in part 1. In one line apiece:

- **motif-select.** Swatch becomes a 48 by 22 band at stitch level. The check becomes the 10px eye. The popup strip becomes the cord. Arabic names go to 15px in ink. Hover ground `#fffdf8`. Edge uses `--sadu-edge`. Options become the five border motifs, without Shajarah.
- **loom-slider.** Warp threads never lighter than `--sadu-edge`. End beams 6px and flat, thumb 14px with grain. Cloth reveals in whole columns with a 1px fell line and no shadow. Value 20px tabular. Releasing the thumb gives one tap.
- **skein-radio.** Two crossing wrap directions, no specular dot. 28px in a 44px hit area. The head slot names the hovered or focused wool. Group inset 4px so the ring stays inside the column. Saffron becomes `#cf7a1b`.
- **sadu-switch.** Rebuilt as a small loom: off is bare warp, on is Dhurus cloth, the thumb is a 10 by 28 wood bar. 52 by 24 track, radius 2, 240ms throw.
- **sadu-tabs.** The list's rule is one thread. The indicator is a 6px band of three stitch rows on that thread, 280ms throw, no shadow.
- **eye-rating.** Stepped 20px eyes on a shared thread. Unrated positions are thread with a knot, preview is outline, committed is filled. Eyes fill row by row in 120ms.

And the three shared pieces under them:

- **weave.** Three levels with whole-pixel cells, three drawing layers, no backing rect, per-thread variance with a seed, whole-column reveals.
- **motifs.** The six grids in part 1, authored for the half-drop lattice, plus `shajarah(seed)`.
- **rug.** The mirrored 77-row recipe, at least half plain, with only changed bands re-weaving.
