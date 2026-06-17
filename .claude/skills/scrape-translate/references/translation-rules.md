# Translation rules (book-agnostic) — CN → EN web novel

These rules are copied into each book's `_TRANSLATE_INSTRUCTIONS.md` together with a
book-specific glossary, and every per-chapter translation agent reads that file.

## Source & output contract
- Source: `<book_folder>/chapters/NNN.txt`. First 3 lines are metadata (Chinese title,
  source URL, blank). Translate the **body** (and the chapter title).
- Output: `<book_folder>/english/NNN.txt`, written with the Write tool, format EXACTLY:
  - Line 1: `Chapter <N> — <English chapter title>`
  - Line 2: the source URL (copied from source line 2)
  - Line 3: blank
  - Then the English translation, one line per source paragraph.

## Style — readability is the #1 priority
- Natural, idiomatic, **publication-quality** English a native reader breezes through —
  NOT literal/machine translation. Match the genre's tone (e.g. modern romance/revenge,
  period drama, xianxia) to the book.
- Plain, everyday words over showy/archaic vocabulary. Short, clean sentences; break
  Chinese run-ons into two or three English sentences.
- Preserve every plot beat, line of dialogue, and emotional turn. Do **not** summarize,
  skip, or invent content. Keep paragraph boundaries close to the source.
- For idioms, 成語, proverbs, and 歇後語: keep the idiom's image in the prose, then add its
  plain-English meaning inline in double parentheses `(( ))` — e.g. 畫蛇添足 →
  "drawing a snake and adding feet (( overdoing it and spoiling what was already fine ))".
  Keep the gloss short; plain non-figurative set-phrases need no gloss. Never leave a bare
  calque that reads as nonsense.
- Convert Chinese punctuation （「」『』，。…—) to English equivalents. Make dropped Chinese
  pronouns explicit in English.
- Render quoted work/product/design names in English quotes.
- On-screen text that is meant to stay in its original script (e.g. a sign, a foreign
  phrase the narrative explicitly quotes) may remain — explain it in English alongside.

## Names
- Romanize personal names in Hanyu Pinyin, **no tone marks**, keeping Chinese
  family-name-first order (e.g. 蘇清鳶 → "Su Qingyuan"). Never Westernize the order.
- Real-world brands/places use the standard English name (卡地亞 → Cartier, 盧浮宮 → the Louvre).
- Once a name's English form is fixed in the glossary, **never vary it**. Watch for
  near-identical names that differ by one character — keep them distinct.

## Self-check before writing
- Read it as a tired reader on their phone: did any sentence make you re-read? Simplify.
- Every name/term matches the glossary. No dropped sentences (rough line-count parity).
- Tense and POV consistent. No stray untranslated text except deliberate on-screen script.
