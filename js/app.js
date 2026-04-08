/* ================================================================
   app.js — Main application controller for ASTRO Letters PWA
   ================================================================ */

(function () {
  'use strict';

  // ── DOM refs ──
  var $ = function (id) { return document.getElementById(id); };
  var letterPage  = $('letter-page');
  var btnPreview  = $('btn-preview');
  var btnPdf      = $('btn-pdf');
  var btnClear    = $('btn-clear');
  var btnBullet   = $('btn-add-bullet');
  var bulletList  = $('bullet-list');
  var toast       = $('toast');
  var installBtn  = $('install-btn');

  var bulletCount = 0;

  // ── Toast helper ──
  function showToast(msg, duration) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, duration || 3000);
  }

  // ── Bullet management ──
  function addBullet() {
    bulletCount++;
    var id = 'bullet_' + bulletCount;
    var wrap = document.createElement('div');
    wrap.className = 'bullet-item';
    wrap.id = id + '_wrap';
    wrap.innerHTML = '<input type="text" id="' + id + '" placeholder="Bold Label – description text">' +
                     '<button type="button" onclick="App.removeBullet(\'' + id + '\')">&times;</button>';
    bulletList.appendChild(wrap);
  }

  function removeBullet(id) {
    var w = document.getElementById(id + '_wrap');
    if (w) w.remove();
  }

  function getBullets() {
    var bullets = [];
    var inputs = bulletList.querySelectorAll('input[type="text"]');
    inputs.forEach(function (inp) {
      var v = inp.value.trim();
      if (v) bullets.push(v);
    });
    return bullets;
  }

  // ── Gather form data ──
  function gatherData() {
    var salBase = $('f_salutation').value;
    var salName = ($('f_sal_name').value || '').trim();
    var salutation = salName ? salBase.replace(/,$/, '') + ' ' + salName + ',' : salBase;

    return {
      date: $('f_date').value,
      recipTitle: $('f_recip_title').value.trim(),
      recipOrg: $('f_recip_org').value.trim(),
      salutation: salutation,
      subject: $('f_subject').value.trim(),
      bodyOpen: $('f_body_open').value.trim(),
      bodyMid: $('f_body_mid').value.trim(),
      bullets: getBullets(),
      bodyClose: $('f_body_close').value.trim(),
      closing: $('f_closing').value,
      sigName: $('f_sig_name').value.trim(),
      sigTitle: $('f_sig_title').value.trim(),
      sigPhone: $('f_sig_phone').value.trim(),
      sigEmail: $('f_sig_email').value.trim()
    };
  }

  // ── Preview ──
  function preview() {
    var data = gatherData();
    letterPage.innerHTML = LetterTemplate.build(data, false);
    showToast('Preview updated');
  }

  // ── PDF download ──
  function downloadPDF() {
    var data = gatherData();

    // Render using data URIs for images
    letterPage.innerHTML = LetterTemplate.build(data, true);

    btnPdf.disabled = true;
    btnPdf.textContent = 'Generating…';

    // Small delay for render
    setTimeout(function () {
      PDFGenerator.generate(letterPage, data.subject, function (err) {
        btnPdf.disabled = false;
        btnPdf.innerHTML = '&#9660; Download PDF';

        if (err) {
          console.error('PDF error:', err);
          showToast('PDF generation failed — check console', 5000);
        } else {
          showToast('PDF downloaded successfully!');
        }

        // Restore preview with normal image paths
        letterPage.innerHTML = LetterTemplate.build(data, false);
      });
    }, 200);
  }

  // ── Clear form ──
  function clearForm() {
    ['f_recip_title','f_recip_org','f_sal_name','f_subject',
     'f_body_open','f_body_mid','f_body_close'].forEach(function (id) {
      $(id).value = '';
    });
    bulletList.innerHTML = '';
    bulletCount = 0;
    $('f_salutation').selectedIndex = 0;
    $('f_closing').selectedIndex = 0;
    letterPage.innerHTML = '<div id="placeholder-msg" style="display:flex;align-items:center;justify-content:center;min-height:500px;color:#aaa;font-size:16px;text-align:center;padding:40px;">Fill in the form and click <strong style="margin:0 6px;">Preview</strong> to see your letter.</div>';
    showToast('Form cleared');
  }

  // ── Auto-set today's date ──
  function setDefaultDate() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    $('f_date').value = d.getFullYear() + '-' + mm + '-' + dd;
  }

  // ── Pre-load image data URIs for PDF ──
  function preloadImages() {
    PDFGenerator.preloadAssets().then(function (results) {
      LetterTemplate.setAssetDataURIs(results[0], results[1]);
    });
  }

  // ── PWA Install ──
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
  });

  installBtn.addEventListener('click', function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  });

  // ── Service Worker registration ──
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function (err) {
        console.log('SW registration skipped:', err.message);
      });
    });
  }

  // ── Bind events ──
  btnPreview.addEventListener('click', preview);
  btnPdf.addEventListener('click', downloadPDF);
  btnClear.addEventListener('click', clearForm);
  btnBullet.addEventListener('click', addBullet);

  // ── Keyboard shortcut (Ctrl+Enter → preview) ──
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      preview();
    }
  });

  // ── Init ──
  setDefaultDate();
  preloadImages();

  // Expose for inline onclick handlers (bullet remove)
  window.App = {
    removeBullet: removeBullet
  };
})();
