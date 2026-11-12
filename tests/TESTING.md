# Manual testing checklist — SnipLink

Run the automated check first: `python3 tests/check_html.py` (must exit 0).

Then work through this list in a browser (needs internet — the APIs are live):

- [ ] Open `src/index.html` — page renders, no console errors.
- [ ] Paste `https://example.com/a/very/long/page` and press **Shorten** —
      a short `https://is.gd/…` link appears.
- [ ] Press **Copy**, paste elsewhere — the short link is on the clipboard.
- [ ] Press **Show QR** — a QR code appears; scanning it opens the link.
- [ ] Press **Check link health** — reports the destination responded.
- [ ] Shorten a second URL — both links appear in **Your links**, newest first.
- [ ] Click a short link in the history — its click count goes from 0 to 1.
- [ ] Reload the page — history is still there (localStorage persistence).
- [ ] Enter a custom alias (e.g. `sniplink-demo-1`) — the short link uses it.
- [ ] Re-use the same alias — error message shown, TinyURL fallback offered.
- [ ] Type `not a url` and submit — a friendly validation error appears,
      no short link is shown.
- [ ] Disconnect from the network and shorten — a clear "couldn't shorten"
      error appears instead of a hang or blank result.
- [ ] Press **Clear history**, confirm — the list empties.
- [ ] Resize to a 360px-wide viewport — layout stays usable, no horizontal scroll.
