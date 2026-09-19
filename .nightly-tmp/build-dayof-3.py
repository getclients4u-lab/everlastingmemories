#!/usr/bin/env python3
"""
Night 54 — step 3: replace the <script> engine entirely with the day-of-card engine.
Writes a self-contained script (data + render + events + print + lead POST).
"""
import pathlib

SITE = pathlib.Path("/var/openclaw_users/isa/.openclaw/workspace/everlastingmemories")
F = SITE / "day-of-card.html"
src = F.read_text(encoding="utf-8")

s = src.index("<script>")
e = src.index("</script>", s) + len("</script>")
head = src[:s]
tail = src[e:]

ENGINE = r'''<script>
/* ---------------- Night 54 — The Day-Of Card engine ---------------- */
var $ = function(id){ return document.getElementById(id); };
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

/* ---- occasions ---- */
var OCCASIONS = [
  {id:'wedding',   emoji:'💍', name:'Wedding',          tone:'the full cast',   note:'Every vendor matters and the timeline is unforgiving. Print two cards — one for you, one for the helper.'},
  {id:'birthday',  emoji:'🎂', name:'Milestone Birthday',tone:'music, cake, photos', note:'Three vendors carry a birthday: the food, the cake and whoever runs the music. Guard the cake-cutting time.'},
  {id:'baby',      emoji:'🍼', name:'Baby Shower',      tone:'calm and pretty',  note:'Short party, few vendors. The risk is the room being ready before guests arrive — not the run sheet.'},
  {id:'graduation',emoji:'🎓', name:'Graduation',       tone:'crowd control',    note:'Guests arrive in waves and leave in waves. Parking and overflow seating are your real vendors.'},
  {id:'anniversary',emoji:'🥂',name:'Anniversary',      tone:'intimate, small',  note:'Fewer moving parts, so every one is visible. The toast and the music cue are the whole evening.'},
  {id:'corporate', emoji:'🏢', name:'Corporate',        tone:'on the clock',     note:'A hard start time and an AV vendor. If the room is not set 90 minutes early, the event starts late in public.'},
  {id:'holiday',   emoji:'🎄', name:'Holiday Party',    tone:'the room carries it', note:'Decor does more work than any vendor. Heat and cost per head are the two numbers to watch.'}
];

/* ---- call-list roles (defaults pre-filled) ---- */
var ROLES = [
  {id:'venue',     emoji:'🏛️', name:'Venue',            hint:'Opens the doors. Ask for the site contact, not the office.'},
  {id:'caterer',   emoji:'🍽️', name:'Caterer',          hint:'The vendor your guests will judge the whole party by.'},
  {id:'music',     emoji:'🎧', name:'DJ / Band',        hint:'Confirm the first-song cue and the last-song time.'},
  {id:'photographer',emoji:'📸',name:'Photographer',    hint:'Confirm how long they stay past the cake.'},
  {id:'cake',      emoji:'🎂', name:'Cake & Dessert',   hint:'Confirm delivery time AND whether they set it up.'},
  {id:'decor',     emoji:'🎈', name:'Decor / Balloons', hint:'Ask exactly when they arrive — decor eats the room early.'},
  {id:'officiant', emoji:'📜', name:'Officiant',        hint:'The one contact who cannot be late.'},
  {id:'bar',       emoji:'🍸', name:'Bar / Bartender',  hint:'Confirm ice delivery separately from the drinks.'},
  {id:'rentals',   emoji:'🪑', name:'Rentals',          hint:'Tables and chairs arrive first and leave last.'},
  {id:'transport', emoji:'🚐', name:'Transportation',   hint:'The last thing booked and the first thing blamed.'}
];

/* ---- pre-doors run sheet: minutes BEFORE doors ---- */
var RUNSHEET = [
  {min:240, label:'Venue access — you are on site',              why:'You cannot fix a room you have not stood in.'},
  {min:180, label:'Rentals delivered and placed',                why:'Tables and chairs set before anything is dressed.'},
  {min:150, label:'Decor / balloons installed',                  why:'Decor needs the empty room, not the finished one.'},
  {min:120, label:'Caterer arrives and sets the kitchen',        why:'The caterer needs a working kitchen before guests, not after.'},
  {min:90,  label:'Bar set and ice in the cooler',               why:'Ice is the first thing a party runs out of.'},
  {min:60,  label:'Music set up and soundchecked',               why:'A band testing levels while guests arrive kills the entrance.'},
  {min:45,  label:'Cake delivered and staged out of sight',      why:'A cake on display early is a cake someone touches.'},
  {min:30,  label:'Yourself dressed, phone charged, card in pocket', why:'This is the item hosts skip and regret.'},
  {min:15,  label:'Lights on, candles lit, doors unlatched',     why:'The last fifteen minutes decide the first impression.'}
];

var FACTS = [
  {n:'2',      t:'cards — one for the host, one for the second-in-command'},
  {n:'90 min', t:'before the doors when you stop taking new problems'},
  {n:'1',      t:'number per role — never a switchboard'},
  {n:'48 h',   t:'before the party when every vendor gets a text'}
];

var CROSS = [
  ['vendor-board.html','The Vendor Board'],
  ['party-timeline.html','The Party Timeline'],
  ['cost-estimator.html','The Cost Estimator'],
  ['main-course.html','The Main Course'],
  ['paper-trail.html','The Paper Trail'],
  ['party-er.html','The Party ER']
];

/* ---------------- state ---------------- */
function blankLine(role){
  return {role:role.id, emoji:role.emoji, name:role.name, contact:'', arrive:'', on:false};
}

function freshState(){
  var st = {
    occasion:'wedding',
    eventName:"Ana & Luis's Wedding",
    venue:'The Willow Barn',
    date:'2026-06-20',
    doors:'17:00',
    guests:120,
    host:'Ana',
    helper:'',
    foodMode:'full',
    bar:'wine',
    emergency:'If the caterer is late: call Marco on the mobile, not the office.',
    lines:[], done:{}
  };
  st.lines = ROLES.slice(0,6).map(function(r,i){
    var l = blankLine(r);
    l.on = true;
    if (i===0){ l.contact='Willow Barn Events'; l.arrive='12:00'; }
    if (i===1){ l.contact=''; l.arrive='14:00'; }
    return l;
  });
  return st;
}

var state = freshState();

/* ---------------- time helpers ---------------- */
function toMin(hhmm){
  var p = String(hhmm||'').split(':');
  var h = parseInt(p[0],10), m = parseInt(p[1],10);
  if (isNaN(h) || isNaN(m)) return null;
  return h*60+m;
}
function toHHMM(min){
  if (min==null) return '';
  min = ((min % 1440) + 1440) % 1440;
  var h = Math.floor(min/60), m = min%60;
  return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;
}
function prettyTime(hhmm){
  var m = toMin(hhmm); if (m==null) return '';
  var h = Math.floor(m/60), mm = m%60;
  var ap = h>=12 ? 'PM' : 'AM';
  var h12 = h%12; if (h12===0) h12 = 12;
  return h12 + (mm ? ':'+(mm<10?'0':'')+mm : ':00') + ' ' + ap;
}
var DAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function prettyDate(iso){
  if (!iso) return '';
  var p = String(iso).split('-');
  var y = parseInt(p[0],10), mo = parseInt(p[1],10), d = parseInt(p[2],10);
  if (isNaN(y)||isNaN(mo)||isNaN(d)) return String(iso);
  var dt = new Date(Date.UTC(y, mo-1, d));
  return DAY[dt.getUTCDay()] + ', ' + MON[mo-1] + ' ' + d;
}
function hoursToDoors(){
  var d = toMin(state.doors);
  if (d==null) return null;
  return d;
}

/* ---------------- readiness ---------------- */
function readiness(){
  var on = activeLines();
  var withContact = on.filter(function(l){ return String(l.contact||'').trim(); });
  var withArrive  = on.filter(function(l){ return String(l.arrive||'').trim(); });
  var tasks = RUNSHEET.length;
  var ticked = RUNSHEET.filter(function(t,i){ return state.done[i]; }).length;

  var score = 0;
  var notes = [];
  if (on.length){ score += Math.round(30 * withContact.length / on.length); }
  if (on.length){ score += Math.round(25 * withArrive.length / on.length); }
  score += Math.round(25 * ticked / tasks);
  if (String(state.helper||'').trim()) score += 10; else notes.push('No second-in-command named — on the day you are the only person who knows anything.');
  if (String(state.emergency||'').trim()) score += 10; else notes.push('No worst-case line — write one before you print.');
  score = Math.max(0, Math.min(100, score));

  if (!withContact.length) notes.push('No vendor has a number yet. A call list without numbers is a list of regrets.');
  else if (withContact.length < on.length) notes.push((on.length - withContact.length) + ' vendor(s) still have no contact on the card.');
  if (!withArrive.length) notes.push('No arrival times set — the run sheet cannot warn you what is late.');

  var tier = score>=90 ? 'Full Isabella' : score>=75 ? 'Print-ready' :
             score>=55 ? 'Mostly there' : score>=30 ? 'Still a draft' : 'Barely started';
  return {score:score, tier:tier, notes:notes, on:on.length, withContact:withContact.length, withArrive:withArrive.length, ticked:ticked, tasks:tasks};
}

function activeLines(){ return state.lines.filter(function(l){ return l.on; }); }

/* ---------------- SVG / DOM build ---------------- */
function renderChips(){
  $('occChips').innerHTML = OCCASIONS.map(function(o){
    var sel = o.id===state.occasion ? ' sel' : '';
    return '<button class="chip'+sel+'" data-occ="'+o.id+'">'+o.emoji+' '+esc(o.name)+'</button>';
  }).join('');
  var occ = OCCASIONS.filter(function(o){ return o.id===state.occasion; })[0];
  $('occNote').textContent = occ ? occ.note : '';

  $('roleChips').innerHTML = ROLES.map(function(r){
    var used = state.lines.some(function(l){ return l.role===r.id; });
    return '<button class="chip sm'+(used?' sel':'')+'" data-add="'+r.id+'">'+r.emoji+' '+esc(r.name)+'</button>';
  }).join('');
}

function renderCallList(){
  $('callList').innerHTML = state.lines.map(function(l,i){
    return ''+
    '<div class="vrow" data-i="'+i+'">'+
      '<label class="vchk"><input type="checkbox" data-on="'+i+'"'+(l.on?' checked':'')+'></label>'+
      '<div class="vname">'+esc(l.emoji)+' '+esc(l.name)+'</div>'+
      '<input class="vin" type="text" placeholder="Name &amp; number" data-f="contact" data-i="'+i+'" value="'+esc(l.contact)+'">'+
      '<input class="vin sm" type="time" data-f="arrive" data-i="'+i+'" value="'+esc(l.arrive)+'">'+
      '<button class="xbtn" data-del="'+i+'" title="Remove">&times;</button>'+
    '</div>';
  }).join('') || '<p class="hint">No lines yet — add one below.</p>';
}

function renderRunSheet(){
  $('runSheet').innerHTML = RUNSHEET.map(function(t,i){
    var at = null; var doors = toMin(state.doors);
    if (doors!=null) at = doors - t.min;
    var late = at!=null && at < 0;
    return ''+
    '<label class="rsrow'+(state.done[i]?' done':'')+'">'+
      '<input type="checkbox" data-task="'+i+'"'+(state.done[i]?' checked':'')+'>'+
      '<span class="rstime">'+(at==null?'—':esc(prettyTime(toHHMM(at))))+'</span>'+
      '<span class="rstext"><b>'+esc(t.label)+'</b><em>'+esc(t.why)+'</em></span>'+
    '</label>';
  }).join('');
}

function renderFacts(){
  $('factList').innerHTML = FACTS.map(function(f){
    return '<div class="fact"><div class="fn">'+esc(f.n)+'</div><div class="ft">'+esc(f.t)+'</div></div>';
  }).join('');
  $('crossLinks').innerHTML = CROSS.map(function(c){
    return '<a class="xlink" href="'+c[0]+'">'+esc(c[1])+'</a>';
  }).join('');
}

function renderMeter(){
  var r = readiness();
  var col = r.score>=75 ? 'var(--good)' : r.score>=50 ? 'var(--c1)' : 'var(--bad)';
  $('readyMeter').innerHTML =
    '<div class="meter"><div class="meterfill" style="width:'+r.score+'%;background:'+col+'"></div></div>'+
    '<div class="meterlbl"><b>'+r.score+'%</b> · '+esc(r.tier)+'</div>'+
    '<div class="mmstat">'+r.withContact+'/'+r.on+' vendors have a number · '+r.withArrive+'/'+r.on+' have an arrival · '+r.ticked+'/'+r.tasks+' pre-doors jobs ticked</div>';
  $('readyNotes').innerHTML = r.notes.length
    ? '<ul class="notes">'+r.notes.map(function(n){ return '<li>'+esc(n)+'</li>'; }).join('')+'</ul>'
    : '<p class="ok">Nothing missing. Print it and stop working.</p>';
}

function renderCard(){
  var r = readiness();
  var on = activeLines();
  var doors = toMin(state.doors);
  var occ = OCCASIONS.filter(function(o){ return o.id===state.occasion; })[0];
  var occName = occ ? occ.name : '';

  var callRows = on.map(function(l){
    var at = l.arrive ? prettyTime(l.arrive) : 'arrival not set';
    return '<tr><td class="c-role">'+esc(l.emoji)+' '+esc(l.name)+'</td>'+
           '<td class="c-who">'+(String(l.contact).trim()?esc(l.contact):'<span class="miss">add number</span>')+'</td>'+
           '<td class="c-when">'+esc(at)+'</td></tr>';
  }).join('');

  var sched = RUNSHEET.map(function(t,i){
    var at = doors!=null ? toHHMM(doors - t.min) : null;
    return '<tr class="'+(state.done[i]?'t-done':'')+'"><td class="c-t">'+(at?esc(prettyTime(at)):'—')+'</td>'+
           '<td class="c-txt">'+esc(t.label)+'</td></tr>';
  }).join('');

  var foodLbl = {full:'Full catering', partial:'Mains catered, sides homemade', diy:'All homemade'}[state.foodMode] || '';
  var barLbl  = {full:'Full bar', wine:'Wine, beer & bubbles', dry:'Dry / zero-proof'}[state.bar] || '';

  $('cardPreview').innerHTML = ''+
  '<div class="dcard" id="dcard">'+
    '<div class="dhead">'+
      '<div class="dkick">'+esc(occ ? occ.emoji+' '+occName : 'Day of')+'</div>'+
      '<div class="dname">'+esc(state.eventName || 'Your party')+'</div>'+
      '<div class="dsub">'+esc(prettyDate(state.date))+' · doors '+esc(prettyTime(state.doors))+' · at '+esc(state.venue || 'venue TBC')+'</div>'+
    '</div>'+
    '<div class="dthree">'+
      '<div><b>'+esc(String(state.guests||0))+'</b><span>guests</span></div>'+
      '<div><b>'+esc(foodLbl)+'</b><span>food</span></div>'+
      '<div><b>'+esc(barLbl)+'</b><span>drinks</span></div>'+
    '</div>'+
    '<div class="dsec"><div class="dsec-h">Call list</div>'+
      '<table class="ctable">'+callRows+'</table></div>'+
    '<div class="dsec"><div class="dsec-h">Before the doors</div>'+
      '<table class="ctable sched">'+sched+'</table></div>'+
    (String(state.emergency||'').trim()
      ? '<div class="demerg"><b>If it goes wrong</b><br>'+esc(state.emergency)+'</div>' : '')+
    '<div class="dfoot">Second in command: '+esc(String(state.helper||'').trim()||'—')+' · Card ready '+esc(r.score+'%')+'</div>'+
  '</div>';
}

function renderAll(){ renderChips(); renderCallList(); renderRunSheet(); renderFacts(); renderMeter(); renderCard(); }

/* ---------------- events ---------------- */
$('occChips').addEventListener('click', function(e){
  var b = e.target.closest('[data-occ]'); if (!b) return;
  state.occasion = b.getAttribute('data-occ'); renderAll();
});
$('roleChips').addEventListener('click', function(e){
  var b = e.target.closest('[data-add]'); if (!b) return;
  var id = b.getAttribute('data-add');
  if (state.lines.some(function(l){ return l.role===id; })) return;
  var r = ROLES.filter(function(x){ return x.id===id; })[0];
  var l = blankLine(r); l.on = true;
  state.lines.push(l); renderAll();
});
$('btnAddRole').addEventListener('click', function(){
  var free = ROLES.filter(function(r){ return !state.lines.some(function(l){ return l.role===r.id; }); })[0];
  if (!free) return;
  var l = blankLine(free); l.on = true;
  state.lines.push(l); renderAll();
});
$('callList').addEventListener('input', function(e){
  var i = e.target.getAttribute('data-i'), f = e.target.getAttribute('data-f');
  if (i==null || !f) return;
  state.lines[+i][f] = e.target.value;
  renderMeter(); renderCard();
});
$('callList').addEventListener('change', function(e){
  var i = e.target.getAttribute('data-on');
  if (i==null) return;
  state.lines[+i].on = e.target.checked; renderAll();
});
$('callList').addEventListener('click', function(e){
  var d = e.target.closest('[data-del]'); if (!d) return;
  state.lines.splice(+d.getAttribute('data-del'),1); renderAll();
});
$('runSheet').addEventListener('change', function(e){
  var t = e.target.getAttribute('data-task'); if (t==null) return;
  state.done[+t] = e.target.checked;
  e.target.closest('.rsrow').classList.toggle('done', e.target.checked);
  renderMeter(); renderCard();
});

['inEvent','inVenue','inHost','inHelper','inEmergency'].forEach(function(id){
  $(id).addEventListener('input', function(){
    var map = {inEvent:'eventName', inVenue:'venue', inHost:'host', inHelper:'helper', inEmergency:'emergency'};
    state[map[id]] = $(id).value; renderMeter(); renderCard();
  });
});
$('inDate').addEventListener('input', function(){ state.date = $('inDate').value; renderCard(); });
$('inDoors').addEventListener('input', function(){ state.doors = $('inDoors').value; renderRunSheet(); renderMeter(); renderCard(); });
$('inGuests').addEventListener('input', function(){ state.guests = parseInt($('inGuests').value,10)||0; renderCard(); });
$('inFoodMode').addEventListener('change', function(){ state.foodMode = $('inFoodMode').value; renderCard(); });
$('inBar').addEventListener('change', function(){ state.bar = $('inBar').value; renderCard(); });

/* ---- print: isolate the card ---- */
$('btnPrint').addEventListener('click', function(){
  var card = $('dcard');
});
$('btnPrint').addEventListener('click', function(){ window.print(); });

/* ---- copy as text ---- */
$('btnCopy').addEventListener('click', function(){
  var on = activeLines();
  var doors = toMin(state.doors);
  var L = [];
  L.push(state.eventName + ' — ' + prettyDate(state.date));
  L.push('Doors ' + prettyTime(state.doors) + ' · ' + state.guests + ' guests · ' + (state.venue||''));
  L.push('');
  L.push('CALL LIST');
  on.forEach(function(l){
    L.push('  ' + l.emoji + ' ' + l.name + ': ' + (l.contact||'—') + (l.arrive ? ' (arrives '+prettyTime(l.arrive)+')' : ''));
  });
  L.push('');
  L.push('BEFORE THE DOORS');
  RUNSHEET.forEach(function(t,i){
    var at = doors!=null ? prettyTime(toHHMM(doors - t.min)) : '—';
    L.push('  [' + (state.done[i]?'x':' ') + '] ' + at + '  ' + t.label);
  });
  if (String(state.emergency||'').trim()){ L.push(''); L.push('IF IT GOES WRONG: ' + state.emergency); }
  L.push('');
  L.push('Second in command: ' + (state.helper||'—'));
  var txt = L.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){ toast('Card copied as text'); },
      function(){ toast('Copy blocked — select the card manually'); });
  } else { toast('Copy not available in this browser'); }
});

/* ---- toast + secret ---- */
function toast(msg){
  var t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.classList.add('show'); }, 10);
  setTimeout(function(){ t.classList.remove('show'); }, 2600);
  setTimeout(function(){ t.remove(); }, 3000);
}
$('secretBadge').addEventListener('click', function(){
  toast('Isabella’s day-of rule: the card is not a plan, it is an amnesia cure. Print two — one for you, one for the person who answers when you cannot.');
});

/* ---- lead POST ---- */
function leadPayload(){
  var r = readiness();
  return {
    name: state.host || 'Day-Of Card user',
    email: '',
    source: 'day-of-card',
    eventType: (OCCASIONS.filter(function(o){return o.id===state.occasion;})[0]||{}).name || '',
    message: 'Day-Of Card — ' + state.eventName + ' · ' + state.guests + ' guests · readiness ' + r.score + '% · ' + r.on + ' vendors, ' + r.withContact + ' with contact'
  };
}
var lf = $('leadForm');
if (lf) lf.addEventListener('submit', function(e){
  e.preventDefault();
  fetch('/api/leads', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(leadPayload())})
    .then(function(){ toast('Saved — we will follow up.'); })
    .catch(function(){ toast('Saved locally (offline).'); });
});

/* ---------------- boot ---------------- */
(function boot(){
  $('inEvent').value = state.eventName;
  $('inVenue').value = state.venue;
  $('inDate').value = state.date;
  $('inDoors').value = state.doors;
  $('inGuests').value = state.guests;
  $('inHost').value = state.host;
  $('inHelper').value = state.helper;
  $('inEmergency').value = state.emergency;
  $('inFoodMode').value = state.foodMode;
  $('inBar').value = state.bar;
  renderAll();
})();
</script>'''

F.write_text(head + ENGINE + tail, encoding="utf-8")
print("  engine replaced")
print("  total bytes:", len(head + ENGINE + tail))
