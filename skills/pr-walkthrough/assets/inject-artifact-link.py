#!/usr/bin/env python3
"""Put the published artifact's link at the top of the local walkthrough page.

Adds a banner with the URL as a clickable link plus a copy button, so the link
can be pasted straight into a PR description. Self-contained (its own style and
script) and idempotent: re-running replaces the existing banner.

Usage: inject-artifact-link.py <walkthrough.html> <artifact-url>
"""
import html
import pathlib
import re
import sys

path, url = pathlib.Path(sys.argv[1]), sys.argv[2].strip()
text = path.read_text()

BANNER = """<div id="artifact-banner">
<style>
  #artifact-banner {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    margin: 0 0 28px; padding: 10px 14px;
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 6px; font-size: 0.85rem;
  }
  #artifact-banner .label { color: var(--muted); }
  #artifact-banner a {
    color: var(--accent); text-decoration: none;
    overflow-wrap: anywhere; flex: 1; min-width: 200px;
  }
  #artifact-banner a:hover { text-decoration: underline; }
  #artifact-banner button {
    background: transparent; color: var(--text);
    border: 1px solid var(--border); border-radius: 5px;
    padding: 4px 10px; font: inherit; font-size: 0.8rem; cursor: pointer;
  }
  #artifact-banner button:hover { border-color: var(--accent); color: var(--accent); }
  #artifact-banner button.done { border-color: var(--green); color: var(--green); }
</style>
<span class="label">Shared artifact</span>
<a href="__URL__" target="_blank" rel="noopener">__URL__</a>
<button type="button">Copy</button>
<script>
(function () {
  var btn = document.currentScript.previousElementSibling;
  var url = "__URL__";
  btn.addEventListener("click", function () {
    function done() {
      btn.textContent = "Copied";
      btn.classList.add("done");
      setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1500);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(done, fallback);
    } else {
      fallback();
    }
    // file:// pages are not a secure context in every browser, so keep a path
    // that works without the async clipboard API.
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { btn.textContent = "Copy failed"; }
      document.body.removeChild(ta);
    }
  });
})();
</script>
</div>
""".replace("__URL__", html.escape(url, quote=True))

text = re.sub(r'<div id="artifact-banner">.*?</div>\n', "", text, flags=re.S)

anchor = '<div id="doc-header"></div>'
if anchor not in text:
    sys.exit("inject-artifact-link: doc-header anchor not found")
text = text.replace(anchor, BANNER + anchor, 1)

path.write_text(text)
