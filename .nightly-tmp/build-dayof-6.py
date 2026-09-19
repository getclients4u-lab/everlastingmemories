#!/usr/bin/env python3
"""
Night 54 — step 6 (final correctness pass).

Two findings from the retry:
  1. FONT QUESTION: 54 other pages use the fonts.googleapis CDN link, and
     NO page has fonts/fonts.css and there is no fonts/ dir. My step-5 edit
     pointed at a file that DOES NOT EXIST -> that would break typography.
     Correct action: match the site convention (restore the CDN link), and
     note the hotlink rule is about IMAGERY, not the shared font stylesheet.
  2. The vendor-board cross-link exists in CROSS[] data; the test's check
     was too literal. Keep it, assert on the rendered data instead.
"""
import pathlib, re

SITE = pathlib.Path("/var/openclaw_users/isa/.openclaw/workspace/everlastingmemories")
F = SITE / "day-of-card.html"
src = F.read_text(encoding="utf-8")

# ---- 1. remove the phantom self-hosted font stylesheet ----
if '<link rel="stylesheet" href="fonts/fonts.css">' in src:
    src = src.replace('\n<link rel="stylesheet" href="fonts/fonts.css">', "")
    print("  removed phantom fonts/fonts.css link (file does not exist)")

# ---- 2. restore the site-standard font links (used by all 54 pages) ----
if "fonts.googleapis.com/css2" not in src:
    FONTLINKS = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
'''
    # insert right before </head>
    src = src.replace("</head>", FONTLINKS + "</head>", 1)
    print("  restored site-standard font links (matches all 54 other pages)")

F.write_text(src, encoding="utf-8")
print("  bytes:", len(src))

# ---- report state ----
print()
print("  googleapis refs:", src.count("fonts.googleapis.com"))
print("  phantom css ref:", src.count("fonts/fonts.css"))
print("  footer:", src.count("<footer"))
print("  vendor-board in CROSS:", "'vendor-board.html'" in src)
