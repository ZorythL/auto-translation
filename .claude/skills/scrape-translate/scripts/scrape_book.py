"""
Scrape every chapter of an xbanxia.cc book over CDP (connects to the Chrome that
launch_chrome.py started), then write them into a folder named after the book.

Usage:
    python scrape_book.py <book_url_or_id> [--port 9222] [--out <base_dir>]

Output (under <base_dir>, default = current dir):
    <Book Title>/chapters/001.txt ... NNN.txt   (header line, source URL, blank, body)
    <Book Title>/FULL_BOOK.txt                  (all chapters concatenated)
    <Book Title>/manifest.json                  (index: title, url, chars per chapter)

Prints the chosen folder name on the LAST stdout line as: FOLDER=<name>
so the orchestrator can capture it.
"""
import sys, io, json, re, time, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def arg(flag, default):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default

RAW = sys.argv[1] if len(sys.argv) > 1 else "417510"
BOOK_ID = re.search(r"(\d+)", RAW).group(1)
BASE = RAW if RAW.startswith("http") else f"https://www.xbanxia.cc/books/{BOOK_ID}.html"
PORT = int(arg("--port", "9222"))
OUTBASE = arg("--out", ".")
WATERMARKS = ["半夏小說，快樂很多", "半夏小说，快乐很多", "半夏小說", "半夏小说"]

def cleared(page):
    return "稍候" not in (page.title() or "") and "challenges.cloudflare" not in page.content()

def sanitize(name):
    name = re.sub(r'[\\/:*?"<>|]', "_", name).strip().strip(".")
    return name[:120] or BOOK_ID

def ch_num(url):
    m = re.search(rf"/{BOOK_ID}/(\d+)\.html", url)
    return int(m.group(1)) if m else 0

def clean(txt):
    out = []
    for ln in (l.strip() for l in txt.split("\n")):
        if not ln: continue
        if any(w in ln and len(ln) < 30 for w in WATERMARKS): continue
        out.append(ln)
    return "\n".join(out)

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp(f"http://localhost:{PORT}")
    ctx = browser.contexts[0]
    page = next((pg for pg in ctx.pages if BOOK_ID in pg.url), None) or ctx.new_page()
    if BOOK_ID not in page.url:
        page.goto(BASE, wait_until="domcontentloaded")
    for _ in range(60):
        if cleared(page): break
        time.sleep(1)
    if not cleared(page):
        raise SystemExit("Cloudflare not cleared. Click the checkbox in Chrome, then rerun.")

    soup = BeautifulSoup(page.content(), "html.parser")
    # The <h1> is the site logo; the real book title is the first comma-segment of <title>.
    raw_title = (soup.title.get_text(strip=True) if soup.title else page.title())
    book_title = re.split(r"[,，]", raw_title)[0].split(" - ")[0].strip()

    seen = {}
    for a in soup.find_all("a", href=True):
        if re.search(rf"/{BOOK_ID}/\d+\.html", a["href"]):
            full = urljoin(BASE, a["href"]); txt = a.get_text(strip=True)
            if txt: seen[full] = txt
    ordered = sorted(({"url": u, "title": t} for u, t in seen.items()), key=lambda c: ch_num(c["url"]))
    print(f"BOOK: {book_title}  CHAPTERS: {len(ordered)}", file=sys.stderr)
    if not ordered:
        raise SystemExit("No chapter links found — page layout may differ; inspect manually.")

    folder = os.path.join(OUTBASE, sanitize(book_title))
    chdir = os.path.join(folder, "chapters")
    os.makedirs(chdir, exist_ok=True)

    def extract(url, attempts=3):
        for _ in range(attempts):
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            for _ in range(40):
                html = page.content()
                if cleared(page) and 'id="nr1"' in html:
                    nr = BeautifulSoup(html, "html.parser").find(id="nr1")
                    if nr: return clean(nr.get_text("\n", strip=True)), page.title()
                time.sleep(1)
            time.sleep(2)
        return None, page.title()

    results = []
    for i, c in enumerate(ordered, 1):
        body, ptitle = extract(c["url"])
        if body is None:
            print(f"[{i}/{len(ordered)}] FAILED {c['title']}", file=sys.stderr)
            results.append({**c, "ok": False}); continue
        fn = os.path.join(chdir, f"{i:03d}.txt")
        open(fn, "w", encoding="utf-8").write(f"{ptitle}\n{c['url']}\n\n{body}\n")
        results.append({**c, "ok": True, "page_title": ptitle, "file": fn, "chars": len(body)})
        print(f"[{i}/{len(ordered)}] OK {c['title']} ({len(body)} chars)", file=sys.stderr)
        time.sleep(1.2)
    page.close()

with open(os.path.join(folder, "FULL_BOOK.txt"), "w", encoding="utf-8") as f:
    f.write(f"{book_title}\n源: {BASE}\n\n")
    for r in results:
        if r.get("ok"):
            f.write(open(r["file"], encoding="utf-8").read()); f.write("\n\n" + "="*40 + "\n\n")
json.dump({"book_title": book_title, "source": BASE, "count": len(results), "chapters": results},
          open(os.path.join(folder, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
ok = sum(1 for r in results if r.get("ok"))
print(f"DONE: {ok}/{len(results)} chapters -> {folder}/", file=sys.stderr)
print(f"FOLDER={sanitize(book_title)}")
