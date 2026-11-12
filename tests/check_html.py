"""Sanity check for the SnipLink front end.

Validates that src/index.html is well-formed enough to ship:
- parses with the standard-library HTML parser (no deps),
- references styles.css and app.js,
- contains the form controls the JavaScript expects (by id),
- contains no leftover placeholder text.

Run:  python3 tests/check_html.py
Exit code 0 = pass, 1 = fail.
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "src" / "index.html"

REQUIRED_IDS = [
    "shorten-form", "url-input", "alias-input", "shorten-btn", "status",
    "result", "short-url", "copy-btn", "qr-btn", "health-btn", "health",
    "qr-wrap", "qr-img", "history-list", "history-empty", "clear-history",
]

failures = []


class TagCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.scripts = []
        self.styles = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if "id" in d:
            self.ids.add(d["id"])
        if tag == "script" and "src" in d:
            self.scripts.append(d["src"])
        if tag == "link" and d.get("rel") == "stylesheet":
            self.styles.append(d.get("href", ""))


def check(condition, message):
    print(("PASS  " if condition else "FAIL  ") + message)
    if not condition:
        failures.append(message)


def main():
    check(HTML.exists(), f"src/index.html exists ({HTML})")
    if not HTML.exists():
        return 1
    text = HTML.read_text(encoding="utf-8")

    parser = TagCollector()
    try:
        parser.feed(text)
        check(True, "HTML parses without errors")
    except Exception as exc:  # pragma: no cover - parser rarely raises
        check(False, f"HTML parses without errors ({exc})")

    for rid in REQUIRED_IDS:
        check(rid in parser.ids, f"element with id='{rid}' present")
    check("app.js" in parser.scripts, "index.html loads app.js")
    check(any("styles.css" in s for s in parser.styles), "index.html loads styles.css")
    check("TODO" not in text and "Lorem ipsum" not in text,
          "no TODO / Lorem ipsum placeholder text")

    js = (ROOT / "src" / "app.js").read_text(encoding="utf-8")
    check("is.gd" in js, "app.js references the is.gd API")
    check("tinyurl" in js.lower(), "app.js has a TinyURL fallback")
    check("localStorage" in js, "app.js persists history in localStorage")
    check("clipboard" in js, "app.js implements copy-to-clipboard")

    css = (ROOT / "src" / "styles.css").read_text(encoding="utf-8")
    check(len(css.strip()) > 200, "styles.css is non-trivial")

    print(f"\n{len(failures)} failure(s).")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
