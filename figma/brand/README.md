# Third-party brand assets

Logos from the owners' official brand packs, kept so the paths in
`src/components/ui/icon.tsx` and the Figma icon components can be checked
against the source. Only the SVGs are kept here; the full packs (Illustrator
files, PNGs, the gradient glyph) came from the links below.

- **Facebook** (`facebook/`): https://www.meta.com/brand/resources/facebook/logo/
  Meta ships Illustrator files only. These SVGs were converted from
  `Facebook_Logo_Primary.ai` and `Facebook_Logo_Secondary.ai` with
  `pdftocairo -svg`, with no other changes. The site uses Secondary (white
  circle, cut-out f), cropped to the circle.
- **Instagram** (`instagram/`): https://www.meta.com/brand/resources/instagram/instagram-brand/
  White and black static glyphs, as downloaded. The site uses White.

In code and Figma the logos keep Meta's shapes, unedited, but take the
surrounding text color like the line icons (2026-11-25 decision). Meta's own
guidance asks for its colors only; Facebook also asks for at least 16px
width and clear space of a quarter of its width.
