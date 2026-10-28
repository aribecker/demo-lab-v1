# Integrated design system — R41 / R49

This is the authoritative visual specification for the integrated frontend. Change this specification before grounding and changing presentation code.

## Palette
R49 replaces the former navy/cyan palette with a brighter blue-green (turquoise) identity. Keep a dark readable canvas, with visibly greener panel surfaces and a saturated, cheerful turquoise accent. Apply the palette consistently across every Demo Lab route through the existing central tokens.

| Token / role | Color |
| --- | --- |
| canvas | `#09252b` |
| surface / surface-end (panel gradient) | `#123e46` / `#0d3038` |
| surface-inset / surface-raised | `#092b32` / `#194c53` |
| surface-hover | `#28616a` |
| text / text-secondary | `#effcf9` / `#c6e8e4` |
| accent / focus | `#45e0ce` / `#a2fff0` |
| button / button-text / button-border | `#1d515b` / `#e2fcf6` / `#79b9bc` |
| on-accent | `#072e32` |
| border / panel-border | `#6aa5ab` / `#3b747c` |
| glow | `#1a9f9a44` |

Positive `#86e4c3`, negative `#ffbaac`, warning `#ffd1ad`, warning-surface `#382a24`, warning-border `#87614d`, shadow `#0003`, menu-shadow `#0006`, transparent `transparent`. Primary buttons use accent/on-accent. Disabled opacity .65; do not rely on color alone for status.

## Hamburger menu icons — R49
Every navigation option has exactly one decorative vector line icon followed by its existing visible label. Use the following internal icon identifiers and drawings; this mapping is part of the specification, not an unspecified implementation choice.

| Option | Route | Icon ID | Drawing |
| --- | --- | --- | --- |
| Home | `/` | `house` | House with roof and door |
| Weather demo | `/weather` | `cloud-sun` | Sun behind a cloud |
| Component gallery | `/components` | `layout-grid` | Four rounded tiles |
| Login | `/login` | `log-in` | Arrow entering a door |
| People | `/people` | `contact-card` | Contact card with a person and text lines |
| Database | `/database` | `database` | Stacked database cylinder |
| Specifications | `/specifications` | `book-open` | Open book |
| Chatbot | `/chatbot` | `message-circle` | Speech bubble with three dots |
| Hello World | `/hello-world` | `hand` | Raised open hand |
| Bitcoin Tracker | `/bitcoin` | `bitcoin` | Bitcoin symbol inside a circle |
| Trading Simulator | `/trading-simulator` | `chart-candlestick` | Candlesticks on chart axes |
| Users | `/users` | `user-settings` | Single user with a settings gear |
| Groups | `/groups` | `users-group` | Group of three people |

Icons are repository-owned inline SVGs: 24×24 viewBox, 20px rendered size, 2px rounded stroke, no fill, accent color inherited from central tokens. No emoji, remote icon requests or new runtime dependency. Stroke and fill presentation belong in CSS. Put icons to the left with a 12px gap, aligned consistently; keep the full text label and existing link accessible name. SVGs have `aria-hidden="true"` and `focusable="false"`; they add no keyboard stop. Distinguish the current option with `aria-current`, background and an accent inset marker. Keep Tab, Escape, focus restoration, menu closing and permission checks intact.

Menu width is 264px capped to viewport minus 40px, with a scrollable height capped to 70vh/640px so all 13 options remain reachable on mobile. Interactive items remain at least 44px high. A new destination must add its icon mapping here before implementation.


## Tokens and composition
Declare named custom properties centrally for all colors (including legacy shade variants), Inter/system font and monospace stacks, text sizes, font weights, spacing, border widths, radii, shadows, focus ring, control height and motion duration. Map repeated dimensions to shared tokens; component-specific chart dimensions/layout values can remain in their BEM block. Use one CSS entry point with internal token/base/block files, without a runtime styling dependency.

## BEM
Lowercase kebab-case block names; elements block__element; modifiers block--modifier or block__element--modifier. Examples: app-shell__navigation, page-intro__subtitle, weather-widget--error, chat__turn--user, database__toggle. Always retain the unmodified base class with a modifier. Shared blocks panel, button, field, notice, page-intro and text support feature composition. No generic success/error/user classes, ID styling or feature-specific CSS imports. Native element/pseudo/attribute selectors can refine an explicit BEM block; only base reset/typography rules may be global.

## Interaction and layout
Preserve compact natural flow, 320px minimum width and existing layout breakpoints (420/540/600/640/820px). Use 44px minimum interactive height; plus/minus buttons remain visible and keyboard accessible. Focus uses a 3px mint-turquoise outline with offset. Preserve loading slot sizes, skeletons, wrapping, disabled feedback and reduce animations for prefers-reduced-motion. No layout scaling or fixed viewport clipping. Panels, controls, readable text and expanded Database values use the shared palette across all routes. Preserve headings, accessible roles and content hierarchy.

## Responsive CRUD records — R50
Lists with record names/metadata and action buttons must use the shared `record-list` BEM block. Do not reuse the two-column People name/time layout for multi-action administration rows. The complete record name must remain readable; actions must never shrink it to a vertical chain of characters. No ellipsis, clipping, horizontal page scrolling or fixed row heights to conceal this problem.

- Separate each `record-list__item` into `record-list__details` and `record-list__actions`. The item and action group both wrap. Details grow from a 16rem basis; both children have min-width 0 and max-width 100%. Long unbroken names/emails may wrap, but ordinary words use normal word breaking.
- At widths up to and including 820px, details occupy a full row and actions sit below with width 100%. Buttons wrap into additional rows within the panel. On wider screens the two regions may sit beside each other only when they fit. Keep natural content height and 44px minimum targets.
- Visible actions are short: Edit, Delete, Members. Preserve complete contextual accessible names (e.g. `Edit Users administration`, `Members of Users administration`) and label each action group `Actions for <complete record name>`. Do not repeat the full record name inside every visible button.
- Title 14px, metadata 12px; spacing, palette and buttons use the existing shared tokens. Both Users and Groups use the same layout contract.
- Regression acceptance at 320, 360, 390, 600, 820 and 1024 CSS pixels: normal group names remain complete and wrap as words, arbitrary 120-character names and 254-character emails stay inside the panel, and all actions are reachable. Preserve behavior when switching Users/Groups and when opening membership editors.
- The central stylesheet guard enforces wrapping, flexible details, bounded children and the mobile full-width/stacked rule. Behavior checks preserve contextual action names and short visible labels with long record names. Actual browser viewport checks remain the visual acceptance standard; DOM-only tests must not be reported as pixel/layout proof.

## Validation and future changes
Normal text target4.5:1, control boundaries/focus3:1. Validate all documented palette tokens against their executable values, ensure all 13 menu entries have the specified decorative icon while keeping their accessible names, and statically guard the central CSS boundary/BEM conventions as part of tests. Existing behavior tests and visual inspection cover the refactor. Every new feature reuses these tokens/shared blocks; additions or exceptions require a specification update before code grounding and generation.
