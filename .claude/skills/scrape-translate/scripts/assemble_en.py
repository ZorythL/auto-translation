"""
After all chapters are translated into <book_folder>/english/NNN.txt, build the
combined English book + table of contents, and run QA checks.

Usage:
    python assemble_en.py "<book_folder>" [--title "<English Book Title>"]

Writes:
    <book_folder>/FULL_BOOK_EN.txt
    <book_folder>/TABLE_OF_CONTENTS_EN.md

Prints a QA report (missing chapters, suspiciously short files, residual Chinese).
Exit code 1 if any chapter file is missing.
"""
import sys, io, os, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

def arg(flag, default):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default

FOLDER = sys.argv[1]
EN_TITLE = arg("--title", os.path.basename(os.path.normpath(FOLDER)))
endir = os.path.join(FOLDER, "english")
chdir = os.path.join(FOLDER, "chapters")

n_source = len([f for f in os.listdir(chdir) if f.endswith(".txt")]) if os.path.isdir(chdir) else 0
cjk = re.compile(r"[一-鿿]")

missing, small, residual, titles, parts = [], [], [], [], []
parts = [EN_TITLE, f"(English translation — source folder: {os.path.basename(os.path.normpath(FOLDER))})",
         "", "=" * 60, ""]
for i in range(1, n_source + 1):
    fp = os.path.join(endir, f"{i:03d}.txt")
    if not os.path.exists(fp):
        missing.append(i); continue
    t = open(fp, encoding="utf-8").read()
    lines = t.split("\n")
    titles.append(lines[0])
    body = "\n".join(lines[3:])
    if len(t.split()) < 300:
        small.append((i, len(t.split())))
    n_cjk = len(cjk.findall(body))
    if n_cjk > 0:
        residual.append((i, n_cjk))
    parts.append(t.rstrip() + "\n\n" + "=" * 40 + "\n")

toc = [f"# Table of Contents — {EN_TITLE}", ""]
toc += [f"- {x}" for x in titles]

open(os.path.join(FOLDER, "FULL_BOOK_EN.txt"), "w", encoding="utf-8").write("\n".join(parts))
open(os.path.join(FOLDER, "TABLE_OF_CONTENTS_EN.md"), "w", encoding="utf-8").write("\n".join(toc) + "\n")

print(f"Source chapters: {n_source}")
print(f"English present: {n_source - len(missing)}/{n_source}")
print(f"Missing: {missing or 'none'}")
print(f"Short (<300 words): {small or 'none'}")
print(f"Residual Chinese (review — may be intentional, e.g. on-screen text): {residual or 'none'}")
print(f"Wrote FULL_BOOK_EN.txt + TABLE_OF_CONTENTS_EN.md")
sys.exit(1 if missing else 0)
