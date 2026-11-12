/* SnipLink — URL shortener front end.
 * Shortening: is.gd public API (free, no key), TinyURL as fallback.
 * History + click counts: localStorage only. No tracking, no sign-up.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "sniplink-history-v1";
  var QR_API = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=";

  var form = document.getElementById("shorten-form");
  var urlInput = document.getElementById("url-input");
  var aliasInput = document.getElementById("alias-input");
  var shortenBtn = document.getElementById("shorten-btn");
  var statusEl = document.getElementById("status");
  var resultEl = document.getElementById("result");
  var shortUrlEl = document.getElementById("short-url");
  var copyBtn = document.getElementById("copy-btn");
  var qrBtn = document.getElementById("qr-btn");
  var healthBtn = document.getElementById("health-btn");
  var healthEl = document.getElementById("health");
  var qrWrap = document.getElementById("qr-wrap");
  var qrImg = document.getElementById("qr-img");
  var historyList = document.getElementById("history-list");
  var historyEmpty = document.getElementById("history-empty");
  var clearBtn = document.getElementById("clear-history");

  /* ---------- history (localStorage) ---------- */

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveHistory(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
    } catch (e) { /* storage full or unavailable — history just won't persist */ }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderHistory() {
    var items = loadHistory();
    historyEmpty.style.display = items.length ? "none" : "";
    historyList.innerHTML = items.map(function (item, i) {
      return '<li>' +
        '<a href="' + escapeHtml(item.short) + '" target="_blank" rel="noopener noreferrer" data-index="' + i + '">' + escapeHtml(item.short) + '</a>' +
        '<button class="mini-copy" type="button" data-copy="' + escapeHtml(item.short) + '">Copy</button>' +
        '<span class="count">' + item.clicks + (item.clicks === 1 ? " click" : " clicks") + '</span>' +
        '<span class="orig">' + escapeHtml(item.long) + '</span>' +
        '</li>';
    }).join("");
  }

  function addToHistory(longUrl, shortUrl) {
    var items = loadHistory();
    var existing = items.find(function (it) { return it.long === longUrl; });
    if (existing) {
      existing.short = shortUrl;
      existing.created = Date.now();
      items = [existing].concat(items.filter(function (it) { return it !== existing; }));
    } else {
      items.unshift({ long: longUrl, short: shortUrl, clicks: 0, created: Date.now() });
    }
    saveHistory(items);
    renderHistory();
  }

  function bumpClick(index) {
    var items = loadHistory();
    if (items[index]) {
      items[index].clicks += 1;
      saveHistory(items);
      renderHistory();
    }
  }

  /* ---------- shortening ---------- */

  function normaliseUrl(raw) {
    var url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return url;
  }

  function isValidUrl(url) {
    try {
      var u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch (e) {
      return false;
    }
  }

  function shortenWithIsGd(longUrl, alias) {
    var endpoint = "https://is.gd/create.php?format=json&url=" + encodeURIComponent(longUrl);
    if (alias) endpoint += "&shorturl=" + encodeURIComponent(alias);
    return fetch(endpoint).then(function (resp) {
      return resp.json();
    }).then(function (data) {
      if (data.errormessage) throw new Error(data.errormessage);
      if (!data.shorturl) throw new Error("is.gd returned no short URL.");
      return data.shorturl;
    });
  }

  function shortenWithTinyUrl(longUrl) {
    return fetch("https://tinyurl.com/api-create.php?url=" + encodeURIComponent(longUrl))
      .then(function (resp) {
        if (!resp.ok) throw new Error("TinyURL request failed (" + resp.status + ").");
        return resp.text();
      })
      .then(function (text) {
        var short = text.trim();
        if (!/^https?:\/\//.test(short)) throw new Error("TinyURL returned an unexpected response.");
        return short;
      });
  }

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  function showResult(longUrl, shortUrl) {
    resultEl.classList.remove("hidden");
    shortUrlEl.textContent = shortUrl;
    shortUrlEl.href = shortUrl;
    qrWrap.classList.add("hidden");
    qrBtn.textContent = "Show QR";
    healthEl.textContent = "";
    healthEl.className = "health";
    addToHistory(longUrl, shortUrl);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var longUrl = normaliseUrl(urlInput.value);
    var alias = aliasInput.value.trim();

    if (!isValidUrl(longUrl)) {
      setStatus("That doesn't look like a valid http(s) URL. Check it and try again.", "error");
      return;
    }
    if (alias && !/^[A-Za-z0-9_-]+$/.test(alias)) {
      setStatus("Custom alias may only contain letters, numbers, dashes and underscores.", "error");
      return;
    }

    shortenBtn.disabled = true;
    setStatus("Shortening…");

    shortenWithIsGd(longUrl, alias)
      .catch(function (err) {
        // is.gd failed (alias taken, rate-limited, or offline) — try TinyURL.
        setStatus("is.gd said: " + err.message + " — trying TinyURL…");
        return shortenWithTinyUrl(longUrl);
      })
      .then(function (shortUrl) {
        setStatus("Done! Your short link is ready.", "success");
        showResult(longUrl, shortUrl);
      })
      .catch(function (err) {
        setStatus("Couldn't shorten that link: " + err.message +
          " Check your connection and that the URL is reachable, then try again.", "error");
      })
      .finally(function () {
        shortenBtn.disabled = false;
      });
  });

  /* ---------- copy / QR / health check ---------- */

  function copyText(text, button, doneLabel) {
    function done() {
      var original = button.textContent;
      button.textContent = doneLabel || "Copied!";
      setTimeout(function () { button.textContent = original; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* clipboard unavailable */ }
    document.body.removeChild(ta);
  }

  copyBtn.addEventListener("click", function () {
    copyText(shortUrlEl.href, copyBtn);
  });

  qrBtn.addEventListener("click", function () {
    if (qrWrap.classList.contains("hidden")) {
      qrImg.src = QR_API + encodeURIComponent(shortUrlEl.href);
      qrWrap.classList.remove("hidden");
      qrBtn.textContent = "Hide QR";
    } else {
      qrWrap.classList.add("hidden");
      qrBtn.textContent = "Show QR";
    }
  });

  healthBtn.addEventListener("click", function () {
    var target = null;
    try {
      var items = loadHistory();
      var match = items.find(function (it) { return it.short === shortUrlEl.href; });
      target = match ? match.long : shortUrlEl.href;
    } catch (e) {
      target = shortUrlEl.href;
    }
    healthEl.textContent = "Checking…";
    healthEl.className = "health";
    // Browsers block reading cross-origin responses, so we use a no-cors
    // probe: an opaque response means *something* answered; a network
    // error means the destination is unreachable. We report honestly.
    fetch(target, { method: "GET", mode: "no-cors", cache: "no-store" })
      .then(function () {
        healthEl.textContent = "✓ Destination responded — the link looks alive.";
        healthEl.className = "health ok";
      })
      .catch(function () {
        healthEl.textContent = "✗ Destination did not respond — the link may be down or blocking probes.";
        healthEl.className = "health bad";
      });
  });

  /* ---------- history interactions ---------- */

  historyList.addEventListener("click", function (event) {
    var copyTarget = event.target.closest("[data-copy]");
    if (copyTarget) {
      copyText(copyTarget.getAttribute("data-copy"), copyTarget, "Copied");
      return;
    }
    var link = event.target.closest("a[data-index]");
    if (link) bumpClick(parseInt(link.getAttribute("data-index"), 10));
  });

  clearBtn.addEventListener("click", function () {
    if (confirm("Clear all saved links?")) {
      saveHistory([]);
      renderHistory();
    }
  });

  renderHistory();
})();
