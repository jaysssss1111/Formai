# formai design system

The rules for how the site looks. `brand/BRAND.md` holds the brand intent; this file is what
`assets/css/styles.css`, the inline `style=""` in `index.html` and the style strings in
`assets/js/*.js` follow. If a value is not listed here, add it here first.

Tokens live in the `:root` / `[data-theme]` blocks at the top of `styles.css`. The shared
component styles are the "Components" block at the end of the same file.

## Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--surface` | `#EDE6D8` | `#141210` | Page ground |
| `--raised` | `#F5F0E6` | `#1E1B18` | Cards, inputs |
| `--ink` | `#26221E` (soft black) | `#EDE6D8` | All text and lines on `--surface` / `--raised` |
| `--muted` | `#5E564B` | `#A39A8B` | Secondary text |
| `--line` | `#D2C9B7` | `#2B2722` | Dividers (decorative) |
| `--strong` | `#8A8173` | `#6E665A` | Control borders |
| `--accent` | `#A8461A` | `#E2692B` | Links, the main button, focus |
| `--on-accent` | `#EDE6D8` | `#141210` | Text on `--accent` |
| `--brand` | `#C85A20` | `#C85A20` | Orange bands, the eye pupil, highlight tags |
| `--on-brand` | `#0E0C0B` | `#0E0C0B` | The only text colour on `--brand` (4.6:1) |
| `--soft-black` | `#26221E` | `#26221E` | Light cards that stay light in both themes |

- Two dark text colours, each with one job: `--ink` (soft black) on light grounds, `--on-brand`
  on orange. No other near-blacks.
- No opacity on text. No shadows or blur on type.
- Light cards on the orange bands (`.fm-svc-panel`, `.fm-wh-card`) set the light tokens
  locally, so they read the same in both themes.

## Type

DM Sans 200/300/400 and DM Mono 300/400. Nine sizes, nothing else:

| Name | Size | Use |
|---|---|---|
| label | 12px (0.75rem), DM Mono 400, uppercase, 0.12em | Labels, tags, chips, mono buttons, nav |
| small | 14px (0.875rem), 400 | Captions, helper text |
| body | 16px (1rem), 300 (400 on orange) | Running text, links, main buttons |
| title | 20px (1.25rem), 400 | FAQ questions, small card titles |
| sub | 24px (1.5rem), 300 | Lead lines, card titles |
| heading | clamp(24px, 2.4vw, 32px), 300 | Service names, case titles, belief rows |
| display-s | clamp(32px, 4vw, 44px), 200 | Dialog and confirmation titles |
| display | clamp(36px, 4.5vw, 56px), **400**, `--ink` | Every section heading, the same in all sections |
| display-xl | clamp(52px, 7vw, 96px), 200 | The hero headline only |

- Nothing under 12px. Under 16px is weight 400.
- Sizes are in `rem`, so the browser's text-size setting applies.

## Spacing

A 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96. Section padding 96px (64px on phones),
side gutter 40px (20px on phones). Borders are 1px (2px for the orange top rule).

## Shape

Square corners everywhere (radius 0).

## Components

**Buttons**: three kinds, all 44px high, 0 20px padding.

| Kind | Class | Look |
|---|---|---|
| Main | `.fm-btn-primary`, `.fm-ck-btn.fm-ck-primary` | `--accent` fill, sentence case, body size. One per view. |
| Secondary | `.fm-svc-ask`, `.fm-case-cta`, `.fm-step-cta`, `.fm-seg-cta`, `.fm-faq-ask-btn`, `.fm-news-readbtn` | `--ink` fill, mono label |
| Ghost | `.fm-ck-btn`, `.fm-news-more`, `.fm-faq-act`, `.fm-sa-toggle`, `.fm-pause` | Transparent, `--strong` border, mono label |

Icon buttons (theme, menu, close, arrows, like) are 44 × 44.

**Inputs**: 48px high in forms, 44px when joined to a button (hero, Free audit).

**Filter chips**: one look everywhere (news, FAQ, audit dialog, booking topics, contact
starters): mono label, 44px, `--strong` border; selected = `--ink` fill.

**Tags**: one outline tag (mono label, `--strong` border, `--muted` text) and one highlight
tag (`--brand` fill, `--on-brand` text) for New, Concept and After. At most one highlight per card.

**Text links**: the arrow link for standalone links (16px, `--strong` underline, 44px high);
the inline link inside sentences and forms (`--accent`, underlined, inherits size).

**Section heading**: `display`, weight 400, `--ink` (`--on-brand` on orange). No eyebrow,
no shadow, no per-section overrides.

## Calm

- One orange signal per area: the orange bands carry no orange fills inside them, the FAQ
  marks "Most asked" with outline tags, and news rows show one meta line (the "New" mark is on
  the lead story only).
- Who we are: the intro, the beliefs, three cards and the tools strip. The first card links to
  Services instead of repeating the list.
- The open service tab is marked by a 4px bar, weight 400 text and a small indent.
