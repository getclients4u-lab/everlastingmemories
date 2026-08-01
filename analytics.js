// Everlasting Memories — Universal Analytics & Lead-Source Tracking
// Injected on every page. Tracks visits, sources, and captures lead attribution.
(function () {
  // ===== 1. Vercel Web Analytics =====
  (function () {
    var a = document.createElement('script');
    a.defer = true;
    a.src = '/_vercel/insights/script.js';
    document.head.appendChild(a);
  })();

  // ===== 2. Vercel Speed Insights =====
  (function () {
    var s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/speed-insights/script.js';
    document.head.appendChild(s);
  })();

  // ===== 3. Google Analytics 4 (GA4) =====
  // Replace G-XXXXXXXXXX with your real Measurement ID from analytics.google.com
  var GA_ID = 'G-XXXXXXXXXX';
  if (GA_ID.indexOf('G-') === 0 && GA_ID.length > 2 && GA_ID !== 'G-XXXXXXXXXX') {
    (function () {
      var g = document.createElement('script');
      g.async = true;
      g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', GA_ID);
      window.gtag = gtag;
    })();
  }

  // ===== 4. Lead Source / Attribution Tracking =====
  // Captures where each visitor came from and stores it for the contact form.
  function getParam(name) {
    var m = new URLSearchParams(window.location.search);
    return m.get(name);
  }

  function getSource() {
    var src = getParam('utm_source') || getParam('ref');
    if (src) return src;
    try {
      if (document.referrer) {
        var host = new URL(document.referrer).hostname;
        if (host.includes('google')) return 'Google';
        if (host.includes('facebook')) return 'Facebook';
        if (host.includes('instagram')) return 'Instagram';
        if (host.includes('tiktok')) return 'TikTok';
        if (host.includes('pinterest')) return 'Pinterest';
        if (host.includes('myeverlastingmemories')) return 'Direct/Site';
        return host.replace('www.', '');
      }
    } catch (e) {}
    return 'Direct';
  }

  var session = {
    source: getSource(),
    medium: getParam('utm_medium') || 'organic',
    campaign: getParam('utm_campaign') || '',
    landed: new Date().toISOString(),
    page: window.location.pathname,
    visits: 1,
    referrer: document.referrer
  };

  // Keep session across pages in the same visit (same tab)
  try {
    var prev = JSON.parse(localStorage.getItem('em_session') || 'null');
    if (prev && prev.landed) {
      // Same session if within 30 min
      var elapsed = (Date.now() - new Date(prev.landed).getTime()) / 60000;
      if (elapsed < 30) {
        prev.visits = (prev.visits || 0) + 1;
        prev.page = window.location.pathname;
        session = prev;
      }
    }
    localStorage.setItem('em_session', JSON.stringify(session));
    window.__emSession = session; // exposed for contact form
  } catch (e) {}

  // ===== 5. Auto-submit visit to leads API (first page only) =====
  // Records each unique visit without manual data entry. (Skip internal pages.)
  try {
    var isInternal = window.location.pathname.indexOf('admin') !== -1 ||
                     window.location.pathname.indexOf('dashboard') !== -1 ||
                     window.location.pathname.indexOf('journal') !== -1 ||
                     window.location.pathname.indexOf('scanner') !== -1 ||
                     window.location.pathname.indexOf('social-connect') !== -1;
    if (!isInternal) {
      var visitKey = 'em_visit_' + new Date().toISOString().slice(0, 10);
      var visitedToday = localStorage.getItem(visitKey);
      if (!visitedToday) {
        fetch('/api/leads.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '[Visitor]',
            email: '',
            phone: '',
            message: '[Auto-recorded visit] Page: ' + window.location.pathname,
            source: session.source,
            medium: session.medium,
            campaign: session.campaign,
            type: 'visit'
          })
        }).catch(function () {});
        localStorage.setItem(visitKey, '1');
      }
    }
  } catch (e) {}

  // ===== 6. Page view logging to console (debug) =====
  console.log('[EM Analytics] Source:', session.source, '| Page:', session.page, '| Visits:', session.visits);
})();
