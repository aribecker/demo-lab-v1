# Integrated design system — R41

This is the authoritative visual specification for the integrated frontend. Change this specification before grounding and changing presentation code.

## Palette
Use dark navy canvas #08151e, panel gradient #142b3a to #102331, inset surface #081b29 and raised surface #19394a. Primary text #edf6fc, secondary text #c4d8e4, accent #9ae6ef and focus #b4f3fc. Secondary buttons use #234d61 with #d8f3f7 text and #6b98ad border; hover/expanded surface #315768. Primary buttons use #9ae6ef with #0c2734 text. Positive #86e4c3, negative #ffbaac, warning #ffd1ad. Disabled opacity .65; do not rely on color alone for status.

## Tokens and composition
Declare named custom properties centrally for all colors (including legacy shade variants), Inter/system font and monospace stacks, text sizes, font weights, spacing, border widths, radii, shadows, focus ring, control height and motion duration. Map repeated dimensions to shared tokens; component-specific chart dimensions/layout values can remain in their BEM block. Use one CSS entry point with internal token/base/block files, without a runtime styling dependency.

## BEM
Lowercase kebab-case block names; elements block__element; modifiers block--modifier or block__element--modifier. Examples: app-shell__navigation, page-intro__subtitle, weather-widget--error, chat__turn--user, database__toggle. Always retain the unmodified base class with a modifier. Shared blocks panel, button, field, notice, page-intro and text support feature composition. No generic success/error/user classes, ID styling or feature-specific CSS imports. Native element/pseudo/attribute selectors can refine an explicit BEM block; only base reset/typography rules may be global.

## Interaction and layout
Preserve compact natural flow, 320px minimum width and existing layout breakpoints (420/540/600/640/820px). Use 44px minimum interactive height; plus/minus buttons remain visible and keyboard accessible. Focus uses a 3px cyan outline with offset. Preserve loading slot sizes, skeletons, wrapping, disabled feedback and reduce animations for prefers-reduced-motion. No layout scaling or fixed viewport clipping. Panels, controls, readable text and expanded Database values use the shared palette across all routes. Preserve headings, accessible roles and content hierarchy.

## Validation and future changes
Normal text target4.5:1, control boundaries/focus3:1. Validate token contrast and statically guard the central CSS boundary/BEM conventions as part of tests. Existing behavior tests and visual inspection cover the refactor. Every new feature reuses these tokens/shared blocks; additions or exceptions require a specification update before code grounding and generation.
