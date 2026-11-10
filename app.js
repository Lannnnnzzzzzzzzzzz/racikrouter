// app.js, mesin RacikRouter.
// Merender beranda, halaman tool, wizard, kalkulator, template login, dan database script
// dari data di tools.js. Semua berjalan lokal di browser.
(function () {
'use strict';

var RR = window.RR;
var $view = document.getElementById('view');
var $search = document.getElementById('globalSearch');
var $sidebar = document.getElementById('sidebar');
var $sideNav = document.getElementById('sideNav');
var $scrim = document.getElementById('scrim');
var $menuBtn = document.getElementById('menuBtn');

function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function byId(id) {
  for (var i = 0; i < RR.tools.length; i++) { if (RR.tools[i].id === id) { return RR.tools[i]; } }
  return null;
}
function catById(id) {
  for (var i = 0; i < RR.cats.length; i++) { if (RR.cats[i].id === id) { return RR.cats[i]; } }
  return null;
}
function catIndex(id) {
  for (var i = 0; i < RR.cats.length; i++) { if (RR.cats[i].id === id) { return i; } }
  return 0;
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function store(key, fallback) {
  try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* penyimpanan penuh atau privat, abaikan */ }
}

/* ---------- Bahasa ---------- */
var I18N = {
  id: {
    brandSub: 'Generator script MikroTik', sideFoot: 'Semua proses berjalan di browser kamu. Tidak ada data yang dikirim ke server mana pun.',
    footText: 'Script diracik dari isian kamu, jalankan di RouterOS v7 setelah kamu periksa. Situs ini tidak berafiliasi dengan MikroTik.',
    home: 'Beranda', snippets: 'Database Script', searchPh: 'Cari tool, misalnya failover, hotspot, wireguard, subnet...',
    searchShort: 'Cari tool...',
    homeTitle: 'Racik script MikroTik tanpa mengetik dari nol',
    homeSub: 'Pilih tool, isi kolomnya, script RouterOS v7 langsung jadi dan berubah mengikuti isianmu. Salin ke terminal, atau unduh sebagai berkas .rsc.',
    favs: 'Favorit kamu', history: 'Terakhir dipakai', allTools: 'Semua tool',
    favEmpty: 'Belum ada favorit. Ketuk bintang pada baris tool mana pun untuk menyimpannya di sini.',
    hisEmpty: 'Belum ada riwayat. Tool yang kamu buka akan muncul di sini.',
    noResult: 'Tidak ada tool yang cocok dengan kata itu. Coba kata lain, misalnya nama protokol atau nama fitur.',
    navMenu: 'Menu', navCats: 'Kategori',
    back: 'Kembali ke beranda', formTitle: 'Isian', formSub: 'Script di panel hasil berubah langsung setiap kamu mengubah isian.',
    result: 'Hasil script', preview: 'Pratinjau halaman login', explain: 'Penjelasan bagian per bagian',
    copy: 'Salin script', copyHtml: 'Salin HTML', download: 'Unduh .rsc', downloadTxt: 'Unduh .txt', downloadHtml: 'Unduh login.html',
    copied: 'Tersalin.', favAdd: 'Jadikan favorit', favDel: 'Hapus dari favorit',
    errTitle: 'Ada isian yang perlu diperbaiki:', validOk: 'Isian valid, script siap dipakai.',
    req: 'Kolom ini wajib diisi.', badIp: 'Format IP belum benar, contoh 192.168.88.1.', badCidr: 'Format CIDR belum benar, contoh 192.168.88.0/24.',
    badNum: 'Isi dengan angka yang benar.', badPort: 'Port harus angka 1 sampai 65535.', outRange: 'Angka di luar rentang yang diizinkan.',
    snipSub: 'Cuplikan script RouterOS karya sendiri untuk tugas yang sering berulang. Salin, sesuaikan nilai bertanda placeholder, lalu tempel di terminal.',
    copySnip: 'Salin cuplikan', toolsCount: 'tool', catOf: 'Kategori', openTool: 'Buka tool',
    loginNote: 'Unduh sebagai login.html lalu unggah ke folder hotspot di router lewat menu Files Winbox.'
  },
  en: {
    brandSub: 'MikroTik script generator', sideFoot: 'Everything runs in your browser. No data is sent to any server.',
    footText: 'Scripts are built from your input, run them on RouterOS v7 after reviewing. This site is not affiliated with MikroTik.',
    home: 'Home', snippets: 'Script Database', searchPh: 'Search tools, e.g. failover, hotspot, wireguard, subnet...',
    searchShort: 'Search tools...',
    homeTitle: 'Build MikroTik scripts without typing from scratch',
    homeSub: 'Pick a tool, fill the form, and the RouterOS v7 script appears instantly and follows your input. Copy it to a terminal, or download it as an .rsc file.',
    favs: 'Your favorites', history: 'Recently used', allTools: 'All tools',
    favEmpty: 'No favorites yet. Tap the star on any tool row to keep it here.',
    hisEmpty: 'No history yet. Tools you open will show up here.',
    noResult: 'No tool matches that word. Try another, for example a protocol or feature name.',
    navMenu: 'Menu', navCats: 'Categories',
    back: 'Back to home', formTitle: 'Form', formSub: 'The script in the result panel updates live as you change the form.',
    result: 'Generated script', preview: 'Login page preview', explain: 'Section by section explanation',
    copy: 'Copy script', copyHtml: 'Copy HTML', download: 'Download .rsc', downloadTxt: 'Download .txt', downloadHtml: 'Download login.html',
    copied: 'Copied.', favAdd: 'Add to favorites', favDel: 'Remove from favorites',
    errTitle: 'Some fields need fixing:', validOk: 'Input is valid, the script is ready.',
    req: 'This field is required.', badIp: 'Invalid IP format, e.g. 192.168.88.1.', badCidr: 'Invalid CIDR format, e.g. 192.168.88.0/24.',
    badNum: 'Enter a valid number.', badPort: 'Port must be a number from 1 to 65535.', outRange: 'Number is outside the allowed range.',
    snipSub: 'Original RouterOS script snippets for recurring jobs. Copy, adjust the placeholder values, then paste into a terminal.',
    copySnip: 'Copy snippet', toolsCount: 'tools', catOf: 'Category', openTool: 'Open tool',
    loginNote: 'Download as login.html, then upload it to the hotspot folder on the router via the Winbox Files menu.'
  }
};
var lang = store('rr-lang', 'id');
if (lang !== 'en') { lang = 'id'; }
function t(k) { return I18N[lang][k] || I18N.id[k] || k; }
function catName(c) { return lang === 'en' ? c.nameEn : c.nameId; }
function toolName(tool) { return lang === 'en' ? tool.name.en : tool.name.id; }
var GROUP_EN = { 'WAN': 'WAN', 'LAN': 'LAN', 'Pelanggan': 'Customers', 'Sekolah': 'School', 'Jaringan': 'Network', 'Pengguna': 'Users', 'Perawatan': 'Maintenance' };
function groupName(g) { return lang === 'en' ? (GROUP_EN[g] || g) : g; }

var ICON_STAR = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z"/></svg>';
var ICON_COPY = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
var ICON_DL = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M4.5 20h15"/></svg>';
var ICON_SEARCH = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg>';

/* ---------- Tema ---------- */
var theme = store('rr-theme', 'light');
function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) { meta.setAttribute('content', theme === 'light' ? '#F4F6F8' : '#101214'); }
}
document.getElementById('themeBtn').addEventListener('click', function () {
  theme = theme === 'light' ? 'dark' : 'light';
  save('rr-theme', theme);
  applyTheme();
});

/* ---------- Bahasa: tombol dan teks statis ---------- */
function applyLangStatic() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var k = el.getAttribute('data-i18n');
    if (I18N[lang][k]) { el.textContent = I18N[lang][k]; }
  });
  document.getElementById('langId').setAttribute('aria-pressed', lang === 'id' ? 'true' : 'false');
  document.getElementById('langEn').setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
  if ($search) { $search.setAttribute('placeholder', t('searchShort')); $search.setAttribute('aria-label', t('searchPh')); }
}
document.getElementById('langId').addEventListener('click', function () { if (lang !== 'id') { lang = 'id'; save('rr-lang', lang); applyLangStatic(); buildSidebar(); route(); } });
document.getElementById('langEn').addEventListener('click', function () { if (lang !== 'en') { lang = 'en'; save('rr-lang', lang); applyLangStatic(); buildSidebar(); route(); } });

/* ---------- Pencarian global di bilah atas ---------- */
var homeQuery = '';
function normQuery(s) { return String(s || '').trim().toLowerCase(); }
if ($search) {
  $search.addEventListener('input', function () {
    homeQuery = $search.value;
    if (currentRoute !== 'home') { location.hash = '#/'; }
    else { renderHomeLists(normQuery(homeQuery)); }
  });
}

/* ---------- Favorit dan riwayat ---------- */
function getFavs() { return store('rr-fav', []); }
function isFav(id) { return getFavs().indexOf(id) !== -1; }
function toggleFav(id) {
  var favs = getFavs();
  var i = favs.indexOf(id);
  if (i === -1) { favs.push(id); } else { favs.splice(i, 1); }
  save('rr-fav', favs);
  return i === -1;
}
function pushHistory(id) {
  var h = store('rr-history', []).filter(function (x) { return x !== id; });
  h.unshift(id);
  save('rr-history', h.slice(0, 10));
}

/* ---------- Sidebar: ikon, grup lipat, drawer mobile ---------- */
function svgIcon(paths) {
  return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
}
var NAV_ICONS = {
  home: svgIcon('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  snippets: svgIcon('<path d="M8 6l-5 6 5 6M16 6l5 6-5 6"/>'),
  dasar: svgIcon('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/>'),
  routing: svgIcon('<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8 8l6 6M18 6l-2 4M6 18l4-2"/>'),
  firewall: svgIcon('<path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  queue: svgIcon('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  hotspot: svgIcon('<path d="M2.5 9a15 15 0 0 1 19 0M5.5 12.5a10 10 0 0 1 13 0M8.6 16a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/>'),
  vpn: svgIcon('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  ipv6: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/>'),
  wireless: svgIcon('<path d="M12 20h.01M8.5 16.5a5 5 0 0 1 7 0M5.5 13a9.5 9.5 0 0 1 13 0M2.5 9.5a14 14 0 0 1 19 0"/>'),
  container: svgIcon('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>'),
  kalkulator: svgIcon('<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 15.5h.01M12 15.5h.01M15 15.5h.01"/>'),
  wizard: svgIcon('<path d="M5 4h14M5 9h14M5 14h9"/><path d="M16 15l2 2 4-4"/>'),
  template: svgIcon('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 20V9"/>')
};
var navGroups = store('rr-nav-groups', {});
function navGroupCollapsed(key) { return navGroups[key] === true; }
function buildSidebar() {
  var h = location.hash || '#/';
  var active = 'home';
  if (h === '#/snippets') { active = 'snippets'; }
  else if (h.indexOf('#/kategori/') === 0) { active = h.slice('#/kategori/'.length); }
  else if (h.indexOf('#/tool/') === 0) { var tl = byId(h.slice('#/tool/'.length)); if (tl) { active = tl.cat; } }
  function item(href, key, icon, label, count) {
    return '<li><a class="nav-item' + (active === key ? ' active' : '') + '" href="' + href + '" aria-current="' + (active === key ? 'page' : 'false') + '">' +
      NAV_ICONS[icon] + '<span class="nav-label">' + esc(label) + '</span>' +
      (count !== undefined ? '<span class="nav-count">' + count + '</span>' : '') + '</a></li>';
  }
  function group(key, title, inner) {
    var collapsed = navGroupCollapsed(key);
    return '<div class="nav-group' + (collapsed ? ' collapsed' : '') + '" data-group="' + key + '">' +
      '<button type="button" class="nav-group-head" data-group-head="' + key + '" aria-expanded="' + (!collapsed) + '">' + esc(title) +
      '<svg class="chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>' +
      '<ul class="nav-items">' + inner + '</ul></div>';
  }
  var menuItems = item('#/', 'home', 'home', t('home')) + item('#/snippets', 'snippets', 'snippets', t('snippets'), RR.snippets.length);
  var catItems = '';
  RR.cats.forEach(function (c) {
    var n = RR.tools.filter(function (x) { return x.cat === c.id; }).length;
    catItems += item('#/kategori/' + c.id, c.id, c.id, catName(c), n);
  });
  $sideNav.innerHTML = group('menu', t('navMenu'), menuItems) + group('kategori', t('navCats'), catItems);
  $sideNav.querySelectorAll('[data-group-head]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-group-head');
      var g = $sideNav.querySelector('[data-group="' + key + '"]');
      var now = g.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded', now ? 'false' : 'true');
      navGroups[key] = now;
      save('rr-nav-groups', navGroups);
    });
  });
}

function openDrawer() {
  $sidebar.classList.add('open');
  $scrim.hidden = false;
  document.body.classList.add('drawer-open');
  $menuBtn.setAttribute('aria-expanded', 'true');
  document.getElementById('sideClose').focus();
}
function closeDrawer() {
  if (!$sidebar.classList.contains('open')) { return; }
  $sidebar.classList.remove('open');
  $scrim.hidden = true;
  document.body.classList.remove('drawer-open');
  $menuBtn.setAttribute('aria-expanded', 'false');
  $menuBtn.focus();
}
$menuBtn.addEventListener('click', openDrawer);
document.getElementById('sideClose').addEventListener('click', closeDrawer);
$scrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { closeDrawer(); }
});

/* ---------- Potongan tampilan bersama ---------- */
function favBtnHtml(tool) {
  var fav = isFav(tool.id);
  return '<button type="button" class="fav-btn" data-fav="' + tool.id + '" aria-pressed="' + fav + '" aria-label="' + esc(fav ? t('favDel') : t('favAdd')) + ': ' + esc(toolName(tool)) + '">' + ICON_STAR + '</button>';
}
function toolRowHtml(tool) {
  return '<li class="tool-row"><div class="tool-row-inner">' +
    '<a class="tool-link" href="#/tool/' + tool.id + '" title="' + esc(tool.desc) + '"><span class="tool-name">' + esc(toolName(tool)) + '</span>' +
    '<span class="tool-desc">' + esc(tool.desc) + '</span></a>' + favBtnHtml(tool) + '</div></li>';
}
function toolListHtml(list) {
  return '<ul class="tool-list">' + list.map(toolRowHtml).join('') + '</ul>';
}
function catBlockHtml(c, i, list) {
  return '<section class="cat-block" aria-labelledby="cath-' + c.id + '"><div class="cat-head">' +
    '<span class="cat-tag">' + pad2(i + 1) + ' / ' + esc(c.id.toUpperCase()) + '</span>' +
    '<h2 id="cath-' + c.id + '">' + esc(catName(c)) + '</h2>' +
    '<span class="cat-note">' + list.length + ' ' + esc(t('toolsCount')) + '</span></div>' +
    toolListHtml(list) + '</section>';
}
function bindFavButtons(root) {
  root.querySelectorAll('[data-fav]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var now = toggleFav(btn.getAttribute('data-fav'));
      btn.setAttribute('aria-pressed', now ? 'true' : 'false');
      var tool = byId(btn.getAttribute('data-fav'));
      btn.setAttribute('aria-label', (now ? t('favDel') : t('favAdd')) + ': ' + (tool ? toolName(tool) : ''));
      if (currentRoute === 'home') { renderHomeLists(); }
    });
  });
}

/* ---------- Beranda ---------- */
var currentRoute = 'home';
function renderHome() {
  currentRoute = 'home';
  document.title = 'RacikRouter, Generator Script MikroTik RouterOS Gratis';
  document.body.classList.remove('has-actionbar');
  $view.innerHTML =
    '<div class="page-head"><h1>' + esc(t('homeTitle')) + '</h1><p>' + esc(t('homeSub')) + '</p></div>' +
    '<div id="homeLists"></div>';
  renderHomeLists(normQuery(homeQuery));
}
function renderHomeLists(query) {
  var box = document.getElementById('homeLists');
  if (!box) { return; }
  var html = '';
  if (query) {
    var hasil = RR.tools.filter(function (tool) {
      var c = catById(tool.cat);
      var hay = (tool.name.id + ' ' + tool.name.en + ' ' + tool.desc + ' ' + (c ? c.nameId + ' ' + c.nameEn : '')).toLowerCase();
      return hay.indexOf(query) !== -1;
    });
    html = hasil.length ? toolListHtml(hasil) : '<p class="no-result">' + esc(t('noResult')) + '</p>';
  } else {
    var favs = getFavs().map(byId).filter(Boolean);
    html += '<section class="cat-block" aria-labelledby="favh"><div class="cat-head"><span class="cat-tag">FAV</span><h2 id="favh">' + esc(t('favs')) + '</h2></div>' +
      (favs.length ? toolListHtml(favs) : '<div style="margin-top:12px"><p class="empty-note">' + esc(t('favEmpty')) + '</p></div>') + '</section>';
    var his = store('rr-history', []).map(byId).filter(Boolean);
    html += '<section class="cat-block" aria-labelledby="hish"><div class="cat-head"><span class="cat-tag">LOG</span><h2 id="hish">' + esc(t('history')) + '</h2></div>' +
      (his.length ? toolListHtml(his) : '<div style="margin-top:12px"><p class="empty-note">' + esc(t('hisEmpty')) + '</p></div>') + '</section>';
    RR.cats.forEach(function (c, i) {
      var list = RR.tools.filter(function (x) { return x.cat === c.id; });
      html += catBlockHtml(c, i, list);
    });
  }
  box.innerHTML = html;
  bindFavButtons(box);
}

/* ---------- Halaman kategori ---------- */
function renderCategory(catId) {
  currentRoute = 'kategori';
  document.body.classList.remove('has-actionbar');
  var c = catById(catId);
  if (!c) { renderHome(); return; }
  var list = RR.tools.filter(function (x) { return x.cat === c.id; });
  document.title = catName(c) + ', RacikRouter';
  $view.innerHTML =
    '<a class="back-link" href="#/">' + esc(t('back')) + '</a>' +
    '<div class="page-head"><h1>' + esc(catName(c)) + '</h1><p>' + esc(c.note) + '</p></div>' +
    toolListHtml(list);
  bindFavButtons($view);
}

/* ---------- Halaman database script ---------- */
function renderSnippets() {
  currentRoute = 'snippets';
  document.body.classList.remove('has-actionbar');
  document.title = t('snippets') + ', RacikRouter';
  var html = '<a class="back-link" href="#/">' + esc(t('back')) + '</a>' +
    '<div class="page-head"><h1>' + esc(t('snippets')) + '</h1><p>' + esc(t('snipSub')) + '</p></div><div>';
  RR.snippets.forEach(function (s, i) {
    html += '<article class="snip"><h3>' + esc(s.judul) + '</h3><p>' + esc(s.desc) + '</p>' +
      '<pre class="snip-code" id="snip-' + i + '">' + esc(s.kode) + '</pre>' +
      '<button type="button" class="btn" data-copy-snip="' + i + '">' + ICON_COPY + esc(t('copySnip')) + '</button> ' +
      '<span class="copied-note" id="snip-note-' + i + '">' + esc(t('copied')) + '</span></article>';
  });
  html += '</div>';
  $view.innerHTML = html;
  $view.querySelectorAll('[data-copy-snip]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var i = btn.getAttribute('data-copy-snip');
      copyText(RR.snippets[Number(i)].kode, document.getElementById('snip-note-' + i));
    });
  });
}

function copyText(text, noteEl) {
  var finished = false;
  function done() {
    if (finished) { return; }
    finished = true;
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
    // Izin clipboard kadang menggantung tanpa jawaban. Beri batas waktu, lalu pakai jalan cadangan
    // agar pengguna selalu mendapat kepastian bahwa tombolnya bekerja.
    var timer = setTimeout(fallback, 700);
    navigator.clipboard.writeText(text).then(
      function () { clearTimeout(timer); done(); },
      function () { clearTimeout(timer); fallback(); }
    );
  } else { fallback(); }
}
function downloadFile(name, text, mime) {
  var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
}

/* ---------- Validasi ---------- */
function isIp(s) {
  var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(s).trim());
  if (!m) { return false; }
  return m.slice(1).every(function (o) { return Number(o) <= 255; });
}
function isCidr(s) {
  var parts = String(s).trim().split('/');
  if (parts.length !== 2 || !isIp(parts[0])) { return false; }
  var p = Number(parts[1]);
  return String(parts[1]).match(/^\d+$/) && p >= 0 && p <= 32;
}
function validateField(fd, raw) {
  var val = fd.t === 'check' ? raw : String(raw === undefined || raw === null ? '' : raw).trim();
  if (fd.t === 'check') { return null; }
  if (val === '') { return fd.opt ? null : t('req'); }
  var v = fd.v;
  if (v === 'ip' && !isIp(val)) { return t('badIp'); }
  if (v === 'cidr' && !isCidr(val)) { return t('badCidr'); }
  if (v === 'port') {
    if (!/^\d+$/.test(val)) { return t('badPort'); }
    var pn = Number(val);
    if (pn < 1 || pn > 65535) { return t('badPort'); }
  }
  if (v === 'num') {
    if (!/^\d+(\.\d+)?$/.test(val)) { return t('badNum'); }
    var n = Number(val);
    if (fd.min !== undefined && n < fd.min) { return t('outRange'); }
    if (fd.max !== undefined && n > fd.max) { return t('outRange'); }
  }
  if (fd.t === 'number') {
    if (!/^\d+$/.test(val)) { return t('badNum'); }
    var n2 = Number(val);
    if (fd.min !== undefined && n2 < fd.min) { return t('outRange'); }
    if (fd.max !== undefined && n2 > fd.max) { return t('outRange'); }
  }
  return null;
}

/* ---------- Halaman tool ---------- */
var toolState = {};
function fieldValue(fd, el) {
  if (!el) { return fd.def; }
  if (fd.t === 'check') { return el.checked; }
  return el.value;
}
function renderTool(id) {
  var tool = byId(id);
  if (!tool) { renderHome(); return; }
  currentRoute = 'tool';
  pushHistory(id);
  document.title = toolName(tool) + ', RacikRouter';
  var c = catById(tool.cat);
  var isLogin = tool.kind === 'login';
  var saved = toolState[id] || {};
  var values = {};
  tool.fields.forEach(function (fd) {
    values[fd.k] = saved[fd.k] !== undefined ? saved[fd.k] : fd.def;
  });

  var html = '<a class="back-link" href="#/">' + esc(t('back')) + '</a>' +
    '<div class="page-head tool-head"><div class="tool-title-row"><h1>' + esc(toolName(tool)) + '</h1>' +
    '<span class="cat-tag">' + pad2(catIndex(tool.cat) + 1) + ' / ' + esc(tool.cat.toUpperCase()) + '</span>' + favBtnHtml(tool) + '</div>' +
    '<p>' + esc(tool.desc) + '</p></div>' +
    '<div class="tool-layout"><section class="panel" aria-label="' + esc(t('formTitle')) + '">' +
    '<h2>' + esc(t('formTitle')) + '</h2><p class="panel-sub">' + esc(t('formSub')) + '</p>' +
    '<form id="toolForm" novalidate>';

  var lastGroup = null;
  var groupOpen = false;
  var groupCount = 0;
  tool.fields.forEach(function (fd) {
    if (fd.g && fd.g !== lastGroup) {
      if (groupOpen) { html += '</div>'; }
      html += '<div class="group"><h3 class="group-title' + (groupCount === 0 ? ' first' : '') + '">' + esc(groupName(fd.g)) + '</h3>';
      groupOpen = true; lastGroup = fd.g; groupCount++;
    }
    var val = values[fd.k];
    if (fd.t === 'check') {
      html += '<div class="field-check"><input type="checkbox" id="fld-' + fd.k + '" data-key="' + fd.k + '"' + (val ? ' checked' : '') + '>' +
        '<label for="fld-' + fd.k + '">' + esc(fd.label) + (fd.help ? '<span class="help">' + esc(fd.help) + '</span>' : '') + '</label></div>';
    } else if (fd.swatch) {
      html += '<div class="field span2" data-field="' + fd.k + '"><label id="lbl-' + fd.k + '">' + esc(fd.label) + '</label>' +
        '<input type="hidden" id="fld-' + fd.k + '" data-key="' + fd.k + '" value="' + esc(val) + '">' +
        '<div class="swatches" role="group" aria-labelledby="lbl-' + fd.k + '">';
      fd.opts.forEach(function (o) {
        html += '<button type="button" class="swatch" data-swatch="' + esc(o.v) + '" style="background:' + esc(o.v) + '" aria-pressed="' + (String(val) === String(o.v)) + '" aria-label="' + esc(o.l) + '" title="' + esc(o.l) + '"></button>';
      });
      html += '</div>' + (fd.help ? '<p class="help">' + esc(fd.help) + '</p>' : '') + '<p class="field-error" role="alert"></p></div>';
    } else if (fd.t === 'select') {
      html += '<div class="field" data-field="' + fd.k + '"><label for="fld-' + fd.k + '">' + esc(fd.label) + '</label>' +
        '<select id="fld-' + fd.k + '" data-key="' + fd.k + '">';
      fd.opts.forEach(function (o) {
        var ov = typeof o === 'string' ? o : o.v;
        var ol = typeof o === 'string' ? o : o.l;
        html += '<option value="' + esc(ov) + '"' + (String(val) === String(ov) ? ' selected' : '') + '>' + esc(ol) + '</option>';
      });
      html += '</select>' + (fd.help ? '<p class="help">' + esc(fd.help) + '</p>' : '') + '<p class="field-error" role="alert"></p></div>';
    } else if (fd.t === 'textarea') {
      html += '<div class="field span2" data-field="' + fd.k + '"><label for="fld-' + fd.k + '">' + esc(fd.label) + '</label>' +
        '<textarea id="fld-' + fd.k + '" data-key="' + fd.k + '" spellcheck="false">' + esc(val) + '</textarea>' +
        (fd.help ? '<p class="help">' + esc(fd.help) + '</p>' : '') + '<p class="field-error" role="alert"></p></div>';
    } else {
      var type = fd.t === 'number' ? 'number' : 'text';
      html += '<div class="field" data-field="' + fd.k + '"><label for="fld-' + fd.k + '">' + esc(fd.label) + '</label>' +
        '<input type="' + type + '" id="fld-' + fd.k + '" data-key="' + fd.k + '" value="' + esc(val) + '"' +
        (fd.ph ? ' placeholder="' + esc(fd.ph) + '"' : '') + (fd.mono ? ' class="mono-in"' : '') +
        (type === 'number' && fd.min !== undefined ? ' min="' + fd.min + '"' : '') + (type === 'number' && fd.max !== undefined ? ' max="' + fd.max + '"' : '') +
        ' autocomplete="off" spellcheck="false">' +
        (fd.help ? '<p class="help">' + esc(fd.help) + '</p>' : '') + '<p class="field-error" role="alert"></p></div>';
    }
  });
  if (groupOpen) { html += '</div>'; }
  html += '</form></section>';

  html += '<div class="result-col">';
  if (isLogin) {
    html += '<div class="console"><div class="console-head"><span class="status-dot" id="statusDot"></span>' +
      '<span class="console-title">' + esc(t('preview')) + ' : login.html</span>' +
      '<div class="console-actions"><button type="button" class="btn" id="copyBtn">' + ICON_COPY + esc(t('copyHtml')) + '</button>' +
      '<button type="button" class="btn btn-primary" id="dlBtn">' + ICON_DL + esc(t('downloadHtml')) + '</button></div></div>' +
      '<iframe class="preview-frame" id="loginPreview" title="' + esc(t('preview')) + '"></iframe>' +
      '<div class="console-msg err" id="consoleMsg" role="alert"></div></div>' +
      '<p class="calc-note" style="margin-top:10px;color:var(--muted);font-size:13px">' + esc(t('loginNote')) + '</p>';
  } else {
    var kind = tool.kind || 'script';
    html += '<div class="console"><div class="console-head"><span class="status-dot" id="statusDot"></span>' +
      '<span class="console-title">' + esc(t('result')) + ' : ' + esc(tool.id) + (kind === 'calc' ? '.txt' : '.rsc') + '</span>' +
      '<div class="console-actions"><span class="copied-note" id="copyNote">' + esc(t('copied')) + '</span>' +
      '<button type="button" class="btn" id="copyBtn">' + ICON_COPY + esc(t('copy')) + '</button>' +
      '<button type="button" class="btn btn-primary" id="dlBtn">' + ICON_DL + esc(kind === 'calc' ? t('downloadTxt') : t('download')) + '</button></div></div>' +
      '<div class="console-msg err" id="consoleMsg" role="alert"></div>' +
      '<div class="console-body"><div class="console-inner"><div class="gutter" id="gutter" aria-hidden="true"></div>' +
      '<pre class="code-out" id="codeOut"></pre></div></div></div>';
  }
  html += '<details class="explain" id="explainBox"><summary>' + esc(t('explain')) + '</summary><div class="explain-body"><ul id="explainList"></ul></div></details>';
  html += '</div></div>';
  var copyLabel = isLogin ? t('copyHtml') : t('copy');
  var dlLabel = isLogin ? t('downloadHtml') : (tool.kind === 'calc' ? t('downloadTxt') : t('download'));
  html += '<div class="action-bar"><span class="copied-note" id="copyNoteM">' + esc(t('copied')) + '</span>' +
    '<button type="button" class="btn" id="copyBtnM">' + ICON_COPY + esc(copyLabel) + '</button>' +
    '<button type="button" class="btn btn-primary" id="dlBtnM">' + ICON_DL + esc(dlLabel) + '</button></div>';
  document.body.classList.add('has-actionbar');
  $view.innerHTML = html;

  bindFavButtons($view);
  var form = document.getElementById('toolForm');
  var codeOut = document.getElementById('codeOut');
  var gutter = document.getElementById('gutter');
  var msg = document.getElementById('consoleMsg');
  var dot = document.getElementById('statusDot');
  var copyBtn = document.getElementById('copyBtn');
  var dlBtn = document.getElementById('dlBtn');
  var copyBtnM = document.getElementById('copyBtnM');
  var dlBtnM = document.getElementById('dlBtnM');
  var explainList = document.getElementById('explainList');
  var preview = document.getElementById('loginPreview');

  function collect() {
    var v = {};
    tool.fields.forEach(function (fd) {
      v[fd.k] = fieldValue(fd, document.getElementById('fld-' + fd.k));
    });
    return v;
  }
  function update() {
    var v = collect();
    toolState[id] = v;
    var errors = [];
    tool.fields.forEach(function (fd) {
      var err = validateField(fd, v[fd.k]);
      var wrap = form.querySelector('[data-field="' + fd.k + '"]');
      var input = document.getElementById('fld-' + fd.k);
      if (wrap) {
        wrap.classList.toggle('has-error', !!err);
        var errEl = wrap.querySelector('.field-error');
        if (errEl) { errEl.textContent = err || ''; }
      }
      if (input && fd.t !== 'check') { input.setAttribute('aria-invalid', err ? 'true' : 'false'); }
      if (err) { errors.push(fd.label + ': ' + err); }
    });
    var out = '';
    var renderError = null;
    try {
      out = isLogin ? RR.loginHtml(v, false) : tool.template(v);
    } catch (e) {
      renderError = e;
      out = '';
    }
    if (isLogin) {
      try { preview.srcdoc = RR.loginHtml(v, true); } catch (e2) { /* pratinjau gagal, unduhan tetap dinilai dari render utama */ }
    } else if (codeOut) {
      codeOut.textContent = out;
      var count = out ? out.replace(/\n$/, '').split('\n').length : 0;
      var nums = [];
      for (var i = 1; i <= count; i++) { nums.push(i); }
      gutter.textContent = nums.join('\n');
    }
    if (explainList) {
      try {
        explainList.innerHTML = tool.explain(v).map(function (li) { return '<li>' + esc(li) + '</li>'; }).join('');
      } catch (e3) { explainList.innerHTML = ''; }
    }
    var bad = errors.length > 0 || !!renderError;
    dot.classList.toggle('bad', bad);
    if (bad) {
      msg.textContent = t('errTitle') + ' ' + (renderError ? renderError.message : errors.join(' '));
      msg.classList.add('show');
    } else {
      msg.textContent = '';
      msg.classList.remove('show');
    }
    copyBtn.disabled = bad;
    dlBtn.disabled = bad;
    if (copyBtnM) { copyBtnM.disabled = bad; }
    if (dlBtnM) { dlBtnM.disabled = bad; }
    update.out = out;
    update.bad = bad;
  }
  update.out = '';
  update.bad = false;

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.querySelectorAll('[data-swatch]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wrap = btn.closest('[data-field]');
      var key = wrap.getAttribute('data-field');
      var hidden = document.getElementById('fld-' + key);
      hidden.value = btn.getAttribute('data-swatch');
      wrap.querySelectorAll('[data-swatch]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      update();
    });
  });
  copyBtn.addEventListener('click', function () {
    if (update.bad) { return; }
    copyText(update.out, document.getElementById('copyNote'));
  });
  if (copyBtnM) {
    copyBtnM.addEventListener('click', function () {
      if (update.bad) { return; }
      copyText(update.out, document.getElementById('copyNoteM'));
    });
  }
  if (dlBtnM) {
    dlBtnM.addEventListener('click', function () { dlBtn.click(); });
  }
  dlBtn.addEventListener('click', function () {
    if (update.bad) { return; }
    if (isLogin) { downloadFile('login.html', update.out, 'text/html;charset=utf-8'); }
    else if (tool.kind === 'calc') { downloadFile(tool.id + '.txt', update.out); }
    else { downloadFile(tool.id + '.rsc', update.out); }
  });
  update();
}

/* ---------- Router ---------- */
function route() {
  var h = location.hash || '#/';
  buildSidebar();
  closeDrawer();
  if (h === '#/' || h === '#' || h === '') { renderHome(); }
  else if (h === '#/snippets') { renderSnippets(); }
  else if (h.indexOf('#/kategori/') === 0) { renderCategory(h.slice('#/kategori/'.length)); }
  else if (h.indexOf('#/tool/') === 0) { renderTool(h.slice('#/tool/'.length)); }
  else { renderHome(); }
  window.scrollTo(0, 0);
  var main = document.getElementById('main');
  if (main) { main.focus({ preventScroll: true }); }
}
window.addEventListener('hashchange', route);

/* ---------- Mulai ---------- */
applyTheme();
applyLangStatic();
buildSidebar();
route();
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  navigator.serviceWorker.register('sw.js').catch(function () { /* situs tetap jalan tanpa service worker */ });
}

})();
