# SnipLink — URL Shortener

Shorten long URLs in one click, copy them, generate a QR code, and keep a
history of every link — all in the browser, with no sign-up and no server of
your own.

![Status](https://img.shields.io/badge/status-working-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Instant shortening** — paste a URL, get a short link via the free is.gd
  public API (no API key). If is.gd fails, TinyURL is tried automatically.
- **One-click copy** — copy the short link with the Clipboard API, with a
  fallback for older browsers.
- **QR code per link** — one click generates a scannable QR code for the
  short URL.
- **Link history with click counts** — every shortened link is saved in
  `localStorage` (max 50). Clicking a saved link bumps its counter.
- **Custom alias** — request your own short slug where is.gd allows it
  (letters, numbers, dashes, underscores).
- **Link health check** — probes the destination and reports whether it
  still responds, so dead links don't get shared.
- **Graceful error handling** — invalid URLs, a taken alias, a down API, or
  no network all produce a plain-language message instead of a blank page.

## Tech Stack

- HTML5, CSS3, vanilla JavaScript (no framework, no build step)
- [is.gd API](https://is.gd/apishorteningreference.php) (primary, free, no key)
- [TinyURL API](https://tinyurl.com) (fallback, free, no key)
- [api.qrserver.com](https://api.qrserver.com) for QR codes
- `localStorage` for history persistence

## How to Run

No build step and no dependencies. Just open the file:

```bash
# Option 1 — open directly
open src/index.html        # macOS
xdg-open src/index.html    # Linux
start src\index.html       # Windows

# Option 2 — serve locally (recommended, avoids file:// quirks)
python3 -m http.server --directory src 8000
# then visit http://localhost:8000
```

Then paste a URL (e.g. `https://example.com/a/very/long/page`) and press
**Shorten**. An internet connection is required — the shortening itself is
done by the is.gd / TinyURL public APIs.

## How It Works

1. The URL is normalised (`https://` is added if missing) and validated.
2. `app.js` calls `https://is.gd/create.php?format=json&url=…` (plus
   `&shorturl=…` when a custom alias is given).
3. On any is.gd error the app falls back to TinyURL's
   `api-create.php` endpoint.
4. The result is shown with Copy / QR / Health-check actions and saved to
   history in `localStorage`.

See [docs/USAGE.md](docs/USAGE.md) for the full usage guide.

## Screenshots

See [screenshots/SCREENSHOTS.md](screenshots/SCREENSHOTS.md) — add a
screenshot of the main view and one of a generated QR code there.

## Tests

- Automated HTML sanity check: `python3 tests/check_html.py`
- Manual checklist: [tests/TESTING.md](tests/TESTING.md)

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Clamor.
