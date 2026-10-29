# Local fonts

Figtree and Source Serif 4 are the existing UI typefaces, loaded locally with
`next/font/local` so builds do not depend on Google Fonts CSS responses. This
avoids Next.js issue [#99114](https://github.com/vercel/next.js/issues/99114).

The variable fonts retain their original glyphs and axes. WOFF2 files were
losslessly encoded with FontTools 4.68.0 from the official Google Fonts sources:

- [Figtree](https://github.com/google/fonts/tree/main/ofl/figtree), `Figtree[wght].ttf`.
- [Source Serif 4](https://github.com/google/fonts/tree/main/ofl/sourceserif4), `SourceSerif4[opsz,wght].ttf`.

Both are distributed under the SIL Open Font License; the respective license
files are included alongside the fonts. No font conversion tool is required
when building or deploying the application.
