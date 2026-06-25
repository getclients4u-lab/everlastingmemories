// ============================================================
// Everlasting Memories - Enhanced Interactive Experience
// ============================================================

(function() {
  'use strict';

  // ---- IntersectionObserver for fade-up animations ----
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

  // ---- Mobile Menu ----
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.querySelector('.mobile-close');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }
  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener('click', closeMobileMenu);
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }
  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ---- FAQ Accordion ----
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all others (single-open mode)
      faqItems.forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ---- Back to Top Button ----
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Nav Scroll State ----
  const nav = document.querySelector('.nav');
  if (nav) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ---- Smooth Scroll for Anchor Links ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 72;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // ---- Gallery Lightbox ----
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (galleryItems.length > 0) {
    // Create lightbox elements
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-overlay"></div>
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-prev" aria-label="Previous">&#8249;</button>
      <button class="lightbox-next" aria-label="Next">&#8250;</button>
      <div class="lightbox-content">
        <img src="" alt="">
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(lightbox);

    // Add lightbox styles
    const lightboxStyles = document.createElement('style');
    lightboxStyles.textContent = `
      .lightbox { position:fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition:opacity .3s ease; }
      .lightbox.active { opacity:1; pointer-events:auto; }
      .lightbox-overlay { position:absolute; inset:0; background:rgba(0,0,0,.9); }
      .lightbox-content { position:relative; z-index:1; max-width:90vw; max-height:85vh; text-align:center; }
      .lightbox-content img { max-width:100%; max-height:80vh; object-fit:contain; border-radius:8px; }
      .lightbox-caption { color:#fff; margin-top:12px; font-family:var(--font-display); font-size:1.1rem; }
      .lightbox-close { position:absolute; top:20px; right:30px; background:none; border:none; color:#fff; font-size:2.5rem; cursor:pointer; z-index:2; }
      .lightbox-prev, .lightbox-next { position:absolute; top:50%; transform:translateY(-50%); background:rgba(255,255,255,.1); border:none; color:#fff; font-size:2rem; width:50px; height:50px; border-radius:50%; cursor:pointer; z-index:2; transition:background .2s; }
      .lightbox-prev:hover, .lightbox-next:hover { background:rgba(255,255,255,.2); }
      .lightbox-prev { left:20px; }
      .lightbox-next { right:20px; }
      @media (max-width:600px) { .lightbox-prev, .lightbox-next { display:none; } }
    `;
    document.head.appendChild(lightboxStyles);

    let currentIndex = 0;
    const images = Array.from(galleryItems).map(item => ({
      src: item.querySelector('img').src,
      caption: item.querySelector('.gallery-overlay span')?.textContent || ''
    }));

    function openLightbox(index) {
      currentIndex = index;
      updateLightbox();
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    function updateLightbox() {
      const img = lightbox.querySelector('.lightbox-content img');
      const caption = lightbox.querySelector('.lightbox-caption');
      img.src = images[currentIndex].src;
      caption.textContent = images[currentIndex].caption;
    }

    function nextImage() {
      currentIndex = (currentIndex + 1) % images.length;
      updateLightbox();
    }

    function prevImage() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateLightbox();
    }

    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => openLightbox(index));
    });

    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-next').addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
    lightbox.querySelector('.lightbox-prev').addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    });
  }

  // ---- Contact Form Handling ----
  const contactForm = document.getElementById('contactForm') || document.getElementById('quoteForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      submitBtn.style.opacity = '0.7';

      try {
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        
        // Store lead in localStorage for admin dashboard
        if (contactForm.hasAttribute('data-store-lead')) {
          const leads = JSON.parse(localStorage.getItem('em_leads') || '[]');
          leads.unshift({
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            eventType: data.eventType || data.event_type || '',
            eventDate: data.eventDate || '',
            message: data.message,
            date: new Date().toISOString(),
            status: 'new'
          });
          localStorage.setItem('em_leads', JSON.stringify(leads));
        }
        
        // Simulate form submission (replace with actual endpoint)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Show success message
        showNotification('Message sent successfully! We\'ll get back to you within 24 hours.', 'success');
        contactForm.reset();
      } catch (error) {
        showNotification('Something went wrong. Please try again or call us directly.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.style.opacity = '1';
      }
    });
  }

  // ---- Notification System ----
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position:fixed; top:20px; right:20px; z-index:10001;
      padding:16px 24px; border-radius:8px; font-weight:500;
      color:#fff; transform:translateX(120%); transition:transform .4s ease;
      ${type === 'success' ? 'background:#4CAF50;' : 'background:#f44336;'}
    `;
    document.body.appendChild(notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
    });

    // Auto dismiss
    setTimeout(() => {
      notification.style.transform = 'translateX(120%)';
      setTimeout(() => notification.remove(), 400);
    }, 4000);
  }

  // ---- Lazy Loading Images ----
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '50px' });
    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // ---- Active Navigation Link ----
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
      link.classList.add('active');
      link.style.color = 'var(--rose)';
    }
  });

  // ---- Parallax Effect for Hero ----
  const hero = document.querySelector('.hero');
  if (hero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        const heroVisual = hero.querySelector('.hero-visual');
        if (heroVisual) {
          heroVisual.style.transform = `translateY(${scrolled * 0.15}px)`;
        }
      }
    }, { passive: true });
  }

  // ---- Performance: Preload critical resources ----
  const criticalImages = document.querySelectorAll('.hero-visual img, .about-img img');
  criticalImages.forEach(img => {
    if (img.src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.src;
      document.head.appendChild(link);
    }
  });

  console.log('✨ Everlasting Memories - Site loaded successfully');
})();
