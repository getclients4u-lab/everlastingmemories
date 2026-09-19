#!/usr/bin/env python3
"""
Night 54 — The Day-Of Card: replace the vendor-board engine (body + script)
with a day-of command-card engine.

Keeps: nav, footer, style block (already palette-swapped), fonts.
Replaces: hero, containers, script.
"""
import pathlib, re

SITE = pathlib.Path("/var/openclaw_users/isa/.openclaw/workspace/everlastingmemories")
F = SITE / "day-of-card.html"
src = F.read_text(encoding="utf-8")

# --- locate the region to replace: from <div class="hero"> to just before <script> ---
start = src.index('<div class="hero">')
script_at = src.index('<script>')
tail = src[script_at:]          # <script> ... </html>

NEW_BODY = '''<div class="hero">
  <a class="home-link" href="index.html">&larr; Everlasting Memories</a>
  <div class="badge" id="secretBadge" title="psst — tap me">🎫 New Tonight — The Day-Of Card</div>
  <h1>The Day-Of Card</h1>
  <p class="sub">Fifty-three tools on this site produced something you use <b>before</b> the party — a plan, a budget, a timeline, a shopping list, a seating chart, a quote. Not one of them produced the single thing you hold <b>on the day</b>, when you have no free hands and no time to open a laptop. The Day-Of Card condenses the whole party onto one card: who arrives when, who to call, what still has to happen before the doors open, and the three numbers you actually need if something goes wrong. <b>Print it. Fold it. Put it in your pocket.</b></p>
</div>

<div class="container">
  <div class="grid">
    <!-- LEFT -->
    <div>
      <div class="card" style="margin-bottom:22px">
        <div class="kicker">Step 1</div>
        <h2>The party in one line</h2>
        <p class="hint">This is what prints at the top of the card — the details you would otherwise be re-reading off your phone with one hand.</p>
        <div class="fg">
          <label>Occasion</label>
          <div class="chips" id="occChips"></div>
          <div class="note-line" id="occNote"></div>
        </div>
        <div class="fg-row">
          <div class="fg"><label for="inEvent">Event name</label><input type="text" id="inEvent" placeholder="Ana &amp; Luis&rsquo;s Wedding"></div>
          <div class="fg"><label for="inVenue">Venue</label><input type="text" id="inVenue" placeholder="The Willow Barn"></div>
        </div>
        <div class="fg-row">
          <div class="fg"><label for="inDate">Event date</label><input type="date" id="inDate"></div>
          <div class="fg"><label for="inDoors">Doors open (guests arrive)</label><input type="time" id="inDoors" value="17:00"></div>
        </div>
        <div class="fg-row">
          <div class="fg"><label for="inGuests">Guests</label><input type="number" id="inGuests" min="1" max="1000" value="100"></div>
          <div class="fg"><label for="inHost">You (the host on the card)</label><input type="text" id="inHost" placeholder="Ana"></div>
        </div>
        <div class="fg" style="margin-bottom:0">
          <label for="inHelper">Your second-in-command (day-of contact)</label>
          <input type="text" id="inHelper" placeholder="Name &amp; number — the person who answers when you can&rsquo;t">
        </div>
      </div>

      <div class="card" style="margin-bottom:22px">
        <div class="kicker">Step 2</div>
        <h2>The call list</h2>
        <p class="hint">Six lines maximum. On the day you will not scroll — you will want one column of numbers, biggest problem first. Pre-filled with the roles a real party needs.</p>
        <div class="chips" id="roleChips" style="margin-bottom:12px"></div>
        <div id="callList"></div>
        <button class="btn ghost" id="btnAddRole" style="margin-top:12px">+ Add a line</button>
      </div>

      <div class="card" style="margin-bottom:22px">
        <div class="kicker">Step 3</div>
        <h2>What must happen before the doors open</h2>
        <p class="hint">Tick these as you go. Each one is counted backwards from your doors time, so the card tells you what is already late.</p>
        <div id="runSheet"></div>
      </div>

      <div class="card" style="margin-bottom:22px">
        <div class="kicker">Step 4</div>
        <h2>The three numbers</h2>
        <p class="hint">The three figures Isabella says decide whether a party day goes smoothly: how many people, how much food, and how long until the doors. The card prints them big so you can answer without thinking.</p>
        <div class="fg-row">
          <div class="fg"><label for="inFoodMode">Catering</label>
            <select id="inFoodMode">
              <option value="full">Full catering (drop-off or staffed)</option>
              <option value="partial">Partial — mains catered, sides homemade</option>
              <option value="diy">All homemade</option>
            </select>
          </div>
          <div class="fg"><label for="inBar">Drinks</label>
            <select id="inBar">
              <option value="full">Full bar</option>
              <option value="wine">Wine, beer &amp; bubbles</option>
              <option value="dry">Dry / zero-proof house</option>
            </select>
          </div>
        </div>
        <div class="fg" style="margin-bottom:0">
          <label for="inEmergency">One line for the worst case</label>
          <input type="text" id="inEmergency" placeholder="If the caterer is late: call Marco on the mobile, not the office.">
        </div>
      </div>
    </div>

    <!-- RIGHT -->
    <div>
      <div class="card" style="margin-bottom:22px">
        <div class="kicker">The card</div>
        <h2>Your day-of card</h2>
        <p class="hint">Exactly what prints. Nothing on this card exists anywhere else in one place.</p>
        <div id="cardPreview" class="card-preview"></div>
        <div class="btn-row" style="margin-top:16px">
          <button class="btn" id="btnPrint">🖨️ Print the card</button>
          <button class="btn ghost" id="btnCopy">Copy as text</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:22px">
        <div class="kicker">Readout</div>
        <h2>How ready is this card?</h2>
        <div id="readyMeter"></div>
        <div id="readyNotes" style="margin-top:12px"></div>
      </div>

      <div class="card">
        <div class="kicker">Isabella&rsquo;s day-of rules</div>
        <h2>The four things that go wrong</h2>
        <div class="facts" id="factList"></div>
      </div>
    </div>
  </div>
</div>

<div class="container">
  <div class="card" style="margin-bottom:22px">
    <div class="kicker">More from Everlasting Memories</div>
    <h2>The rest of the toolbox</h2>
    <p class="hint">The Day-Of Card is the last ten minutes. These are the weeks before it.</p>
    <div class="cross" id="crossLinks"></div>
  </div>
</div>

'''

src = src[:start] + NEW_BODY + tail
F.write_text(src, encoding="utf-8")
print(f"  body replaced. new size {len(src):,} bytes, {src.count(chr(10)):,} lines")
print(f"  script block starts at char {src.index('<script>'):,}")
