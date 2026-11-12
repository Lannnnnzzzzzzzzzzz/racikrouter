// racik.js, fitur Racik Cepat RacikRouter (Racik Pakai Kalimat).
// Pengguna memilih keinginan dalam kalimat sehari-hari, situs menggabungkan
// isian semua tool terkait jadi satu form, lalu meracik satu script .rsc utuh
// yang urutan bagiannya disusun dari dasar ke lanjutan. Mesinnya memakai
// skema dan template tool yang sudah ada di tools.js, tidak ada generator baru.
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
function toolName(tool) {
  var lang = 'id';
  try { lang = localStorage.getItem('rr-lang') || 'id'; } catch (e) { /* abaikan */ }
  return lang === 'en' ? tool.name.en : tool.name.id;
}

/* ---------- Katalog keinginan ---------- */
// stage menentukan urutan bagian di script gabungan: dasar dulu, otomatisasi terakhir.
var GROUPS = [
  { name: 'Internet dan Dasar', wishes: [
    { id: 'nama-jam', label: 'Kasih nama router dan samakan jamnya', tools: ['identitas-ntp'], stage: 0 },
    { id: 'lan-dasar', label: 'Bangun jaringan lokal: alamat LAN, DHCP, dan DNS', tools: ['ip-lan', 'dhcp-server', 'dns-statis'], stage: 1 },
    { id: 'internet-dhcp', label: 'Sambungkan internet dari modem atau ISP (DHCP) plus NAT', tools: ['dhcp-client-wan', 'nat-masquerade'], stage: 2 },
    { id: 'dua-isp-aman', label: 'Dua ISP: satu mati, yang lain mengambil alih otomatis', tools: ['failover-recursive'], stage: 2 },
    { id: 'dua-isp-kencang', label: 'Dua ISP digabung supaya bandwidth bertambah (PCC)', tools: ['lb-pcc'], stage: 2 }
  ] },
  { name: 'Keamanan', wishes: [
    { id: 'proteksi', label: 'Lindungi router dari serangan dan akses ilegal', tools: ['proteksi-router', 'drop-invalid'], stage: 3 },
    { id: 'blokir-situs', label: 'Blokir judi, situs dewasa, dan situs pilihan', tools: ['blokir-situs'], stage: 3 },
    { id: 'blokir-bandet', label: 'Blokir website bandel sampai ke akar (Layer 7 dan DNS)', tools: ['block-web-l7', 'block-web-dns'], stage: 3 },
    { id: 'saring-iklan', label: 'Saring iklan dan situs jahat untuk semua perangkat (AdGuard)', tools: ['container-adguard'], stage: 6 }
  ] },
  { name: 'Pelanggan dan Hotspot', wishes: [
    { id: 'pisah-game', label: 'Trafik game dipisah supaya tidak kalah sama unduhan', tools: ['pisah-game'], stage: 3 },
    { id: 'batas-kecepatan', label: 'Batasi kecepatan tiap pelanggan', tools: ['simple-queue'], stage: 4 },
    { id: 'prioritas', label: 'Prioritaskan aplikasi penting di jaringan', tools: ['queue-prioritas-aplikasi'], stage: 4 },
    { id: 'hotspot', label: 'Bikin hotspot dengan halaman login untuk pelanggan', tools: ['hotspot-server'], stage: 5 },
    { id: 'profil-voucher', label: 'Atur profil paket voucher (kecepatan dan masa aktif)', tools: ['hotspot-user-profile'], stage: 5 },
    { id: 'voucher', label: 'Buat voucher hotspot dalam jumlah banyak', tools: ['generate-vouchers'], stage: 5 },
    { id: 'ikat-perangkat', label: 'Ikat akun hotspot ke perangkat pelanggan', tools: ['hotspot-ip-binding'], stage: 5 }
  ] },
  { name: 'Otomatis dan Ekstra', wishes: [
    { id: 'vpn-rumah', label: 'Akses jaringan rumah dari luar lewat WireGuard', tools: ['wireguard'], stage: 6 },
    { id: 'internet-anak', label: 'Atur internet anak: jadwal dan batasan', tools: ['kid-control'], stage: 6 },
    { id: 'laporan-telegram', label: 'Kirim laporan router ke Telegram tiap hari', tools: ['telegram-reporter'], stage: 7 },
    { id: 'jaga-diri', label: 'Router memulihkan diri saat internet bermasalah', tools: ['watchdog-auto'], stage: 7 },
    { id: 'restart-malam', label: 'Restart router otomatis tengah malam', tools: ['auto-reboot'], stage: 7 }
  ] }
];
var WISH = {};
GROUPS.forEach(function (g) { g.wishes.forEach(function (w) { WISH[w.id] = w; }); });
var CONFLICTS = [
  { a: 'dua-isp-aman', b: 'dua-isp-kencang', msg: 'Failover dan Load Balancing PCC sama-sama mengatur dua jalur ISP dengan cara yang berlawanan. Memakai keduanya sekaligus membuat rute bertabrakan. Pilih salah satu, atau jalankan scriptnya di router yang berbeda.' }
];

/* ---------- Keadaan halaman ---------- */
var selected = {};   // wishId -> true
var values = {};     // 'toolId::key' -> nilai
function ns(toolId, k) { return toolId + '::' + k; }
function ensureDefaults(tool) {
  tool.fields.forEach(function (fd) {
    if (values[ns(tool.id, fd.k)] === undefined) { values[ns(tool.id, fd.k)] = fd.def; }
  });
}
function selectedTools() {
  var map = {};
  Object.keys(selected).forEach(function (wid) {
    if (!selected[wid]) { return; }
    var w = WISH[wid];
    if (!w) { return; }
    w.tools.forEach(function (tid) {
      var tool = byId(tid);
      if (!tool) { return; }
      if (!map[tid]) { map[tid] = { tool: tool, stage: w.stage, labels: [] }; }
      if (w.stage < map[tid].stage) { map[tid].stage = w.stage; }
      map[tid].labels.push(w.label);
    });
  });
  var list = Object.keys(map).map(function (k) { return map[k]; });
  list.sort(function (a, b) { return a.stage - b.stage; });
  list.forEach(ensureDefaultsEntry);
  return list;
  function ensureDefaultsEntry(e) { ensureDefaults(e.tool); }
}
function activeConflicts() {
  return CONFLICTS.filter(function (c) { return selected[c.a] && selected[c.b]; });
}

/* ---------- Render ---------- */
function fieldHtml(tool, fd) {
  var id = 'rcf-' + tool.id + '-' + fd.k;
  var val = values[ns(tool.id, fd.k)];
  var dk = ' data-rc="' + esc(ns(tool.id, fd.k)) + '" data-rct="' + esc(fd.t) + '"';
  if (fd.t === 'check') {
    return '<div class="field-check"><input type="checkbox" id="' + id + '"' + dk + (val ? ' checked' : '') + '>' +
      '<label for="' + id + '">' + esc(fd.label) + (fd.help ? '<span class="help">' + esc(fd.help) + '</span>' : '') + '</label></div>';
  }
  if (fd.t === 'select') {
    var opts = '';
    fd.opts.forEach(function (o) {
      var ov = typeof o === 'string' ? o : o.v;
      var ol = typeof o === 'string' ? o : o.l;
      opts += '<option value="' + esc(ov) + '"' + (String(val) === String(ov) ? ' selected' : '') + '>' + esc(ol) + '</option>';
    });
    return '<div class="field"><label for="' + id + '">' + esc(fd.label) + '</label>' +
      '<select id="' + id + '"' + dk + '>' + opts + '</select>' +
      (fd.help ? '<p class="help">' + esc(fd.help) + '</p>' : '') + '</div>';
  }
  if (fd.t === 'textarea') {
    return '<div class="field span2"><label for="' + id + '">' + esc(fd.label) + '</label>' +
      '<textarea id="' + id + '"' + dk + ' spellcheck="false">' + esc(val) + '</textarea>' +
      (fd.help ? '<p class="help">' + esc(fd.help) + '</p>' : '') + '</div>';
  }
  var type = fd.t === 'number' ? 'number' : 'text';
  return '<div class="field"><label for="' + id + '">' + esc(fd.label) + '</label>' +
    '<input type="' + type + '" id="' + id + '"' + dk + ' value="' + esc(val) + '"' +
    (fd.ph ? ' placeholder="' + esc(fd.ph) + '"' : '') + (fd.mono ? ' class="mono-in"' : '') +
    ' autocomplete="off" spellcheck="false">' +
    (fd.help ? '<p class="help">' + esc(fd.help) + '</p>' : '') + '</div>';
}

function generate() {
  var list = selectedTools();
  var errors = [];
  var parts = [];
  var wishLabels = Object.keys(selected).filter(function (w) { return selected[w]; }).map(function (w) { return WISH[w].label; });
  var conflicts = activeConflicts();
  list.forEach(function (entry, idx) {
    var tool = entry.tool;
    var v = {};
    tool.fields.forEach(function (fd) {
      v[fd.k] = values[ns(tool.id, fd.k)];
      if (fd.t !== 'check' && !fd.opt && String(v[fd.k] === undefined ? '' : v[fd.k]).trim() === '') {
        errors.push(toolName(tool) + ': ' + fd.label + ' wajib diisi.');
      }
    });
    var out = '';
    try {
      out = tool.template(v);
    } catch (e) {
      errors.push(toolName(tool) + ' gagal dibuat: ' + e.message);
      out = '# Bagian ini gagal dibuat. Periksa isian ' + toolName(tool) + '.\n';
    }
    parts.push('# ========== Bagian ' + (idx + 1) + ': ' + toolName(tool) + ' ==========\n' +
      '# Untuk keinginan: ' + entry.labels.join(' + ') + '\n' + out.replace(/\s+$/, ''));
  });
  var head = '# RacikRouter: Racikan Cepat\n' +
    '# Gabungan script RouterOS v7 hasil Racik Cepat. Tempel di terminal MikroTik (Winbox, menu New Terminal).\n' +
    '# Keinginan yang diracik: ' + wishLabels.join('; ') + '\n' +
    '# Urutan bagian disusun dari dasar ke lanjutan. Baca lagi semua nilainya sebelum menjalankan di router produksi.\n';
  conflicts.forEach(function (c) {
    head += '# PERINGATAN BENTROK: ' + c.msg + '\n';
  });
  var script = parts.length ? head + '\n' + parts.join('\n\n') + '\n' : '';
  return { script: script, errors: errors, conflicts: conflicts };
}

function renderRacik() {
  var view = document.getElementById('view');
  if (!view) { return; }
  document.title = 'Racik Cepat, RacikRouter';
  document.body.classList.add('has-actionbar');

  // Resep Racik yang masuk lewat tautan dibagikan.
  try {
    var pending = sessionStorage.getItem('rr-resep-racik');
    if (pending) {
      sessionStorage.removeItem('rr-resep-racik');
      var p = JSON.parse(pending);
      if (p && p.k === 'racik') {
        (p.w || []).forEach(function (wid) { if (WISH[wid]) { selected[wid] = true; } });
        Object.keys(p.f || {}).forEach(function (k) { values[k] = p.f[k]; });
      }
    }
  } catch (e) { /* abaikan muatan rusak */ }

  var chips = '';
  GROUPS.forEach(function (g) {
    chips += '<div class="group"><h3 class="group-title">' + esc(g.name) + '</h3><div class="rc-chips">';
    g.wishes.forEach(function (w) {
      chips += '<button type="button" class="rc-chip" data-wish="' + w.id + '" aria-pressed="' + (selected[w.id] ? 'true' : 'false') + '">' + esc(w.label) + '</button>';
    });
    chips += '</div></div>';
  });

  view.innerHTML =
    '<a class="back-link" href="#/">&larr; Kembali ke beranda</a>' +
    '<div class="page-head"><h1>Racik Cepat</h1>' +
    '<p>Pilih keinginanmu dalam kalimat sehari-hari, isi satu form gabungan, dan dapatkan satu script RouterOS utuh yang urutannya sudah disusun aman. Mode per tool seperti biasa tetap tersedia di menu kategori.</p></div>' +
    '<div class="tool-layout"><section class="panel" aria-label="Pilihan keinginan dan isian">' +
    '<h2>Mau ngapain aja routernya?</h2><p class="panel-sub">Sentuh kalimat yang kamu mau. Form di bawah hanya menampilkan isian dari tool yang terkait keinginan pilihanmu.</p>' +
    '<div id="rcWishes">' + chips + '</div>' +
    '<div class="rc-warn" id="rcConflict" hidden></div>' +
    '<form id="rcForm" novalidate></form></section>' +
    '<div class="result-col">' +
    '<div class="console"><div class="console-head"><span class="status-dot" id="rcDot"></span>' +
    '<span class="console-title">Hasil racikan : racikan.rsc</span>' +
    '<div class="console-actions"><span class="copied-note" id="rcCopyNote">Tersalin.</span>' +
    '<button type="button" class="btn" id="rcCopyBtn">Salin script</button>' +
    '<button type="button" class="btn btn-primary" id="rcDlBtn">Unduh .rsc</button></div></div>' +
    '<div class="console-msg err" id="rcMsg" role="alert"></div>' +
    '<div class="console-body"><div class="console-inner"><div class="gutter" id="rcGutter" aria-hidden="true"></div>' +
    '<pre class="code-out" id="rcOut"></pre></div></div></div>' +
    '<section class="panel share-panel" aria-label="Bagikan Resep racikan">' +
    '<h2>Bagikan Resep</h2>' +
    '<p class="panel-sub">Kemaskan pilihan keinginan dan isian racikan ini jadi satu tautan atau QR. Penerima membuka tautan dan mendapat racikan yang sama persis.</p>' +
    '<div class="field-check"><input type="checkbox" id="rcHideSecret" checked>' +
    '<label for="rcHideSecret">Sembunyikan data rahasia<span class="help">Kolom berisi password, token, dan sejenisnya tidak ikut dibawa tautan.</span></label></div>' +
    '<div class="share-actions"><button type="button" class="btn btn-primary" id="rcShareBtn">Buat Tautan Resep</button>' +
    '<span class="copied-note" id="rcShareNote">Tersalin.</span></div>' +
    '<div class="share-out" id="rcShareOut" hidden>' +
    '<div class="field"><label for="rcShareLink">Tautan resep</label>' +
    '<input type="text" id="rcShareLink" readonly class="mono-in" autocomplete="off" spellcheck="false"></div>' +
    '<div class="share-actions"><button type="button" class="btn" id="rcShareCopyBtn">Salin Tautan</button></div>' +
    '<div class="share-qr" id="rcShareQr"></div>' +
    '<p class="help">Pindai QR ini untuk membuka racikan yang sama di perangkat lain.</p>' +
    '</div></section>' +
    '</div></div>' +
    '<div class="action-bar"><span class="copied-note" id="rcCopyNoteM">Tersalin.</span>' +
    '<button type="button" class="btn" id="rcCopyBtnM">Salin script</button>' +
    '<button type="button" class="btn btn-primary" id="rcDlBtnM">Unduh .rsc</button></div>';

  var form = document.getElementById('rcForm');
  var out = document.getElementById('rcOut');
  var gutter = document.getElementById('rcGutter');
  var msg = document.getElementById('rcMsg');
  var dot = document.getElementById('rcDot');
  var warn = document.getElementById('rcConflict');
  var current = { script: '', bad: true };

  function renderForm() {
    var list = selectedTools();
    if (!list.length) {
      form.innerHTML = '<p class="help" style="margin-top:12px">Belum ada keinginan yang dipilih. Sentuh minimal satu kalimat di atas, form isiannya muncul di sini.</p>';
      return;
    }
    var html = '';
    list.forEach(function (entry) {
      html += '<div class="group"><h3 class="group-title">' + esc(toolName(entry.tool)) + '</h3>';
      entry.tool.fields.forEach(function (fd) { html += fieldHtml(entry.tool, fd); });
      html += '</div>';
    });
    form.innerHTML = html;
  }
  function collectFromDom() {
    form.querySelectorAll('[data-rc]').forEach(function (el) {
      var key = el.getAttribute('data-rc');
      values[key] = el.getAttribute('data-rct') === 'check' ? el.checked : el.value;
    });
  }
  function update() {
    collectFromDom();
    var conflicts = activeConflicts();
    if (conflicts.length) {
      warn.hidden = false;
      warn.textContent = conflicts.map(function (c) { return c.msg; }).join(' ');
    } else {
      warn.hidden = true;
      warn.textContent = '';
    }
    var res = generate();
    current = { script: res.script, bad: res.errors.length > 0 || !res.script };
    out.textContent = res.script || '# Pilih keinginan dulu di panel kiri, racikanmu muncul di sini.';
    var count = res.script ? res.script.replace(/\n$/, '').split('\n').length : 0;
    var nums = [];
    for (var i = 1; i <= count; i++) { nums.push(i); }
    gutter.textContent = nums.join('\n');
    dot.classList.toggle('bad', current.bad);
    if (res.errors.length) {
      msg.textContent = 'Ada isian yang perlu diperbaiki: ' + res.errors.join(' ');
      msg.classList.add('show');
    } else {
      msg.textContent = '';
      msg.classList.remove('show');
    }
    ['rcCopyBtn', 'rcDlBtn', 'rcCopyBtnM', 'rcDlBtnM', 'rcShareBtn'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) { b.disabled = current.bad; }
    });
  }
  function refresh() { renderForm(); update(); }

  document.getElementById('rcWishes').addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-wish]') : null;
    if (!btn) { return; }
    collectFromDom();
    var wid = btn.getAttribute('data-wish');
    selected[wid] = !selected[wid];
    btn.setAttribute('aria-pressed', selected[wid] ? 'true' : 'false');
    refresh();
  });
  form.addEventListener('input', update);
  form.addEventListener('change', update);

  function doCopy(noteId) {
    if (current.bad || !window.RRshare) { return; }
    window.RRshare.copyText(current.script, document.getElementById(noteId));
  }
  function doDownload() {
    if (current.bad) { return; }
    var blob = new Blob([current.script], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'racikan.rsc';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  document.getElementById('rcCopyBtn').addEventListener('click', function () { doCopy('rcCopyNote'); });
  document.getElementById('rcCopyBtnM').addEventListener('click', function () { doCopy('rcCopyNoteM'); });
  document.getElementById('rcDlBtn').addEventListener('click', doDownload);
  document.getElementById('rcDlBtnM').addEventListener('click', doDownload);

  document.getElementById('rcShareBtn').addEventListener('click', function () {
    if (current.bad || !window.RRshare) { return; }
    var hide = document.getElementById('rcHideSecret').checked;
    var f = {};
    Object.keys(values).forEach(function (k) {
      var sep = k.indexOf('::');
      var tool = byId(k.slice(0, sep));
      if (!tool) { return; }
      var fd = null;
      tool.fields.forEach(function (x) { if (x.k === k.slice(sep + 2)) { fd = x; } });
      if (!fd) { return; }
      if (hide && window.RRshare.isSecretField(fd)) { return; }
      var same = fd.t === 'check' ? (values[k] === !!fd.def) : (String(values[k]) === String(fd.def));
      if (!same) { f[k] = values[k]; }
    });
    var payload = {
      v: 1, k: 'racik',
      w: Object.keys(selected).filter(function (w) { return selected[w]; }),
      f: f
    };
    window.RRshare.encode(payload).then(function (enc) {
      var link = window.RRshare.recipeLink(enc);
      var box = document.getElementById('rcShareOut');
      box.hidden = false;
      document.getElementById('rcShareLink').value = link;
      document.getElementById('rcShareQr').innerHTML = window.RRshare.qrSvg(link);
    });
  });
  document.getElementById('rcShareCopyBtn').addEventListener('click', function () {
    if (!window.RRshare) { return; }
    window.RRshare.copyText(document.getElementById('rcShareLink').value, document.getElementById('rcShareNote'));
  });

  refresh();
}

window.RRrenderRacik = renderRacik;
if ((location.hash || '') === '#/racik') { renderRacik(); }
})();
