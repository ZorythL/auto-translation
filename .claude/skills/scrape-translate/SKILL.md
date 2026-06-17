---
name: scrape-translate
description: "Scrape an entire web novel from a shared xbanxia.cc book URL, save every chapter into a folder named after the story, then translate the whole book to publication-quality English. Activate when the user shares a book/story URL (especially xbanxia.cc/books/<id>.html) and asks to scrape it, get all chapters/episodes, download the novel, and/or translate it to English. Trigger phrases include 'scrape this story', 'get all chapters', 'scrape and translate', 'download this novel and translate', 'translate this book to English'. Do NOT activate for translating a single pasted snippet (use cn-en-translator) or for non-novel scraping."
trigger: /scrape-translate
---

# /scrape-translate — Scrape a web novel and translate it to English

End-to-end pipeline: **book URL → all chapters scraped → title-named folder →
publication-quality English translation**. Built for `xbanxia.cc` (Cloudflare-protected;
Traditional Chinese), but the translation half works for any CN source.

Scripts live in `scripts/` next to this file; reusable translation rules in
`references/translation-rules.md`. Run everything from the project working directory
(e.g. `automation-translation/`) so output folders land there.

## Prerequisites (verify once)
- Python with `playwright`, `beautifulsoup4` installed; Chromium/Chrome present.
  Quick check: `python -c "import playwright, bs4; print('ok')"`.
- Real Google Chrome (or Edge) installed — the Cloudflare bypass relies on it, NOT on
  Playwright's bundled Chromium (which Cloudflare detects and loops forever).

## Step 1 — Get the URL & confirm scope
Take the book URL from the user (e.g. `https://www.xbanxia.cc/books/417510.html`).
Extract the numeric book id. If they pasted a chapter URL, ask for the book index URL.

## Step 2 — Launch a clean Chrome past Cloudflare
```
python ".claude/skills/scrape-translate/scripts/launch_chrome.py" <book_url_or_id>
```
This launches (or reuses) Chrome with `--remote-debugging-port=9222` and a dedicated
`cf_profile/` — no automation flags, so Cloudflare usually clears automatically.
- Exit 0 → cleared, proceed.
- Exit 2 → still challenged: tell the user to **click the "Verify you are human"
  checkbox** in the Chrome window that opened, then continue.
Run this with a generous timeout (it polls up to ~90s).

## Step 3 — Scrape all chapters
```
python ".claude/skills/scrape-translate/scripts/scrape_book.py" <book_url_or_id>
```
Writes `<Book Title>/chapters/001.txt …`, `FULL_BOOK.txt`, `manifest.json`. The last
stdout line is `FOLDER=<name>` — capture it; that folder name (the Chinese book title)
is used by every later step. Each chapter file = header line, source URL, blank, body.
Give it a long timeout (≈1.2s/chapter + page loads; dozens of chapters = a few minutes).

## Step 4 — Build the glossary + per-book instructions (ONE agent)
Spawn a single `general-purpose` agent to read a SAMPLE of chapters (e.g. 001, then every
~5th up to the last) and produce a consistent name/term bible. It must:
1. Decide ONE fixed English rendering for each recurring character, place, brand, and
   story-specific term (pinyin without tone marks for names; standard English for real
   brands/places; flag near-identical names that differ by one character).
2. Pick an English book title.
3. Write `<Book Title>/GLOSSARY.md` (a Markdown table).
4. Write `<Book Title>/_TRANSLATE_INSTRUCTIONS.md` = the full contents of
   `references/translation-rules.md` (read it and inline it) followed by a
   `## Fixed glossary` section listing every name/term mapping. This single file is what
   the translators read, so it must be self-contained.

## Step 5 — Translate every chapter (parallel agents)
Count the chapters in `<Book Title>/chapters/`. Create `<Book Title>/english/`.
Spawn one `general-purpose` agent **per chapter**, in waves of ~12 (send multiple Agent
calls in one message so they run concurrently). Each agent prompt (keep it short):

> Read `<Book Title>/_TRANSLATE_INSTRUCTIONS.md` and follow it exactly to translate
> chapter NNN. Source: `<Book Title>/chapters/NNN.txt` → output
> `<Book Title>/english/NNN.txt`. (For 番外 chapters, render "番外" as "(Side Story)" in
> the title.) Reply ONLY: "NNN done — <word count> words".

Use absolute paths in the prompts to avoid CWD ambiguity. Re-spawn any chapter that fails
or returns a too-short file.

## Step 6 — Assemble & QA
```
python ".claude/skills/scrape-translate/scripts/assemble_en.py" "<Book Title>" --title "<English Book Title>"
```
Writes `FULL_BOOK_EN.txt` + `TABLE_OF_CONTENTS_EN.md` and prints a QA report. Investigate
any **missing** or **short** chapters (re-translate). **Residual Chinese** is often
intentional (on-screen text a scene quotes, e.g. a sign or a foreign phrase) — open the
flagged file and only re-translate if it's genuinely untranslated prose.

## Final folder layout (everything under the one story folder)
```
<Book Title>/
├── chapters/        001.txt … NNN.txt   (original Chinese)
├── english/         001.txt … NNN.txt   (English)
├── FULL_BOOK.txt        full Chinese
├── FULL_BOOK_EN.txt     full English
├── TABLE_OF_CONTENTS_EN.md
├── GLOSSARY.md
├── _TRANSLATE_INSTRUCTIONS.md
└── manifest.json
```

## Notes & gotchas
- The scraper connects to Chrome over CDP; keep that Chrome (port 9222) running for the
  whole scrape. Closing the window mid-run aborts it.
- Windows console is cp1252 — the scripts already force UTF-8 stdout/stderr. When echoing
  Chinese in your own Bash one-liners, wrap Python stdout in a UTF-8 TextIOWrapper.
- Book folders are named with the Chinese title (may contain full-width chars like `：`,
  which are valid on Windows). The user may rename a folder to its English title later;
  pass whatever the current folder name is to `assemble_en.py`.
- For a different site, only the scraper selectors change (`#nr1` body, `/<id>/<n>.html`
  chapter links, `<title>` book name); the launch + translate + assemble steps are reusable.
