/* ================================================================
   letter-template.js — Generates the letter HTML from form data
   ================================================================ */

var LetterTemplate = (function () {
  'use strict';

  // Paths relative to index.html
  var LOGO_PATH = 'assets/logo.png';
  var SIGNATURE_PATH = 'assets/signature.png';

  // Pre-loaded data URIs (filled at boot by app.js for PDF reliability)
  var logoDataURI = '';
  var signatureDataURI = '';

  function setAssetDataURIs(logo, sig) {
    logoDataURI = logo || '';
    signatureDataURI = sig || '';
  }

  /**
   * Escape HTML entities
   */
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /**
   * Format ISO date string to "8th April 2026" style
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    var months = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    var day = d.getDate();
    var suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    return day + suffix + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  /**
   * Build the full letter HTML string
   * @param {Object} data — form field values
   * @param {boolean} forPDF — if true, use data URIs for images (required for html2canvas)
   */
  function build(data, forPDF) {
    var logoSrc = forPDF && logoDataURI ? logoDataURI : LOGO_PATH;
    var sigSrc = forPDF && signatureDataURI ? signatureDataURI : SIGNATURE_PATH;
    var html = '';

    // ── HEADER ──────────────────────────────
    html += '<div class="lh-header">';
    html += '<div class="lh-header-bg">';
    html += '<div class="lh-logo"><img src="' + logoSrc + '" alt="ASTRO BSM Logo"></div>';
    html += '<div class="lh-brand">';
    html += '<h1>BONNESANTE MEDICALS</h1>';
    html += '<div class="tagline1">INNOVATIVE HEALTH CARE SOLUTIONS</div>';
    html += '<div class="tagline2">. . . R E W A R D I N G&ensp;T R U S T&ensp;W I T H&ensp;E X C E L L E N C E</div>';
    html += '</div></div>';
    html += '<div class="lh-address-bar">';
    html += 'No 17A Isuofia / No 6B Peace Avenue, Federal Housing Estate, Trans-Ekulu, Enugu, Enugu State. &nbsp;|&nbsp; astrobsm@gmail.com';
    html += '</div></div>';

    // ── BODY ────────────────────────────────
    html += '<div class="lh-body">';

    // Date
    if (data.date) {
      html += '<div class="lh-date">' + esc(formatDate(data.date)) + '</div>';
    }

    // Recipient
    if (data.recipTitle || data.recipOrg) {
      html += '<div class="lh-recipient">';
      if (data.recipTitle) html += '<p class="bold">' + esc(data.recipTitle) + '</p>';
      if (data.recipOrg) {
        data.recipOrg.split('\n').forEach(function (line) {
          var l = line.trim();
          if (l) html += '<p>' + esc(l) + '</p>';
        });
      }
      html += '</div>';
    }

    // Salutation
    html += '<div class="lh-salutation">' + esc(data.salutation) + '</div>';

    // Subject
    if (data.subject) {
      html += '<div class="lh-subject">RE: ' + esc(data.subject).toUpperCase() + '</div>';
    }

    // Content
    html += '<div class="lh-content">';
    if (data.bodyOpen) html += '<p>' + esc(data.bodyOpen) + '</p>';
    if (data.bodyMid) {
      data.bodyMid.split('\n\n').forEach(function (para) {
        var p = para.trim();
        if (p) html += '<p>' + esc(p) + '</p>';
      });
    }
    if (data.bullets && data.bullets.length) {
      html += '<ul>';
      data.bullets.forEach(function (b) {
        var parts = b.split(' – ');
        if (parts.length < 2) parts = b.split(' — ');
        if (parts.length >= 2) {
          html += '<li><strong>' + esc(parts[0].trim()) + '</strong> – ' + esc(parts.slice(1).join(' – ').trim()) + '</li>';
        } else {
          html += '<li>' + esc(b) + '</li>';
        }
      });
      html += '</ul>';
    }
    if (data.bodyClose) html += '<p>' + esc(data.bodyClose) + '</p>';
    html += '</div>';

    // Closing & Signature
    html += '<div class="lh-closing">' + esc(data.closing) + '</div>';
    html += '<div class="lh-signature"><img src="' + sigSrc + '" alt="Signature"></div>';

    // Signatory
    html += '<div class="lh-signatory">';
    if (data.sigName) html += '<div class="name">' + esc(data.sigName) + '</div>';
    if (data.sigTitle) html += '<div>' + esc(data.sigTitle) + '</div>';
    if (data.sigPhone) html += '<div>Phone: ' + esc(data.sigPhone) + '</div>';
    if (data.sigEmail) html += '<div>Email: ' + esc(data.sigEmail) + '</div>';
    html += '</div>';

    html += '</div>'; // .lh-body

    // ── FOOTER ──────────────────────────────
    html += '<div class="lh-footer">';
    html += '<div class="ft-left">';
    html += '<span><span class="ft-icon">&#9742;</span>+234 909 253 4292, +234 909 253 4293</span>';
    html += '<span><span class="ft-icon">&#9993;</span>astrobsm@gmail.com</span>';
    html += '</div>';
    html += '<div class="ft-right">';
    html += '<span><span class="ft-icon">&#9679;</span>No 17A Isuofia / No 6B Peace Avenue</span>';
    html += '<span>&nbsp;&nbsp;&nbsp;Federal Housing Estate, Trans-Ekulu, Enugu, Enugu State</span>';
    html += '</div>';
    html += '</div>';

    return html;
  }

  return {
    build: build,
    setAssetDataURIs: setAssetDataURIs,
    formatDate: formatDate
  };
})();
