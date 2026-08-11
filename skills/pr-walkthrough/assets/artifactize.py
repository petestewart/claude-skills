#!/usr/bin/env python3
"""Derive an artifact-safe copy of a walkthrough HTML file.

Artifacts are published inside a host-provided <!doctype>/<head>/<body> shell and
run under a CSP that blocks every request to another host, so the local page's
wrapper tags and its localhost dashboard integrations cannot come along.

Emits body content only:
  - keeps the <style> block and the walkthrough/diff markup and JS
  - drops <!doctype>, <html>, <head>, <meta>, <title>, <body> tags
  - drops the EXPLAIN_ANCHOR script, so the GitHub "Viewed" checkboxes never
    render and their fetches to 127.0.0.1 never fire (prAnchor() returns null)
  - drops the "Ask about this change" chat panel markup and its script block

Usage: artifactize.py <input.html> <output.html>
Prints the page title to stdout for the publish step.
"""
import pathlib
import re
import sys

src, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
text = src.read_text()

title_match = re.search(r"<title>(.*?)</title>", text, re.S)
title = title_match.group(1).strip() if title_match else src.stem

style = text[text.index("<style>") : text.index("</style>") + len("</style>")]
body = text[text.index("<body>") + len("<body>") : text.rindex("</body>")]

# Potential Issues is review material for the author, who has already read it and
# decided what to act on. The shared copy is the explanation of the merged change,
# so drop the section and its TOC entry.
body, n = re.subn(
    r"<h2\b[^>]*>(?:(?!</h2>).)*?Potential issues.*?(?=<h2\b|</div>\s*<div id=\"view-diff\")",
    "",
    body,
    flags=re.S | re.I,
)
if n:
    body = re.sub(
        r"\s*<a href=\"#[^\"]*\">[^<]*Potential issues[^<]*</a>", "", body, flags=re.I
    )

# A previous publish may have left its link banner in the local page; the artifact
# should not carry a link to itself.
body = re.sub(r'<div id="artifact-banner">.*?</div>\n', "", body, flags=re.S)

# The chat panel markup sits between the page content and the first script block.
ask = body.find('<button id="ask-btn">')
if ask != -1:
    body = body[:ask] + body[body.index("<script>", ask) :]

# The chat panel's JS is the last script block in the body.
chat_js = body.rfind("<script>")
if chat_js != -1 and "127.0.0.1" in body[chat_js:]:
    body = body[:chat_js]

out = style + "\n" + body.strip() + "\n"

# The kept script block still contains the viewed-sync call sites, but they are
# unreachable without an anchor: prAnchor() returns null, so no checkbox is built
# and hydrateViewed() returns before its fetch. Assert the anchor is really gone,
# which is the gate the whole thing hangs on.
if "EXPLAIN_ANCHOR = {" in out:
    sys.exit("artifactize: chat anchor survived the transform, refusing to write")
if 'id="chat-transcript"' in out:
    sys.exit("artifactize: chat panel survived the transform, refusing to write")

dst.write_text(out)
print(title)
