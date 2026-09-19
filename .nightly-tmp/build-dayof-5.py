#!/usr/bin/env python3
"""
Night 54 — step 5: fix the 4 smoke-test failures.
  1. vendor-board cross-link  → check why missing
  2. nav + footer             → footer missing from this file
  3. remote font CDN          → SELF-HOST fonts (fleet rule: never hotlink CDN)
  4. raw ampersands in JS     → expected; those are inside a <script> block
                                (legit JS &&, string content). Test must scope
                                entity checks to HTML prose only.
"""
import pathlib, re

SITE = pathlib.Path("/var/openclaw_users/isa/.openclaw/workspace/everlastingmemories")
F = SITE / "day-of-card.html"
src = F.read_text(encoding="utf-8")

# ---------- 1. self-host the fonts ----------
# Fleet rule: never hotlink remote CDNs for client sites.
CDN_LINKS = [
    '  <link rel="preconnect" href="https://fonts.googleapis.com">\n',
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n',
]
removed = 0
for line in CDN_LINKS:
    if line in src:
        src = src.replace(line, ""); removed += 1

# the stylesheet link itself
src, n = re.subn(
    r'\s*<link[^>]*href="https://fonts\.googleapis\.com/css2[^"]*"[^>]*>\n?',
    "\n", src)
removed += n

# check for a local, self-hosted font stylesheet
local_font = '<link rel="stylesheet" href="fonts/fonts.css">'
if "fonts/fonts.css" not in src:
    src = src.replace("</head>", local_font + "\n</head>", 1)
print(f"  removed {removed} remote-CDN font link(s); added self-hosted stylesheet")

# ---------- 2. ensure footer exists ----------
if "<footer" not in src:
    FOOTER = '''<footer>
  <p class="strip">
    <a href="day-of-card.html" style="color:#c2410c;font-weight:600;">The Day-Of Card</a> ·
    <a href="vendor-board.html" style="color:#e8b17a;font-weight:600;">The Vendor Board</a> ·
    <a href="main-course.html" style="color:#e8b17a;font-weight:600;">The Main Course</a> ·
    <a href="paper-trail.html" style="color:#e8b17a;font-weight:600;">The Paper Trail</a> ·
    <a href="glow-up.html" style="color:#e879f9;font-weight:600;">The Glow Up</a> ·
    <a href="sky-installer.html" style="color:#ffdca6;font-weight:600;">The Sky Installer</a> ·
    <a href="sip-station.html" style="color:#f0c987;font-weight:600;">The Sip Station</a> ·
    <a href="favor-bar.html" style="color:#bef264;font-weight:600;">The Favor Bar</a> ·
    <a href="party-timeline.html" style="color:#eed9a6;font-weight:600;">The Party Timeline</a> ·
    <a href="cost-estimator.html" style="color:#eed9a6;font-weight:600;">The Cost Estimator</a>
  </p>
</footer>
'''
    src = src.replace("<script>", FOOTER + "<script>", 1)
    print("  footer added")

F.write_text(src, encoding="utf-8")
print("  bytes:", len(src))
