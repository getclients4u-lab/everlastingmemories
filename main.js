/* ============================================================
   Everlasting Memories - Main JavaScript
   IntersectionObserver fade-ups, mobile menu, FAQ accordion,
   back-to-top button, nav scroll states
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- IntersectionObserver fade-ups ---- */
  const fadeUps = document.querySelectorAll('.fade-up');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  fadeUps.forEach(el => observer.observe(el));

  /* ---- Mobile menu ---- */
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileClose = document.querySelector('.mobile-close');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => mobileMenu.classList.add('open'));
  }
  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---- Nav scroll state ---- */
  const nav = document.querySelector('.nav');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 50) {
      nav.style.boxShadow = '0 2px 20px rgba(26,26,26,0.08)';
    } else {
      nav.style.boxShadow = 'none';
    }
    lastScroll = currentScroll;
  });

  /* ---- Back to top ---- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Active nav link ---- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.style.color = 'var(--gold)';
    }
  });

  /* ---- Form success message ---- */
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('submitted') === 'true') {
    const successMsg = document.getElementById('formSuccess');
    if (successMsg) successMsg.style.display = 'block';
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  /* ---- Google Sheets form submission ---- */
  const GOOGLE_SCRIPT_URL = ''; // PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
  const quoteForm = document.getElementById('quoteForm');
  if (quoteForm && GOOGLE_SCRIPT_URL) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = quoteForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      const data = {
        name: quoteForm.querySelector('[name="name"]').value,
        email: quoteForm.querySelector('[name="email"]').value,
        phone: quoteForm.querySelector('[name="phone"]').value,
        event_type: quoteForm.querySelector('[name="event_type"]').value,
        event_date: quoteForm.querySelector('[name="event_date"]').value,
        message: quoteForm.querySelector('[name="message"]').value
      };

      try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.result === 'success') {
          document.getElementById('formSuccess').style.display = 'block';
          document.getElementById('formError').style.display = 'none';
          quoteForm.reset();
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formSuccess').style.display = 'none';
        console.error('Form error:', err);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

});
