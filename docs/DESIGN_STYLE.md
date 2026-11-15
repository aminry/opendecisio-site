# Design style guide

One look for the home page, the feature pages and every documentation page.
The docs already used this palette, type scale and three-column frame in dark mode.
This guide fixes the rest: framed code and tables, one callout, looping figures and short pages.
Numbers below were measured from the approved target and are the source of truth.

## Principles

1. **Dark, quiet, one accent.** Black page, navy panels, amber for the one thing to look at.
2. **Structure carries the page.** Rules, mono labels and panels do the work that decoration usually does.
3. **Code and tables are first-class.** They are framed objects, never raw blocks.
4. **Motion explains.** A diagram loops to show a process.
   It never decorates, and it always has a complete still state.

## Palette (tokens)

| Token | Value | Use |
| --- | --- | --- |
| `--black` | `#000000` | Page background |
| `--prussian` | `#14213d` | Panels, table headers, code background (mixed with black) |
| `--panel` | `#0b1221` | Code, table and diagram surfaces |
| `--text` | `#e5e5e5` | Body text |
| `--text-strong` | `#ffffff` | Headings, bold, inline code |
| `--text-dim` | `#e5e5e5` at 70% on black | Secondary text, table headers, captions |
| `--accent` | `#fca311` | Links, active nav, code labels, callout bar, primary button |
| `--steel` | `#8fb3d9` | Second diagram series, "the model" side of a diagram |
| `--line` | text at 12% | Hairlines, table row rules, inline code border |
| `--line-strong` | text at 24% | Buttons, inputs |

Rules:
- Amber is used for exactly one meaning per view: "the thing you act on".
- Never use red or green as decoration.
  Errors and "wrong" cases may use a muted red, always with a text label.
- Text on amber is black.
- Contrast stays at or above 4.5:1 for body text and 3:1 for large text and UI.
  `scripts/checks/contrast.mjs` enforces it.
- A light theme remains available.
  It maps the same tokens to a warm white page with navy text and a darker amber for links.
  Dark is the default.

## Typography

Fonts: Geist for text, Geist Mono for code and labels.
Both are already installed.

| Element | Spec |
| --- | --- |
| Prose (paragraphs, list items) | 19px / 1.6, weight 400, 18px between paragraphs, 6px between list items |
| UI text (sidebar, tables, captions, figure text) | 14.5px to 17px |
| Lead (the page description under the title) | 19px / 1.6, one sentence or two, never repeated by the first paragraph |
| `h1` | 50px / 1.06, weight 700, letter-spacing -0.035em, white |
| `h2` | 27px / 1.25, weight 700, letter-spacing -0.025em, 64px above, 14px below, hairline rule above |
| `h3` | 20px, weight 650 |
| Inline code | Geist Mono 0.96em, `--panel` background, 1px `--line` border, 6px radius, 1px 6px padding |
| Eyebrow, breadcrumb, table head | Geist Mono 11.5px, uppercase, letter-spacing 0.08em, `--text-dim` |

Rules:
- One `h1` per page.
- Headings are sentence case.
- Two-tone titles (white plus amber or steel) are for the home and demo pages only, not for ordinary docs.
- Prose is 780px wide at 1440px, about 70 to 75 characters a line, and never wider.
  The "On this page" column takes the rest of the row (312px at 1440px).
- A page uses at most three text sizes in its body: prose, UI text and mono labels.

## Page frame

Three columns on desktop:

1. Left: search box, then grouped navigation.
   Group labels are mono uppercase 11px.
   The active item has a 3px amber left bar and a soft amber fill.
2. Center: breadcrumb and reading time on one line, `h1`, lead, then content.
3. Right: "On this page" with a 1px rule, the current section marked by an amber bar, then "Back to top" and "Suggest an edit".

Below 1100px the right column collapses.
Below 800px the left column becomes a menu.
The content column never scrolls sideways, except inside a code block or a wide table.

Every page ends with a "Next" card pair (previous, next) and the edit link.

## Components

### Code blocks

- Framed panel: `--panel` background, 1px `--line` border, 14px radius, flat (no inner shadow, no drop shadow).
  Code follows the page theme: a light panel with a darker amber label in the light theme.
- A header row holds the language label (amber, mono, uppercase, 11px) on the left and a `copy` button on the right.
- Code is Geist Mono 13.75px / 1.65.
- Comments are italic and dim, aligned to a shared column when short.
- Syntax colors come from the palette only: keywords amber, strings a warm grey-amber, numbers and names white, comments dim.
- One command or one idea per block.
- Output is a separate panel under the command, titled `RESPONSE` when it is JSON and `OUTPUT` otherwise: blacker fill, 3px grey bar at the left, smaller radius.
  A quiet note beside the title says what a reader needs (the flag the server started with, that fields are trimmed), never the release, date or machine.
  JSON is indented by two spaces and uses the colours of the docs' own JSON blocks.
  Never mix a command and its output in one block.
- A first section named `TL;DR` holds at most two code blocks.
  It needs no special style: it is an ordinary h2 followed by code.

### Tables

- Rounded 14px container with a 1px `--line` border.
- Header row on `--prussian` at 50%, mono uppercase labels.
- Rows separated by a 1px hairline.
  Cells have 11px 14px padding at 14.5px.
- Code in a cell uses the inline code style.
- Tables are for comparing things across two or more attributes.
  A two-column "term, meaning" table is acceptable.
  A table with long sentences in cells is a bad table: use a list.
- A table that does not fit keeps its frame and scrolls sideways inside it, at every width, with a faint edge shadow showing that more is there.
  Its frame is a keyboard-focusable region.
  It never turns into stacked cards: stacked cards made an 11-row table 7,600px tall on a phone.
  The first column stays visible while scrolling.
- A two-column term-and-meaning table is framed too.
- A status column (measured, not tested) uses a muted mono style.

### Callouts

One style, one label set: `Heads up` (amber bar), `Note` (steel bar), `Tip` (steel bar).
In Markdown write `:::caution[Heads up]`, `:::note` or `:::tip`.
- 3px left bar, 0 12px 12px 0 radius, `--panel` background, 16px 20px padding.
- A mono uppercase label, then at most three lines.
- At most one callout per section, and no more than two on a page.
  If a section needs more, the section is doing too much.

### Lists

- Bullets are the amber marker.
  Numbered lists use mono numerals.
- Maximum seven items.
  Each item is one line or two.
- Steps are numbered and start with a verb.

### Buttons and links

- Primary: amber fill, black text, 8px radius, 10px 14px padding, weight 600.
  One per view.
- Secondary: 1px `--line-strong` border, transparent fill, 10px radius.
- Links in prose are amber with an underline on hover.
- Focus ring is a 2px amber outline with 2px offset, on every interactive element.

### Figures and diagrams

- Stage: `--panel` background, 1px `--line` border, 14px radius, padding 18px 20px 16px, and a hard navy offset shadow of 6px 6px 0 (navy at 80%).
  This is the only shadow in the system and it belongs to figure stages.
- Inside the stage, in order: a mono amber caption (`FIGURE - THE REQUEST PATH`), a one-line bold headline that states the point, the drawing, a one-sentence takeaway under a hairline, and a mono source line when a number is shown.
- Palette: amber for the active path, steel for the part that is "the model", white for structure.
  The active node has a strong amber border and a 4px soft amber halo.
- If no part of a flow is the model, use steel for the second actor or leave it out.
- Use at most seven steps and six boxes.
- One figure per page.
- A lead-in table or command may sit between a figure and the first section.
- Every diagram has a one-sentence takeaway below it and a text alternative.
- Diagrams loop on their own, about 1.8 seconds a step.
  There are no play, next, scenario or pause controls.
  They hold while offscreen or in a hidden tab.
  They honour `prefers-reduced-motion` live.
  The still state, used without JavaScript and under reduced motion, shows every part complete with nothing highlighted.
- A figure whose point is a choice by the reader (a field chooser, a slider) may keep that one control, and only that.
- Panel height is the same for every state.
- When a figure changes how it animates, delete the styles of the old behaviour in the same change.
- Transition timing: 120ms, 240ms, 480ms with `cubic-bezier(.16, 1, .3, 1)`.
- Prefer a figure to prose when a page describes a flow, a decision rule or a comparison over time.
  Do not add one for a list or a settings table.

### Charts

- Series 1 amber, series 2 light grey, series 3 steel.
- Hairline grid at 8% opacity, mono axis labels.
- Label values directly on the marks.
  A legend is the fallback.
- The title states the finding ("Accuracy rises from 77.6% to 84.2%").
  Dataset, version, date and hardware sit in a caption directly under the chart.

### Other

- Horizontal rules appear above each `h2` and nowhere else.
- Images and videos use the same 14px radius and 1px border as code blocks.
  Videos have native controls and captions.
- Keyboard shortcut hints (`/` for search) use a bordered mono chip.

## Spacing and shape

- Radius: 14px for panels, 8px for buttons and small controls, 6px for inline code.
- Spacing steps: 4, 8, 12, 18, 24, 40, 64px.
- The only hard shadow is the figure stage's.
  Code, tables and callouts are flat.
  Use the amber glow only on the selected or primary object.

## Site pages (not documentation)

The home, Benchmarks, Demos, Privacy, the 404 and the Articles and News pages share the palette, the framed code and tables, the one callout and the motion rules above, with these differences:

- **Hero system.** A mono kicker, a large title (the two-tone amber or steel title is allowed on the home, Demos, Privacy and the 404 page), a lede and a row of chips.
  Benchmarks, Articles and News use a plain title: they are reading pages.
- **Display sizes.** Home titles may be up to 72px and section titles 45px, with the soft title shadow.
  Every other page uses the sizes in Typography.
- **Hard shadow.** Tiles and cards of the home system (`.tile`, `.ptile`, `.hp-job`) and the primary button may carry the navy offset shadow, 6px.
  Documentation pages do not.
- **Code on the home.** A home code box stays dark in both themes and may use a corner Copy button without a header row when it is a single command.
- **Posts and index pages.** One 780px reading column, 19px prose, hairline above each h2 (64px above the rule, 22px of padding inside it), framed tables, the callout style for a quote, and a closing `What next` that links the other posts and the feed.
  An index is a list of hairline rows, not a grid of cards.
- **Tables.** A table of three columns or more keeps its frame and scrolls inside it, with its first column sticky, on every page.
- **Charts.** A fixed colour per measured base is allowed and stays the same on every chart.
  A chart that is an image keeps its text at 11px or more and scrolls inside its card on a phone.
  A static chart is a framed image: it needs no loop.
  A chart title states the finding, or describes the data where the finding would repeat a number or rank something.
- **Section pages.** A page made of sections uses the Typography h2 (27px) with 64px above, 80px below the section's content and a hairline above; Benchmarks is one.
- **Reading column without a rail.** Posts and index pages centre their 780px column; the header and footer stay on the wide site grid.
- **Wide charts.** A chart image wider than 900px is never narrower than 38rem on a phone: it scrolls inside a focusable frame, or has a phone version.
- **Stages.** A card that holds only a table is flat, with no shadow: use the stage for drawings.

## What a page must not do

- No emoji, no icons in headings.
- No gradient text outside home and demo titles.
- No more than three font sizes in the body of a page.
- No decorative motion.
- No raw browser default element (unstyled table, button, details or blockquote).

## Checklist for a styled page

- [ ] Dark and light themes both pass contrast.
- [ ] 320, 390, 820, 1440 and 1920px have no overflow or clipped text.
- [ ] Every code block has a label and a copy button.
- [ ] Every table fits its container or scrolls inside its frame, at 390px too.
- [ ] Each diagram works without JavaScript and with reduced motion.
- [ ] Keyboard focus is visible everywhere.
- [ ] Lighthouse stays at 100.
