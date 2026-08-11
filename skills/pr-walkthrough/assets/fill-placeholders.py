#!/usr/bin/env python3
"""Fill the untrusted placeholders in a walkthrough HTML file.

PR metadata (title, branch name, repo nwo, raw diff) comes from GitHub and must
never be pasted into the document as literal markup: a PR titled
"</title><script>...</script>" would otherwise execute when the page opens, with
the private diff in reach. Every value here is serialized for the context it
lands in - HTML-escaped inside the <title>, JSON-encoded inside the anchor
<script> (with "<" escaped so no substring can close the tag).

It also stamps generatedAt and the local server token into the anchor, so the
page can authenticate to the loopback server.

Usage:
  fill-placeholders.py OUT.html --title "PR title" --repo /abs/path \\
      --ref-range base...head --diff /tmp/pr123.diff \\
      [--pr-number 123 --repo-nwo owner/name] [--branch my-branch]

Exactly one of --pr-number (PR mode) or --branch (local-branch mode) is required.
"""
import argparse
import datetime
import html
import json
import pathlib
import secrets
import sys

TOKEN_PATH = pathlib.Path.home() / ".claude" / "skills" / "pr-walkthrough" / "server-token"


def load_or_create_token() -> str:
    """Shared secret with server.mjs, which reads/creates the same file."""
    try:
        tok = TOKEN_PATH.read_text().strip()
        if tok:
            return tok
    except OSError:
        pass
    tok = secrets.token_hex(32)
    try:
        TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
        TOKEN_PATH.write_text(tok + "\n")
        TOKEN_PATH.chmod(0o600)
    except OSError as e:
        print(f"fill-placeholders: could not write {TOKEN_PATH}: {e}", file=sys.stderr)
        return ""
    return tok


def json_for_script(obj) -> str:
    """JSON safe to embed in a <script> block: no raw "<" can start "</script>"."""
    return json.dumps(obj).replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


p = argparse.ArgumentParser()
p.add_argument("out")
p.add_argument("--title", required=True, help="PR title, or a short title for a branch walkthrough")
p.add_argument("--repo", required=True, help="absolute path of the repo the diff came from")
p.add_argument("--ref-range", required=True, help="git range, e.g. <baseSha>...<headSha>")
p.add_argument("--diff", required=True, help="path to the raw unified diff")
p.add_argument("--pr-number", type=int)
p.add_argument("--repo-nwo", default="")
p.add_argument("--branch", help="branch slug, for a walkthrough with no PR")
a = p.parse_args()

if (a.pr_number is None) == (a.branch is None):
    p.error("pass exactly one of --pr-number or --branch")

label = f"PR #{a.pr_number}" if a.pr_number else f"Branch {a.branch}"
page_title = f"{label} Walkthrough: {a.title}"

anchor = {
    "sessionId": None,
    "repo": a.repo,
    "refRange": a.ref_range,
    "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    # Viewed-sync needs a real PR; a branch walkthrough leaves both empty/null so
    # the checkboxes never render.
    "repoNwo": a.repo_nwo if a.pr_number else "",
    "prNumber": a.pr_number,
    "token": load_or_create_token(),
}

out = pathlib.Path(a.out)
text = out.read_text()
text = text.replace("{{PAGE_TITLE}}", html.escape(page_title))
text = text.replace("{{ANCHOR_JSON}}", json_for_script(anchor))
text = text.replace("{{RAW_DIFF}}", html.escape(pathlib.Path(a.diff).read_text()))
out.write_text(text)

leftover = [ph for ph in ("{{PAGE_TITLE}}", "{{ANCHOR_JSON}}", "{{RAW_DIFF}}", "{{CONTENT}}") if ph in text]
if leftover:
    sys.exit("fill-placeholders: unfilled placeholders remain: " + ", ".join(leftover))
print(page_title)
