/* ================================================================
   pdf-generator.js — Reliable PDF export using jsPDF + html2canvas
   Uses the bundled libs from html2pdf.js CDN
   ================================================================ */

var PDFGenerator = (function () {
  'use strict';

  var LIB_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  var libLoaded = false;
  var libLoading = false;
  var libCallbacks = [];

  /**
   * Lazy-load html2pdf.js bundle (includes html2canvas + jsPDF)
   */
  function ensureLib(cb) {
    if (libLoaded) return cb();
    libCallbacks.push(cb);
    if (libLoading) return;
    libLoading = true;
    var s = document.createElement('script');
    s.src = LIB_URL;
    s.onload = function () {
      libLoaded = true;
      libLoading = false;
      libCallbacks.forEach(function (fn) { fn(); });
      libCallbacks = [];
    };
    s.onerror = function () {
      libLoading = false;
      libCallbacks.forEach(function (fn) { fn(new Error('Failed to load PDF library')); });
      libCallbacks = [];
    };
    document.head.appendChild(s);
  }

  /**
   * Convert an image URL (or path) to a data URI via canvas
   */
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

  /**
   * Pre-load assets as data URIs for PDF (needed because html2canvas
   * cannot reliably resolve relative paths in cloned DOM)
   */
  function preloadAssets() {
    return Promise.all([
      imgToDataURI('assets/logo.png'),
      imgToDataURI('assets/signature.png')
    ]);
  }

  /**
   * Generate and download PDF from the letter-page element
   * @param {HTMLElement} pageEl — the .letter-page div
   * @param {string} subject — letter subject for filename
   * @param {Function} onDone — called when finished (err or null)
   */
  function generate(pageEl, subject, onDone) {
    ensureLib(function (err) {
      if (err) return onDone(err);

      // Build filename
      var filename = 'Bonnesante_Letter.pdf';
      if (subject) {
        filename = 'Bonnesante_' + subject.substring(0, 40).replace(/[^a-zA-Z0-9 ]/g, '').replace(/ +/g, '_') + '.pdf';
      }

      // Create an off-screen container with fixed A4 pixel width
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:absolute;left:0;top:0;width:794px;z-index:-9999;overflow:visible;background:#fff;';
      document.body.appendChild(wrapper);

      // Clone the page into the wrapper
      var clone = pageEl.cloneNode(true);
      clone.style.cssText = 'width:794px;min-height:1123px;margin:0;display:flex;flex-direction:column;background:#fff;';
      wrapper.appendChild(clone);

      // Scroll to top to avoid capture offset
      window.scrollTo(0, 0);

      // Allow reflow + image decode
      setTimeout(function () {
        var opts = {
          margin: 0,
          filename: filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            width: 794,
            height: Math.max(1123, clone.scrollHeight),
            windowWidth: 794,
            scrollX: 0,
            scrollY: 0
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css'] }
        };

        html2pdf().set(opts).from(clone).save()
          .then(function () {
            cleanup();
            onDone(null);
          })
          .catch(function (e) {
            cleanup();
            onDone(e);
          });

        function cleanup() {
          if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        }
      }, 400);
    });
  }

  return {
    generate: generate,
    preloadAssets: preloadAssets,
    imgToDataURI: imgToDataURI
  };
})();
