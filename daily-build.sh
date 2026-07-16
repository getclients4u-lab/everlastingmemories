#!/usr/bin/env bash
# Daily build script — runs every night at ~02:00 UTC
# Fetches fresh market data, rebuilds dashboard, pushes to GitHub

export PATH="$HOME/.local/bin:$PATH"
cd /var/openclaw_users/isa/.openclaw/workspace/everlastingmemories

echo "=== DAILY BUILD $(date -u +%Y-%m-%d) ==="

# 1. Fetch fresh market data
python3 << 'PYEOF'
import json, urllib.request, os
from datetime import date

today = date.today().isoformat()
tickers = ["SPY","QQQ","DIA","JPM","AAPL","GS","AMGN","CAT","BAC","AXP","NVDA","TSLA","NFLX","AMZN","GOOGL","IWM"]
prices = {}
for t in tickers:
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{t}?range=2d&interval=1d"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            meta = data["chart"]["result"][0]["meta"]
            prices[t] = {
                "current": meta.get("regularMarketPrice", 0),
                "prevClose": meta.get("previousClose", 0),
                "changePct": round((meta.get("regularMarketPrice",0)-meta.get("previousClose",0))/meta.get("previousClose",0)*100,2) if meta.get("previousClose") else 0
            }
    except:
        pass

os.makedirs("data", exist_ok=True)
with open("data/market-data.json","w") as f:
    json.dump({"date": today, "prices": prices}, f, indent=2)
print(f"Saved {len(prices)} prices")
PYEOF

# 2. Commit and push
git add dashboard.html journal.html data/market-data.json 2>/dev/null
git commit -m "🤖 Daily build $(date -u +%Y-%m-%d) — market data refresh" 2>/dev/null || echo "Nothing new to commit"
git push origin main 2>&1 | tail -3

echo "=== BUILD COMPLETE $(date -u +%Y-%m-%d-%H:%M) ==="
