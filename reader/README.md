# Novel Reader

A local, personal reading web app for your translated web novels. Built with Next.js +
Tailwind. It reads chapter `.txt` files straight from disk — no database, no accounts.

Library → pick a novel → chapter list → read, with an **English / 中文 / Both** toggle
and adjustable text size (your preference is remembered).

## Run it

```bash
cd reader
npm install        # first time only
npm run dev        # http://localhost:3000
```

For a faster, production-like run: `npm run build && npm run start`.

## How content is stored

Each novel lives in its own folder:

```
reader/content/novels/<slug>/
  meta.json          # { slug, title, originalTitle, author, source, chapterCount }
  chapters/          # Chinese source: 001.txt, 002.txt, …  (first 2 lines = title + URL, auto-skipped)
  english/           # English translation: 001.txt, …      (first "Chapter N" line auto-skipped)
```

A chapter shows in the reader if it has an English file, a Chinese file, or both. Paragraphs
are split on blank lines.

## Adding another novel (the workflow you'll repeat)

1. **Scrape** the novel into a Chinese-chapters folder (your existing `scrape*.py` flow),
   e.g. `../novels-cn/<name>/001.txt …`.
2. **Translate** with Claude using the `cn-en-translator` skill → an English-chapters folder.
3. **Ingest** both into the reader:

   ```bash
   cd reader
   npm run ingest -- \
     --slug some-slug \
     --title "The English Title" \
     --original "原始中文標題" \
     --author "Author or Unknown" \
     --source "https://source-url/" \
     --cn ../path/to/chinese-chapters \
     --en ../path/to/english-chapters
   ```

   Re-run the same command after translating new chapters — it refreshes that novel's files.
4. `npm run dev` — the new novel appears on the homepage automatically.

> The first novel (`real-heiress`) was ingested from the repo's top-level `chapters/` and
> `english-chapters/` folders. You can pass `--en` only (no `--cn`) if you just want English,
> or `--cn` only to add a novel before it's translated.

## Notes

- Translations are personal / non-commercial.
- It's a static reader: `npm run build` prerenders every chapter to HTML.
