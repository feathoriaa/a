document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     1) Smooth Typewriter Effect with Cursor
     ========================= */
  (function typewriter() {
    const el = document.querySelector('.hero h2');
    if (!el) return;
    const text = el.textContent.trim();
    el.textContent = '';
    let i = 0;
    const cursor = document.createElement('span');
    cursor.textContent = '|';
    cursor.style.marginLeft = '2px';
    cursor.style.opacity = '1';
    cursor.style.transition = 'opacity 0.3s';
    el.appendChild(cursor);

    const blink = () => {
      cursor.style.opacity = cursor.style.opacity === '1' ? '0' : '1';
      setTimeout(blink, 500);
    };
    blink();

    const step = () => {
      if (i < text.length) {
        el.textContent = text.slice(0, i + 1);
        el.appendChild(cursor);
        i++;
        setTimeout(step, 50);
      }
    };
    step();
  })();

  /* =========================
     2) Fade-in on Scroll
     ========================= */
  const fadeItems = document.querySelectorAll('.poem-item, .quote-item');
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.12 });

  fadeItems.forEach(item => {
    item.classList.add('fade-item');
    fadeObserver.observe(item);
  });

  /* =========================
     3) Hover Effect on Items
     ========================= */
  document.addEventListener('mouseover', e => {
    const item = e.target.closest('.poem-item, .quote-item');
    if (item) item.classList.add('item-hover');
  });
  document.addEventListener('mouseout', e => {
    const item = e.target.closest('.poem-item, .quote-item');
    if (item) item.classList.remove('item-hover');
  });

  /* =========================
     4) Scroll-to-Top Button with Fade
     ========================= */
  const scrollBtn = document.getElementById('scroll-top');
  if (scrollBtn) {
    scrollBtn.style.transition = 'opacity 0.3s, transform 0.3s';
    const toggleScrollBtn = () => {
      if (window.scrollY > 200) {
        scrollBtn.style.display = 'block';
        setTimeout(() => scrollBtn.style.opacity = '1', 10);
      } else {
        scrollBtn.style.opacity = '0';
        setTimeout(() => scrollBtn.style.display = 'none', 300);
      }
    };
    toggleScrollBtn();
    window.addEventListener('scroll', toggleScrollBtn);
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* =========================
     5) Accordion Functionality
     ========================= */
  const closePanel = content => {
    if (!content) return;
    content.style.maxHeight = '0px';
    content.style.opacity = '0';
    content.style.padding = '0 18px';
    content.dataset.open = 'false';
  };
  const openPanel = content => {
    if (!content) return;
    content.style.opacity = '1';
    content.style.padding = '12px 18px';
    content.style.maxHeight = content.scrollHeight + 'px';
    content.dataset.open = 'true';
  };
  document.querySelectorAll('.accordion-content').forEach(c => closePanel(c));

  document.body.addEventListener('click', e => {
    const header = e.target.closest('.accordion-item h3');
    if (!header) return;
    const item = header.closest('.accordion-item');
    if (!item) return;
    const clickedContent = item.querySelector('.accordion-content');

    document.querySelectorAll('.accordion-item').forEach(other => {
      const oc = other.querySelector('.accordion-content');
      if (oc && oc !== clickedContent) closePanel(oc);
    });

    if (clickedContent) {
      clickedContent.dataset.open === 'true' ? closePanel(clickedContent) : openPanel(clickedContent);
    }
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('.accordion-content').forEach(c => {
      if (c.dataset.open === 'true') c.style.maxHeight = c.scrollHeight + 'px';
    });
  });

  /* =========================
     6) Search / Filter
     ========================= */
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const query = e.target.value.trim().toLowerCase();
      document.querySelectorAll('.boxes-container .box').forEach(box => {
        box.style.display = box.textContent.toLowerCase().includes(query) ? 'block' : 'none';
      });
      document.querySelectorAll('.accordion-item').forEach(item => {
        const match = item.textContent.toLowerCase().includes(query);
        item.style.display = match ? '' : 'none';
        const c = item.querySelector('.accordion-content');
        if (c && !match) closePanel(c);
      });
    });
    if (searchInput.value.trim() !== '') searchInput.dispatchEvent(new Event('input'));
  }

});
