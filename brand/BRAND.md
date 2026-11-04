formai is an AI-native design studio. It delivers brand, web and product design at a speed traditional studios cannot match, for startups, studios and legacy brands. The name reads three ways: form, AI, and eye. The look is warm, precise and quiet: charcoal and cream, one burnt-orange signal, thin type, sharp corners.

## Content fundamentals

- Write the name as `formai`, always lowercase, one word. Never `Formai`, `FormAI` or `FORMAI`, including at the start of a sentence.
- Speak as a studio: "we". Address the client as "you". Short declarative sentences, concrete numbers (days, not "quickly"), no hype words ("revolutionary", "cutting-edge", "supercharge").
- Lowercase for headlines and display lines ("design at machine pace"). Sentence case for body and UI. Uppercase only for mono labels.
- No emoji. No exclamation marks.
- The promise is speed-asymmetric delivery: the client waits days where an agency quotes weeks. Say it with a number and a deliverable, not an adjective.
- The primary outreach format is the unsolicited design audit: lead with one specific observation about the recipient's own product, then the fix, then the price of fixing it.

## Visual foundations

- **Grounds.** Two themes. Dark is the default: `surface` is charcoal, `ink` is cream. Light swaps them. Use `surface-raised` for cards and inputs, never a shadow.
- **One signal color.** Burnt orange is the only hue. Use it for the "ai" in the wordmark, the pupil of the eye mark, rules, large display type and one primary action per view. If orange covers more than about a tenth of a layout, remove some.
- **Orange text.** Text under 24px in orange uses `accent` (bright on dark, deep on light), never the raw brand `orange`, which fails 4.5:1 at small sizes. Fills that carry text use `accent-fill` with `on-accent`.
- **Type.** DM Sans for everything readable, DM Mono for labels, figures and code. Display sizes (`display-xl`, `display`) use weight 200; `heading`, `subhead` and `body` use 300; anything under 16px uses `body-small` at weight 400. Tighten display tracking as the tokens specify. Never set display type in bold.
- **Mono labels.** Section markers and tags use `label`: DM Mono, uppercase, 0.12em tracking, in `ink-muted` or `accent`.
- **Corners and borders.** Everything is sharp: `radius-none`. Separate with 1px hairlines in `line`; controls use `line-strong`. No shadows, no gradients, no blur.
- **Spacing.** Generous. Use `space-16` and `space-24` between sections, `space-6` inside cards, and align to the 4px steps of the spacing scale.
- **Focus.** A solid 2px `accent` outline with a 2px offset on every focusable element, in both themes.
- **Imagery.** Real work, product screens and type specimens. Photography, when used, is desaturated and warm. No stock illustration, no mascots, no 3D renders.
- **Motion.** Quick and linear: 120 to 200ms, opacity and position only. No bounces.

## Logo

- The wordmark is lowercase `formai` in DM Sans 300 with "ai" in brand orange. On dark grounds use `formai-wordmark-cream.svg`; on light grounds use `formai-wordmark-charcoal.svg`.
- The eye mark is a sharp-cornered almond outline with a rotated-square pixel pupil in orange. Use `formai-eye-mark-cream.svg` on dark and `formai-eye-mark-charcoal.svg` on light. It stands alone as an avatar, favicon or stamp.
- Clear space equals the height of the "o" on every side. Minimum wordmark width 72px; minimum eye mark 20px.
- Do not recolor, outline, stretch, rotate, round the corners, add effects, or set the name in another typeface. Do not put the orange "ai" on an orange ground.

## Iconography

- The brand has no icon set of its own. Use thin 1.5px-stroke, square-capped, sharp-cornered line icons in `ink` or `accent`. Never filled, never rounded, never emoji.
- The eye mark is the only pictorial symbol. Do not redraw it or place it as a decorative pattern.

## Components

Button, Tag and Card are the working set. Each preview shows both themes' tokens in use; read the component's README for what the consumer provides and the do/don'ts.
