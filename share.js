// share.js, fitur Bagikan Resep RacikRouter.
// Satu resep = nama tool (atau daftar keinginan Racik Cepat) + nilai isian form,
// dikemas jadi tautan yang bisa dibuka siapa pun: halaman tool terbuka dengan
// isian yang sama persis dan script yang sama tergenerate ulang. Data resep
// menempel di bagian hash URL (setelah tanda #), jadi tidak pernah dikirim
// ke server mana pun. QR code digambar lokal memakai qrcode.js (MIT).
(function () {
'use strict';

var RR = window.RR;
if (!RR) { return; }

function esc(s) {
  return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function byId(id) {
  for (var i = 0; i < RR.tools.length; i++) { if (RR.tools[i].id === id) { return RR.tools[i]; } }
  return null;
}

/* ---------- Pengodean muatan resep ---------- */
function b64urlEncode(bytes) {
  var bin = '';
  for (var i = 0; i < bytes.length; i++) { bin += String.fromCharCode(bytes[i]); }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  var b64 = String(str).replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) { b64 += '='; }
  var bin = atob(b64);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) { bytes[i] = bin.charCodeAt(i); }
  return bytes;
}
function streamToBytes(stream) {
  var reader = stream.getReader();
  var chunks = [];
  var total = 0;
  function step() {
    return reader.read().then(function (r) {
      if (r.done) {
        var out = new Uint8Array(total);
        var off = 0;
        chunks.forEach(function (c) { out.set(c, off); off += c.length; });
        return out;
      }
      chunks.push(r.value); total += r.value.length;
      return step();
    });
  }
  return step();
}
function encodePayload(obj) {
  var json = JSON.stringify(obj);
  var bytes = new TextEncoder().encode(json);
  if (window.CompressionStream) {
    try {
      var cs = new CompressionStream('gzip');
      var stream = new Blob([bytes]).stream().pipeThrough(cs);
      return streamToBytes(stream).then(function (packed) {
        return 'z.' + b64urlEncode(packed);
      }).catch(function () { return 'r.' + b64urlEncode(bytes); });
    } catch (e) { /* lanjut ke jalan mentah */ }
  }
  return Promise.resolve('r.' + b64urlEncode(bytes));
}
function decodePayload(str) {
  var mode = String(str).slice(0, 2);
  var bytes = b64urlDecode(String(str).slice(2));
  function parse(b) { return JSON.parse(new TextDecoder().decode(b)); }
  if (mode === 'z.' && window.DecompressionStream) {
    try {
      var ds = new DecompressionStream('gzip');
      var stream = new Blob([bytes]).stream().pipeThrough(ds);
      return streamToBytes(stream).then(parse);
    } catch (e) { return Promise.reject(e); }
  }
  return Promise.resolve(parse(bytes));
}

/* ---------- Deteksi kolom rahasia ---------- */
var SECRET_RE = /pass|token|secret|sandi|kunci|psk|pin/i;
function isSecretField(fd) { return SECRET_RE.test(fd.k) || SECRET_RE.test(fd.label); }

/* ---------- Ambil isian tool yang sedang terbuka ---------- */
function collectToolState(tool, hideSecret) {
  var f = {};
  tool.fields.forEach(function (fd) {
    var el = document.getElementById('fld-' + fd.k);
    if (!el) { return; }
    if (hideSecret && isSecretField(fd)) { return; }
    var val = fd.t === 'check' ? el.checked : el.value;
    var same = fd.t === 'check' ? (val === !!fd.def) : (String(val) === String(fd.def));
    if (!same) { f[fd.k] = val; }
  });
  return f;
}

/* ---------- Salin teks (jalan cadangan sama seperti app.js) ---------- */
function copyText(text, noteEl) {
  function done() {
    if (noteEl) {
      noteEl.classList.add('show');
      setTimeout(function () { noteEl.classList.remove('show'); }, 1800);
    }
  }
  function fallback() {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* abaikan */ }
    document.body.removeChild(ta);
    done();
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    var timer = setTimeout(fallback, 700);
    navigator.clipboard.writeText(text).then(
      function () { clearTimeout(timer); done(); },
      function () { clearTimeout(timer); fallback(); }
    );
  } else { fallback(); }
}

/* ---------- Panel Bagikan Resep di halaman tool ---------- */
function currentToolFromHash() {
  var h = location.hash || '';
  if (h.indexOf('#/tool/') !== 0) { return null; }
  return byId(h.slice('#/tool/'.length));
}
function qrSvg(text) {
  try {
    var qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 3, margin: 10, scalable: true });
  } catch (e) {
    return '<p class="help">QR tidak bisa digambar karena tautannya terlalu panjang. Pakai tautan teksnya saja.</p>';
  }
}
function injectSharePanel() {
  var tool = currentToolFromHash();
  if (!tool) { return; }
  if (document.getElementById('sharePanel')) { return; }
  var resultCol = document.querySelector('.result-col');
  if (!resultCol) { return; }
  var panel = document.createElement('section');
  panel.className = 'panel share-panel';
  panel.id = 'sharePanel';
  panel.setAttribute('aria-label', 'Bagikan Resep');
  panel.innerHTML =
    '<h2>Bagikan Resep</h2>' +
    '<p class="panel-sub">Kemaskan isian tool ini jadi satu tautan. Siapa pun yang membukanya melihat isian dan script yang sama persis, tanpa perlu akun.</p>' +
    '<div class="field-check"><input type="checkbox" id="shareHideSecret" checked>' +
    '<label for="shareHideSecret">Sembunyikan data rahasia<span class="help">Kolom berisi password, token, dan sejenisnya tidak ikut dibawa tautan. Penerima mengisinya sendiri.</span></label></div>' +
    '<div class="share-actions"><button type="button" class="btn btn-primary" id="shareMakeBtn">Buat Tautan Resep</button>' +
    '<span class="copied-note" id="shareNote">Tersalin.</span></div>' +
    '<div class="share-out" id="shareOut" hidden>' +
    '<div class="field"><label for="shareLink">Tautan resep</label>' +
    '<input type="text" id="shareLink" readonly class="mono-in" autocomplete="off" spellcheck="false"></div>' +
    '<div class="share-actions"><button type="button" class="btn" id="shareCopyBtn">Salin Tautan</button></div>' +
    '<div class="share-qr" id="shareQr"></div>' +
    '<p class="help">Pindai QR ini untuk membuka resep yang sama di perangkat lain.</p>' +
    '</div>';
  resultCol.appendChild(panel);
  document.getElementById('shareMakeBtn').addEventListener('click', function () {
    var hide = document.getElementById('shareHideSecret').checked;
    var payload = { v: 1, k: 'tool', t: tool.id, f: collectToolState(tool, hide) };
    encodePayload(payload).then(function (enc) {
      var link = location.origin + location.pathname + '#/resep/' + enc;
      var out = document.getElementById('shareOut');
      out.hidden = false;
      document.getElementById('shareLink').value = link;
      document.getElementById('shareQr').innerHTML = qrSvg(link);
    });
  });
  document.getElementById('shareCopyBtn').addEventListener('click', function () {
    copyText(document.getElementById('shareLink').value, document.getElementById('shareNote'));
  });
}

/* ---------- Terapkan resep yang masuk ---------- */
var pendingTool = null;
function fillToolForm() {
  if (!pendingTool) { return; }
  var tool = currentToolFromHash();
  if (!tool || tool.id !== pendingTool.t) { return; }
  var form = document.getElementById('toolForm');
  if (!form) { return; }
  var f = pendingTool.f || {};
  Object.keys(f).forEach(function (k) {
    var el = document.getElementById('fld-' + k);
    if (!el) { return; }
    if (el.type === 'checkbox') { el.checked = !!f[k]; return; }
    el.value = f[k];
    var wrap = el.closest ? el.closest('[data-field]') : null;
    if (wrap) {
      wrap.querySelectorAll('[data-swatch]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-swatch') === String(f[k]) ? 'true' : 'false');
      });
    }
  });
  pendingTool = null;
  form.dispatchEvent(new Event('input', { bubbles: true }));
  form.dispatchEvent(new Event('change', { bubbles: true }));
}
function handleResepHash() {
  var h = location.hash || '';
  if (h.indexOf('#/resep/') !== 0) { return; }
  var enc = h.slice('#/resep/'.length);
  decodePayload(enc).then(function (payload) {
    if (!payload || payload.v !== 1) { return; }
    if (payload.k === 'racik') {
      try { sessionStorage.setItem('rr-resep-racik', JSON.stringify(payload)); } catch (e) { /* abaikan */ }
      location.hash = '#/racik';
    } else if (payload.k === 'tool' && byId(payload.t)) {
      pendingTool = payload;
      if (currentToolFromHash() && currentToolFromHash().id === payload.t) {
        fillToolForm();
      } else {
        location.hash = '#/tool/' + payload.t;
      }
    }
  }).catch(function () { /* muatan rusak, abaikan */ });
}

/* ---------- Pengamatan halaman ---------- */
var view = document.getElementById('view');
if (view && window.MutationObserver) {
  var obs = new MutationObserver(function () {
    injectSharePanel();
    fillToolForm();
  });
  obs.observe(view, { childList: true });
}
window.addEventListener('hashchange', function () {
  handleResepHash();
  setTimeout(injectSharePanel, 0);
});
handleResepHash();
injectSharePanel();

window.RRshare = {
  encode: encodePayload,
  qrSvg: qrSvg,
  copyText: copyText,
  isSecretField: isSecretField,
  recipeLink: function (enc) { return location.origin + location.pathname + '#/resep/' + enc; }
};
})();
