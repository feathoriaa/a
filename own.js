// ===== own.js (2025 optimized + fixed export aspect ratio) =====

// Element refs (guarded)
const quoteInput    = document.getElementById('quoteInput');
const authorInput   = document.getElementById('authorInput');
const quoteText     = document.getElementById('quoteText');
const quoteAuthor   = document.getElementById('quoteAuthor');
const downloadBtn   = document.getElementById('downloadBtn');
const quotePreview  = document.getElementById('quotePreview');
const bgSelect      = document.getElementById('bgSelect');
const fontSelect    = document.getElementById('fontSelect');
const shadowToggle  = document.getElementById('shadowToggle');
const logoToggle    = document.getElementById('logoToggle');
const logo          = document.getElementById('logo');
const bgUpload      = document.getElementById('bgUpload');
const brightnessRange = document.getElementById('brightnessRange');
const blurRange     = document.getElementById('blurRange');
const textColor     = document.getElementById('textColor');
const aspectSelect  = document.getElementById('aspectSelect');
const filterButtons = document.querySelectorAll('.filter-buttons button');

if (!quotePreview) console.error('Missing #quotePreview element — script cannot proceed.');

// Known BG classes (used by presets)
const BG_CLASSES = ['bg1','bg2','bg3','bg4','bg5','bg6'];

// Helper: keep the base class present
function ensureBaseClass() {
  if (!quotePreview.classList.contains('quote-card')) {
    quotePreview.classList.add('quote-card');
  }
}

// Remove only background preset classes (do not touch aspect / shadow)
function removeBgClasses() {
  BG_CLASSES.forEach(c => quotePreview.classList.remove(c));
}

// Apply a preset background class (preserve other classes)
function applyPresetBackground(preset) {
  ensureBaseClass();
  quotePreview.style.backgroundImage = '';
  removeBgClasses();
  if (preset && BG_CLASSES.includes(preset)) {
    quotePreview.classList.add(preset);
  }
  console.debug('Applied preset background:', preset);
}

// Apply uploaded background (preserve aspect & other classes)
function applyCustomBackground(dataUrl) {
  ensureBaseClass();
  removeBgClasses();
  quotePreview.style.backgroundImage = `url(${dataUrl})`;
  quotePreview.style.backgroundSize = 'cover';
  quotePreview.style.backgroundPosition = 'center';
  console.debug('Applied custom background (data-url)', dataUrl && dataUrl.slice ? dataUrl.slice(0,80) + '...' : dataUrl);
}

// Minimal font loader (avoid duplicates)
function loadFont(fontName) {
  if (!fontName) return;
  const encoded = fontName.replace(/ /g, '+');
  const href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`;
  const existing = Array.from(document.head.querySelectorAll('link')).some(l => l.href && l.href.includes(encoded));
  if (!existing) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    console.debug('Loaded font:', fontName);
  }
}

// Keep track of active filter
let activeFilter = 'none';
let customBgUrl = null;

// Main preview update
function updateQuotePreview() {
  if (!quotePreview) return;

  if (quoteText) quoteText.style.opacity = 0;
  if (quoteAuthor) quoteAuthor.style.opacity = 0;

  setTimeout(() => {
    const quote = quoteInput?.value?.trim() || 'Your quote will appear here...';
    const author = authorInput?.value?.trim() || 'Your Name';
    if (quoteText) quoteText.textContent = `"${quote}"`;
    if (quoteAuthor) quoteAuthor.textContent = `– ${author}`;

    const font = fontSelect?.value || '';
    loadFont(font);
    if (quoteText) quoteText.style.fontFamily = font;
    if (quoteAuthor) quoteAuthor.style.fontFamily = font;

    const color = textColor?.value || '#ffffff';
    if (quoteText) quoteText.style.color = color;
    if (quoteAuthor) quoteAuthor.style.color = color;

    if (customBgUrl) {
      removeBgClasses();
      quotePreview.style.backgroundImage = `url(${customBgUrl})`;
      quotePreview.style.backgroundSize = 'cover';
      quotePreview.style.backgroundPosition = 'center';
    } else {
      quotePreview.style.backgroundImage = '';
      removeBgClasses();
      const preset = bgSelect?.value || '';
      if (preset && BG_CLASSES.includes(preset)) {
        quotePreview.classList.add(preset);
      }
    }

    const brightness = (brightnessRange?.value ?? 100) / 100;
    const blur = (blurRange?.value ?? 0);
    let filterStr = `brightness(${brightness}) blur(${blur}px)`;
    switch (activeFilter) {
      case 'dreamy': filterStr += ' saturate(1.2)'; break;
      case 'warm':   filterStr += ' sepia(0.3) contrast(1.1)'; break;
      case 'cool':   filterStr += ' hue-rotate(180deg) brightness(1.05)'; break;
      case 'bw':     filterStr += ' grayscale(1) contrast(1.2)'; break;
    }
    quotePreview.style.filter = filterStr;

    quotePreview.classList.toggle('text-shadow', !!shadowToggle?.checked);
    if (logo) logo.style.display = logoToggle?.checked ? 'block' : 'none';

    const aspectVal = aspectSelect?.value || 'square';
    quotePreview.classList.remove('square','story','banner');
    quotePreview.classList.add(aspectVal);

    if (quoteText) { quoteText.style.transition = 'opacity 0.35s ease'; quoteText.style.opacity = 1; }
    if (quoteAuthor) { quoteAuthor.style.transition = 'opacity 0.35s ease'; quoteAuthor.style.opacity = 1; }
  }, 60);

  quotePreview.style.transition = 'transform 0.22s ease';
  quotePreview.style.transform = 'scale(1.02)';
  setTimeout(() => (quotePreview.style.transform = 'scale(1)'), 160);
}

// === Event wiring ===

// Preset background
if (bgSelect) {
  bgSelect.addEventListener('change', () => {
    customBgUrl = null;
    applyPresetBackground(bgSelect.value);
    updateQuotePreview();
  });
}

// Upload background
if (bgUpload) {
  bgUpload.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      customBgUrl = reader.result;
      applyCustomBackground(customBgUrl);
      updateQuotePreview();
    };
    reader.readAsDataURL(file);
  });
}

// Filter buttons
if (filterButtons && filterButtons.length) {
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');
      activeFilter = btn.dataset.filter || 'none';
      updateQuotePreview();
    });
  });
}

// Aspect ratio
if (aspectSelect) {
  aspectSelect.addEventListener('change', () => {
    const val = aspectSelect.value || 'square';
    quotePreview.classList.remove('square','story','banner');
    quotePreview.classList.add(val);
    console.debug('Aspect changed to:', val);
    updateQuotePreview();
  });
}

// Inputs that update preview
[
  quoteInput, authorInput, fontSelect, textColor,
  brightnessRange, blurRange, shadowToggle, logoToggle
].forEach(el => {
  if (!el) return;
  el.addEventListener('input', updateQuotePreview);
  el.addEventListener('change', updateQuotePreview);
});

// === Export / Download (fixed aspect ratio) ===
if (downloadBtn) {
  downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    const prevText = downloadBtn.textContent;
    downloadBtn.textContent = '✨ Generating...';

    try {
      // Clone preview to capture exact aspect ratio
      const clone = quotePreview.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.margin = '0';
      clone.style.transform = 'none';
      clone.style.boxShadow = 'none';
      clone.style.opacity = '1';
      clone.style.filter = quotePreview.style.filter;
      clone.style.backgroundImage = quotePreview.style.backgroundImage;
      clone.style.backgroundSize = 'cover';
      clone.style.backgroundPosition = 'center';
      clone.style.maxWidth = 'none';
      clone.style.maxHeight = 'none';
      clone.style.display = 'block';
      clone.style.overflow = 'hidden';

      let width = 1080, height = 1080;
      if (quotePreview.classList.contains('story')) {
        width = 1080; height = 1920;
      } else if (quotePreview.classList.contains('banner')) {
        width = 1920; height = 1080;
      }
      clone.style.width = `${width}px`;
      clone.style.height = `${height}px`;

      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.width = `${width}px`;
      wrapper.style.height = `${height}px`;
      wrapper.style.background = 'none';
      wrapper.style.overflow = 'hidden';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        width: width,
        height: height,
      });

      wrapper.remove();

      const link = document.createElement('a');
      const aspect = quotePreview.classList.contains('story')
        ? 'story' : quotePreview.classList.contains('banner') ? 'banner' : 'square';
      link.download = `feathoria-${aspect}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

    } catch (err) {
      console.error('Export error:', err);
      alert('⚠️ Something went wrong while exporting the image.');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = prevText || 'Download as PNG';
    }
  });
}

// === Initialization ===
window.addEventListener('load', () => {
  ensureBaseClass();

  if (bgSelect && bgSelect.value && BG_CLASSES.includes(bgSelect.value)) {
    removeBgClasses();
    quotePreview.classList.add(bgSelect.value);
  }

  const initAspect = aspectSelect?.value || 'square';
  quotePreview.classList.remove('square','story','banner');
  quotePreview.classList.add(initAspect);

  if (!document.querySelector('.filter-buttons .active-filter')) {
    const noneBtn = document.querySelector('.filter-buttons button[data-filter="none"]');
    if (noneBtn) noneBtn.classList.add('active-filter');
  }

  updateQuotePreview();
  console.debug('✅ own.js initialized. Initial aspect:', initAspect);
});
