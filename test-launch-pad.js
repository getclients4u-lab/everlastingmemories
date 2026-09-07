#!/usr/bin/env node
// Night 44 smoke test — The Launch Pad (launch-pad.html)
// Extracts the pure-logic block via module.exports guard and asserts invariants.
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/launch-pad.html', 'utf8');
const VM = require('vm');
const sandbox = { module: { exports: {} }, document: undefined };
VM.createContext(sandbox);
// Run only the script content (strip the DOM guard by providing document undefined is fine,
// but we also need window/navigator not referenced at top level — they aren't).
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
for (const s of scripts) VM.runInContext(s[1], sandbox);
const M = sandbox.module.exports;

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log('FAIL:', msg); } }
function eq(a, b, msg) { ok(a === b, msg + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }

// --- data integrity ---
eq(M.MISSIONS.length, 6, '6 missions');
eq(M.ZONES.length, 6, '6 zones');
eq(M.TONES.length, 3, '3 tones');
eq(M.PALETTES.length, 6, '6 palettes');
const ids = M.MISSIONS.map(m => m.id).sort().join(',');
eq(ids, 'anniversary,clients,holiday,launch,milestone,opening', 'mission ids unique+complete');
const zids = M.ZONES.map(z => z.id).sort().join(',');
eq(zids, 'arch,moment,sky,stage,tables,wall', 'zone ids unique+complete');
M.MISSIONS.forEach(m => ok(m.emoji && m.name && m.desc && m.hook && m.season, 'mission fields: ' + m.id));
M.ZONES.forEach(z => ok(z.emoji && z.name && z.desc && z.includes.length >= 3, 'zone fields: ' + z.id));

// --- tier/tables math ---
eq(M.tierOf(10), 'S', 'tier S at 10');
eq(M.tierOf(24), 'S', 'tier S at 24');
eq(M.tierOf(25), 'M', 'tier M at 25');
eq(M.tierOf(49), 'M', 'tier M at 49');
eq(M.tierOf(50), 'L', 'tier L at 50');
eq(M.tierOf(99), 'L', 'tier L at 99');
eq(M.tierOf(100), 'XL', 'tier XL at 100');
eq(M.tierOf(249), 'XL', 'tier XL at 249');
eq(M.tierOf(250), 'XXL', 'tier XXL at 250');
eq(M.tierOf(500), 'XXL', 'tier XXL at 500');
eq(M.tablesOf(120), 12, '12 tables at 120');
eq(M.tablesOf(10), 2, 'min 2 tables');
eq(M.tablesOf(500), 50, '50 tables at 500');

// --- zone pricing math (matches quote-sheet conventions) ---
// wall: base $670 incl 6ft, +$45/ft
eq(M.zoneCost(M.pickZone('wall'), 20), 670, 'wall 6ft (S) = 670');
eq(M.zoneCost(M.pickZone('wall'), 120), 670 + 8 * 45, 'wall 14ft (XL) = 1030');
eq(M.zoneCost(M.pickZone('wall'), 500), 670 + 12 * 45, 'wall 18ft (XXL) = 1210');
eq(M.zoneCost(M.pickZone('arch'), 120), 450 + 8 * 22, 'arch 18ft (XL) = 626');
eq(M.zoneCost(M.pickZone('stage'), 120), 420 + 8 * 30, 'stage 16ft (XL) = 660');
eq(M.zoneCost(M.pickZone('sky'), 120), 220 + 8 * 18, 'sky 16ft (XL) = 364');
eq(M.zoneCost(M.pickZone('tables'), 120), 12 * 38, 'tables 12 x 38 = 456');
eq(M.zoneCost(M.pickZone('moment'), 120), 180, 'moment flat 180');
eq(M.zoneFt(M.pickZone('wall'), 10), 6, 'wall ft S=6');
eq(M.zoneFt(M.pickZone('arch'), 500), 22, 'arch ft XXL=22');

// --- buildQuote sample state (matches facts-grid claim ~$28/guest @120) ---
const st = M.sampleState();
eq(st.zones.join(','), 'wall,arch,tables,moment', 'sample zones');
const q = M.buildQuote(st);
eq(q.guests, 120, 'quote guests 120');
eq(q.tier, 'XL', 'quote tier XL');
eq(q.tables, 12, 'quote tables 12');
eq(q.count, 4, '4 zones quoted');
eq(q.total, 1030 + 626 + 456 + 180, 'sample total 2292');
ok(q.perGuest > 19 && q.perGuest < 20, 'sample per-guest ~$19.10');
eq(M.money(2292), '$2,292', 'money comma format');
eq(M.money(0), '$0', 'money zero');
eq(M.zoneMathTxt(M.pickZone('wall'), 120, 1030), '$670 + 8 ft × $45', 'wall math text');
eq(M.zoneMathTxt(M.pickZone('moment'), 120, 180), 'flat rate', 'moment math text');
eq(M.zoneSizeTxt(M.pickZone('tables'), 120), '12 tables', 'tables size text');

// --- empty selection guard ---
const q0 = M.buildQuote({ guests: 120, zones: [] });
eq(q0.total, 0, 'no zones -> total 0');
eq(q0.count, 0, 'no zones -> count 0');
eq(q0.perGuest, 0, 'no zones -> perGuest 0');

// --- brief builder: tone coverage + no placeholders ---
M.TONES.forEach(t => {
  const s = Object.assign({}, st, { tone: t.id, company: 'Nimbus Labs', your: 'Alex' });
  const b = M.buildBrief(s, M.buildQuote(s));
  ok(b.length === 3, 'brief 3 paras for ' + t.id);
  const txt = b.map(p => p.text).join(' ');
  ok(txt.indexOf('Nimbus Labs') !== -1, 'brief mentions company: ' + t.id);
  ok(txt.indexOf('per guest') !== -1, 'brief mentions per guest: ' + t.id);
  ok(!/undefined|NaN|\[object/.test(txt), 'no garbage tokens: ' + t.id);
  ok(txt.indexOf('{') === -1 && txt.indexOf('}') === -1, 'no leftover braces: ' + t.id);
});
// zone summary appears for agency/enterprise variants
const ba = M.buildBrief(Object.assign({}, st, { tone: 'agency' }), q);
ok(ba.map(p => p.text).join(' ').indexOf('The Logo Wall') !== -1, 'agency brief lists zones');

// --- esc XSS ---
eq(M.esc('<script>"&'), '&lt;script&gt;&quot;&amp;', 'esc XSS chars');

// --- date formatting ---
eq(M.fmtDate('2026-11-14'), 'Nov 14, 2026', 'fmtDate');
eq(M.fmtDate(''), '', 'fmtDate empty');
eq(M.fmtDate('garbage'), 'garbage', 'fmtDate fallback');

// --- run sheet + rules ---
const run = M.buildRun(st);
eq(run.length, 7, '7 run-sheet rows');
ok(run[0][0] === 'T-14 days' && run[6][0] === 'T+1 · 7 AM', 'run sheet anchors');
const rules = M.buildRules();
eq(rules.length, 6, '6 office-proof rules');
ok(rules.every(r => r.length === 2 && r[0] && r[1]), 'rules complete');

// --- share text ---
const share = M.buildShare(st);
ok(share.indexOf('THE LAUNCH PAD') !== -1, 'share header');
ok(share.indexOf('$2,292') !== -1, 'share total');
ok(share.indexOf('per guest') !== -1, 'share per-guest');
ok(share.indexOf('myeverlastingmemories.com') !== -1, 'share brand link');
ok(share.indexOf('The Logo Wall') !== -1, 'share lists zones');

// --- lead payload ---
const lp = M.leadPayload(st);
eq(lp.source, 'launch-pad', 'lead source');
eq(lp.eventType, 'Product Launch 🚀', 'lead eventType');
ok(lp.message.indexOf('Headcount: 120 (XL)') !== -1, 'lead message headcount');
ok(lp.message.indexOf('$2,292') !== -1, 'lead message total');
ok(lp.message.indexOf('Glam Gold') !== -1, 'lead message palette');

// --- every mission renders a quote + payload without throwing ---
M.MISSIONS.forEach(m => {
  const s = Object.assign({}, st, { mission: m.id, zones: ['wall', 'tables'] });
  const bq = M.buildQuote(s);
  ok(bq.total > 0, 'quote for ' + m.id);
  const bp = M.leadPayload(s);
  ok(bp.eventType.indexOf(m.name) !== -1, 'payload event for ' + m.id);
});

// --- HTML-level checks ---
ok(html.indexOf('models.providers') === -1, 'no config leakage');
ok(html.indexOf('The Launch Pad') > 0, 'page names tool');
ok(html.indexOf('/api/leads.js') !== -1, 'lead POST endpoint present');
ok(html.indexOf('wa.me') !== -1, 'WhatsApp share present');
ok(html.indexOf('print-card') !== -1 && html.indexOf('@media print') !== -1, 'print CSS present');
ok(html.indexOf('secret #21') !== -1 || html.indexOf('Secret #21') !== -1, 'easter egg secret #21 present');
ok(html.indexOf('module.exports') !== -1, 'module.exports guard present');
const meta = html.match(/<meta name="description" content="([^"]*)"/)[1];
ok(meta.length < 170, 'meta description length ' + meta.length);
ok(html.indexOf('myeverlastingmemories.com') !== -1, 'brand domain referenced');
ok(html.indexOf('faq.html') !== -1 && html.indexOf('referral.html') !== -1 && html.indexOf('after-glow.html') !== -1 && html.indexOf('playlist.html') !== -1, 'cross links in FAQ');
ok(html.indexOf('sitemap.xml') === -1, 'no accidental sitemap ref');

console.log('\nPASS ' + pass + ' / ' + (pass + fail));
process.exit(fail ? 1 : 0);
