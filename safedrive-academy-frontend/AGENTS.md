<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design System & UI Development Rules (`DESIGN.md` - Mobbin Monochrome)

Before writing or modifying any frontend code, components, or styles in this project:
1. **Mandatory Review**: Always review [`DESIGN.md`](file:///h:/Hackathon/safedrive-academy/DESIGN.md) to inspect and follow its exact design tokens, typography scale, color palette, spacing rhythm, border radius scale, and component specifications.
2. **Color Invariants**:
   - **Primary Brand Color**: Ink Black (`#141414` / text `#ffffff`). All primary CTAs are stadium pills (`rounded-full`) in `#141414`.
   - **Commercial Accent Only**: Electric Blue (`#0066ff`). Reserved strictly for commercial/pricing emphasis (e.g. "Popular" badge, savings callouts). Never used for CTAs or decoratively.
   - **Surfaces**: Canvas (`#ffffff`), Soft Canvas (`#f3f3f3`), Field (`#f0f0f0`), Soft Hairline (`#f0f0f0`), Hairline (`#e0e0e0`).
   - **Text**: Ink (`#141414`), Soft Ink (`#262626`), Muted (`#707070`), Faint (`#adadad`).
3. **Typography Invariants**:
   - Use Saans / Inter (Variable weights: 650 for display & headings, 450 for body, 300 for light subtitles).
   - Tight leading (1.0 to 1.13 on headings) with 0 letter-spacing.
   - Headlines are declarative sentences ending with terminal periods (e.g., "Track driving classes and payment dues.").
4. **Shape & Radius Vocabulary**:
   - `9999px` (`rounded-full` / stadium pill) for **every** interactive element: floating nav bar, buttons, segmented controls, badges, chips.
   - `24px` (`rounded-[24px]` / `{rounded.md}`) for content cards, pricing cards, student cards, footer top corners.
   - `16px` (`rounded-[16px]` / `{rounded.sm}`) for form inputs, table containers, class cards.
   - `30%` squircle (`app-icon-squircle`) for icon tiles.
5. **Elevation & Card Depth**:
   - Zero drop shadows. Elevation is carried entirely by fill differences (white canvas vs. 6-8% ink tints `#f3f3f3`/`#f0f0f0`) and 1px hairlines.
6. **Signature Layout Elements**:
   - **Floating Nav Pill**: Horizontally centered stadium bar in `{colors.canvas-soft}` (`#f3f3f3`) detached from viewport edges.
   - **Polarity Inversion Footer**: Full-bleed near-black `{colors.ink}` (`#141414`) footer with `{rounded.md}` (24px) top corners.
