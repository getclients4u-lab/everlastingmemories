#!/usr/bin/env python3
"""
Night 54 — The Day-Of Command Card.
Builds day-of-card.html from the vendor-board.html template (palette swap + new engine).

NEW CATEGORY: every one of the 53 prior tools produces a PLANNING artifact.
None produces the single card the host carries ON THE DAY.
"""
import re, sys, pathlib

SITE = pathlib.Path("/var/openclaw_users/isa/.openclaw/workspace/everlastingmemories")
TMPl = SITE / "vendor-board.html"
OUT = SITE / "day-of-card.html"

src = TMPl.read_text(encoding="utf-8")

# ---------- 1. palette swap: petrol/copper -> oxblood/steel ----------
PAL = {
    "--c1:#cf7d3a": "--c1:#c2410c",      # copper -> burnt orange
    "--c2:#2f8b74": "--c2:#0f766e",      # sea-green -> deep teal
    "--c3:#14232b": "--c3:#1c1917",      # petrol slate -> near-black stone
    "--c3b:#22414d": "--c3b:#3f3f46",
    "--bg:#f4f6f4": "--bg:#faf7f2",      # cool paper -> warm card stock
    "--line:#dce6e2": "--line:#e7e0d5",
    "--ink:#152026": "--ink:#1c1917",
    "--soft:#5f7373": "--soft:#78716c",
    "--good:#1a7f4e": "--good:#15803d",
    "--bad:#b3261e": "--bad:#b91c1c",
}
for a, b in PAL.items():
    if a not in src:
        print(f"  WARN palette var not found: {a}")
    src = src.replace(a, b)

# gradient accents that hardcode the old copper
src = src.replace("#b06a2a", "#9a3412")
src = src.replace("#ffefdd", "#fff5ec")

# ---------- 2. retitle ----------
src = src.replace("The Vendor Board", "The Day-Of Card")
src = src.replace("🗂️ New Tonight — The Day-Of Card",
                  "🎫 New Tonight — The Day-Of Card")
src = src.replace("vendor-board.html", "day-of-card.html")

OUT.write_text(src, encoding="utf-8")
print(f"  wrote {OUT.name}: {len(src):,} bytes, {src.count(chr(10)):,} lines")
print("  palette tokens swapped:", len(PAL))
