# Sadu review, round 2

Judged from pixels. I shot the home page at 1440 and 390 in Day, Tent and RTL, all five batch galleries in Day and Tent, every popup kind open, nine detail pages, the install prompt, the Loom and Bench pages, and 3x crops of the woven details. Captures are in `/tmp/sadu-tools/f2/`. Measurements quoted below come from computed styles on the home page (`/tmp/sadu-tools/f2/probe.txt`) and from the component CSS.

Ground rules I am holding to. The expressive concepts stay. Nothing here asks for less cloth, less wood or fewer ideas. Every fix is about making the same character cohere across 56 components and removing the flaws that stop it reading as one hand. Edge stripes are banned, and I looked for them specifically (section 2.14).

Owners: `core`, `overlays`, `menus`, `inputs`, `pickers`, `display`, `site`.

---

## 1. Verdict

The material is now right and the best pieces are award-level. The cloth renders as crisp warp-faced floats on whole pixels, the cord reads as two-ply, and a dozen components have an idea nobody else has: the alert dialog whose band unravels to bare warp, the toast with a fringe and a fraying timer thread, the calendar range woven as a camel band with cut ends, the OTP cells of bare warp, the password of eyes, the hover card as a pinked swatch, the toolbar lashed to a beam. Against spec-01 the library has more invention per component. It loses on discipline. spec-01 shows 58 components in 4,726px on one strict card module where everything shares one hand. Sadu shows 56 in 8,612px, with twelve different card heights, card numbers out of order (25, 28, 26, 27), three card radii across pages, six icon-button sizes, eight focus offsets, sixteen hand-copied wood gradients, two kinds of eye (stepped floats and rounded beads), and a Tent theme in which the selected segment, the goat-hair skein, the toast and the waterfall bars all disappear. RTL mirrors layout but breaks punctuation in every English sentence and clips the code block. The three biggest moves left:

1. One system pass that moves the repeated things into shared parts and tokens (eye, lozenge, wood, capsule colours, chip, kbd, popup surface, focus). This removes most of the cross-batch drift and fixes Tent in one place.
2. Rebuild the catalogue page on a strict module with numbers in reading order, give the eight trigger-only overlay cards a visible specimen, fill the empty half of the masthead with a live loom, and replace Bench with real compositions the way spec-01 has Player, Paint and Dashboard.
3. Make it flawless at the edges. Arabic copy and correct bidi in RTL, the five overflow bugs at 390px, threads that strike through text, stale idea copy on detail pages, and stock portraits that do not belong to this subject.

---

## 2. System consistency

Each item gives what differs, the standard to adopt, and who changes.

### 2.1 Type sizes and weights

What is consistent already: labels are 12px/600 `--sadu-ink-2` with 0.12px tracking everywhere (`.sadu-label`, `.sadu-field__label`). Descriptions are 13px/400 `--sadu-ink-2` everywhere. Control text is 14px. Keep all of that.

What differs:

| Thing | Where | Now |
| --- | --- | --- |
| Trigger weight | `.sadu-button` 600, `.sadu-menu__trigger` 500, `.sadu-nav__trigger` 500 | A menu trigger looks like an outline button set lighter |
| Row title weight | `.sadu-accordion__trigger` 600, `.sadu-collapsible__trigger` 500 | Same role, two weights |
| Field value weight | `.sadu-input__control` 400, `.sadu-date-picker__input` 500, `.sadu-color__input` 500 | Three text fields, two weights |
| Arabic label | Date Input `موعد التسليم` 13px/500 beside Latin 12px/600 | Reads smaller and thinner than its Latin twin |
| Big numerals | Loom Slider readout 20px/600 sans, Number Input value 20px/600 sans, Loom page "11" about 96px sans | No rule for display numerals |

Standard:

- Actions are 600 (`SaduButton`, and any trigger drawn as a button). Choices are 500 and the chosen choice is 600 (tabs, segments, toggles, menu rows, tree rows, list rows).
- Row titles that disclose content are 14px/600. Collapsible moves to 600.
- Typed values are 14px/400. Segmented values (date, time) and hex are 14px/400 with `tabular-nums`. Date Picker and Color Picker drop to 400.
- Arabic. I am revising my own rule from DIRECTION. Below 16px set Arabic 2px larger than the Latin role and keep the same weight. So labels are 14px/600 in Arabic. The 1px and 500 rule produced the weak label above.
- Display numerals 28px and up use `--sadu-font-display` 600 with `tabular-nums`. Readouts under 28px stay sans 20px/600 with the unit at 12px `--sadu-ink-2`.

Change: menus (menu and nav triggers), overlays (collapsible), pickers (date picker, color picker), inputs (Arabic label), site (Loom page numeral).

### 2.2 Control heights and radii

Measured heights and radii today:

| Control | Height | Radius |
| --- | --- | --- |
| Button | 36 | 10 |
| Button small | 28 | 8 |
| Warp Toggle | 36 | 8 |
| Tab | 36 | 8 |
| Menubar trigger | 32 | 8 |
| Segmented container / item | 36 / 30 | 10 / 7 |
| Image Cropper aspect chooser | 30 | 999 |
| Text field | 40 | 10 |
| Color hex field | 36 | 10 |
| Toolbar select | 36 | 8 |
| Collapsible trigger | 60 | 14 |
| Accordion trigger | 48 | 8 |
| Icon button in a field | 28 r6 (input clear, combobox), 32 r7 (password), 32 r8 (date picker), 28 r7 (file remove) | |
| Icon button standing alone | 32 r8 (calendar step, code copy), 36 r10 (carousel, cropper tools, dropper, pagination step) | |
| Checkbox | 20 | 6 |

Standard, to be added as tokens in `sadu.css`:

```css
--sadu-h-field: 40px;      /* anything you type in */
--sadu-h-control: 36px;    /* buttons, toggles, tabs, triggers, standalone icon buttons */
--sadu-h-compact: 28px;    /* small buttons, icon buttons inside a field */
--sadu-radius-control: 10px;   /* 36 and 40 */
--sadu-radius-compact: 6px;    /* 28 */
--sadu-radius-item: 8px;       /* rows inside popups and lists, tabs */
--sadu-radius-inner: 7px;      /* a 30px thumb inside a 36px container */
```

- Warp Toggle radius 8 becomes 10. It sits beside buttons in the top bar and the difference shows.
- Menubar trigger 32 becomes 36 with radius 8 (it is a row of items on a rod, so the item radius is right).
- Color hex field 36 becomes 40.
- Icon buttons inside a field are all 28 r6. Password toggle and date picker trigger shrink from 32. File remove goes from r7 to r6.
- Standalone icon buttons are all 36 r10. Calendar step and code copy grow from 32.
- Small button radius 8 becomes 6.
- Image Cropper stops drawing its own pill chooser and uses `SaduSegmentedControl`.
- Toolbar select stays 36 r8 as the one in-toolbar exception.

Change: menus, inputs, pickers, display.

### 2.3 Insets and card padding

- Popup inner padding is 6px with 8px-radius rows in Menu, Select, Suggestions and Trigger Menu. Good. Popover content pads about 16px and Dialog 24px. Good. Adopt as the rule: lists 6, panels 16, dialogs 24.
- Popup row height is 36 in Menu, Menubar, Trigger Menu and the toolbar select, and 40 in Command, Combobox and Autocomplete. Standard: 36 for text rows, 40 only when the row carries a swatch, skein or avatar. Command's icon-only rows drop to 36.
- Site cards. The header pads 16px (`.catalog-card__head`) and the stage pads 20px (`.catalog-card__stage`), so the number and the content are 4px out of line in every card. Set both to 20.
- Demo content insets inside cards vary from 20 to 173px because each demo sets its own width and the stage centres it. That is fine for centred single controls. It is not fine for form-like demos, which sit at 20 (Field), 30 (Segmented), 38 (Toggle), 49 (Switch), 52 (Checkbox), 54 (Rating). Standard: form-like demos take the full stage width at inset 20, capped at 248px in a single card. Single objects (a button, a trigger, the pagination) are centred.

Change: site, plus every batch's catalogue demo widths.

### 2.4 Focus

Two focus languages exist and both are good. They are applied unevenly.

- The ring. `outline: 2px solid var(--sadu-madder-ink)`. Offsets in use: 2px (32 rules), -2px (11), 3px (5), 1px (4), -1px (4), 6px, 4px, 0.
- The strip. On Input, Autocomplete and Combobox the border goes to ink and a dhurs strip beats in along the bottom edge. There is no ring. This is one of the best details in the library.

But Trigger Menu's editor, Command's input, the boxed Number Input (seen in the Popover), OTP cells and Token Input use the ring, while their siblings use the strip.

Standard:

- Anything you type prose or a value into takes the strip and no ring: Input, Textarea, Password, Autocomplete, Combobox, Date Input, Time Input, Date Picker field, Color hex, Number Input (boxed), Token Input, Trigger Menu editor, Command input. The strip is 5px, the border becomes 1.5px `--sadu-ink`.
- OTP keeps a per-cell signal. Make it the strip language too: the active cell gets the 1.5px ink border and its under-band weaves in. Drop the ring.
- Everything else takes the ring at exactly two offsets: `2px` outside for a control that stands alone, `-2px` for a row or item inside a clipped container. Remove 0, 1, -1, 3, 4 and 6.
- Add `--sadu-focus: 2px solid var(--sadu-madder-ink)` and a `.sadu-focusable` rule in `sadu.css` so batches stop restating it.

Change: all batches. Inputs and menus carry most of it.

### 2.5 Popup anatomy and cords

What is consistent: every popup uses `--sadu-float`, enters at scale 0.97 with opacity in 160ms and leaves in 100ms. Keep.

What differs:

| Popup | Top edge | Radius | Arrow |
| --- | --- | --- | --- |
| Menu, Menubar, Nav Menu, Trigger Menu, toolbar select | 4px cord inset 6 | 4 4 14 14 | none |
| Popover, Install prompt | 4px cord inset 6 | 14 all round | stepped dhalla triangle |
| Autocomplete, Combobox suggestions | 4px cord inset 6 | 14 all round | none |
| Date Picker | 22px band flush to the edges, clipped by the corner radius | 14 | none |
| Hover Card | none (the swatch is its material) | 14 | none |
| Dialog, Alert Dialog | 22px band inset 6 | 16 | n/a |
| Drawer | nothing | 0 | n/a |
| Tooltip, Toast | goat-hair tag with a woven edge or fringe | 6 (tooltip) | none |

Other drift inside popups:

- Highlighted row. Sand fill with no border in Menu, Select, Command. Sand fill plus a 1px edge border in Combobox and Autocomplete.
- Chosen mark. Madder eye at the start in menus, at the end in Select, Combobox and Listbox. That split is a fine convention. Write it down.
- Unchosen mark. Menu checkbox rows show a grey outline eye. Menu radio rows show nothing. Listbox shows a grey outline eye.
- Shortcuts. Plain text in Menu (`⌘D`), separate boxed key caps in Command, one boxed chip in Tooltip.
- Dividers. Camel teeth strips in Menu, a plain thread in Command and Date Picker.

Standard:

- Three tiers by how much the surface interrupts. Tooltip gets the 2px woven edge. Anchored popups get the 4px cord inset 6px. Modal sheets (Dialog, Alert Dialog, Drawer) and the Date Picker get a 22px band inset 6px with a 2px cloth radius. Date Picker's band stops running flush to the corners. Drawer gains the band across its top.
- Any popup with a cord uses radius `4px 4px 14px 14px` so it visibly hangs. Popover and Suggestions change. When the popup flips above its anchor (`data-side="top"`), the cord moves to the bottom edge and the radius mirrors. Check every cord popup for this.
- The cord always faces the anchor. Hover Card stays cordless.
- Highlight is `--sadu-sand`, radius 8, no border. Remove the border from Suggestions.
- Chosen is a 10px madder eye plus a 600 label. Start side in menus, end side in selects and lists. Unchosen is blank in menus and selects, and an outline eye only in Listbox, where every row is a visible checkbox.
- One `Kbd` part (below) for all three shortcut styles.
- Teeth strips separate groups in Menu and Menubar only. Everything else uses `Thread`.
- The stepped arrow belongs to Popover only. Its base should overlap the cord by 1px. Today it floats 2px above the popup and looks detached.

Change: overlays (drawer, popover), menus, inputs (suggestions), pickers (date picker).

### 2.6 Eye marks, sizes and colours

Two different objects are both called an eye.

- The stepped eye from `parts.tsx` (`Eye`, sizes 10, 15, 20). At 3x its floats are pills. `rx` is `float.height * 0.4`, which on a 3 by 2 float is nearly a full round. Next to the rectangular floats of the cloth it reads as beadwork, the fault the first review started with. It shows most in Rating, Listbox, Password and the avatar wasm.
- The lozenge, a CSS square rotated 45 degrees with rounded corners and a smooth edge, used for Pagination pages, Calendar and Date Picker selected days, and the Color Picker thumb. Each batch draws its own.

Colours in use for the stepped eye: madder (accordion and collapsible disclosure, listbox chosen, menu chosen, today, rating, avatar status, current step), ink (tree disclosure, done steps), `--sadu-ink-2` (waterfall disclosure, password toggle), grey outline (listbox off, menu off, future step), camel (date and OTP separators).

Standard:

- `Eye` floats get `rx={0.5}` at every size. One line in `parts.tsx`. This alone makes the eye and the cloth the same hand.
- Colour carries meaning. Madder means chosen, current or a value (checked, selected, today, rating, current step, status). Ink (`--sadu-ink-2`) means structure: open and closed in Accordion, Collapsible, Tree and Waterfall, and the password toggle. `--sadu-edge` means a separator or not yet. So Accordion and Collapsible disclosure marks change from madder to `--sadu-ink-2`.
- Sizes. 10 for inline marks and disclosure, 15 for a mark that is the control (listbox check, timeline step), 20 for rating. Closed is the single row of three floats, everywhere.
- A shared `Lozenge` part: 28px square (36px hit area), rotated 45deg, radius 3, 1.5px border in `--sadu-edge`. Chosen is `--sadu-madder-cloth` fill with a 1px inner line of wool at 55% inset 3px and wool text. Pagination, Calendar and Color Picker all use it.

Change: core (`Eye`), overlays, pickers, menus, display.

### 2.7 Wood

The gradient `#ead8b8, #b98d5b 50%, #7b5631` is pasted into sixteen rules in ten files, at 90deg in some and 180deg in others, with different edges and grain. The results differ:

- Loom Slider beater, Switch thumb, carousel rollers, file-input posts. Convincing.
- Toolbar beam. Its own four-stop gradient with a gloss. Convincing, slightly more polished than the rest.
- Number Input buttons. Square tiles shaded left to right with a grey edge. They look like brushed tiles from another kit.
- Menubar rod. A flat `border-bottom: 2px solid #b98d5b`. Not wood at all.
- Crop pegs. A radial gradient, the only round wood.

Standard. One recipe in `sadu.css`, used through the class or a mixin of custom properties:

```css
.sadu-wood {
  --sadu-wood-angle: 180deg;  /* light from above for anything wider than tall */
  border-radius: var(--sadu-radius-wood);
  background:
    repeating-linear-gradient(var(--sadu-wood-grain, 0deg), rgb(255 255 255 / 0.12) 0 1px, transparent 1px 6px),
    linear-gradient(var(--sadu-wood-angle), #ead8b8, #b98d5b 50%, #7b5631);
  box-shadow: 0 0 0 1px rgb(31 24 19 / 0.35), var(--sadu-contact);
}
.sadu-wood[data-upright] { --sadu-wood-angle: 90deg; --sadu-wood-grain: 90deg; }
```

- Upright pieces (beater, posts, rollers, scroll thumb, resize handle, drawer grip) light from the start side and run their grain along their length. Lying pieces (toolbar beam, menubar rod, stepper buttons) light from above.
- Number Input buttons take the lying recipe, lose the grey edge, and keep radius 3.
- Menubar rod becomes a real 4px wood bar with radius 2.
- Crop pegs keep the radial variant, defined once as `.sadu-wood[data-peg]`.
- A `WoodButton` part (36px, radius 3, pressed state darkens 8% and drops 1px) for Number Input, and for the carousel steps if pickers wants them on the beams.

Change: core (recipe), menus, inputs, pickers, display, overlays.

### 2.8 Weave levels, cell sizes and cloth drawn outside `Weave`

`Weave` has three levels: thread 10 by 4, cloth 8 by 3, stitch 6 by 2. Usage is 25 stitch, 9 cloth, 1 thread, and everything drawn through `Weave` is crisp.

The cloth that is not drawn through `Weave` is where a second hand shows:

- Warp Toggle pressed state: a CSS ribbed texture in two reds.
- Waterfall bars: a dotted CSS texture.
- Meter floats: rounded pills with a top highlight and a dark underside. These are beads.
- Color Picker area: a brick overlay.
- Button hem and Checkbox bevel: soft shadows.

Standard:

- Level by size of the piece. Thread for anything taller than 120px (hero, rug on the Loom page). Cloth for 33 to 120px (rug cards, carousel, dialog band at 22px uses stitch). Stitch for anything under 33px (swatches, bands in controls, cords).
- Small fills use a shared `.sadu-cloth-fill` background that tiles the same float as stitch level: 6 by 2 floats on the half-drop, 1px radius, thread shade from `--sadu-thread-shade`, colour from `--cloth`. Toggle, Waterfall and Meter adopt it.
- No highlights or bevels on floats. Meter floats become flat 8 by 4 rectangles with radius 1.

Change: menus (toggle), display (meter, waterfall), pickers (color area).

### 2.9 Chips, tokens and swatches

Chip shapes today: Combobox chips are full pills. Token Input chips are rectangles with radius 6. Trigger Menu has one of each in the same sentence (Hessa is a pill, Uwairjan is a rectangle).

Band swatches are drawn separately in Motif Select, Listbox, Command, Tabs, Nav Menu, Autocomplete, Token Input and Trigger Menu, at slightly different sizes (48 by 22, 44 by 20, 38 by 22).

Standard:

- One `Chip` part. 26px tall, radius 6, 1px `--sadu-edge` border, fill `color-mix(in srgb, var(--sadu-wool) 55%, var(--sadu-surface))`, 13px/500. A leading sample is a 16px skein, an 18px wasm avatar, or a band swatch 32 by 16. Optional remove button 16px.
- One `BandSwatch` part with three sizes: 32 by 16 (in chips), 48 by 22 (rows and triggers), 64 by 30 (cards), always stitch level, radius 2, and a 1px ring that appears only on a tent surface (2.11).
- One `SkeinDot` part for the small skein used in menus, Command, Combobox and chips, at 16 and 20px, cut from `SkeinRadio`.

Change: inputs, menus, pickers, core.

### 2.10 Motion timing

Popup timing is consistent, as above. Durations elsewhere have a long tail: 280ms (14 uses, five of them in Segmented Control, the rest in Pagination, Accordion, Date Picker, Toast and `sadu.css`), plus 135, 150, 170, 300, 360, 380 and 440ms scattered through Collapsible, Checkbox, Field, Input, File Input, Timeline and Scroll Area.

Standard. Add duration tokens next to the curves and use nothing else:

```css
--sadu-dur-press: 120ms;      /* hover, press, colour */
--sadu-dur-pop-in: 160ms;     /* popup enter, check */
--sadu-dur-pop-out: 100ms;
--sadu-dur-throw: 240ms;      /* indicator travel up to 80px */
--sadu-dur-throw-far: 320ms;
--sadu-dur-unroll-in: 320ms;  /* drawer, dialog, toast, accordion, collapsible */
--sadu-dur-unroll-out: 200ms;
```

280 becomes 240 or 320 by distance. Alert Dialog's 180ms thump stays as a named exception. The beat stays at 40ms per column, capped at 600ms in a control and 900ms in a band. I could not judge motion from stills, so each batch should record its two longest animations and check that nothing bounces and exits are faster than entrances.

Change: menus (segmented, pagination), overlays, inputs, pickers, display.

### 2.11 Tent parity

Tent is the better theme and it is not finished. `--sadu-black` and the wool colour are fixed values, so anything goat-hair on a goat-hair surface disappears. Seen:

1. Segmented Control. The selected capsule vanishes. Only its cord dashes float around the label. This hits the top bar, Preferences, the playground toolbar and every knob.
2. The goat-hair skein is an invisible disc in the top bar, Skeins, Preferences, Dialog and the Dye submenu.
3. Toast is goat hair on a goat-hair page. Its fringe is invisible.
4. Waterfall bars for goat-hair spans turn a muddy brown at well under 3:1.
5. Rug, Menubar band, carousel and swatches lose their outer edge where a black band meets the card.
6. Toolbar buttons stay day bone (`rgb(251 247 240 / 0.94)` is hard-coded) and glare on the beam.
7. Token chips are a grey-beige with dark text. They look pasted in from Day.
8. Command's highlighted row is barely darker than the popup.
9. Popups are `#2a211a` on `#1f1813` cards. With a 14% ring the menu and its submenu merge.

Standard:

```css
/* day */
--sadu-capsule: #1f1813;  --sadu-capsule-ink: #e6d9bf;
--sadu-cloth-ring: 0 0 0 0 transparent;
/* tent */
--sadu-capsule: #e6d9bf;  --sadu-capsule-ink: #1f1813;
--sadu-cloth-ring: 0 0 0 1px rgb(241 231 214 / 0.18);
--sadu-raised: #30261e;
--sadu-sand: #3d3026;
--sadu-float: 0 0 0 1px rgb(241 231 214 / 0.22), 0 18px 40px -14px rgb(0 0 0 / 0.7);
```

- `.sadu-float-highlight`, the Segmented thumb, Tooltip and Toast use `--sadu-capsule` and `--sadu-capsule-ink`. Code Block's line capsules and the cropper pill already flip correctly, which shows this is the right behaviour.
- Every `Weave` container, `BandSwatch` and skein takes `box-shadow: var(--sadu-cloth-ring)`.
- Waterfall goat-hair spans use `--sadu-capsule`.
- Toolbar buttons use `--sadu-surface`.
- Component CSS has about 90 hard-coded hex values. Image Cropper has 15, Toolbar 12, Toast 11, File Input 10. Each batch should replace every hex that is not wood or cloth with a token.

Change: core (tokens), then every batch.

### 2.12 RTL

Layout mirrors well. Sliders weave from the right, popups flip, the stepper swaps ends. The faults:

1. The page sets `dir="rtl"` and `lang="ar"` on English copy. Every sentence then puts its full stop at the wrong end (`.weaving of Kuwait and the Gulf`, `.is even. Use 11 or 13 12`, `of 5 eyes, from Hessa 4`), the at-sign jumps (`ui-sdk/react 0.1.0-beta.1@`), and `+2` becomes `2+`. Screen readers will read English with an Arabic voice.
2. Code Block is clipped at the start in RTL. Line numbers are gone and each line begins mid-token.
3. Time Input shows `pm 30 ◆ 04`. Hour and minute must keep their left-to-right order inside an RTL field. Have an Arabic reader confirm the expected order for the date segments too.
4. The top bar does not mirror at all.

Standard:

- RTL mode ships Arabic copy for the 56 demos, the masthead and the card names. That is the award-level answer and the only one that makes the RTL toggle worth pressing. Use the `ux-araby` skill and have a native reader approve it.
- Until then set `dir="rtl"` without `lang="ar"`, and put `dir="auto"` on demo text elements.
- Code is always `direction: ltr; text-align: left; unicode-bidi: isolate`, in Code Block and in the site's code panel.
- Numeric runs (time, counts, `+2`, versions, hex) are wrapped in `<bdi dir="ltr">`.
- The top bar mirrors with the page.

Change: site, display (code block), inputs (time input), every batch for copy.

### 2.13 Contrast and legibility

- Threads behind text. In Warp Toggle (unpressed) and the top bar's RTL and Still buttons, 1px threads run straight through the label. In File Input the threads meet the text line at mid-height, so "PDF or PNG, up to 10 MB" reads as struck through. Standard: text never shares a row with a thread. Either place text between threads with line-height equal to the thread pitch (Textarea already does this well), or give the label a 3px halo in the surface colour with `paint-order: stroke fill; -webkit-text-stroke: 3px var(--sadu-surface)`.
- Text on cloth. Wool text on the toggle's two-red rib and ink numerals on the calendar's camel band both pass because the cloth is low-contrast. Write the rule: text may sit on cloth only when the cloth's two colours are within 1.5:1 of each other and the text has a 2px halo of the cloth's ground.
- Primary button shadow. `0 6px 14px -6px rgb(118 21 15 / 0.6)` is a coloured glow, which the brief bans. Replace with `0 1px 2px rgb(31 24 19 / 0.22), 0 4px 8px -4px rgb(31 24 19 / 0.3)`.
- Required mark. The single madder float after a label reads as a stray hyphen ("Rows per band -"). Use a 10px madder `Eye` raised 3px, with the word "required" kept for screen readers.
- Meter colours. The "Madder" row is black, "Goat hair" is red. Colour is carrying status (enough, low, over) while the labels are dye names. Either rename the demo rows to things that are not colours, or put the status in a word and colour the floats by the dye.

Change: menus, pickers, inputs, display, site.

### 2.14 Edge stripes

I found none. No row, card, toast, alert, menu item or panel has a coloured bar, border or inset shadow down one side. The four one-sided rules in the CSS are structural 1px lines (the fell of the loom, the code gutter, the masthead title divider, the playground panel divider).

Three things are close enough to the ban that I would change them now:

1. Waterfall's "Eid" marker is a 1px madder vertical line through the whole chart. Make it a dashed `--sadu-edge` thread with a 10px madder eye and the label at the top.
2. Tree's child connector is a two-tone camel cord about 3px wide running down the side of the rows. Keep the knots. Make the vertical a 1px `--sadu-edge` thread.
3. Any future "selected row" or "status" treatment. Nothing should reach for a side bar. The sand capsule plus 600 label plus eye that Listbox and Tree use is the pattern.

### 2.15 Shared parts to add

All in `src/sadu/parts.tsx` and `sadu.css`, owned by core, before the batches make their passes:

| Part | Replaces |
| --- | --- |
| `Eye` with `rx={0.5}` | the bead eye everywhere |
| `Lozenge` | pagination pages, calendar days, colour thumb |
| `.sadu-wood`, `WoodButton` | 16 pasted gradients, number stepper |
| `BandSwatch` | 8 hand-rolled swatches |
| `SkeinDot` | skeins in menus, command, combobox, chips |
| `Chip` | combobox chips, token input tokens, trigger-menu chips |
| `Kbd` | menu shortcut text, command key caps, tooltip chip. 18px tall, min-width 18px, radius 4, 1px `--sadu-edge`, 11px/500 `--sadu-font-mono`, one cap per key |
| `PopupSurface` | the cord, radius, shadow, padding and enter/exit of Menu, Select, Suggestions, Trigger Menu, Popover, Nav Menu. Props: `band` (cord or 22px band), `arrow` |
| `IconButton` | 12 icon buttons at 6 sizes. Sizes 28 and 36 only |
| `.sadu-cloth-fill` | toggle rib, waterfall dots, meter pills |
| Tokens | heights, radii, durations, capsule, cloth ring, focus |

---

## 3. Every component

Format: verdict, what to keep, numbered fixes ranked by impact. System fixes from section 2 are named by their number and not repeated in full.

### Core

#### Rug
Keep. The crisp floats, the half-drop, the bare warp continuing each band's colour past the fell, the mirrored bands around a seeded Shajarah. This is the reference for everything else.
1. Tent: add `--sadu-cloth-ring` so the black bands keep an edge (2.11).
2. The fell line is `1px rgb(31 24 19 / 0.55)`. In Tent it disappears. Use `--sadu-edge`.
3. The home card stacks rug, slider, select and button at 616px. Fine as the feature card, and it already fits the 2-row module.

#### Loom Slider
Keep. Still the best single idea in the library.
1. Give the beater a 44px hit area and confirm the focus ring sits on the beater at 2px offset, not on the track.
2. Readout unit "rows" at 12px `--sadu-ink-2` is right. Apply the same readout to Progress and Number Input (2.1).

#### Motif Select
Keep. This is the popup reference.
1. Adopt `PopupSurface` and `BandSwatch` so other popups can match it exactly.
2. Long names truncate ("Dhurus al..." on the Loom page at 270px). Let the Arabic name drop first, then truncate the Latin.

#### Skeins
Keep. The twisted-yarn discs are convincing at 28px.
1. Tent: the goat-hair skein needs the cloth ring (2.11).
2. The selected ring is a 2px ink ring with a 2px gap. In Tent use `--sadu-ink`, which is wool. Check it is not hard-coded.
3. Extract `SkeinDot` (2.9).

#### Switch
Keep. Cloth for on, bare warp for off, wood thumb. Reads at a glance.
1. Disabled uses opacity and looks washed. Use the dashed-thread rule: a 1px dashed `--sadu-edge` outline and no opacity change on the cloth above 60%.
2. Take wood from the shared recipe, upright (2.7).

#### Tabs
Polish.
1. The indicator is a three-row band that reads well. Its travel time should be `--sadu-dur-throw`, 240ms up to 80px.
2. In RTL every tab is 16px/500, so the active tab loses its 600 weight and the Latin labels grow (`.sadu-tabs:lang(ar) .sadu-tabs__tab`). The Arabic rule is hitting Latin text because the page sets `lang="ar"`. Fixed by 2.12, and the active tab should stay heavier than the rest in Arabic too (700 against 500).
3. Check the hover state. A tab should show `--sadu-sand` at radius 8 behind its label, the same as a menubar trigger.

#### Eye Rating
Keep. Eyes threaded on a warp, with a knot for the unrated place.
1. `Eye` float radius (2.6). This is where the beads are most visible, at 20px.
2. On hover, preview the eyes up to the pointer in `--sadu-madder-ink` at 45% so the control invites the click.

### Overlays

#### Dialog
Keep. The 22px band inset 6px, the serif title, the primary button with a woven hem. The band taking the motif being edited is exactly right.
1. Tent: skein ring, and confirm the backdrop is goat hair at 48% with no blur.
2. Footer buttons are 36px. The Popover's "Done" and the install prompt's buttons are 28px. Rule: 36 in dialogs and drawers, 28 in popovers.
3. Detail page idea text is stale (section 4).

#### Alert Dialog
Keep. The band that is half cloth and half bare warp with one madder thread is the strongest overlay idea. Do not touch the concept.
1. The panel is 420px wide and Dialog is 480px. Keep both, but name them (`--sadu-dialog-sm: 420px`, `--sadu-dialog: 480px`).
2. The catalogue trigger says "Cut from the loom" and the gallery says "Unravel band". Use one demo.
3. The 180ms thump is the one duration outside the scale that DIRECTION asked for. Keep it and name it `--sadu-dur-thump`.

#### Drawer
Rework the open state. Closed-to-open as an unrolling rug is a good idea. Once open, the drawer is a plain bone sheet with a 90px wood grip, and it is the only modal surface with no cloth.
1. Add the 22px band inset 6px across the top, in dhurs, so Dialog, Alert Dialog and Drawer are one family (2.5).
2. Keep the wood grip. Make it 120px tall, centred on the edge, with a 44px hit area and `cursor: grab`. A grip is a handle and not a stripe. Do not run wood or cloth down the full edge.
3. The body leaves 560px empty below the list. Put the order's rug in the drawer at cloth level, 96px tall, above "Bands".
4. Give the sheet a 16px radius on its two inner corners to match Dialog.

#### Popover
Polish.
1. Radius becomes `4px 4px 14px 14px` and the arrow overlaps the cord by 1px (2.5).
2. The Number Input inside it is the boxed variant with a madder ring, and the catalogue shows the unboxed tally variant. Name the two variants and give the boxed one the strip (2.4).
3. The trigger's pressed state is a sand fill. Good. Apply the same to Menu and Date Picker triggers, which already do it.

#### Hover Card
Keep. A swatch with pinked edges, the Latin and Arabic names, one line of gloss. Perfect scale.
1. The trigger's dotted underline turns madder while open. Make the resting underline `--sadu-edge` dotted 2px at offset 4px so it differs from the stitch underline used for search matches.
2. The card opens over the next line of the sentence. Offset it 8px from the baseline.

#### Tooltip
Keep. A goat-hair tag with a madder and wool woven edge facing the trigger.
1. Tent: use `--sadu-capsule` (2.11).
2. Shortcut uses `Kbd` (2.5).

#### Toast
Keep. Fringe at the cut end, a madder timer thread that frays, a two-float broken mark for errors, a stack that peeks.
1. Tent: flip to `--sadu-capsule` so the toast and its fringe are visible (2.11).
2. The fringe reaches 25px from the viewport edge at 1280. Inset the toast region 32px so the fringe never clips.
3. Timer colours. Success uses a madder and wool woven thread, error a plain madder thread with a fray. Good. Document that the thread is the only timer and that hover pauses it.

#### Preferences
Keep. A sampler on the loom whose bands are woven by the settings below it.
1. It depends on Segmented Control and Skeins, so it inherits the Tent failure. After 2.11, re-shoot it in Tent.
2. The panel is a bordered card inside the catalogue card. Drop the inner border on the home card and let it sit on the card surface.
3. "Reset" is a 13px madder text button. Madder text is reserved for destructive actions and links. Use a ghost small button in ink.

#### Collapsible
Polish.
1. Disclosure marks move from madder to `--sadu-ink-2` (2.6). Title weight to 600 (2.1).
2. Trigger is 60px tall with radius 14, and Accordion's is 48px with radius 8. Make the collapsible header 48px. The folded band under it supplies the height.
3. The folded edge band is the idea. Make sure it is `BandSwatch` cloth at stitch level and takes the item's own motif, as the gallery demo does. The catalogue demo shows the same band on all three.

#### Accordion
Polish.
1. Disclosure marks to `--sadu-ink-2` (2.6).
2. The gallery version carries a motif swatch per stage, bare warp until opened and then woven in. The catalogue version has no swatches and loses the idea. Use the gallery demo in the catalogue.
3. The open item's madder cord under the trigger is fine. Keep it horizontal and under the trigger only.
4. 280ms becomes `--sadu-dur-unroll-in` 320ms in, 200ms out.

### Menus

#### Button
Keep. A madder face with a woven hem, squared bottom corners.
1. Replace the coloured glow shadow (2.13).
2. Small size radius 8 becomes 6. Icon size stays 36.
3. The ghost variant ("Preview") has no resting affordance beside an outline button. Give it `--sadu-sand` on hover and a 1px `--sadu-line` at rest in button groups.
4. Show the pending state (the beater weaving the hem across) in the catalogue card. It is the idea and nobody sees it.

#### Toggle
Polish.
1. Unpressed threads strike through the label (2.13). Use the halo.
2. Radius 8 becomes 10 (2.2).
3. The pressed rib is CSS. Move it to `.sadu-cloth-fill` at stitch level (2.8).
4. Disabled "Lock" is ink-3 text over threads. Make the threads dashed, per the "cannot" rule, and remove them behind the label.

#### Segmented Control
Keep. The thumb as a short woven band with a cord top and bottom.
1. Tent: the thumb vanishes (2.11). Highest-impact fix in this batch.
2. Five uses of 280ms become 240ms (2.10).
3. Image Cropper should use this component (2.2).

#### Menu
Keep. Cord, eyes for chosen, teeth strips between groups, skeins in the Dye submenu.
1. Trigger weight 600 and built from `SaduButton` (2.1).
2. Shortcuts use `Kbd` (2.5).
3. Unchosen checkbox rows show nothing (2.5).
4. Tent: popup surface and ring (2.11). The submenu currently merges with its parent.
5. Teeth strips are camel on bone at low contrast. Raise them to `--sadu-edge`.

#### Menubar
Polish.
1. The rod becomes real wood, 4px, from the shared recipe (2.7).
2. Trigger height 32 becomes 36.
3. The popup's cord sits flush against the rod. Good. Check it stays flush when the menubar wraps.

#### Navigation Menu
Keep. A madder eye rides the cord under the open section.
1. Triggers are 500. They are navigation choices, so 500 is right by 2.1. Add the 600 weight on the open one.
2. Its CSS has 14 tent-specific rules, the most of any component. Most should disappear once the tokens in 2.11 exist.
3. The catalogue card is three links in 300px. Show the popup as a specimen (section 4).

#### Command
Keep. The inline panel is the best-looking card on the page. The wood caret and the stitched matches are lovely.
1. Rows drop to 36px unless they carry a swatch or skein (2.3).
2. Input takes the strip. The ring around the whole panel goes (2.4).
3. Typing "mad" ranks "Order 14, majlis divider" (m, a, d as a scattered subsequence) above "Madder skeins". Rank contiguous and prefix matches first.
4. Tent: highlighted row contrast (2.11).

#### Trigger Menu
Polish.
1. Chips use `Chip`. One shape (2.9).
2. Editor takes the strip (2.4).
3. The "@" with a stitched underline and the list hanging from it by a thread is the idea. Draw the thread: a 1px `--sadu-edge` line from the caret to the popup's cord, 6px long.

#### Toolbar
Keep. A beam lashed at both ends carrying the tools. Bold and it works.
1. Tent: buttons stay day bone (2.11).
2. It overflows its card at 390px and clips. Wrap to two rows of tools under 520px, or scroll inside the beam with the lashings fixed.
3. Take the beam from the shared wood recipe so the Number Input buttons and the beam match.
4. Toolbar toggles inherit the toggle fixes.

#### Pagination
Polish.
1. Pages use the shared `Lozenge` (2.6).
2. Previous and next are small camel arrows. Calendar and Carousel use Lucide chevrons. Use Lucide `ChevronLeft` and `ChevronRight` at 16 in 36px icon buttons everywhere.
3. The woven band under the pages up to the current one is the idea and it lands on the centre of the current page. Keep that alignment when the lozenge changes size.
4. 280ms becomes 240ms.

### Inputs

#### Input
Keep. The dhurs strip beating in on focus from the reading side.
1. This is the focus language for all text entry (2.4). Publish the strip as a shared class so other batches stop restating it.
2. The underline-only variant ("Order") has no strip in the stills. It should take the same strip in place of its underline on focus.
3. The clear button is 28 r6. Correct, and the reference for in-field icon buttons.

#### Field
Polish.
1. Required mark becomes a raised 10px madder eye (2.13).
2. The frayed-thread error mark is good. Use it in Toast errors and File Input errors as the one error mark.
3. Disabled is a dashed border on sand. Correct. Make it the documented disabled treatment for every field.

#### Number Input
Polish.
1. Wood buttons from the shared recipe (2.7).
2. The tally starts 47px in and ends at 192px, and the value is not centred over it. Run the tally from the inner edge of one button to the inner edge of the other and centre the value.
3. Two variants exist, tally and boxed. Name them (`variant="tally" | "field"`) and show both in the gallery.
4. In the props panel on detail pages, three tally inputs in a row with different tally lengths look noisy. Knobs should use `variant="field"`.

#### Password Input
Keep. Eyes for hidden characters, the closed eye as the toggle.
1. `Eye` radius (2.6).
2. Toggle 32 r7 becomes 28 r6.
3. The eyes are madder. Madder means a value here, so this is right. Keep.

#### Textarea
Keep. Text sitting on ruled threads and a count band that weaves toward the limit.
1. Tent: the band's goat-hair floats vanish and it reads as white dashes. Use `--sadu-capsule` for the dark float.
2. Show the over-limit state (madder teeth) in the gallery.
3. This is the model for text over threads. File Input should copy it.

#### OTP Input
Keep. Bare vertical warp for empty cells, a strip woven under each digit.
1. Focus by strip, not ring (2.4).
2. The invalid state outlines all six cells in madder. Enough. Keep.

#### Token Input
Polish.
1. Tokens use `Chip` (2.9).
2. Tent: chip fill and text (2.11).
3. Editor takes the strip.

#### Autocomplete
Polish.
1. Bug. Arrowing to a suggestion fills the field with `Shajarahشجرة`, the Latin and Arabic names run together. Pass an explicit string value per item.
2. Highlight loses its 1px border (2.5).
3. Popup radius `4px 4px 14px 14px` (2.5).

#### Combobox
Polish.
1. Chips use `Chip` (2.9). The full pill goes.
2. Same highlight and radius fixes as Autocomplete.
3. The single-select card is a plain field with a chevron. Put the chosen motif's `BandSwatch` in the field, as Motif Select does, so the card shows cloth at rest.

#### Date Input
Keep. Eye separators and a goat-hair float on the active segment.
1. Date Picker's field shows `11/28/2026` with slashes. One date field style in the library: eye separators in both.
2. Arabic label size and weight (2.1).
3. Tent: the active-segment float uses `--sadu-capsule`.

#### Time Input
Polish.
1. RTL segment order (2.12).
2. The day band under the field (24 floats, the hour in madder) is a good idea drawn at an arbitrary 145px. Make it the field's full width, or move it inside the field's bottom edge like the focus strip.
3. The gap before "pm" has no eye and is wider than the others. Use a 6px gap and no eye before the period.

### Pickers

#### Calendar
Keep. The range woven as a camel band, cut with fringe where the week wraps, with madder lozenges at each end. The best new piece since the first round.
1. Under 560px it still shows two months side by side. Weekday names collide and December is clipped. Show one month under 560px.
2. Day lozenges use the shared `Lozenge` (2.6).
3. Today's eye sits directly under the numeral, where the range band is drawn. Check a range that includes today. If they collide, move the eye to the cell's top end corner.
4. Detail page idea text still says "a thread between two knots" (section 4).

#### Date Picker
Polish.
1. Band inset 6px with a 2px radius. It runs flush and is clipped by the corner today (2.5).
2. The popup starts about 50px to the start side of its field. Align its start edge with the field's.
3. Field uses eye separators (see Date Input).
4. "Clear" and "Today" are madder text. Make them ghost small buttons in ink. Madder text is for destructive actions and links.
5. The presets column is good. Its highlighted row uses the standard sand highlight.

#### Color Picker
Polish.
1. Thumb uses `Lozenge` (2.6).
2. The area's brick overlay should be `.sadu-cloth-fill` at stitch level so the mixer is cloth and not bricks (2.8).
3. Hex field 36 becomes 40 and takes the strip.
4. The hue track is a plain rainbow with a wood thumb. Draw it as 24 dyed threads side by side, each 1 float wide, so it matches the skeins.

#### File Input
Polish.
1. Threads strike through both lines of text (2.13). Place the two lines between threads at a 24px pitch.
2. Finished files show a goat-hair and wool cord, and files in progress show a madder cord with a tiny beater. Good. In Tent the finished cord's dark floats vanish. Use `--sadu-capsule`.
3. Remove button r7 becomes r6.
4. Ten hard-coded hex values. Move to tokens.

#### Image Cropper
Polish.
1. Aspect chooser becomes `SaduSegmentedControl` (2.2).
2. At 390px the image and the toolbar overflow the card. The canvas needs `max-width: 100%` and the toolbar needs to wrap.
3. Pegs and thirds as wool threads are right. Give corner pegs a 28px hit area.
4. Fifteen hard-coded hex values.

#### Listbox
Keep. Chosen bands join into one sand run with a madder eye each.
1. `Eye` radius (2.6). The outline eye for unchosen rows is at its worst here as a cluster of hollow pills.
2. Swatches use `BandSwatch`.
3. Show reordering by drag if the UI SDK supports it. A list of bands in a piece wants to be reordered and it would show the wood grip idea.

#### Tree
Polish.
1. Connector becomes a 1px thread with knots (2.14).
2. The home card leaves 234px empty above the tree because the card is tall. Expand one more level in the demo, as the gallery does.
3. Disclosure marks are ink. Correct, and the reference for 2.6.

#### Checkbox
Polish.
1. Remove the bevel (`inset 0 -2px 3px rgb(0 0 0 / 0.18)`). Flat madder with the stepped check in wool.
2. The check is five floats in a tick. Good. Make indeterminate the closed eye (three floats in one row), which it already nearly is. Align it to the same grid as the tick.
3. Unchecked is an empty rounded box. Put three bare warp threads in it at 20% so "not yet" reads the same as the Switch and Toggle.

#### Carousel
Keep. Rugs wound between two beams.
1. Caption clips at 390px.
2. The indicator, four floats between two lines, is cryptic at 1x and its targets are 24px. Make each float 12 by 5 with a 28px hit area and put the current one in madder at double length.
3. The disabled step at the first slide is a pale chevron. Use the dashed treatment or hide it.

### Display

#### Avatar
Rework the demo, keep the component. The wasm (a family brand woven from the name) is a strong idea, and the status eye in a notch is good.
1. The photos are stock portraits of young women in Western dress captioned "Umm Saad, master weaver". A Gulf audience will see that at once. Lead with wasm avatars, and for photos use hands at the loom or cloth close-ups you have rights to.
2. `Eye` radius affects the wasm floats too (2.6).
3. Avatar radius 4 for squares is right for a woven mark. Keep.
4. `+2` in RTL (2.12).

#### Separator
Polish. It is the least developed piece.
1. The labelled separator ("or") is a thread with a word. Tie a knot: a 10px `--sadu-edge` eye either side of the label, 8px from it.
2. The gallery has a cord variant between major sections that the catalogue card does not show. Show it.
3. Vertical separator (the one before "Deposit paid") should be the same `Thread`.

#### Progress
Keep. Cloth woven up to a beater with bare warp ahead.
1. The home card puts it at the bottom of a 430px card with 150px empty above. Fixed by the module in section 4.
2. The indeterminate variant (a patch of cloth shuttling across the warp) is in the gallery only. Show it in the catalogue as a knob.
3. Share the readout style with Loom Slider (2.1).

#### Meter
Rework the rendering. Counted floats is the right idea. The floats are drawn as glossy pills.
1. Flat floats, 8 by 4, radius 1, no highlight (2.8).
2. Fix the colour and label clash (2.13).
3. Draw two rows on the half-drop, so 20 skeins is 2 rows of 10. It then reads as a strip of cloth and not an LED bar.

#### Scroll Area
Keep. A wood thumb on one thread.
1. Rows wrap badly in the single card ("Order 14," then "Umm Saad"). Give the demo `min-width: 0` on the title column and let the status drop under the title below 260px.
2. Wood from the shared recipe, upright.

#### Resizable
Keep. A thread that becomes a wood beam when you reach for it.
1. The handle is 4 by 26. Give it a 24px hit area and show the grown state on focus as well as hover.
2. Tent: cloth ring on the pane's cloth.

#### Timeline
Keep. Eyes for done, a larger madder eye for now, a dashed thread for what is to come.
1. `Eye` radius.
2. The home card has 170px empty above the list. Fixed by the module.
3. Dates are right-aligned 13px `--sadu-ink-2`. Good. Set them `tabular-nums`.

#### Waterfall
Polish.
1. Eid marker (2.14).
2. Tent: goat-hair bars (2.11).
3. At 390px the axis labels pile up and bars shrink to dots. Give the chart `min-width: 640px` inside a scroller with the label column sticky.
4. Bars use `.sadu-cloth-fill` (2.8) and are 12px tall so one float row pair fits.
5. The selected bar shows a black ring with a white gap. Use the standard focus ring at 2px offset.

#### Code Block
Keep. The cord on top, line numbers behind a thread, highlighted lines as goat-hair capsules.
1. RTL clipping (2.12). Highest priority here.
2. The block cuts off mid-line at its max height ("15 )" sliced in half). End on a whole line and add a 32px fade to the surface colour.
3. Tabs are 26px tall with radius 8. Use the compact size, 28 r6.

---

## 4. The site

Judged against spec-01. Fixes ranked within each part.

### Card grid rhythm

spec-01's craft is one module repeated without exception. Sadu's grid uses `grid-auto-rows: minmax(300px, auto)` with `grid-auto-flow: row dense`, which gives card heights of 300, 316, 322, 353, 377, 388, 397, 409, 430, 616, 632, 693, 766 and 768, and reorders cards so the numbers read 24, 25, 28, 26, 27 and 35, 38, 36, 37.

1. Fix the module. `grid-auto-rows: 300px` with a 16px gap, and cards span 1 or 2 rows only (300 or 616). Every demo fits its card or scrolls inside it. No `auto`.
2. Remove `dense`. Order the catalogue by hand so numbers ascend in reading order with no holes at 4, 3 and 2 columns. `/tmp/sadu-tools/pack.py` already checks this.
3. Fit demos to the module. The offenders are Field and Toast row (388), Accordion (397), Calendar row (409), Code Block row (430), Listbox row (632), Tree (693), Preferences (766), Timeline (768). Trim copy or move to a 2-row card.
4. Add six family rows. A full-width row 44px tall with the family title in `--sadu-font-display` 20px/600, the number range in mono 12px, and a thread. It gives 56 cards some wayfinding and resets the packing per family.

### Card headers

1. Header inset 16 becomes 20 to line up with the stage.
2. The whole header should be the link target, with a hover state: the rule thread turns `--sadu-edge` and a 10px outline eye appears at the end. Today only the name is a link and nothing says the card leads anywhere.
3. Bring back the one-line idea. The gallery cards carry it ("Bare warp and one madder thread, where cloth used to be") and it is the best copy on the site. Put it in the card as a 12px `--sadu-ink-2` line that appears on hover or focus at the bottom of the stage, or always on 2-row cards.

### Trigger-only cards

Dialog, Alert Dialog, Drawer, Popover, Toast, Tooltip, Menu and Navigation Menu are each one outline button in a 300px card. Eight cards in a row look the same, and they hide the eight best ideas. Command shows its panel inline and is the best card on the page.

1. Show a specimen. Render the overlay's real content inline in the card, `inert` and `aria-hidden`, scaled to fit (Dialog at 0.6, Toast and Tooltip at 1.0, Menu at 0.8). Clicking the specimen opens the live one. The Alert Dialog's unravelled band and the Toast's fringe are then visible on first paint.

### Masthead

1. The right half of the masthead is 600px of empty black. Put the loom there. Bare warp runs from the end of the copy to the viewport edge, the hero rug is woven to 62% at thread level, and a wood beater can be dragged. Changing the dye in the top bar re-weaves it. This is the one place the page may weave on load, at 1300ms.
2. Latin "Sadu" is 72px serif and Arabic is 80px with a 1px divider. Good pairing. Keep it until the woven wordmark exists.
3. The woven wordmark in square Kufic from DIRECTION is still open and still needs an Arabic reader to draw it. If it lands, it replaces the set type here only.
4. The selvedge band under the masthead is 33px of dhurs at cloth level and is right. Keep it.

### Top bar

1. It holds four control styles in 300px (skeins, a segmented control, two warp toggles) and a mono nav with eyes. That is acceptable. It mirrors spec-01's colour dots and nav. Fix the two faults: the RTL and Still labels are struck through by threads (2.13), and in Tent the Day and Tent segment has no visible thumb (2.11).
2. At 390px the bar is 150px tall in three rows. Collapse the settings into one row: skeins, then a single 36px button that opens a popover with Theme, RTL and Still.
3. Mirror the bar in RTL.

### Page ground and colophon

1. spec-01 has a paper grain under everything. The Sadu page is flat `#eadfcb`. Add a ground of undyed warp: `repeating-linear-gradient(0deg, rgb(31 24 19 / 0.02) 0 1px, transparent 1px 3px)` on the page only, never on cards.
2. The page opens with a cord and ends with a hairline and two lines of text. End it with the fringe: the selvedge band again, full bleed, with `Fringe` under it, then the sources as links (Al Sadu Society, Sadu House, the UNESCO listing, Crichton, Canavan).
3. Site card radius is 14 on home and 22 in the galleries, Loom and Bench. Use 14 everywhere.

### Detail page

The bones are good: breadcrumb, number, a 72px serif title, the idea as a serif lede, a playground with a props panel, install, source.

1. Stale ideas. The ledes were not updated when the expressive concepts came back. Number Input says "A wood stepper: the one part of the field you press and hold", Calendar says "a range is a thread between two knots", Dialog says "a stitch band of the motif being edited". Use the gallery captions, which describe what is on screen. Keep one source of truth for `idea`.
2. One demo per component. The galleries and the catalogue have different demos (accordion with and without swatches, "Unravel band" and "Cut from the loom"). Make the catalogue import the gallery demo, or retire the gallery routes.
3. The stage is the page colour `#eadfcb`. Every component was tuned on bone. Make the stage `--sadu-surface` and divide it from the props panel with a thread.
4. Stage alignment. Number Input sits at the start edge and Dialog and Calendar are centred. Centre everything, max-width 560px.
5. It needs four short sections under the playground to be a real reference: States (every state side by side, static), Keyboard (a two-column table), Anatomy (the parts and their `data-slot` names), Usage (a 10 to 20 line snippet, not the whole source file).
6. The playground's Day, Tent, LTR and RTL toggles look identical to the top bar's and sit 300px below them. Label the group "Stage" in mono 12px so it is clear they affect the stage only.
7. "Reset" is a sand-filled button with an icon, unlike any other button on the site. Use a ghost small `SaduButton`.

### Code panel

1. The file tabs overflow to the right and end in a clipped letter. Add a 32px fade at the end and scroll the active tab into view.
2. The code stops at 27 lines with a hard cut. Add a fade and a "Show all N lines" ghost button on a thread.
3. The install command prints `http://localhost:5191/r/...`. Build it from a configured public origin.
4. Force LTR (2.12).
5. Copy feedback. On copy, the cord above the panel should beat once across and the icon swap to a 10px madder eye for 1200ms.

### Install prompt

1. It works and looks right: a popover in Tent with a cord and the stepped arrow. The prompt is four lines. Add the two lines an agent needs: which components exist (link to `registry.json`) and the theme and direction attributes.
2. Buttons are 28px, right for a popover. Give "Copy" the same beat feedback as the code panel.
3. It opens over the selvedge and the first row of cards. Set its max-height so it ends above the cards at 900px viewport height, or anchor it to the end side.

### Loom page and Bench

1. Loom and Bench overlap. Both are a rug, a motif select, skeins, a slider and an RTL tabs tile. Bench adds nothing. spec-01's nav has seven working demos (Player, Paint, MIDI, Timer, Color, Photo, Dashboard), and that is what convinces people the kit is real.
2. Replace Bench with compositions that use 15 or more components each on one screen: an order desk (Tree of orders, Waterfall, Timeline, Meter, Drawer for an order, Toasts), a pattern drafter (a float grid you paint to design a motif, with Toolbar, Color Picker, Loom Slider, Menubar, Command), and a dye shed (inventory with Listbox, Number Input, Combobox, Date Picker, Dialogs).
3. Loom page. The "Six bands" tile cuts its sixth band at the bottom. The rug starts at the card's edge while the text is inset 28px. The big "11" is sans at 96px and should be display serif, or better, woven numerals 11 rows tall. Card radius 22 becomes 14.

### Mobile (390px)

Five overflow bugs, all visible in `/tmp/sadu-tools/f2/home-390-*.png`:

1. Toolbar clips at the card edge.
2. Calendar shows two squeezed months.
3. Image Cropper canvas and toolbar run off the card.
4. Carousel caption clips.
5. Waterfall axis collapses.

Also:

6. The page is 18,735px tall. Trigger-only cards keep `min-height: 180px` around one button. With specimens they earn the height. Without, drop to 120px.
7. Detail page install line clips with no scroll hint. Add the end fade.

---

## 5. Ranked punch list

| # | Fix | Owner |
| --- | --- | --- |
| 1 | Tent: add `--sadu-capsule`, `--sadu-capsule-ink`, `--sadu-cloth-ring`, raise `--sadu-raised` and `--sadu-sand`. Segmented thumb, tooltip, toast, float highlight, skeins and all cloth containers use them (2.11) | core, then all |
| 2 | Catalogue grid on a fixed 300 / 616 module, `dense` off, numbers in reading order, demos trimmed to fit | site |
| 3 | `Eye` floats to `rx={0.5}`. Publish `Lozenge`. Disclosure marks to `--sadu-ink-2`, madder only for chosen and value (2.6) | core, overlays, pickers, menus |
| 4 | RTL: stop setting `lang="ar"` on English, add `dir="auto"` now, then ship Arabic demo copy. Force LTR on code. Fix time segment order and `+2` (2.12) | site, display, inputs, all |
| 5 | Overlay cards show an inline specimen of the open state (Dialog, Alert Dialog, Drawer, Popover, Toast, Tooltip, Menu, Nav Menu) | site, overlays, menus |
| 6 | Threads never cross text: Warp Toggle, top bar toggles, File Input drop zone (2.13) | menus, pickers, site |
| 7 | One wood recipe in `sadu.css`. Delete the 16 copies. Number Input buttons and Menubar rod become real wood (2.7) | core, inputs, menus, pickers, display, overlays |
| 8 | Focus rule: the strip for everything typed into, the ring at 2px or -2px for everything else (2.4) | inputs, menus, pickers, all |
| 9 | Mobile overflow: Toolbar, Calendar, Image Cropper, Carousel caption, Waterfall | menus, pickers, display |
| 10 | Masthead: live loom in the empty right half, re-woven by the dye | site |
| 11 | Popup anatomy: `PopupSurface`, cord popups at `4px 4px 14px 14px`, Date Picker band inset 6px, Drawer gains the band, highlight without a border (2.5) | core, overlays, inputs, pickers, menus |
| 12 | Detail pages: one source of truth for `idea` and for demos. Fix the stale ledes (Number Input, Calendar, Dialog and any others) | site |
| 13 | Avatar demo: replace stock portraits with wasm marks and loom photography | display |
| 14 | Height and radius tokens. Icon buttons to 28 r6 or 36 r10. Toggle radius 10. Color hex 40. Cropper uses Segmented Control (2.2) | core, menus, inputs, pickers, display |
| 15 | `Chip`, `BandSwatch`, `SkeinDot`, `Kbd` shared parts, adopted in Combobox, Token Input, Trigger Menu, Menu, Command, Tooltip (2.9, 2.5) | core, inputs, menus, overlays |
| 16 | Meter: flat floats on the half-drop, and fix the colour and label clash | display |
| 17 | Autocomplete fills the field with `Shajarahشجرة`. Command ranks scattered matches above prefix matches | inputs, menus |
| 18 | Replace Bench with three real compositions. Fix the Loom page's clipped tile and numeral | site |
| 19 | Primary button: remove the coloured glow. Checkbox: remove the bevel | menus, pickers |
| 20 | Durations to tokens. 280ms and the off-scale tail go (2.10) | core, menus, overlays, inputs, pickers, display |
| 21 | Detail page: stage on `--sadu-surface`, centred. Add States, Keyboard, Anatomy, Usage. Code panel fades, expand, public origin | site |
| 22 | Waterfall Eid marker to a dashed thread with an eye. Tree connector to a 1px thread with knots (2.14) | display, pickers |
| 23 | Type weights: menu trigger 600, collapsible title 600, typed values 400, Arabic labels 14px/600 (2.1) | menus, overlays, pickers, inputs |
| 24 | Replace every non-wood, non-cloth hex in component CSS with a token. Image Cropper 15, Toolbar 12, Toast 11, File Input 10 | pickers, menus, overlays |
| 25 | Page ground of undyed warp, a fringe to close the page, card radius 14 on every route, family rows in the grid, card header inset 20 with a hover state and the idea line | site |
