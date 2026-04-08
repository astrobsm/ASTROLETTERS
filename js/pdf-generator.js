/* ================================================================
   pdf-generator.js — Reliable PDF export using html2canvas + jsPDF
   Strategy: capture the ACTUAL on-screen element (no cloning) by
   temporarily hiding surrounding UI and positioning the letter at
   viewport origin so html2canvas gets a clean, full-width capture.
   ================================================================ */

var PDFGenerator = (function () {
  'use strict';

  var H2C_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  var JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  var libReady = false;
  var libLoading = false;
  var libQueue = [];

  /* ── Load html2canvas + jsPDF separately (more reliable than bundle) ── */
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed to load ' + url)); };
      document.head.appendChild(s);
    });
  }

  function ensureLibs(cb) {
    if (libReady) return cb();
    libQueue.push(cb);
    if (libLoading) return;
    libLoading = true;
    loadScript(H2C_URL)
      .then(function () { return loadScript(JSPDF_URL); })
      .then(function () {
        libReady = true;
        libLoading = false;
        libQueue.forEach(function (fn) { fn(); });
        libQueue = [];
      })
      .catch(function (e) {
        libLoading = false;
        libQueue.forEach(function (fn) { fn(e); });
        libQueue = [];
      });
  }

  /* ── Convert image URL to data URI ── */
  function imgToDataURI(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        var c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        try { resolve(c.toDataURL('image/png')); }
        catch (e) { resolve(''); }
      };
      img.onerror = function () { resolve(''); };
      img.src = url;
    });
  }

  /* ── Pre-load assets as data URIs ── */
  function preloadAssets() {
    return Promise.all([
      imgToDataURI('assets/logo.png'),
      imgToDataURI('assets/signature.png')
    ]);
  }

  /* ── Build sanitised filename ── */
  function buildFilename(subject) {
    if (!subject) return 'Bonnesante_Letter.pdf';
    return 'Bonnesante_' + subject.substring(0, 40)
      .replace(/[^a-zA-Z0-9 ]/g, '').replace(/ +/g, '_') + '.pdf';
  }

  /* ──────────────────────────────────────────────────────────────
     GENERATE PDF
     1.  Hide every sibling of the letter-page's ancestor chain
         so only the letter is visible at 0,0 in the viewport.
     2.  Use html2canvas to capture the element directly.
     3.  Feed the canvas into jsPDF as a full-page JPEG image.
     4.  Restore the DOM to its original state.
     ────────────────────────────────────────────────────────────── */
  function generate(pageEl, subject, onDone) {
    ensureLibs(function (err) {
      if (err) return onDone(err);

      var filename = buildFilename(subject);

      /* — collect elements to temporarily hide — */
      var hidden = [];
      function hideEl(sel) {
        var el = document.querySelector(sel);
        if (el) { hidden.push({ el: el, prev: el.style.display }); el.style.display = 'none'; }
      }
      hideEl('.app-header');
      hideEl('.form-panel');
      hideEl('.preview-label');

      /* — save & override styles on the letter-page and its ancestors — */
      var saved = [];
      function overrideStyle(el, css) {
        saved.push({ el: el, prev: el.getAttribute('style') || '' });
        el.style.cssText += ';' + css;
      }

      var container = document.querySelector('.container');
      var previewPanel = document.querySelector('.preview-panel');
      var previewFrame = document.querySelector('.preview-frame');

      if (container)    overrideStyle(container,    'padding:0;margin:0;display:block;');
      if (previewPanel) overrideStyle(previewPanel, 'padding:0;margin:0;');
      if (previewFrame) overrideStyle(previewFrame, 'padding:0;margin:0;box-shadow:none;border-radius:0;overflow:visible;');
      overrideStyle(pageEl, 'margin:0;width:794px;min-height:1123px;');
      overrideStyle(document.body, 'overflow:hidden;margin:0;padding:0;');

      window.scrollTo(0, 0);

      /* — capture after reflow — */
      setTimeout(function () {
        /* A4 at 96 dpi in px */
        var A4_W = 794;
        var A4_H = 1123;
        var contentH = Math.max(A4_H, pageEl.scrollHeight);

        html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          width: A4_W,
          height: contentH,
          windowWidth: A4_W,
          windowHeight: contentH,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0
        }).then(function (canvas) {
          /* — build PDF with jsPDF — */
          var jsPDF = window.jspdf.jsPDF;
          var imgData = canvas.toDataURL('image/jpeg', 0.95);
          var pdfW = 210;                       // A4 mm width
          var pdfH = 297;                       // A4 mm height
          var imgW = canvas.width;
          var imgH = canvas.height;
          var pages = Math.ceil(imgH / (imgW * (pdfH / pdfW)));
          var pdf = new jsPDF('portrait', 'mm', 'a4');

          /* slice the canvas image into A4-ratio pages */
          var pageCanvasH = imgW * (pdfH / pdfW);   // pixels per page
          for (var p = 0; p < pages; p++) {
            if (p > 0) pdf.addPage();
            var srcY = p * pageCanvasH;
            var sliceH = Math.min(pageCanvasH, imgH - srcY);

            var sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = imgW;
            sliceCanvas.height = sliceH;
            sliceCanvas.getContext('2d').drawImage(
              canvas, 0, srcY, imgW, sliceH, 0, 0, imgW, sliceH
            );
            var sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
            var sliceMMH = (sliceH / imgW) * pdfW;
            pdf.addImage(sliceData, 'JPEG', 0, 0, pdfW, sliceMMH);
          }

          pdf.save(filename);
          restore();
          onDone(null);
        }).catch(function (e) {
          restore();
          onDone(e);
        });
      }, 500);

      /* — Restore all hidden / overridden elements — */
      function restore() {
        hidden.forEach(function (h) { h.el.style.display = h.prev; });
        saved.forEach(function (s) {
          if (s.prev) s.el.setAttribute('style', s.prev);
          else s.el.removeAttribute('style');
        });
      }
    });
  }

  return {
    generate: generate,
    preloadAssets: preloadAssets,
    imgToDataURI: imgToDataURI
  };
})();
