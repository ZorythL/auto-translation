"""
Launch (or reuse) a CLEAN Chrome with a remote-debugging port so the scraper can
drive it over CDP. Launching Chrome normally — WITHOUT Playwright's automation
flags — is what lets it clear the Cloudflare "请稍候…/Just a moment" challenge
(usually automatically; occasionally the user must click the checkbox once).

Usage:
    python launch_chrome.py <book_url_or_id> [--port 9222] [--profile <dir>]

Examples:
    python launch_chrome.py https://www.xbanxia.cc/books/417510.html
    python launch_chrome.py 417510

Exit code 0 = a Chrome with the debug port is running AND the target page has
cleared Cloudflare. Exit code 2 = port is up but still challenged (ask the user
to click the verification checkbox in the Chrome window, then re-run the scraper).
"""
import sys, io, os, re, json, time, glob, subprocess, urllib.request, platform
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

def arg(flag, default):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default

def normalize_url(a):
    if a.startswith("http"):
        return a
    return f"https://www.xbanxia.cc/books/{a}.html"

def find_chrome():
    if os.environ.get("CHROME_PATH"):
        return os.environ["CHROME_PATH"]
    sysname = platform.system()
    candidates = []
    if sysname == "Windows":
        candidates = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        ]
    elif sysname == "Darwin":
        candidates = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
    else:
        candidates = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
                      "/usr/bin/microsoft-edge"]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    raise SystemExit("Chrome/Edge not found. Set CHROME_PATH env var to the browser executable.")

def cdp_up(port):
    try:
        urllib.request.urlopen(f"http://localhost:{port}/json/version", timeout=2).read()
        return True
    except Exception:
        return False

def tabs(port):
    try:
        return json.load(urllib.request.urlopen(f"http://localhost:{port}/json/list", timeout=3))
    except Exception:
        return []

def is_challenge(title):
    t = (title or "").lower()
    return ("just a moment" in t) or ("稍候" in title) or ("请稍候" in title) or ("attention required" in t)

def main():
    url = normalize_url(sys.argv[1])
    bid_m = re.search(r"/books/(\d+)", url)
    book_id = bid_m.group(1) if bid_m else "book"
    port = int(arg("--port", "9222"))
    profile = arg("--profile", os.path.abspath("cf_profile"))

    if not cdp_up(port):
        chrome = find_chrome()
        os.makedirs(profile, exist_ok=True)
        args = [chrome, f"--remote-debugging-port={port}", f"--user-data-dir={profile}",
                "--no-first-run", "--no-default-browser-check", url]
        print(f"Launching: {chrome}\n  port={port} profile={profile}\n  url={url}", file=sys.stderr)
        subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                         creationflags=getattr(subprocess, "DETACHED_PROCESS", 0))
        for _ in range(30):
            if cdp_up(port): break
            time.sleep(1)
    else:
        print(f"Reusing existing Chrome on port {port}.", file=sys.stderr)

    if not cdp_up(port):
        raise SystemExit("Failed to bring up Chrome debug port.")

    # Wait (up to 90s) for the target page to clear Cloudflare.
    for i in range(90):
        ts = [t for t in tabs(port) if t.get("type") == "page" and book_id in t.get("url", "")]
        if ts:
            title = ts[0].get("title", "")
            if not is_challenge(title):
                print(f"CLEARED — title: {title}")
                return 0
            if i % 5 == 0:
                print(f"[{i}] waiting for Cloudflare to clear (title={title!r})... "
                      f"if a checkbox is showing, click it in the Chrome window.", file=sys.stderr)
        else:
            if i % 5 == 0:
                print(f"[{i}] waiting for the book tab to appear...", file=sys.stderr)
        time.sleep(1)

    print("STILL CHALLENGED — click the 'Verify you are human' checkbox in the Chrome window, "
          "then run the scraper.", file=sys.stderr)
    return 2

if __name__ == "__main__":
    raise SystemExit(main())
