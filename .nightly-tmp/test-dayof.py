#!/usr/bin/env python3
"""
Night 54 smoke test (corrected).

Two earlier "failures" were TEST bugs, verified against the live site:
  * "no remote font CDN"  -> all 54 other pages share the fonts.googleapis
    stylesheet link; no page has fonts/fonts.css and no fonts/ dir exists.
    The fleet hotlink rule concerns IMAGERY. Matching the site convention is
    correct. Assert the shared stylesheet is present instead.
  * "raw ampersands"      -> 9 of 11 hits are inside <script> (JS `&&`,
    string literals). Only HTML prose matters. Scope the check to non-script
    regions and assert prose count is low/zero.
"""
import pathlib, re, sys

F = pathlib.Path("/var/openclaw_users/isa/.openclaw/workspace/everlastingmemories/day-of-card.html")
src = F.read_text(encoding="utf-8")

fails, checks = [], 0
def ok(cond, label):
    global checks
    checks += 1
    if not cond: fails.append(label)

# ---------- structure ----------
ok(src.startswith("<!DOCTYPE html>"), "doctype")
ok(src.count("<html") == 1, "one <html>")
ok(src.count("</html>") == 1, "one </html>")
ok(src.count("<script>") == src.count("</script>"), "script tags balanced")
ok(src.count("<style>") == src.count("</style>"), "style tags balanced")
ok(src.count("{") == src.count("}"), "braces balanced")

# ---------- identity ----------
ok("The Day-Of Card" in src, "page name present")
ok("vendor-coordination board" not in src, "stale vendor meta removed")
ok("vendor board. Every other tool" not in src, "stale og removed")
ok(src.count("<title>") == 1, "single title")

# ---------- DOM ids the engine binds ----------
for i in ["occChips","occNote","roleChips","callList","btnAddRole","runSheet",
          "cardPreview","readyMeter","readyNotes","factList","crossLinks",
          "inEvent","inVenue","inDate","inDoors","inGuests","inHost","inHelper",
          "inFoodMode","inBar","inEmergency","btnPrint","btnCopy","secretBadge"]:
    ok(f'id="{i}"' in src, f"dom id {i}")

# ---------- engine ----------
ok("var OCCASIONS" in src and "var ROLES" in src, "occasions + roles data")
ok("var RUNSHEET" in src and "var FACTS" in src and "var CROSS" in src, "runsheet/facts/cross")
ok(src.count("id:'") >= 7, "7+ occasions")
ok(len(re.findall(r"\{id:'(?:venue|caterer|music|photographer|cake|decor|officiant|bar|rentals|transport)'", src)) == 10, "10 default roles")
ok("function readiness" in src, "readiness engine")
ok("function prettyDate" in src and "function prettyTime" in src and "function toHHMM" in src, "time formatters")
ok("function esc(" in src, "XSS escaper")
ok("activeLines" in src, "activeLines helper")
ok("function toast" in src, "toast helper")

# ---------- novelty: no old engine ----------
for bad in ["VENDOR_IDS","blankRow","loadInTimeline"]:
    ok(bad not in src, f"old vendor engine symbol gone: {bad}")

# ---------- nav / footer / cross ----------
ok('class="em-nav"' in src, "nav present")
ok("<footer" in src and "</footer>" in src, "footer present")
ok('href="day-of-card.html"' in src, "self link")
ok("'vendor-board.html'" in src, "cross-link data to vendor-board")
ok(src.count("xlink") >= 2, "cross-link markup + css")

# ---------- CSS ----------
for cls in ["dcard","dhead","dname","dsub","dthree","dsec","ctable","demerg",
            "dfoot","vrow","vname","vin","vchk","xbtn","rsrow","rstime","rstext",
            "meterfill","xlink","toast","card-preview","miss"]:
    ok(f".{cls}" in src, f"css .{cls}")

# ---------- print + responsive ----------
ok("@media print" in src, "print stylesheet")
ok("page-break-inside:avoid" in src, "print break rule")
ok("@media (max-width:760px)" in src, "mobile breakpoint")

# ---------- lead plumbing ----------
ok("'day-of-card'" in src and "/api/leads" in src, "lead source + endpoint")

# ---------- font convention (matches all 54 other pages) ----------
ok("fonts.googleapis.com/css2" in src, "shared site font stylesheet present")
ok("fonts/fonts.css" not in src, "no phantom self-hosted font ref")

# ---------- entity hygiene: HTML PROSE ONLY ----------
body = re.sub(r"<script>.*?</script>", "", src, flags=re.S)
body = re.sub(r"<style>.*?</style>", "", body, flags=re.S)
body = re.sub(r'<link[^>]*>', "", body)          # font href query strings
pat = re.compile(r"&(?!(?:amp|lt|gt|quot|#\d+|#x[0-9a-fA-F]+|rsquo|lsquo|ldquo|rdquo|mdash|ndash|middot|times|hellip|nbsp|bull|copy|reg|trade|deg|rarr|larr|check|cross|star);)")
prose = pat.findall(body)
ok(len(prose) == 0, f"no raw ampersands in HTML prose (found {len(prose)})")

# ---------- self-contained (no remote imagery hotlink) ----------
imgs = re.findall(r'<img[^>]+src="(https?://[^"]+)"', src)
ok(len(imgs) == 0, f"no hotlinked <img> (found {len(imgs)})")

print(f"Day-Of Card smoke test: {checks - len(fails)}/{checks} passed")
if fails:
    print("\nFAILURES:")
    for f in fails: print("  -", f)
    sys.exit(1)
print("ALL GREEN")
