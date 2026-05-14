# Passby — Tailwind Style Guide

A clean, minimal, editorial system. Big confident display type on a near‑white ground, a single inky neutral for emphasis, and a monospaced label voice for citations and meta. No gradients, no shadows, no decorative color — restraint is the brand.

The slide source uses 1920px artboards and very large display sizes; the scale below has been **adapted down to product UI** (web app baseline 16px / 1440px desktop). When in doubt, prefer fewer elements and more whitespace.

---

## 1. Setup

### Fonts

Both fonts are on Google Fonts. Load in `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=IBM+Plex+Mono:wght@400;500&display=swap"
  rel="stylesheet">
```

### `tailwind.config.ts`

The slide palette maps 1:1 onto Tailwind's `zinc` ramp, so we lean on that instead of inventing custom names. Add only the semantic aliases and the two type families.

```ts
import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // semantic aliases — use these in components
        bg:        colors.zinc[100],   // #F4F4F5 page ground
        surface:   '#FFFFFF',          // raised surfaces (cards, inputs)
        ink:       colors.zinc[900],   // #18181B primary text + dark surfaces
        muted:     colors.zinc[500],   // #71717A captions, meta, mono labels
        subtle:    colors.zinc[400],   // disabled, dividers on dark
        line:      colors.zinc[200],   // hairlines on light
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans:    ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.03em',
        label:    '0.12em', // for uppercase mono labels
      },
      borderRadius: {
        card: '24px', // matches the slide's 64px @ 1920 → ~24px @ product scale
      },
    },
  },
} satisfies Config
```

---

## 2. Color

One neutral ramp, one ground, one ink. No accent color in v1 — if a single accent is added later it must be high‑chroma (cobalt, cadmium red, or pure black on white). Do **not** introduce muted earth tones.

| Token       | Hex       | Tailwind          | Use                                            |
| ----------- | --------- | ----------------- | ---------------------------------------------- |
| `bg`        | `#F4F4F5` | `bg-bg` / `zinc-100` | Page background, app shell                  |
| `surface`   | `#FFFFFF` | `bg-surface`      | Cards, inputs, menus, modals                   |
| `ink`       | `#18181B` | `bg-ink` / `text-ink` | All primary text; dark hero/CTA surfaces   |
| `muted`     | `#71717A` | `text-muted`      | Captions, meta, mono labels, secondary text    |
| `subtle`    | `#A1A1AA` | `text-subtle`     | Placeholders, disabled, dividers on `ink`      |
| `line`      | `#E4E4E7` | `border-line`     | Hairlines, table rules, input borders          |

**On dark (`bg-ink`):** text is `text-bg` (zinc-100) for primary, `text-zinc-400` for muted, `border-zinc-800` for hairlines.

**Contrast rules**

- Body text below 16px **must** be `text-ink` on light, `text-bg` on dark — never `muted`.
- `text-muted` is only allowed at ≥ 14px and only for non‑essential meta.
- No tinted grays. If you need a gray, it comes from the zinc ramp.

---

## 3. Typography

Two families, doing different jobs.

- **Bricolage Grotesque** — everything user‑facing: display, headings, body, buttons.
- **IBM Plex Mono** — small uppercase labels, citations, source attribution, timestamps, keyboard hints, code.

### Type scale

Slide sizes scaled to product UI. Always pair with the listed weight and line‑height; the contrast between weights is doing as much work as the size.

| Role           | Class                                                                                  | Notes                                            |
| -------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `display-xl`   | `font-display text-7xl md:text-8xl font-bold tracking-tightest leading-[0.95]`         | Marketing heroes, single stat moments (`$621B`). |
| `display-lg`   | `font-display text-6xl font-bold tracking-tightest leading-[1]`                        | Section hero numerals.                           |
| `h1`           | `font-display text-5xl font-semibold tracking-tight leading-[1.05]`                    | Page titles. Weight 600, not 700.                |
| `h1-light`     | `font-display text-5xl font-normal tracking-tight leading-[1.05]`                      | Second line of a two‑line title (see slide 1).   |
| `h2`           | `font-display text-3xl font-semibold tracking-tight leading-tight`                     | Section headers.                                 |
| `h3`           | `font-display text-xl font-semibold leading-snug`                                      | Card titles, modal titles.                       |
| `lead`         | `font-display text-2xl font-normal leading-snug text-ink`                              | Subtitles, intro paragraphs.                     |
| `lead-bold`    | `font-display text-2xl font-semibold leading-snug text-ink`                            | Emphasized subtitle line.                        |
| `body`         | `font-sans text-base font-normal leading-relaxed text-ink`                             | Default paragraph.                               |
| `body-sm`      | `font-sans text-sm font-normal leading-normal text-ink`                                | Dense UI, table cells.                           |
| `label`        | `font-mono text-xs font-normal uppercase tracking-label text-muted`                    | Citation, "as of", category, kbd. **Hero voice.**|
| `label-sm`     | `font-mono text-[11px] font-normal uppercase tracking-label text-muted`                | Smallest acceptable label. Don't go below.       |
| `numeric`      | `font-display font-bold tabular-nums tracking-tightest`                                | Any standalone number (KPIs, stats, prices).     |

### Pairing rules

1. **Heavy ↔ light contrast.** A 600/700 display headline should sit next to 400 body or a 400 mono label, never another semibold line of similar size.
2. **One display line per view.** If a page has a hero number, the rest of the page steps down sharply (no second `display-*` on the same screen).
3. **Mono is small and uppercase, always.** It is never used at body size and never mixed‑case.
4. **Negative tracking on display, open tracking on mono labels.** `tracking-tightest` (~`-0.03em`) above 36px; `tracking-label` (~`0.12em`) on uppercase mono.

### Examples

```tsx
// Hero number with mono citation (slide 4 pattern)
<section className="flex flex-col items-center gap-8 py-24">
  <div className="font-display text-7xl md:text-8xl font-bold tracking-tightest leading-none text-ink">
    $621B
  </div>
  <p className="font-display text-2xl text-ink">Size of worldwide B2B exhibitions market</p>
  <p className="font-mono text-xs uppercase tracking-label text-muted">
    CustomMarketInsights, 2026
  </p>
</section>

// Two‑weight headline (slide 1 pattern)
<h1 className="text-center">
  <span className="block font-display text-5xl font-semibold tracking-tight text-ink">
    Companies are spending blind
  </span>
  <span className="block font-display text-5xl font-normal tracking-tight text-ink">
    at trade shows.
  </span>
</h1>
```

---

## 4. Spacing & layout

The slides use a generous `64px` gap at 1920px width — that translates to a **multiple‑of‑4 rhythm** at product scale with deliberately large vertical gaps between sections.

| Token            | Value | Tailwind     | Use                                      |
| ---------------- | ----- | ------------ | ---------------------------------------- |
| Element padding  | 16px  | `p-4`        | Inputs, buttons, dense rows              |
| Card padding     | 24px  | `p-6`        | Cards, list items                        |
| Card padding lg  | 32px  | `p-8`        | Feature cards, hero cards                |
| Section gap (sm) | 32px  | `gap-8`      | Within a section                         |
| Section gap (md) | 48px  | `gap-12`     | Between subsections                      |
| Section gap (lg) | 96px  | `py-24`      | Between page sections (hero ↔ next)     |
| Page gutter      | 24px  | `px-6`       | Mobile shell                             |
| Page gutter lg   | 48px  | `lg:px-12`   | Desktop shell                            |

**Rules**

- Center align hero content (`mx-auto max-w-3xl text-center`). Default everything else to left.
- Stat groups (multiple KPIs in a row) get **equal column widths**, large gaps (`gap-12` or `gap-16`), and each stat is itself a vertical stack of `numeric → lead → label` with `gap-4` between.
- Never use a third gap value within a single component — keep it to two (tight intra‑group, loose inter‑group).

---

## 5. Components

### Card

White surface on the `bg` ground. No shadow. Borders only when needed for separation against `surface`.

```tsx
<div className="bg-surface rounded-card p-6">
  {/* content */}
</div>
```

### Dark hero / CTA panel (slide 3 pattern)

```tsx
<div className="bg-ink rounded-card p-12 text-bg">
  <h2 className="font-display text-4xl font-semibold tracking-tight">…</h2>
  <p className="mt-4 font-display text-lg text-zinc-400">…</p>
</div>
```

The slide uses a 64px radius at 1920px width → `rounded-card` (24px) at product scale. Don't increase the radius further; it tips into novelty.

### Button

```tsx
// Primary — ink on bg
<button className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 font-display text-sm font-medium text-bg hover:bg-zinc-800">
  Get started
</button>

// Secondary — bordered ink
<button className="inline-flex items-center justify-center rounded-full border border-ink bg-transparent px-6 py-3 font-display text-sm font-medium text-ink hover:bg-ink hover:text-bg">
  Learn more
</button>

// Ghost
<button className="font-display text-sm font-medium text-ink underline-offset-4 hover:underline">
  Cancel
</button>
```

### Input

```tsx
<input
  className="w-full rounded-lg border border-line bg-surface px-4 py-3 font-sans text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-none"
/>
```

### Stat block (slide 1 pattern)

```tsx
<div className="flex flex-col items-center gap-4 text-center">
  <div className="font-display text-6xl font-bold tracking-tightest leading-none text-ink tabular-nums">
    $1.4M
  </div>
  <p className="font-display text-lg text-ink">Avg budget of a trade show</p>
  <p className="font-mono text-xs uppercase tracking-label text-muted">Cvent, 2023</p>
</div>
```

A row of these: `grid grid-cols-1 md:grid-cols-3 gap-12`.

### Wordmark / logo lockup (slide 2 pattern)

The "Passby" wordmark is just Bricolage Grotesque Bold at scale with tight tracking. No icon. Treat the wordmark as a typographic asset — never apply effects, colors, or rotation.

```tsx
<span className="font-display font-bold tracking-tightest text-ink">Passby</span>
```

---

## 6. Iconography & decoration

- **Icons:** Lucide, stroke 1.5px, color `text-ink` or `text-muted`. Use sparingly — most rows in this style do not need a leading icon.
- **Dividers:** `border-line` hairlines only. No dotted/dashed.
- **Shadows:** None.
- **Gradients:** None.
- **Illustrations:** If introduced, must be flat, monochrome `ink` on `bg` — never colored.

---

## 7. Dark mode (optional)

Invert the two grounds. Same type scale, same rules.

| Token     | Light     | Dark      |
| --------- | --------- | --------- |
| `bg`      | `#F4F4F5` | `#09090B` |
| `surface` | `#FFFFFF` | `#18181B` |
| `ink`     | `#18181B` | `#FAFAFA` |
| `muted`   | `#71717A` | `#A1A1AA` |
| `line`    | `#E4E4E7` | `#27272A` |

---

## 8. Do / don't

**Do**

- Let one number or one headline carry the whole view.
- Pair a heavy display line with a thin mono label.
- Leave large empty space around hero content.
- Keep everything `text-ink` or `text-muted` — no other text colors.

**Don't**

- Add a third type family.
- Use `text-muted` for anything a user actually needs to read.
- Box every section in a card — let information sit directly on the ground.
- Introduce shadows, gradients, or a colored accent without a brand‑level decision.
- Mix multiple display sizes on the same screen.
