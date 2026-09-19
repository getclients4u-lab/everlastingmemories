#!/usr/bin/env python3
"""
Night 54 — step 4: add the CSS the new engine needs, and fix stale meta.
Inserted before </style>.
"""
import pathlib

SITE = pathlib.Path("/var/openclaw_users/isa/.openclaw/workspace/everlastingmemories")
F = SITE / "day-of-card.html"
src = F.read_text(encoding="utf-8")

CSS = '''
/* ---------- Night 54 — Day-Of Card engine ---------- */
.chip.sm{font-size:.72rem;padding:5px 10px}
.vrow{display:grid;grid-template-columns:26px 108px 1fr 104px 28px;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)}
.vrow:last-child{border-bottom:0}
.vchk{display:flex;align-items:center;justify-content:center}
.vname{font-size:.8rem;font-weight:600;color:var(--c3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vin{width:100%;font:400 .82rem 'Inter',sans-serif;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--ink)}
.vin.sm{padding:6px 6px;font-size:.76rem}
.vin:focus{outline:none;border-color:var(--c1);box-shadow:0 0 0 3px rgba(194,65,12,.10)}
.xbtn{border:0;background:none;color:var(--soft);font-size:1.15rem;line-height:1;cursor:pointer;border-radius:6px}
.xbtn:hover{color:var(--bad);background:var(--bg)}
.rsrow{display:grid;grid-template-columns:22px 86px 1fr;gap:10px;align-items:start;padding:9px 0;border-bottom:1px solid var(--line);cursor:pointer}
.rsrow:last-child{border-bottom:0}
.rsrow.done{opacity:.45}
.rsrow.done .rstext b{text-decoration:line-through}
.rstime{font-size:.76rem;font-weight:700;color:var(--c1);padding-top:1px;white-space:nowrap}
.rstext b{display:block;font-size:.84rem;font-weight:600;color:var(--ink)}
.rstext em{display:block;font-style:normal;font-size:.74rem;color:var(--soft);margin-top:2px}

/* the printable card */
.card-preview{background:#fff;border:1px solid var(--line);border-radius:14px;padding:6px}
.dcard{border:1px solid #ddd3c4;border-radius:10px;overflow:hidden;background:#fff}
.dhead{background:linear-gradient(135deg,var(--c3),#3f3f46);color:#fff5ec;padding:16px 18px}
.dkick{font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;opacity:.8;margin-bottom:5px}
.dname{font-family:'Playfair Display',serif;font-size:1.35rem;font-weight:700;line-height:1.2}
.dsub{font-size:.76rem;opacity:.88;margin-top:5px}
.dthree{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--line)}
.dthree>div{padding:11px 12px;text-align:center;border-right:1px solid var(--line)}
.dthree>div:last-child{border-right:0}
.dthree b{display:block;font-size:.86rem;color:var(--c3);font-weight:700}
.dthree span{display:block;font-size:.64rem;text-transform:uppercase;letter-spacing:.07em;color:var(--soft);margin-top:3px}
.dsec{padding:12px 16px 4px}
.dsec-h{font-size:.66rem;text-transform:uppercase;letter-spacing:.09em;color:var(--soft);font-weight:700;margin-bottom:6px}
.ctable{width:100%;border-collapse:collapse}
.ctable td{padding:5px 0;font-size:.79rem;vertical-align:top;border-bottom:1px dotted var(--line)}
.ctable tr:last-child td{border-bottom:0}
.c-role{width:34%;font-weight:600;color:var(--c3)}
.c-who{color:var(--ink)}
.c-when{width:24%;text-align:right;color:var(--c1);font-weight:600;white-space:nowrap}
.ctable.sched .c-t{width:27%;color:var(--c1);font-weight:700;white-space:nowrap}
.ctable.sched .c-txt{color:var(--ink)}
.ctable.sched tr.t-done .c-txt{text-decoration:line-through;opacity:.5}
.miss{color:var(--bad);font-style:italic;font-size:.75rem}
.demerg{margin:10px 16px;padding:10px 12px;background:#fef3ea;border-left:3px solid var(--c1);border-radius:6px;font-size:.78rem;color:var(--c3)}
.dfoot{padding:10px 16px 13px;font-size:.7rem;color:var(--soft);border-top:1px solid var(--line);margin-top:8px}

/* readiness meter */
.meter{height:11px;background:var(--line);border-radius:999px;overflow:hidden}
.meterfill{height:100%;border-radius:999px;transition:width .25s}
.meterlbl{margin-top:8px;font-size:.86rem;color:var(--ink)}
.meterlbl b{font-size:1.05rem;color:var(--c3)}
.mmstat{font-size:.74rem;color:var(--soft);margin-top:5px}
.notes{margin:10px 0 0 18px;font-size:.8rem;color:var(--c3)}
.notes li{margin-bottom:5px}
.ok{font-size:.82rem;color:var(--good);font-weight:600;margin-top:10px}
.fact{display:flex;gap:12px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--line)}
.fact:last-child{border-bottom:0}
.fn{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:700;color:var(--c1);min-width:72px}
.ft{font-size:.8rem;color:var(--ink)}
.cross{display:flex;flex-wrap:wrap;gap:9px}
.xlink{font-size:.8rem;font-weight:600;padding:7px 13px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--c3)}
.xlink:hover{border-color:var(--c1);color:var(--c1)}
.toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,14px);background:var(--c3);color:#fff5ec;padding:11px 18px;border-radius:999px;font-size:.82rem;max-width:88vw;opacity:0;transition:all .25s;z-index:200;box-shadow:0 10px 30px rgba(28,25,23,.3)}
.toast.show{opacity:1;transform:translate(-50%,0)}

/* print: card only */
@media print{
  .em-nav,footer,.hero,.card-preview .btn-row,.toast{display:none!important}
  body{background:#fff}
  .container,.grid{display:block!important}
  .card-preview{border:0;padding:0}
  .dcard{border:1px solid #999;page-break-inside:avoid}
}
@media (max-width:760px){
  .vrow{grid-template-columns:24px 1fr 26px}
  .vrow .vin{grid-column:2/-1}
  .vrow .vin.sm{grid-column:2/3}
}
'''

if ".dcard{" not in src:
    src = src.replace("</style>", CSS + "\n</style>", 1)
    print("  CSS inserted")
else:
    print("  CSS already present — skipped")

# --- fix stale meta from the vendor template ---
src = src.replace(
    'content="Manage every party vendor in one place: contacts, quotes, deposits, balances and arrival times. The site\'s first vendor-coordination board — with a live load-in timeline, a cashflow ledger, gap warnings for the vendors you forgot, and a printable contact sheet."',
    'content="Your whole party on one printable card: who to call, who arrives when, what must happen before the doors open, and the three numbers you need. The site\'s first day-of card — print two, keep one in your pocket and give one to the person who answers when you cannot."',
)
src = src.replace(
    'content="The site\'s first vendor board. Every other tool planned a thing — the balloons, the food, the paper, the drinks. This one runs the people who deliver it: ten vendors, one board, one load-in timeline, one ledger of deposits and balances."',
    'content="The first day-of tool on the site. Fifty-three prior tools produced something you use before the party. The Day-Of Card is the one page you hold during it: call list, pre-doors run sheet, and a printable card."',
)
print("  meta refreshed")
F.write_text(src, encoding="utf-8")
print("  bytes:", len(src))
