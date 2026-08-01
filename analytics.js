// Everlasting Memories — Universal Analytics & Lead-Source Tracking
// Injected on every page. Tracks visits, sources, device, location, and captures lead attribution.
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
  var GA_ID = 'G-XXXXXXXXXX'; // Replace with real Measurement ID
  if (GA_ID.indexOf('G-') === 0 && GA_ID.length > 2 && GA_ID !== 'G-XXXXXXXXXX') {
    (function () {
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', GA_ID);
      window.gtag = gtag;
      var g = document.createElement('script');
      g.async = true;
      g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
      document.head.appendChild(g);
    })();
  }

  // ===== 4. Device & Browser Fingerprint =====
  function getDevice() {
    var ua = navigator.userAgent;
    var w = window.innerWidth;
    var device = '';
    if (/iPad|Tablet/i.test(ua) || (w >= 768 && w <= 1024 && /Macintosh/.test(ua))) device = 'Tablet';
    else if (/Mobile|iPhone|Android/i.test(ua) || w < 768) device = 'Mobile';
    else device = 'Desktop';
    return device;
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return 'Edge';
    if (/OPR\/|Opera/.test(ua)) return 'Opera';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
    if (/Firefox\//.test(ua)) return 'Firefox';
    return 'Other';
  }

  function getOS() {
    var ua = navigator.userAgent;
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad/.test(ua)) return 'iOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Other';
  }

  // ===== 5. Lead Source / Attribution =====
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getSource() {
    var src = getParam('utm_source') || getParam('ref');
    if (src) return decodeURIComponent(src);
    try {
      if (document.referrer) {
        var host = new URL(document.referrer).hostname;
        if (host.includes('google')) return 'Google';
        if (host.includes('bing')) return 'Bing';
        if (host.includes('facebook')) return 'Facebook';
        if (host.includes('instagram')) return 'Instagram';
        if (host.includes('tiktok')) return 'TikTok';
        if (host.includes('pinterest')) return 'Pinterest';
        if (host.includes('linkedin')) return 'LinkedIn';
        if (host.includes('youtube')) return 'YouTube';
        if (host.includes('myeverlastingmemories')) return 'Direct/Site';
        return host.replace('www.', '');
      }
    } catch (e) {}
    return 'Direct';
  }

  function getSessionId() {
    var sid = localStorage.getItem('em_sid');
    if (!sid) {
      sid = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      localStorage.setItem('em_sid', sid);
    }
    return sid;
  }

  function getVisitId() {
    return 'v_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ===== 6. Build session object =====
  var now = new Date();
  var session = {
    sessionId: getSessionId(),
    visitId: getVisitId(),
    source: getSource(),
    medium: getParam('utm_medium') || 'organic',
    campaign: getParam('utm_campaign') || '',
    term: getParam('utm_term') || '',
    device: getDevice(),
    browser: getBrowser(),
    os: getOS(),
    screen: window.screen.width + 'x' + window.screen.height,
    page: window.location.pathname,
    title: document.title || '',
    referrer: document.referrer || '',
    url: window.location.href,
    landed: now.toISOString(),
    language: (navigator.language || '') + '',
    timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || '',
    visits: 1
  };

  try {
    var prev = JSON.parse(localStorage.getItem('em_session') || 'null');
    if (prev && prev.sessionId === session.sessionId && prev.landed) {
      var elapsed = (Date.now() - new Date(prev.landed).getTime()) / 60000;
      if (elapsed < 90) {
        prev.visits = (prev.visits || 0) + 1;
        prev.page = window.location.pathname;
        prev.title = document.title;
        prev.screen = session.screen;
        session = prev;
      }
    }
    localStorage.setItem('em_session', JSON.stringify(session));
    window.__emSession = session;
  } catch (e) {}

  // ===== 7. Auto-record visit (skip internal pages) =====
  try {
    var isInternal = /admin|dashboard|journal|scanner|social-connect|analytics/.test(window.location.pathname);
    if (!isInternal) {
      // Record each page in a session (not just daily) for granular page views
      fetch('/api/leads.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '[Visitor]',
          email: '',
          phone: '',
          message: '[Video] Page: ' + window.location.pathname,
          source: session.source,
          medium: session.medium,
          campaign: session.campaign,
          term: session.term,
          device: session.device,
          browser: session.browser,
          os: session.os,
          screen: session.screen,
          referrer: session.referrer,
          sessionId: session.sessionId,
          language: session.language,
          timezone: session.timezone,
          type: 'visit'
        })
      }).catch(function () {});
    }
  } catch (e) {}

  // ===== 8. Time-on-page tracking =====
  window.addEventListener('beforeunload', function () {
    var duration = Math.round((Date.now() - new Date(now).getTime()) / 1000);
    try {
      fetch('/api/leads.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '[Engagement]',
          email: '',
          phone: '',
          message: '[Duration] Page: ' + window.location.pathname + ' Seconds: ' + duration,
          source: session.source,
          medium: session.medium,
          campaign: session.campaign,
          duration: duration,
          sessionId: session.sessionId,
          type: 'engagement'
        })
      }).catch(function () {});
    } catch (e) {}
  }, false);

  console.log('[EM Analytics]', session.source, session.device, session.browser, session.page);
})();
