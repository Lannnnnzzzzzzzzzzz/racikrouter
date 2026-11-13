// tools.js, data tool RacikRouter.
// Setiap tool: skema form + fungsi template (menghasilkan script RouterOS v7)
// + fungsi explain (penjelasan Bahasa Indonesia per bagian).
// Semua script ditulis sendiri dari pengetahuan RouterOS.
(function () {
'use strict';

function H(n) {
  return '# RacikRouter: ' + n + '\n' +
    '# Script untuk RouterOS v7. Tempel di terminal MikroTik (Winbox, menu New Terminal).\n' +
    '# Baca lagi semua nilainya sebelum menjalankan di router produksi.\n';
}
function f(k, label, t, def, o) {
  var x = { k: k, label: label, t: t || 'text', def: (def === undefined ? '' : def) };
  if (o) { for (var p in o) { x[p] = o[p]; } }
  return x;
}
function T(id, cat, nId, nEn, desc, fields, template, explain, extra) {
  var t = { id: id, cat: cat, name: { id: nId, en: nEn }, desc: desc, fields: fields, template: template, explain: explain };
  if (extra) { for (var p in extra) { t[p] = extra[p]; } }
  return t;
}
function q(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
function ipPart(cidr) { return String(cidr).split('/')[0]; }
function prefixPart(cidr) { var p = String(cidr).split('/')[1]; return p ? p : '24'; }
function ipToNum(ip) { var a = String(ip).split('.').map(Number); return ((a[0] * 256 + a[1]) * 256 + a[2]) * 256 + a[3]; }
function numToIp(n) { return [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].join('.'); }
function ipAdd(ip, n) { return numToIp(ipToNum(ip) + n); }
function netPart(cidr) { var p = parseInt(prefixPart(cidr), 10); var mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0; return numToIp((ipToNum(ipPart(cidr)) & mask) >>> 0); }
function rateToK(s) {
  var m = String(s).trim().match(/^(\d+(?:\.\d+)?)\s*([kKmMgG])?$/);
  if (!m) { return null; }
  var v = parseFloat(m[1]); var u = (m[2] || 'k').toLowerCase();
  if (u === 'k') { return Math.round(v); }
  if (u === 'm') { return Math.round(v * 1024); }
  return Math.round(v * 1024 * 1024);
}
function fmtK(k) {
  if (k >= 1024 && k % 1024 === 0) { return (k / 1024) + 'M'; }
  if (k >= 1024) { return (Math.round(k / 102.4) / 10) + 'M'; }
  return k + 'k';
}
// Cache alamat MAC acak untuk tool Change MAC Address: dibuat sekali saat
// mode acak dipilih, lalu dipakai ulang supaya script tidak berubah-ubah
// setiap kali kolom lain disentuh. Ganti mode ke manual lalu kembali ke
// acak untuk membuat alamat baru.
var macAcakCache = '';
var macAcakPrev = '';

var CATS = [
  { id: 'dasar', nameId: 'Dasar dan Sistem', nameEn: 'Basics and System', note: 'Identitas, alamat IP, DHCP, DNS, dan perawatan router.' },
  { id: 'routing', nameId: 'Routing', nameEn: 'Routing', note: 'Rute statis, failover, load balancing, OSPF, BGP, dan VRRP.' },
  { id: 'firewall', nameId: 'Firewall dan NAT', nameEn: 'Firewall and NAT', note: 'Masquerade, port forwarding, blokir, dan proteksi router.' },
  { id: 'queue', nameId: 'Queue', nameEn: 'Queues', note: 'Pembagian dan prioritas bandwidth.' },
  { id: 'hotspot', nameId: 'Hotspot dan PPP', nameEn: 'Hotspot and PPP', note: 'Hotspot voucher, PPPoE, dan User Manager.' },
  { id: 'vpn', nameId: 'VPN', nameEn: 'VPN', note: 'WireGuard, L2TP, SSTP, sertifikat, dan klien VPN.' },
  { id: 'ipv6', nameId: 'IPv6', nameEn: 'IPv6', note: 'Alamat, DHCPv6, firewall, dan rute IPv6.' },
  { id: 'wireless', nameId: 'Wireless', nameEn: 'Wireless', note: 'Access point rumahan dan CAPsMAN.' },
  { id: 'container', nameId: 'Container', nameEn: 'Containers', note: 'Aplikasi di dalam router, misalnya pemblokir iklan.' },
  { id: 'kalkulator', nameId: 'Kalkulator', nameEn: 'Calculators', note: 'Hitung subnet dan pool DHCP tanpa script.' },
  { id: 'wizard', nameId: 'Wizard Paket', nameEn: 'Package Wizards', note: 'Satu form panjang, keluar satu paket script lengkap.' },
  { id: 'template', nameId: 'Template Login', nameEn: 'Login Template', note: 'Halaman login hotspot yang bisa diganti nama dan warnanya.' }
];

var TOOLS = [];

/* ================= Kategori: Dasar dan Sistem ================= */

TOOLS.push(T('identitas-ntp', 'dasar', 'Identitas Router dan NTP', 'Router Identity and NTP',
  'Beri nama router dan sinkronkan jamnya lewat NTP agar log dan jadwal selalu tepat.',
  [
    f('nama', 'Nama identitas router', 'text', 'Router-Utama', { mono: 1, help: 'Nama ini muncul di Winbox, log, dan laporan. Hindari spasi agar script lain mudah membaca nama ini.' }),
    f('zona', 'Zona waktu', 'select', 'Asia/Jakarta', { opts: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'UTC'] }),
    f('ntp', 'Server NTP', 'text', 'id.pool.ntp.org', { mono: 1, help: 'id.pool.ntp.org adalah kumpulan server jam Indonesia.' })
  ],
  function (v) {
    return H('Identitas Router dan NTP') +
      '/system identity set name=' + v.nama + '\n' +
      '/system clock set time-zone-name=' + v.zona + '\n' +
      '/system ntp client set enabled=yes\n' +
      '/system ntp client servers add address=' + v.ntp + '\n';
  },
  function () {
    return [
      'Baris pertama mengganti nama identitas router menjadi nilai yang kamu isi.',
      'Zona waktu menentukan jam lokal router. Scheduler dan log mengikuti zona ini.',
      'Dua baris terakhir menyalakan klien NTP dan mendaftarkan server jam, jadi jam router selalu akurat tanpa diatur manual.'
    ];
  }));

TOOLS.push(T('ip-lan', 'dasar', 'Alamat IP untuk LAN', 'IP Address for a LAN',
  'Pasang satu alamat IP pada interface, biasanya sebagai gateway jaringan lokal.',
  [
    f('iface', 'Interface', 'text', 'ether2', { mono: 1, help: 'Nama interface tujuan, contoh ether2 atau bridge-lan.' }),
    f('cidr', 'Alamat IP beserta prefix', 'cidr', '192.168.88.1/24', { v: 'cidr', help: 'Format IP/prefix, contoh 192.168.88.1/24.' }),
    f('komen', 'Komentar', 'text', 'Gateway LAN', { opt: 1 })
  ],
  function (v) {
    var s = '/ip address add address=' + v.cidr + ' interface=' + v.iface;
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('Alamat IP untuk LAN') + s + '\n';
  },
  function () {
    return [
      'Satu baris ini memasang alamat IP pada interface pilihanmu.',
      'Perangkat di jaringan lokal memakai alamat ini sebagai gateway menuju router.',
      'Komentar hanya label bantu di Winbox, tidak memengaruhi kerja alamat.'
    ];
  }));

TOOLS.push(T('dhcp-server', 'dasar', 'DHCP Server', 'DHCP Server',
  'Bagi alamat IP otomatis ke perangkat di jaringan lokal, lengkap dengan pool, gateway, dan DNS.',
  [
    f('iface', 'Interface', 'text', 'ether2', { mono: 1 }),
    f('net', 'Jaringan (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr' }),
    f('gw', 'Gateway', 'ip', '192.168.88.1', { v: 'ip' }),
    f('from', 'Awal pool', 'ip', '192.168.88.10', { v: 'ip' }),
    f('to', 'Akhir pool', 'ip', '192.168.88.254', { v: 'ip' }),
    f('dns', 'Server DNS untuk klien', 'text', '8.8.8.8,1.1.1.1', { mono: 1, help: 'Pisahkan dengan koma bila lebih dari satu.' }),
    f('lease', 'Masa sewa (lease time)', 'select', '1d', { opts: ['10m', '1h', '12h', '1d', '3d', '7d'] })
  ],
  function (v) {
    return H('DHCP Server') +
      '/ip pool add name=pool-lan ranges=' + v.from + '-' + v.to + '\n' +
      '/ip dhcp-server add name=dhcp-lan interface=' + v.iface + ' address-pool=pool-lan lease-time=' + v.lease + ' disabled=no\n' +
      '/ip dhcp-server network add address=' + v.net + ' gateway=' + v.gw + ' dns-server=' + v.dns + '\n';
  },
  function () {
    return [
      'Baris pool menentukan rentang alamat yang boleh dibagikan.',
      'Baris dhcp-server mengaktifkan layanan pada interface pilihanmu dan memakai pool itu.',
      'Baris network memberi tahu klien gateway dan DNS yang harus mereka pakai.',
      'Alamat sebelum awal pool sengaja disisakan untuk perangkat statis seperti printer dan access point.'
    ];
  }));

TOOLS.push(T('dhcp-client-wan', 'dasar', 'DHCP Client untuk WAN', 'DHCP Client for WAN',
  'Minta alamat IP otomatis dari ISP pada interface WAN, lengkap dengan rute default.',
  [
    f('iface', 'Interface WAN', 'text', 'ether1', { mono: 1 }),
    f('route', 'Tambahkan rute default dari ISP', 'select', 'yes', { opts: [{ v: 'yes', l: 'Ya' }, { v: 'no', l: 'Tidak' }] }),
    f('jarak', 'Jarak rute default (distance)', 'number', '1', { v: 'num', min: 1, max: 255 }),
    f('dns', 'Pakai DNS dari ISP', 'check', true)
  ],
  function (v) {
    return H('DHCP Client untuk WAN') +
      '# Hapus DHCP client lama pada interface ini dulu (misalnya bawaan pabrik router), karena satu interface hanya boleh punya satu DHCP client\n' +
      '/ip dhcp-client remove [find interface=' + v.iface + ']\n' +
      '/ip dhcp-client add interface=' + v.iface + ' disabled=no add-default-route=' + v.route +
      ' default-route-distance=' + v.jarak + ' use-peer-dns=' + (v.dns ? 'yes' : 'no') + ' use-peer-ntp=yes\n';
  },
  function () {
    return [
      'Baris pertama menghapus DHCP client lama pada interface yang sama, misalnya bawaan pabrik router, karena RouterOS hanya mengizinkan satu DHCP client per interface.',
      'Router meminta alamat, gateway, dan DNS ke ISP setiap kali interface ini menyala.',
      'Bila rute default diaktifkan, semua trafik internet keluar lewat pemberian ISP ini.',
      'Distance berguna bila ada dua WAN: angka lebih kecil berarti lebih diprioritaskan.'
    ];
  }));

TOOLS.push(T('dns-statis', 'dasar', 'DNS Statis dan Cache', 'Static DNS and Cache',
  'Atur server DNS utama router dan jadikan router sebagai cache DNS untuk jaringan lokal.',
  [
    f('s1', 'Server DNS utama', 'ip', '8.8.8.8', { v: 'ip' }),
    f('s2', 'Server DNS cadangan', 'ip', '1.1.1.1', { v: 'ip', opt: 1 }),
    f('remote', 'Izinkan permintaan DNS dari LAN (allow remote requests)', 'check', true, { help: 'Wajib aktif bila perangkat LAN memakai router sebagai DNS mereka.' }),
    f('cache', 'Ukuran cache (KiB)', 'select', '4096', { opts: ['2048', '4096', '8192', '16384'] }),
    f('statik', 'Tambahkan catatan DNS statis', 'check', false),
    f('nama', 'Nama domain statis', 'text', '', { opt: 1, ph: 'nas.rumah.lokal' }),
    f('ipstatik', 'Alamat IP untuk nama itu', 'ip', '', { v: 'ip', opt: 1 })
  ],
  function (v) {
    var servers = v.s2 ? v.s1 + ',' + v.s2 : v.s1;
    var s = H('DNS Statis dan Cache') +
      '/ip dns set servers=' + servers + ' allow-remote-requests=' + (v.remote ? 'yes' : 'no') + ' cache-size=' + v.cache + 'KiB\n';
    if (v.statik && v.nama && v.ipstatik) {
      s += '/ip dns static add name=' + v.nama + ' address=' + v.ipstatik + '\n';
    }
    return s;
  },
  function () {
    return [
      'Router meneruskan pertanyaan DNS ke server yang kamu tulis, lalu menyimpan jawabannya di cache.',
      'Perangkat LAN yang menunjuk DNS ke router akan merasa membuka situs berulang jauh lebih cepat.',
      'Catatan statis membuat nama lokal, misalnya nas.rumah.lokal, selalu menjawab ke IP yang kamu tentukan.'
    ];
  }));

TOOLS.push(T('ganti-password', 'dasar', 'Ganti Password Pengguna', 'Change User Password',
  'Ganti password pengguna router, misalnya admin bawaan, langsung dari terminal.',
  [
    f('user', 'Nama pengguna', 'text', 'admin', { mono: 1 }),
    f('pass', 'Password baru', 'text', '', { mono: 1, help: 'Password tampil sebagai teks biasa di form ini dan di berkas hasil unduhan. Jangan bagikan berkas script ini ke siapa pun.' })
  ],
  function (v) {
    return H('Ganti Password Pengguna') +
      '# Peringatan: berkas ini berisi password dalam teks biasa. Hapus setelah dipakai.\n' +
      '/user set [find name=' + q(v.user) + '] password=' + q(v.pass) + '\n';
  },
  function () {
    return [
      'Satu baris ini mengganti password pengguna yang namanya kamu isi.',
      'Simpan password baru di pengelola password, bukan di berkas script hasil unduhan.',
      'Setelah menjalankan script, masuk ulang ke Winbox memakai password baru untuk memastikan perubahan berhasil.'
    ];
  }));

TOOLS.push(T('netwatch', 'dasar', 'Netwatch', 'Netwatch',
  'Pantau satu host secara berkala. Router mencatat ke log saat host putus dan saat kembali.',
  [
    f('host', 'Host yang dipantau', 'ip', '8.8.8.8', { v: 'ip' }),
    f('interval', 'Jeda pemeriksaan', 'select', '1m', { opts: ['30s', '1m', '5m'] }),
    f('aksi', 'Aksi saat host putus', 'select', 'log', { opts: [{ v: 'log', l: 'Catat ke log saja' }, { v: 'restart', l: 'Catat log dan nyalakan ulang interface' }] }),
    f('iface', 'Interface yang dinyalakan ulang', 'text', 'ether1', { mono: 1, help: 'Hanya dipakai bila aksi kedua dipilih.' })
  ],
  function (v) {
    var down;
    if (v.aksi === 'restart') {
      down = '{:log warning "Netwatch: ' + v.host + ' putus, menyalakan ulang ' + v.iface + '"; /interface set disabled=yes [find name=' + q(v.iface) + ']; :delay 5s; /interface set disabled=no [find name=' + q(v.iface) + ']}';
    } else {
      down = '{:log error "Netwatch: ' + v.host + ' tidak terjangkau"}';
    }
    return H('Netwatch') +
      '/tool netwatch add host=' + v.host + ' interval=' + v.interval + ' timeout=5s' +
      ' down-script=' + down +
      ' up-script={:log info "Netwatch: ' + v.host + ' kembali terjangkau"}\n';
  },
  function () {
    return [
      'Netwatch mengirim ping ke host tujuan sesuai jeda yang kamu pilih.',
      'Saat host gagal menjawab, script down berjalan: mencatat ke log, dan bila dipilih, menyalakan ulang interface yang sering menjadi sumber macet.',
      'Saat host kembali menjawab, script up mencatat kabar baiknya ke log.'
    ];
  }));

TOOLS.push(T('backup-email', 'dasar', 'Backup Otomatis ke Email', 'Automatic Backup to Email',
  'Router membuat backup dan ekspor konfigurasi, lalu mengirimnya ke emailmu setiap hari.',
  [
    f('email', 'Email tujuan backup', 'text', 'backup@contoh.id', { ph: 'nama@domain.id' }),
    f('smtp', 'Server SMTP', 'text', 'smtp.gmail.com', { mono: 1 }),
    f('port', 'Port SMTP', 'number', '587', { v: 'port' }),
    f('user', 'Pengguna SMTP (sekaligus pengirim)', 'text', 'router@contoh.id'),
    f('pass', 'Password SMTP', 'text', '', { mono: 1, help: 'Untuk Gmail gunakan App Password, bukan password utama akun.' }),
    f('jam', 'Jam pengiriman setiap hari', 'text', '03:00', { mono: 1, ph: '03:00' })
  ],
  function (v) {
    return H('Backup Otomatis ke Email') +
      '/tool e-mail set server=' + v.smtp + ' port=' + v.port + ' tls=starttls user=' + q(v.user) + ' password=' + q(v.pass) + ' from=' + q(v.user) + '\n' +
      '/system script add name=kirim-backup policy=ftp,reboot,read,write,policy,test,sensitive source={\n' +
      '  :local nama "backup-router";\n' +
      '  /system backup save name=$nama;\n' +
      '  /export hide-sensitive file=$nama;\n' +
      '  /tool e-mail send to=' + q(v.email) + ' subject=("Backup biner " . [/system identity get name]) file=($nama . ".backup");\n' +
      '  :delay 10s;\n' +
      '  /tool e-mail send to=' + q(v.email) + ' subject=("Ekspor teks " . [/system identity get name]) file=($nama . ".rsc");\n' +
      '  :delay 10s;\n' +
      '  /file remove ($nama . ".backup");\n' +
      '  /file remove ($nama . ".rsc");\n' +
      '}\n' +
      '/system scheduler add name=jadwal-backup interval=1d start-time=' + v.jam + ':00 on-event=kirim-backup comment="Backup otomatis ke email"\n';
  },
  function () {
    return [
      'Baris pertama mengatur akun pengirim email di router.',
      'Script kirim-backup membuat dua berkas: backup biner untuk restore persis, dan ekspor teks yang bisa dibaca manusia.',
      'Kedua berkas dikirim sebagai dua email terpisah, lalu dihapus dari router agar penyimpanan tidak penuh.',
      'Scheduler menjalankan script itu sekali sehari pada jam yang kamu pilih.',
      'Nama berkas dibuat tetap (backup-router) agar berkas lama tertimpa dan tidak menumpuk.'
    ];
  }));

TOOLS.push(T('telegram-reporter', 'dasar', 'Laporan Router ke Telegram', 'Router Report to Telegram',
  'Router mengirim laporan kondisi (uptime, CPU, sisa memori) ke Telegram lewat bot secara berkala.',
  [
    f('token', 'Token bot Telegram', 'text', '', { mono: 1, help: 'Dapat dari @BotFather. Token ini rahasia, jangan bagikan berkas script hasil unduhan.' }),
    f('chat', 'Chat ID tujuan', 'text', '', { mono: 1, ph: '123456789', help: 'ID chat kamu atau grup tempat bot berada.' }),
    f('jadwal', 'Jeda pengiriman laporan', 'select', '6h', { opts: ['1m', '5m', '30m', '1h', '6h', '12h', '1d'] }),
    f('hotspot', 'Sertakan jumlah pengguna hotspot aktif', 'check', false)
  ],
  function (v) {
    var lines = [
      '/system script add name=laporan-telegram policy=read,write,test source={',
      '  :local token "' + v.token + '";',
      '  :local chatid "' + v.chat + '";',
      '  :local teks ("LAPORAN ROUTER\\n");',
      '  :set teks ($teks . "Router: " . [/system identity get name] . "\\n");',
      '  :set teks ($teks . "Uptime: " . [/system resource get uptime] . "\\n");',
      '  :set teks ($teks . "CPU: " . [/system resource get cpu-load] . "%\\n");',
      '  :set teks ($teks . "Memori bebas: " . ([/system resource get free-memory] / 1048576) . " MB");'
    ];
    if (v.hotspot) {
      lines.push('  :set teks ($teks . "\\n" . "Hotspot aktif: " . [:len [/ip hotspot active find]]);');
    }
    lines.push('  :local encoded [:convert $teks to=url];');
    lines.push('  /tool fetch url=("https://api.telegram.org/bot" . $token . "/sendMessage") http-method=post http-data=("chat_id=" . $chatid . "&text=" . $encoded) output=none;');
    lines.push('}');
    lines.push('/system scheduler add name=jadwal-laporan interval=' + v.jadwal + ' on-event="/system script run laporan-telegram" comment="Laporan Router Telegram"');
    return H('Laporan Router ke Telegram') + lines.join('\n') + '\n';
  },
  function () {
    return [
      'Script membaca nama router, uptime, beban CPU, dan sisa memori, lalu merangkainya menjadi satu pesan.',
      'Pesan dikirim memakai API bot Telegram dengan metode POST. Isi pesan di encode dulu memakai convert to url, jadi spasi dan karakter khusus pada nama router tidak merusak pengiriman.',
      'Parameter tujuan memakai nama chat_id, sesuai yang diminta API Telegram.',
      'Scheduler menjalankan script ini sesuai jeda pilihanmu. Router harus bisa mencapai internet agar pengiriman berhasil.'
    ];
  }));

TOOLS.push(T('watchdog-auto', 'dasar', 'Watchdog Pemulihan Otomatis', 'Automatic Recovery Watchdog',
  'Bila internet putus berulang kali, router menyalakan ulang interface WAN sendiri dan melapor ke Telegram.',
  [
    f('target', 'Target ping untuk cek internet', 'ip', '8.8.8.8', { v: 'ip' }),
    f('iface', 'Interface WAN yang dinyalakan ulang', 'text', 'ether1', { mono: 1 }),
    f('batas', 'Batas gagal berturut sebelum bertindak', 'number', '3', { v: 'num', min: 2, max: 10 }),
    f('periksa', 'Jeda pemeriksaan', 'select', '1m', { opts: ['1m', '5m'] }),
    f('token', 'Token bot Telegram', 'text', '', { mono: 1 }),
    f('chat', 'Chat ID tujuan laporan', 'text', '', { mono: 1, ph: '123456789' })
  ],
  function (v) {
    return H('Watchdog Pemulihan Otomatis') +
      '/system script add name=watchdog-pantau policy=read,write,test,policy source={\n' +
      '  :global wdGagal;\n' +
      '  :if ([:typeof $wdGagal] = "nothing") do={ :set wdGagal 0 }\n' +
      '  :local hasil [/ping ' + v.target + ' count=3];\n' +
      '  :if ($hasil = 0) do={ :set wdGagal ($wdGagal + 1); :log warning ("Watchdog: ping gagal, hitungan " . $wdGagal) } else={ :set wdGagal 0 }\n' +
      '  :if ($wdGagal >= ' + v.batas + ') do={\n' +
      '    :log error "Watchdog: internet diduga putus, menyalakan ulang ' + v.iface + '";\n' +
      '    /interface set disabled=yes [find name=' + q(v.iface) + '];\n' +
      '    :delay 5s;\n' +
      '    /interface set disabled=no [find name=' + q(v.iface) + '];\n' +
      '    /tool fetch url=("https://api.telegram.org/bot' + v.token + '/sendMessage?chat_id=' + v.chat + '&text=Watchdog%20menyalakan%20ulang%20' + v.iface + '") output=none;\n' +
      '    :set wdGagal 0;\n' +
      '  }\n' +
      '}\n' +
      '/system scheduler add name=jadwal-watchdog interval=' + v.periksa + ' on-event=watchdog-pantau comment="Watchdog pemulihan otomatis"\n';
  },
  function () {
    return [
      'Setiap jeda, script mengirim 3 ping ke target. Bila semuanya gagal, penghitung kegagalan naik satu.',
      'Satu kali gagal tidak langsung bertindak. Ini mencegah restart sia sia karena gangguan sesaat.',
      'Setelah gagal berturut mencapai batas, interface WAN dimatikan 5 detik lalu dinyalakan lagi, cara klasik menghidupkan ulang modem atau jalur yang macet.',
      'Router mengirim kabar ke Telegram. Perlu dicatat: laporan ini hanya terkirim bila jalur internet lain masih hidup atau setelah jalur pulih dan fetch diulang manual.'
    ];
  }));

TOOLS.push(T('kid-control', 'dasar', 'Kid Control', 'Kid Control',
  'Batasi jam internet satu perangkat, misalnya tablet anak, memakai fitur Kid Control bawaan RouterOS.',
  [
    f('nama', 'Nama aturan (nama anak)', 'text', 'Anak', {}),
    f('mac', 'Alamat MAC perangkat', 'text', '', { mono: 1, ph: 'AA:BB:CC:DD:EE:FF', help: 'Lihat di DHCP Server, tab Leases, pada perangkat yang dimaksud.' }),
    f('mulai', 'Jam mulai boleh online', 'text', '07:00', { mono: 1 }),
    f('selesai', 'Jam selesai (batas akhir)', 'text', '21:00', { mono: 1 }),
    f('pola', 'Pola hari', 'select', 'setiap', { opts: [{ v: 'setiap', l: 'Setiap hari jam yang sama' }, { v: 'sekolah', l: 'Hari sekolah lebih awal, akhir pekan lebih longgar' }, { v: 'akhirpekan', l: 'Hanya akhir pekan' }] }),
    f('mulaiW', 'Akhir pekan: jam mulai', 'text', '06:00', { mono: 1 }),
    f('selesaiW', 'Akhir pekan: jam selesai', 'text', '22:00', { mono: 1 })
  ],
  function (v) {
    var hari = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    var rangeBiasa = v.mulai + ':00-' + v.selesai + ':00';
    var rangeW = v.mulaiW + ':00-' + v.selesaiW + ':00';
    var parts = hari.map(function (d, i) {
      var akhirPekan = i >= 5;
      var r;
      if (v.pola === 'setiap') { r = rangeBiasa; }
      else if (v.pola === 'sekolah') { r = akhirPekan ? rangeW : rangeBiasa; }
      else { r = akhirPekan ? rangeW : '00:00:00-00:00:00'; }
      return d + '=' + r;
    });
    return H('Kid Control') +
      '/ip kidcontrol add name=' + q(v.nama) + ' ' + parts.join(' ') + '\n' +
      '/ip kidcontrol device add kid=' + q(v.nama) + ' mac-address=' + v.mac + '\n';
  },
  function () {
    return [
      'Baris pertama membuat aturan jam untuk setiap hari dalam seminggu.',
      'Jendela 00:00:00 sampai 00:00:00 berarti tidak ada akses pada hari itu, dipakai untuk pola hanya akhir pekan.',
      'Baris kedua menempelkan aturan ke perangkat berdasarkan alamat MAC nya.',
      'Di luar jam yang diizinkan, perangkat tetap terhubung ke WiFi tetapi trafik internetnya ditahan oleh router.'
    ];
  }));

TOOLS.push(T('add-admin-user', 'dasar', 'Add Admin User', 'Add Admin User',
  'Buat pengguna router baru dengan grup akses sendiri, misalnya akun teknisi yang berbeda dari admin utama.',
  [
    f('user', 'Nama pengguna baru', 'text', 'admin-baru', { mono: 1, help: 'Nama login untuk masuk Winbox atau terminal. Hindari spasi.' }),
    f('pass', 'Password', 'text', 'GantiSaya123', { mono: 1, help: 'Pakai password panjang dan unik. Ganti lagi setelah akun dibuat bila password ini sempat terlihat orang lain.' }),
    f('grup', 'Grup pengguna', 'select', 'full', { opts: [{ v: 'full', l: 'full (akses penuh)' }, { v: 'read', l: 'read (hanya baca)' }, { v: 'write', l: 'write (baca dan tulis)' }] }),
    f('komen', 'Komentar', 'text', '', { opt: 1, ph: 'Teknisi lapangan' })
  ],
  function (v) {
    var s = '/user add name=' + v.user + ' password=' + v.pass + ' group=' + v.grup;
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('Add Admin User') + s + '\n';
  },
  function () {
    return [
      'Satu baris ini membuat akun pengguna baru lengkap dengan password dan grup aksesnya.',
      'Grup full boleh mengubah apa pun, write boleh membaca dan mengubah tetapi tidak mengelola pengguna, sedangkan read hanya boleh melihat.',
      'Peringatan praktis: jangan membagikan akun full ke banyak orang, buat satu akun per orang agar jejak perubahan di log bisa dilacak.'
    ];
  }));

TOOLS.push(T('add-ip-pool', 'dasar', 'Add IP Pool', 'Add IP Pool',
  'Buat pool alamat IP, yaitu rentang alamat yang siap dibagikan ke DHCP server, hotspot, atau PPPoE.',
  [
    f('nama', 'Nama pool', 'text', 'pool-tambahan', { mono: 1, help: 'Nama ini dipakai saat pool dipilih di DHCP server, hotspot, atau profil PPP.' }),
    f('from', 'Alamat awal pool', 'ip', '192.168.88.100', { v: 'ip' }),
    f('to', 'Alamat akhir pool', 'ip', '192.168.88.200', { v: 'ip' })
  ],
  function (v) {
    return H('Add IP Pool') +
      '/ip pool add name=' + v.nama + ' ranges=' + v.from + '-' + v.to + '\n';
  },
  function () {
    return [
      'Baris ini mendaftarkan satu rentang alamat dengan nama pool yang kamu isi.',
      'Pool baru belum dipakai apa pun sampai kamu menunjuknya di DHCP server, hotspot, atau profil PPP.',
      'Peringatan praktis: pastikan rentang pool tidak menabrak alamat statis seperti gateway, printer, atau access point.'
    ];
  }));

TOOLS.push(T('auto-reboot', 'dasar', 'Auto Reboot', 'Auto Reboot',
  'Jadwalkan reboot router secara berkala pada jam sepi, supaya memori segar dan layanan yang macet pulih sendiri.',
  [
    f('nama', 'Nama scheduler', 'text', 'reboot-otomatis', { mono: 1 }),
    f('interval', 'Interval reboot', 'select', '7d', { opts: ['1d', '7d', '30d'] }),
    f('mulai', 'Jam mulai (HH:MM:SS)', 'text', '03:00:00', { mono: 1, help: 'Pilih jam paling sepi, contoh dini hari saat tidak ada pengguna aktif.' })
  ],
  function (v) {
    return H('Auto Reboot') +
      '/system scheduler add name=' + v.nama + ' start-time=' + v.mulai + ' interval=' + v.interval + ' on-event="/system reboot" comment="Reboot berkala otomatis"\n';
  },
  function () {
    return [
      'Satu baris ini membuat jadwal yang menjalankan perintah reboot setiap interval yang kamu pilih, mulai dari jam yang kamu isi.',
      'Reboot hanya memakan waktu sekitar satu menit, dan semua layanan kembali normal sendiri setelah router menyala lagi.',
      'Peringatan praktis: pastikan jam router sudah benar lewat NTP, karena scheduler mengikuti jam router, dan jangan memilih jam sibuk bila ada pengguna yang sedang bekerja.'
    ];
  }));

TOOLS.push(T('backup-export', 'dasar', 'Backup Export File .rsc', 'Backup Export File .rsc',
  'Simpan konfigurasi router ke berkas teks .rsc dan cadangan biner, supaya bisa dipulihkan cepat bila router rusak atau salah konfigurasi.',
  [
    f('file', 'Nama berkas (tanpa ekstensi)', 'text', 'backup-router', { mono: 1, help: 'Berkas tersimpan di menu Files, contoh backup-router.rsc.' }),
    f('hide', 'Sembunyikan data sensitif di ekspor', 'check', true, { help: 'Password dan kunci tidak ikut tertulis di berkas .rsc.' }),
    f('biner', 'Buat juga backup biner (.backup)', 'check', true, { help: 'Cadangan biner memulihkan seluruh konfigurasi termasuk password.' })
  ],
  function (v) {
    var s = H('Backup Export File .rsc') +
      '/export file=' + v.file + (v.hide ? ' hide-sensitive' : '') + '\n';
    if (v.biner) {
      s += '/system backup save name=' + v.file + '\n';
    }
    return s;
  },
  function () {
    return [
      'Baris export menulis seluruh konfigurasi ke berkas .rsc yang bisa dibaca dan diedit sebagai teks.',
      'Bila opsi sembunyikan sensitif aktif, password dan kunci tidak ikut tertulis, jadi berkas aman dibagikan ke teknisi lain.',
      'Bila opsi biner aktif, baris kedua menyimpan cadangan biner yang memulihkan router persis seperti semula, termasuk password.',
      'Peringatan praktis: unduh kedua berkas dari menu Files dan simpan di luar router, karena cadangan di dalam router ikut hilang bila perangkatnya rusak.'
    ];
  }));

TOOLS.push(T('bootloader-protector', 'dasar', 'Bootloader Protector', 'Bootloader Protector',
  'Kunci RouterBOOT supaya router tidak bisa di-boot dari perangkat lain dan tombol reset tidak bisa menghapus konfigurasi.',
  [
    f('aktif', 'Aktifkan proteksi RouterBOOT', 'check', true, { help: 'Bila dimatikan, perintah yang dihasilkan justru membuka kembali proteksinya.' })
  ],
  function (v) {
    return H('Bootloader Protector') +
      '/system routerboard settings set protected-routerboot=' + (v.aktif ? 'yes' : 'no') + '\n';
  },
  function () {
    return [
      'Satu baris ini menyalakan atau mematikan proteksi RouterBOOT, sesuai centang yang kamu isi.',
      'Saat proteksi aktif, router hanya mau boot dari memori internalnya sendiri, jadi tidak bisa dibajak lewat Netinstall atau media boot lain.',
      'Tombol reset juga kehilangan fungsinya untuk menghapus konfigurasi, sehingga pencuri yang memegang fisik router tidak bisa mereset password dengan mudah.',
      'Peringatan praktis: bila kamu sendiri lupa password saat proteksi aktif, tombol reset tidak bisa menolongmu, jadi pastikan kamu masih bisa login dan sudah menyimpan backup sebelum mengaktifkan fitur ini.'
    ];
  }));

TOOLS.push(T('clear-dns-flush', 'dasar', 'Clear DNS Flush', 'Clear DNS Flush',
  'Kosongkan cache DNS router, supaya nama domain yang sudah berubah alamat langsung dijawab dengan alamat barunya.',
  [
    f('tampil', 'Tampilkan jumlah entri cache yang tersisa', 'check', false, { help: 'Menambahkan satu baris yang mencetak sisa entri cache setelah flush.' })
  ],
  function (v) {
    var s = H('Clear DNS Flush') + '/ip dns cache flush\n';
    if (v.tampil) {
      s += ':put ("Sisa entri cache DNS: " . [:len [/ip dns cache find]])\n';
    }
    return s;
  },
  function () {
    return [
      'Baris pertama mengosongkan seluruh cache DNS, jadi pertanyaan berikutnya akan dijawab langsung dari server DNS, bukan dari simpanan lama.',
      'Perintah ini berguna setelah pindah server DNS atau saat sebuah situs baru pindah hosting tetapi perangkat masih membuka alamat lamanya.',
      'Bila opsi tampil dicentang, baris kedua mencetak jumlah entri cache yang tersisa, biasanya nol, sebagai bukti flush sudah berjalan.',
      'Peringatan praktis: sesaat setelah flush, membuka situs terasa sedikit lebih lambat karena cache harus dibangun ulang dari nol, tetapi itu normal dan hanya berlangsung sebentar.'
    ];
  }));

TOOLS.push(T('clear-log', 'dasar', 'Clear Log Terminal', 'Clear Log Terminal',
  'Hapus entri log router dari buffer memory, semua atau hanya satu topik tertentu, supaya log lama tidak menumpuk.',
  [
    f('mode', 'Yang dihapus', 'select', 'semua', { opts: [{ v: 'semua', l: 'Semua entri log' }, { v: 'topik', l: 'Hanya satu topik' }] }),
    f('topik', 'Topik yang dihapus', 'text', 'info', { opt: 1, help: 'Dipakai bila mode di atas "Hanya satu topik". Contoh info, warning, error, hotspot, atau system.' }),
    f('tampil', 'Tampilkan sisa entri log sesudahnya', 'check', false)
  ],
  function (v) {
    var s = H('Clear Log Terminal');
    if (v.mode === 'topik' && v.topik) {
      s += '/log remove [find topics~' + q(v.topik) + ']\n';
    } else {
      s += '/log remove [find]\n';
    }
    if (v.tampil) {
      s += ':put ("Sisa entri log: " . [:len [/log find]])\n';
    }
    return s;
  },
  function () {
    return [
      'Perintah remove mengosongkan entri log dari buffer memory router, bukan dari berkas, jadi log yang sudah diekspor ke berkas tetap aman.',
      'Mode satu topik memakai pencocokan topics, berguna misalnya untuk membersihkan banjir info hotspot tanpa menghapus peringatan penting.',
      'Log yang dihapus tidak bisa dikembalikan. Bila log itu bukti gangguan, ekspor dulu dengan print file sebelum menjalankan script ini.',
      'Peringatan praktis: setelah dibersihkan, log mulai terisi lagi dari nol, jadi kejadian lama tidak lagi bisa dilacak dari router ini.'
    ];
  }));

TOOLS.push(T('ip-service', 'dasar', 'IP Service Control', 'IP Service Control',
  'Atur port layanan kelola router (Winbox dan SSH), matikan layanan yang tidak dipakai, dan batasi alamat yang boleh membuka layanan kelola.',
  [
    f('winboxPort', 'Port Winbox', 'number', 8291, { v: 'num', min: 1, max: 65535 }),
    f('sshPort', 'Port SSH', 'number', 22, { v: 'num', min: 1, max: 65535 }),
    f('offTelnet', 'Matikan Telnet', 'check', true),
    f('offFtp', 'Matikan FTP', 'check', true),
    f('offWww', 'Matikan WebFig (www)', 'check', false),
    f('offApi', 'Matikan API', 'check', false),
    f('batas', 'Batasi Winbox dan SSH ke jaringan ini (opsional)', 'cidr', '', { opt: 1, v: 'cidr', help: 'Bila diisi, Winbox dan SSH hanya menjawab dari jaringan ini. Salah isi bisa mengunci kamu dari router sendiri, jadi periksa dua kali.' })
  ],
  function (v) {
    var L = [];
    L.push('/ip service set winbox port=' + v.winboxPort);
    L.push('/ip service set ssh port=' + v.sshPort);
    var off = [];
    if (v.offTelnet) { off.push('telnet'); }
    if (v.offFtp) { off.push('ftp'); }
    if (v.offWww) { off.push('www'); }
    if (v.offApi) { off.push('api'); }
    if (off.length) { L.push('/ip service disable ' + off.join(',')); }
    if (v.batas) {
      L.push('/ip service set winbox address=' + v.batas);
      L.push('/ip service set ssh address=' + v.batas);
    }
    return H('IP Service Control') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Dua baris pertama memindah port Winbox dan SSH dari angka bawaannya. Pemindai dari internet biasanya hanya mengetuk port bawaan, jadi langkah kecil ini sudah mengurangi banyak ketukan.',
      'Telnet dan FTP mengirim password tanpa enkripsi, jadi keduanya dimatikan secara bawaan di sini. WebFig dan API hanya dimatikan bila kamu mencentangnya, karena ada yang masih memakainya.',
      'Bila kolom batas jaringan diisi, Winbox dan SSH hanya menjawab dari jaringan itu. Pastikan alamat laptop pengelola masuk ke jaringan tersebut sebelum menjalankan script ini, atau kamu terkunci dari router sendiri.',
      'Mengganti port bukan pengganti firewall. Pasangkan dengan aturan firewall input agar layanan kelola tetap tertutup dari arah internet.'
    ];
  }));

TOOLS.push(T('iface-default-name', 'dasar', 'Interface Name to Default', 'Interface Name to Default',
  'Kembalikan nama interface ke nama bawaan pabriknya (ether1, wlan1), memakai properti default-name tiap interface.',
  [
    f('scope', 'Jenis interface', 'select', 'ethernet', { opts: [{ v: 'ethernet', l: 'Ethernet (ether1, ether2, ...)' }, { v: 'wireless', l: 'Wireless (wlan1, wlan2, ...)' }] }),
    f('tampil', 'Tampilkan daftar interface sesudahnya', 'check', true)
  ],
  function (v) {
    var m = '/interface ' + v.scope;
    var L = [];
    L.push(':foreach i in=[' + m + ' find] do={ :local d [' + m + ' get $i default-name]; ' + m + ' set $i name=$d }');
    if (v.tampil) { L.push(m + ' print'); }
    return H('Interface Name to Default') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Perintah ini membaca properti default-name tiap interface, yaitu nama yang diberikan pabrik sebelum diubah, lalu mengembalikannya satu per satu.',
      'Nama bawaan berguna saat mengikuti panduan atau script orang lain yang menyebut ether1 atau wlan1, karena nama yang sudah diganti sering membuat perintah contoh gagal.',
      'Perintah print di akhir menampilkan daftar nama sesudah diubah, sebagai bukti nama sudah kembali ke bawaan.',
      'Peringatan praktis: script lain yang merujuk nama interface lama (misalnya ether2-lan) akan gagal setelah nama dikembalikan, jadi periksa dulu aturan firewall, DHCP, dan queue yang memakai nama itu.'
    ];
  }));

TOOLS.push(T('ping-tool', 'dasar', 'Ping Tool', 'Ping Tool',
  'Uji keterjangkauan host dari router: kirim beberapa paket ping dan lihat hasilnya langsung di terminal.',
  [
    f('target1', 'Target pertama (IP atau nama host)', 'text', '8.8.8.8', { mono: 1 }),
    f('target2', 'Target kedua (opsional)', 'text', '', { opt: 1, mono: 1, ph: '1.1.1.1' }),
    f('count', 'Jumlah paket per target', 'number', 4, { v: 'num', min: 1, max: 100 }),
    f('interval', 'Jeda antar paket', 'select', '500ms', { opts: ['200ms', '500ms', '1s', '2s'] })
  ],
  function (v) {
    var L = [];
    L.push('/ping ' + v.target1 + ' count=' + v.count + ' interval=' + v.interval);
    if (v.target2) { L.push('/ping ' + v.target2 + ' count=' + v.count + ' interval=' + v.interval); }
    L.push(':log info "Uji ping selesai"');
    return H('Ping Tool') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Setiap baris ping mengirim paket sebanyak jumlah yang kamu isi, dengan jeda antar paket sesuai pilihan, dan hasilnya tampil langsung di terminal tempat script dijalankan.',
      'Balasan yang hilang ditandai timeout. Satu atau dua timeout sesekali masih wajar, tetapi bila semua paket hilang, periksa dulu kabel, gateway, dan DNS sebelum menyalahkan ISP.',
      'Menguji dua target sekaligus membantu membedakan masalah lokal dan masalah internet: bila target pertama menjawab tetapi target kedua tidak, masalahnya ada di luar router.',
      'Baris terakhir mencatat penyelesaian uji ke log router, supaya ada jejaknya bila nanti dicek ulang.'
    ];
  }));

TOOLS.push(T('change-mac', 'dasar', 'Change MAC Address', 'Change MAC Address',
  'Ganti alamat MAC satu interface ethernet, diisi manual atau dibuat acak (locally administered, diawali 02, 06, 0A, atau 0E).',
  [
    f('iface', 'Interface', 'text', 'ether2', { mono: 1 }),
    f('mode', 'Alamat MAC baru', 'select', 'acak', { opts: [{ v: 'manual', l: 'Isi manual pada kolom di bawah' }, { v: 'acak', l: 'Buat acak otomatis' }] }),
    f('mac', 'Alamat MAC baru', 'text', '', { opt: 1, mono: 1, ph: '02:11:22:33:44:55', help: 'Format enam pasang heksadesimal dipisah titik dua. Dipakai bila mode di atas "Isi manual".' }),
    f('bounce', 'Matikan lalu nyalakan lagi interface sesudah ganti', 'check', false, { help: 'Membantu bila alamat baru tidak langsung aktif. Koneksi lewat interface ini putus sesaat.' })
  ],
  function (v) {
    var mac = v.mac;
    if (v.mode === 'acak') {
      if (macAcakPrev !== 'acak' || !macAcakCache) {
        var first = [0x02, 0x06, 0x0A, 0x0E][Math.floor(Math.random() * 4)];
        var b = [first];
        for (var i = 1; i < 6; i++) { b.push(Math.floor(Math.random() * 256)); }
        macAcakCache = b.map(function (x) { return (x < 16 ? '0' : '') + x.toString(16).toUpperCase(); }).join(':');
      }
      mac = macAcakCache;
    }
    macAcakPrev = v.mode;
    var L = [];
    if (!mac) {
      L.push('# Isi alamat MAC baru pada kolom di atas, atau pilih mode "Buat acak otomatis".');
      return H('Change MAC Address') + L.join('\n') + '\n';
    }
    if (v.bounce) { L.push('/interface ethernet disable ' + v.iface); }
    L.push('/interface ethernet set [find name=' + v.iface + '] mac-address=' + mac);
    if (v.bounce) { L.push('/interface ethernet enable ' + v.iface); }
    return H('Change MAC Address') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Alamat MAC adalah identitas perangkat di lapisan dua. Menggantinya berguna bila ISP mengunci layanan ke MAC tertentu, atau bila dua perangkat terlanjur memakai MAC yang sama.',
      'Mode acak memakai oktet pertama 02, 06, 0A, atau 0E, yaitu alamat locally administered yang tidak akan bertabrakan dengan alamat pabrik perangkat lain.',
      'Perubahan MAC bisa membuat link putus sesaat, karena perangkat di ujung lain harus mempelajari ulang alamatnya lewat ARP.',
      'Catat alamat MAC lama sebelum menjalankan script ini. Bila ISP ternyata mengunci MAC lama, kamu butuh alamat itu untuk kembali.'
    ];
  }));


TOOLS.push(T('remove-arp-table', 'dasar', 'Remove ARP Table', 'Remove ARP Table',
  'Kosongkan tabel ARP router: hapus entri dinamis yang dipelajari otomatis, dan bila dipilih, entri statis yang dipasang manual. Tabel terisi lagi sendiri begitu perangkat berkomunikasi.',
  [
    f('dinamis', 'Hapus entri ARP dinamis', 'check', true, { help: 'Entri yang dipelajari otomatis dari trafik jaringan.' }),
    f('statis', 'Hapus juga entri ARP statis', 'check', false, { help: 'Entri statis adalah pasangan IP dan MAC yang dipasang manual, misalnya untuk mengunci perangkat ke alamat tertentu.' })
  ],
  function (v) {
    var L = [];
    if (v.dinamis) { L.push('/ip arp remove [find where dynamic=yes]'); }
    if (v.statis) { L.push('/ip arp remove [find where dynamic=no]'); }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang dihapus. Centang minimal satu jenis entri.'); }
    return H('Remove ARP Table') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Tabel ARP adalah buku alamat lapisan dua: pasangan alamat IP dan alamat MAC perangkat yang pernah berkomunikasi lewat router.',
      'Entri dinamis dipelajari otomatis dan kedaluwarsa sendiri. Menghapusnya hanya memaksa router mempelajari ulang alamat perangkat, jadi gangguan yang timbul hanya jeda sesaat.',
      'Entri statis tidak dipelajari ulang. Bila dihapus, ikatan IP dan MAC buatanmu hilang dan harus dipasang lagi satu per satu.',
      'Pakai tool ini saat tabel ARP diduga berisi entri palsu (misalnya serangan ARP spoofing), atau setelah mengganti perangkat jaringan yang alamat MAC-nya berubah.'
    ];
  }));

TOOLS.push(T('remove-dhcp', 'dasar', 'Remove DHCP Server dan Client', 'Remove DHCP Server and Client',
  'Hapus konfigurasi DHCP sekaligus: server, jaringan server, client, dan bila dipilih, lease serta pool. Perangkat LAN berhenti mendapat alamat otomatis setelah server dihapus.',
  [
    f('cadangan', 'Buat backup konfigurasi (.rsc) dulu', 'check', true, { help: 'Menyimpan salinan konfigurasi lengkap ke menu Files sebelum ada yang dihapus.' }),
    f('server', 'Hapus semua DHCP server', 'check', true),
    f('jaringan', 'Hapus juga jaringan DHCP server', 'check', true, { help: 'Jaringan DHCP menyimpan gateway, DNS, dan subnet yang dibagikan server.' }),
    f('client', 'Hapus semua DHCP client', 'check', true, { help: 'Hati-hati: bila WAN memakai DHCP client, internet router langsung putus setelah client dihapus.' }),
    f('lease', 'Hapus semua lease DHCP', 'check', false, { help: 'Lease adalah catatan alamat yang sudah dibagikan ke perangkat. Menghapusnya membuat semua perangkat meminta alamat baru.' }),
    f('pool', 'Hapus juga semua IP pool', 'check', false, { help: 'Pool dipakai server DHCP dan juga layanan lain seperti PPPoE. Periksa dulu pemakai pool sebelum menghapus.' })
  ],
  function (v) {
    var L = [];
    if (v.cadangan) { L.push('/export file=backup-sebelum-hapus-dhcp'); }
    if (v.server) { L.push('/ip dhcp-server remove [find]'); }
    if (v.jaringan) { L.push('/ip dhcp-server network remove [find]'); }
    if (v.client) { L.push('/ip dhcp-client remove [find]'); }
    if (v.lease) { L.push('/ip dhcp-server lease remove [find]'); }
    if (v.pool) { L.push('/ip pool remove [find]'); }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang dihapus. Centang minimal satu kelompok.'); }
    return H('Remove DHCP Server dan Client') + L.join('\n') + '\n';
  },
  function () {
    return [
      'DHCP server membagikan alamat IP otomatis ke perangkat LAN. Setelah dihapus, perangkat baru tidak lagi mendapat alamat sampai server dibuat ulang.',
      'Jaringan DHCP menyimpan gateway dan DNS yang dibagikan. Menghapusnya bersama server membuat konfigurasi lama benar-benar bersih, tanpa sisa.',
      'DHCP client adalah sisi sebaliknya: router meminta alamat ke ISP atau router atas. Menghapus client WAN memutus internet router, jadi lakukan ini hanya bila kamu sudah menyiapkan penggantinya.',
      'Lease yang dihapus membuat semua perangkat meminta alamat baru saat tersambung lagi. Biasanya tidak terasa, kecuali perangkat yang alamatnya diikat statis ke lease tertentu.',
      'Backup .rsc menyimpan seluruh konfigurasi ke menu Files. Bila penghapusan ternyata salah, pulihkan dengan menjalankan berkas backup itu dari terminal.'
    ];
  }));

TOOLS.push(T('remove-dns', 'dasar', 'Remove DNS', 'Remove DNS',
  'Bersihkan DNS router: kosongkan cache, hapus semua entri DNS statis, dan bila dipilih, kembalikan setelan DNS ke bawaan. Entri statis yang dipakai untuk memblokir situs ikut hilang.',
  [
    f('cache', 'Kosongkan cache DNS', 'check', true, { help: 'Cache berisi jawaban DNS yang sudah pernah dicari. Mengosongkannya memaksa router bertanya ulang ke server DNS.' }),
    f('statis', 'Hapus semua entri DNS statis', 'check', true, { help: 'Entri statis dipakai untuk nama lokal dan untuk memblokir situs dengan mengarahkannya ke alamat kosong.' }),
    f('setelan', 'Kembalikan setelan DNS ke bawaan', 'check', false, { help: 'Mengosongkan daftar server DNS dan mematikan permintaan jarak jauh (allow-remote-requests).' })
  ],
  function (v) {
    var L = [];
    if (v.cache) { L.push('/ip dns cache flush'); }
    if (v.statis) { L.push('/ip dns static remove [find]'); }
    if (v.setelan) { L.push('/ip dns set servers="" allow-remote-requests=no'); }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang dihapus. Centang minimal satu kelompok.'); }
    return H('Remove DNS') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Cache DNS mempercepat browsing karena jawaban yang sudah pernah dicari tidak perlu ditanyakan ulang. Mengosongkannya aman, hanya membuat pencarian pertama setelah itu sedikit lebih lambat.',
      'Entri DNS statis menimpa jawaban dari internet. Banyak pemblokir situs bekerja dengan cara ini, jadi menghapus semua entri statis berarti membuka kembali situs yang tadinya diblokir.',
      'Setelan bawaan berarti router tidak lagi meneruskan permintaan DNS dari perangkat LAN. Perangkat harus memakai DNS sendiri, atau kamu harus mengisi server DNS lagi setelah ini.',
      'Setelah dibersihkan, uji dengan membuka satu situs dari perangkat LAN. Bila situs tidak terbuka, periksa dulu daftar server DNS sebelum menyalahkan ISP.'
    ];
  }));

TOOLS.push(T('remove-all-ip', 'dasar', 'Remove All IP Address', 'Remove All IP Address',
  'Hapus semua alamat IP dari semua interface. PERINGATAN: setelah alamat IP hilang, router tidak lagi bisa dijangkau lewat IP, hanya lewat MAC di Winbox. Jalankan hanya bila kamu tersambung lewat MAC atau konsol.',
  [
    f('cadangan', 'Buat backup konfigurasi (.rsc) dulu', 'check', true, { help: 'Menyimpan salinan konfigurasi lengkap ke menu Files sebelum ada yang dihapus.' }),
    f('kecuali', 'Alamat IP yang dipertahankan (opsional)', 'cidr', '', { opt: 1, v: 'cidr', mono: 1, ph: '192.168.88.1/24', help: 'Bila diisi, alamat ini tidak dihapus supaya kamu tetap bisa masuk lewat IP itu. Tulis lengkap dengan prefix, contoh 192.168.88.1/24.' })
  ],
  function (v) {
    var L = [];
    if (v.cadangan) { L.push('/export file=backup-sebelum-hapus-ip'); }
    if (v.kecuali) { L.push('/ip address remove [find where address!=' + q(v.kecuali) + ']'); }
    else { L.push('/ip address remove [find]'); }
    return H('Remove All IP Address') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Alamat IP adalah identitas router di tiap jaringan. Menghapus semuanya sama dengan melepas router dari semua jaringan sekaligus, termasuk jaringan tempat kamu tersambung sekarang.',
      'Setelah dijalankan, satu-satunya jalan masuk adalah lewat alamat MAC (Winbox Neighbors) atau kabel konsol. Pastikan kamu tahu cara masuk lewat MAC sebelum menjalankan script ini.',
      'Kolom alamat yang dipertahankan berguna untuk membersihkan alamat lama sambil tetap memegang satu alamat darurat. Isi dengan alamat yang kamu pakai untuk masuk saat ini.',
      'Backup .rsc menyimpan seluruh konfigurasi ke menu Files. Bila penghapusan ternyata salah, pulihkan dengan menjalankan berkas backup itu dari terminal lewat MAC.'
    ];
  }));

TOOLS.push(T('remove-all-pool', 'dasar', 'Remove All IP Pool', 'Remove All IP Pool',
  'Hapus semua IP pool. Pool yang masih dipakai DHCP server atau PPPoE membuat layanan itu gagal membagikan alamat, jadi periksa pemakainya dulu.',
  [
    f('cadangan', 'Buat backup konfigurasi (.rsc) dulu', 'check', true, { help: 'Menyimpan salinan konfigurasi lengkap ke menu Files sebelum ada yang dihapus.' })
  ],
  function (v) {
    var L = [];
    if (v.cadangan) { L.push('/export file=backup-sebelum-hapus-pool'); }
    L.push('/ip pool remove [find]');
    return H('Remove All IP Pool') + L.join('\n') + '\n';
  },
  function () {
    return [
      'IP pool adalah rentang alamat yang siap dibagikan, misalnya 192.168.88.10 sampai 192.168.88.254 untuk DHCP server.',
      'Pool tidak berdiri sendiri: DHCP server, PPPoE, dan layanan lain mengambil alamat dari pool. Menghapus pool membuat layanan itu kehabisan alamat untuk dibagikan.',
      'Sebelum menjalankan, periksa di menu IP Pool kolom mana saja yang dipakai, dan siapkan pool pengganti bila layanan harus tetap jalan.',
      'Backup .rsc menyimpan seluruh konfigurasi ke menu Files. Bila penghapusan ternyata salah, pulihkan dengan menjalankan berkas backup itu dari terminal.'
    ];
  }));

TOOLS.push(T('remove-interface-bridge', 'dasar', 'Remove Interface dan Bridge', 'Remove Interface and Bridge',
  'Hapus bridge beserta port anggotanya, dan bila dipilih, interface VLAN. PERINGATAN: perangkat yang tersambung lewat bridge langsung terputus. Jalankan hanya lewat MAC Winbox atau konsol.',
  [
    f('cadangan', 'Buat backup konfigurasi (.rsc) dulu', 'check', true, { help: 'Menyimpan salinan konfigurasi lengkap ke menu Files sebelum ada yang dihapus.' }),
    f('port', 'Lepas dan hapus semua bridge port', 'check', true, { help: 'Port dilepas dulu sebelum bridge dihapus, supaya tidak ada interface yang tertinggal menggantung.' }),
    f('bridge', 'Hapus semua bridge', 'check', true),
    f('vlan', 'Hapus juga semua interface VLAN', 'check', false, { help: 'Interface VLAN biasanya menempel di atas bridge. Menghapusnya memutus semua segmen VLAN sekaligus.' })
  ],
  function (v) {
    var L = [];
    if (v.cadangan) { L.push('/export file=backup-sebelum-hapus-bridge'); }
    if (v.port) { L.push('/interface bridge port remove [find]'); }
    if (v.bridge) { L.push('/interface bridge remove [find]'); }
    if (v.vlan) { L.push('/interface vlan remove [find]'); }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang dihapus. Centang minimal satu kelompok.'); }
    return H('Remove Interface dan Bridge') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Bridge menggabungkan beberapa port fisik menjadi satu switch virtual. Semua perangkat di port itu berkomunikasi lewat bridge, jadi menghapus bridge memutus mereka semua.',
      'Bridge port dilepas dulu sebelum bridge dihapus, karena port yang masih menempel membuat penghapusan bridge gagal.',
      'Interface VLAN menempel di atas bridge dan membawa segmen seperti Guru atau Siswa. Menghapusnya memutus seluruh segmen itu, termasuk DHCP dan alamat IP di atasnya.',
      'Setelah bridge hilang, interface fisik kembali berdiri sendiri. Kamu harus membangun ulang bridge, alamat IP, dan DHCP dari nol bila jaringan ini masih dipakai.',
      'Backup .rsc menyimpan seluruh konfigurasi ke menu Files. Bila penghapusan ternyata salah, pulihkan dengan menjalankan berkas backup itu dari terminal.'
    ];
  }));

TOOLS.push(T('reset-all-counters', 'dasar', 'Reset All Counters', 'Reset All Counters',
  'Nol-kan semua penghitung statistik: interface, firewall, dan antrean. Yang di-nol-kan hanya angka statistiknya, trafik dan aturan tidak berubah.',
  [
    f('iface', 'Nol-kan penghitung semua interface', 'check', true, { help: 'Jumlah paket dan byte yang lewat tiap interface kembali ke nol.' }),
    f('firewall', 'Nol-kan penghitung filter, NAT, dan mangle', 'check', true, { help: 'Jumlah paket dan byte per aturan kembali ke nol, sehingga mudah melihat aturan mana yang bekerja setelah ini.' }),
    f('queue', 'Nol-kan penghitung simple queue dan queue tree', 'check', true)
  ],
  function (v) {
    var L = [];
    if (v.iface) { L.push('/interface reset-counters'); }
    if (v.firewall) {
      L.push('/ip firewall filter reset-counters [find]');
      L.push('/ip firewall nat reset-counters [find]');
      L.push('/ip firewall mangle reset-counters [find]');
    }
    if (v.queue) {
      L.push('/queue simple reset-counters [find]');
      L.push('/queue tree reset-counters [find]');
    }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang di-nol-kan. Centang minimal satu kelompok.'); }
    return H('Reset All Counters') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Penghitung (counter) hanyalah angka statistik: berapa paket dan byte yang sudah lewat. Me-nol-kannya tidak memengaruhi kecepatan, aturan, atau koneksi yang sedang berjalan.',
      'Ini berguna sebelum pengujian: nol-kan dulu, jalankan uji selama beberapa menit, lalu baca angkanya untuk melihat trafik yang benar-benar terjadi selama uji.',
      'Penghitung firewall yang di-nol-kan membuat aturan yang tadinya ramai terlihat sepi. Tunggu beberapa saat sebelum menyimpulkan sebuah aturan tidak pernah dipakai.',
      'Angka lama yang sudah di-nol-kan tidak bisa dikembalikan. Bila angka itu dibutuhkan untuk laporan, catat atau ekspor dulu sebelum menjalankan script ini.'
    ];
  }));

TOOLS.push(T('reset-mac-interfaces', 'dasar', 'Reset MAC All Interfaces', 'Reset MAC All Interfaces',
  'Kembalikan alamat MAC semua interface ethernet ke alamat pabrik. PERINGATAN: perangkat yang mengunci layanan ke MAC lama (ISP, DHCP binding) akan kehilangan pengenalnya.',
  [
    f('cadangan', 'Buat backup konfigurasi (.rsc) dulu', 'check', true, { help: 'Menyimpan salinan konfigurasi lengkap ke menu Files sebelum ada yang diubah.' }),
    f('ethernet', 'Reset MAC semua interface ethernet', 'check', true),
    f('wireless', 'Reset juga MAC interface wireless', 'check', false, { help: 'Hanya bila paket wireless terpasang di router ini.' }),
    f('kecuali', 'Interface yang dilewati (opsional)', 'text', '', { opt: 1, mono: 1, ph: 'ether1', help: 'Nama satu interface yang MAC-nya tidak diubah, contoh ether1 (biasanya interface WAN yang dikunci ISP).' })
  ],
  function (v) {
    var L = [];
    var sel = v.kecuali ? ' [find where name!=' + q(v.kecuali) + ']' : ' [find]';
    if (v.cadangan) { L.push('/export file=backup-sebelum-reset-mac'); }
    if (v.ethernet) { L.push('/interface ethernet reset-mac-address' + sel); }
    if (v.wireless) { L.push('/interface wireless reset-mac-address' + sel); }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang diubah. Centang minimal satu jenis interface.'); }
    return H('Reset MAC All Interfaces') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Alamat MAC adalah identitas perangkat di lapisan dua. Meresetnya berarti mengembalikan alamat bawaan pabrik yang tertulis di label perangkat.',
      'Perubahan MAC bisa membuat link putus sesaat, karena perangkat di ujung lain harus mempelajari ulang alamatnya lewat ARP.',
      'ISP yang mengunci layanan ke alamat MAC akan menolak koneksi bila MAC berubah. Itulah gunanya kolom pengecualian: lewati interface WAN bila ISP-mu memakai penguncian seperti itu.',
      'Catat alamat MAC sekarang sebelum menjalankan script ini. Bila ternyata layanan menuntut MAC lama, kamu butuh alamat itu untuk mengembalikannya manual.'
    ];
  }));

TOOLS.push(T('setup-romon', 'dasar', 'Setup RoMON', 'Setup RoMON',
  'Nyalakan RoMON (Router Management Overlay Network) supaya router ini bisa ditemukan dan dikelola lewat MAC dari segmen lain, lengkap dengan secret dan ID.',
  [
    f('aktif', 'Nyalakan RoMON', 'check', true, { help: 'Bila dimatikan, router ini tidak lagi terlihat di daftar RoMON router lain.' }),
    f('secret', 'Secret RoMON (opsional)', 'text', '', { opt: 1, mono: 1, ph: 'rahasia-bersama', help: 'Kata sandi bersama antar router RoMON. Router dengan secret berbeda tidak saling terlihat. Kosongkan bila jaringanmu tertutup.' }),
    f('id', 'ID RoMON router ini (opsional)', 'text', '', { opt: 1, mono: 1, ph: 'Router-Utama', help: 'Nama yang tampil di daftar RoMON. Kosongkan untuk memakai identitas router.' })
  ],
  function (v) {
    var L = [];
    L.push('/tool romon set enabled=' + (v.aktif ? 'yes' : 'no'));
    if (v.secret) { L.push('/tool romon set secrets=' + q(v.secret)); }
    if (v.id) { L.push('/tool romon set id=' + q(v.id)); }
    return H('Setup RoMON') + L.join('\n') + '\n';
  },
  function () {
    return [
      'RoMON membuat router-router MikroTik saling menemukan lewat alamat MAC, bahkan bila mereka berada di segmen jaringan yang berbeda dan tidak saling terjangkau lewat IP.',
      'Dengan RoMON aktif, kamu bisa membuka Winbox ke router tetangga lewat daftar RoMON, tanpa harus tahu alamat IP-nya. Ini sangat membantu saat alamat IP router lupa.',
      'Secret adalah kata sandi bersama: semua router yang ingin saling terlihat harus memakai secret yang sama. Router dengan secret berbeda tidak akan muncul di daftar satu sama lain.',
      'ID adalah nama yang tampil di daftar RoMON. Isi dengan nama yang mudah dikenali, misalnya nama lokasi router, supaya tidak tertukar dengan router lain.'
    ];
  }));

TOOLS.push(T('shutdown-reset-reboot', 'dasar', 'Shutdown, Reset, dan Reboot', 'Shutdown, Reset, and Reboot',
  'Matikan, nyalakan ulang, atau reset router ke setelan pabrik. Terminal akan meminta konfirmasi sebelum perintah dijalankan, jadi kamu tetap punya kesempatan membatalkan.',
  [
    f('aksi', 'Aksi', 'select', 'reboot', { opts: [{ v: 'reboot', l: 'Reboot: nyalakan ulang router' }, { v: 'shutdown', l: 'Shutdown: matikan router' }, { v: 'reset', l: 'Reset: kembalikan ke setelan pabrik' }] }),
    f('tanpaDefault', 'Reset tanpa konfigurasi bawaan (no-defaults)', 'check', false, { help: 'Dipakai bila aksi di atas "Reset". Router kembali benar-benar kosong, tanpa alamat IP bawaan 192.168.88.1.' }),
    f('tanpaBackup', 'Reset tanpa membuat backup otomatis (skip-backup)', 'check', false, { help: 'Dipakai bila aksi di atas "Reset". Tanpa ini, RouterOS menyimpan backup otomatis sebelum mereset.' }),
    f('simpanUser', 'Reset tetap mempertahankan pengguna (keep-users)', 'check', true, { help: 'Dipakai bila aksi di atas "Reset". Nama dan password admin lama tetap bisa dipakai setelah reset.' })
  ],
  function (v) {
    if (v.aksi === 'reboot') { return H('Shutdown, Reset, dan Reboot') + '/system reboot\n'; }
    if (v.aksi === 'shutdown') { return H('Shutdown, Reset, dan Reboot') + '/system shutdown\n'; }
    var s = '/system reset-configuration';
    if (v.tanpaDefault) { s += ' no-defaults=yes'; }
    if (v.tanpaBackup) { s += ' skip-backup=yes'; }
    if (v.simpanUser) { s += ' keep-users=yes'; }
    return H('Shutdown, Reset, dan Reboot') + s + '\n';
  },
  function () {
    return [
      'Reboot mematikan router sesaat lalu menyalakannya lagi dengan konfigurasi yang sama. Semua koneksi putus sebentar dan tersambung lagi setelah router siap.',
      'Shutdown mematikan router sampai dinyalakan manual lewat tombol power. Jangan pilih ini untuk router jauh yang tidak ada orang di dekatnya.',
      'Reset menghapus seluruh konfigurasi dan mengembalikan router ke setelan pabrik. Tanpa no-defaults, router kembali dengan alamat IP bawaan 192.168.88.1 dan tanpa password.',
      'Opsi keep-users mempertahankan akun admin lama, jadi kamu tetap bisa login dengan password yang sama setelah reset. Tanpa opsi ini, login memakai admin tanpa password.',
      'Terminal RouterOS selalu meminta konfirmasi untuk ketiga aksi ini. Baca lagi pilihanmu saat konfirmasi muncul, karena reset tidak bisa dibatalkan setelah berjalan.'
    ];
  }));

TOOLS.push(T('system-note', 'dasar', 'System Note Terminal', 'System Note Terminal',
  'Pasang catatan yang muncul di terminal setiap kali admin login ke router. Cocok untuk pengumuman, peringatan, atau info kontak pengelola.',
  [
    f('catatan', 'Isi catatan', 'textarea', 'Selamat datang di router ini.\nHubungi admin bila ada gangguan.', { mono: 1, help: 'Tulis singkat dan jelas. Baris baru tetap tampil sebagai baris baru di terminal.' }),
    f('login', 'Tampilkan saat login', 'check', true),
    f('reboot', 'Tampilkan juga setiap router reboot', 'check', false)
  ],
  function (v) {
    var isi = q(v.catatan).replace(/\n/g, '\\n');
    var L = [];
    L.push('/system note set show-at-login=' + (v.login ? 'yes' : 'no') + ' show-at-reboot=' + (v.reboot ? 'yes' : 'no'));
    if (v.catatan) { L.push('/system note set note=' + isi); }
    return H('System Note Terminal') + L.join('\n') + '\n';
  },
  function () {
    return [
      'System note adalah pesan yang tampil di terminal begitu admin login, sebelum prompt perintah muncul. Semua admin yang login akan membaca pesan yang sama.',
      'Pakai catatan untuk hal yang wajib dibaca: peringatan jangan mengubah setelan tertentu, nomor kontak pengelola, atau jadwal maintenance berikutnya.',
      'Opsi tampil saat reboot membuat catatan muncul juga di log boot, sehingga jejaknya tetap ada walau tidak ada yang login setelah router menyala.',
      'Catatan yang terlalu panjang mengganggu karena menutupi layar terminal. Tulis maksimal dua sampai tiga baris, dan hapus catatan lama yang sudah tidak berlaku.'
    ];
  }));

TOOLS.push(T('traceroute-tool', 'dasar', 'Traceroute Tool', 'Traceroute Tool',
  'Lacak rute paket dari router ke satu tujuan: lihat tiap lompatan (hop) beserta waktunya, untuk mencari di mana paket tersendat atau hilang.',
  [
    f('target1', 'Target pertama (IP atau nama host)', 'text', '8.8.8.8', { mono: 1 }),
    f('target2', 'Target kedua (opsional)', 'text', '', { opt: 1, mono: 1, ph: '1.1.1.1' }),
    f('maxhop', 'Jumlah hop maksimum', 'number', 30, { v: 'num', min: 1, max: 255 }),
    f('protokol', 'Protokol', 'select', 'icmp', { opts: [{ v: 'icmp', l: 'ICMP (bawaan)' }, { v: 'udp', l: 'UDP' }, { v: 'tcp', l: 'TCP' }] }),
    f('dns', 'Tampilkan nama host tiap hop (use-dns)', 'check', true)
  ],
  function (v) {
    function baris(t) {
      return '/tool traceroute ' + t + ' max-hops=' + v.maxhop + ' protocol=' + v.protokol + ' use-dns=' + (v.dns ? 'yes' : 'no');
    }
    var L = [];
    L.push(baris(v.target1));
    if (v.target2) { L.push(baris(v.target2)); }
    return H('Traceroute Tool') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Traceroute mengirim paket dengan batas hop yang naik satu per satu. Tiap router di jalan membalas saat paketnya kedaluwarsa, sehingga kamu melihat daftar lengkap perjalanan paket.',
      'Bintang (*) pada satu hop berarti router itu tidak membalas, bukan berarti paket hilang. Banyak router sengaja tidak membalas traceroute, jadi baca bintang sebagai "tidak menjawab", bukan "rusak".',
      'Waktu yang melonjak tiba-tiba di satu hop menunjukkan di mana kemacetan mulai terjadi. Bila lonjakan muncul di hop pertama, masalahnya ada di jaringan lokalmu.',
      'Protokol UDP dan TCP berguna bila ICMP diblokir di tengah jalan. Hasil ketiganya boleh berbeda, karena tiap protokol bisa menempuh jalur yang berbeda di internet.'
    ];
  }));


TOOLS.push(T('konfigurasi-dasar', 'dasar', 'Konfigurasi Dasar (Satu Script Awal)', 'Basic Configuration Script Generator',
  'Satu script awal untuk router baru: identitas, alamat LAN, DHCP server, DNS, NTP, rute default, NAT, dan pengaman dasar.',
  [
    f('nama', 'Nama identitas router', 'text', 'Router-Utama', { mono: 1 }),
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('cidr', 'Alamat IP LAN beserta prefix', 'cidr', '192.168.88.1/24', { v: 'cidr' }),
    f('wan', 'Interface WAN', 'text', 'ether1', { mono: 1 }),
    f('gw', 'Gateway WAN', 'ip', '192.168.1.1', { v: 'ip' }),
    f('from', 'Awal pool DHCP', 'ip', '192.168.88.10', { v: 'ip' }),
    f('to', 'Akhir pool DHCP', 'ip', '192.168.88.254', { v: 'ip' }),
    f('dhcp', 'Nyalakan DHCP server untuk LAN', 'check', true),
    f('dns', 'Server DNS', 'text', '8.8.8.8,1.1.1.1', { mono: 1, help: 'Pisahkan dengan koma bila lebih dari satu.' }),
    f('nat', 'Nyalakan NAT masquerade keluar WAN', 'check', true),
    f('pass', 'Password admin baru (opsional)', 'text', '', { mono: 1, help: 'Bila diisi, password pengguna admin diubah ke nilai ini. Bila kosong, baris password dilewati.' }),
    f('layanan', 'Matikan layanan lama (Telnet, FTP, WWW, API)', 'check', false)
  ],
  function (v) {
    var L = [];
    L.push('/system identity set name=' + v.nama);
    L.push('/ip address add address=' + v.cidr + ' interface=' + v.lan + ' comment="Gateway LAN"');
    if (v.dhcp) {
      L.push('# DHCP server untuk LAN');
      L.push('/ip pool add name=pool-lan ranges=' + v.from + '-' + v.to);
      L.push('/ip dhcp-server network add address=' + netPart(v.cidr) + '/' + prefixPart(v.cidr) + ' gateway=' + ipPart(v.cidr) + ' dns-server=' + v.dns);
      L.push('/ip dhcp-server add name=dhcp-lan interface=' + v.lan + ' address-pool=pool-lan disabled=no');
    }
    L.push('/ip dns set servers=' + v.dns + ' allow-remote-requests=yes');
    L.push('/system ntp client set enabled=yes');
    L.push('/system ntp client servers add address=id.pool.ntp.org');
    L.push('/ip route add gateway=' + v.gw + ' comment="Rute default lewat ' + v.wan + '"');
    if (v.nat) { L.push('/ip firewall nat add chain=srcnat out-interface=' + v.wan + ' action=masquerade comment="NAT keluar ' + v.wan + '"'); }
    if (v.pass) { L.push('/user set admin password=' + q(v.pass)); }
    if (v.layanan) { L.push('/ip service disable telnet,ftp,www,api,api-ssl'); }
    return H('Konfigurasi Dasar (Satu Script Awal)') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Script ini adalah titik awal router baru: satu alamat LAN, DHCP server, DNS, jam NTP, rute default, dan NAT keluar WAN dalam satu kali tempel.',
      'Gateway pada jaringan DHCP diambil dari alamat IP LAN yang kamu isi, jadi perangkat LAN otomatis memakai router sebagai gateway.',
      'NTP memakai id.pool.ntp.org agar jam router selalu akurat. Scheduler dan log mengikuti jam ini.',
      'Bila password admin diisi, catat dulu password barunya di tempat aman sebelum menjalankan script, karena akses admin lama langsung berubah.',
      'Setelah script jalan, periksa dengan perintah /ip address print dan /ip dhcp-server print sebelum menyambungkan perangkat lain.'
    ];
  }));

/* ================= Kategori: Routing ================= */

TOOLS.push(T('static-route', 'routing', 'Rute Statis', 'Static Route',
  'Arahkan trafik menuju satu jaringan tujuan lewat gateway tertentu.',
  [
    f('dst', 'Jaringan tujuan (CIDR)', 'cidr', '192.168.99.0/24', { v: 'cidr' }),
    f('gw', 'Gateway (next hop)', 'ip', '192.168.88.2', { v: 'ip' }),
    f('jarak', 'Distance', 'number', '1', { v: 'num', min: 1, max: 255 }),
    f('cek', 'Cek gateway', 'select', 'ping', { opts: [{ v: 'ping', l: 'Ping (rute mati bila gateway putus)' }, { v: 'none', l: 'Tidak dicek' }] }),
    f('komen', 'Komentar', 'text', '', { opt: 1, ph: 'Menuju jaringan gudang' })
  ],
  function (v) {
    var s = '/ip route add dst-address=' + v.dst + ' gateway=' + v.gw + ' distance=' + v.jarak;
    if (v.cek === 'ping') { s += ' check-gateway=ping'; }
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('Rute Statis') + s + '\n';
  },
  function () {
    return [
      'Router meneruskan paket menuju jaringan tujuan ke gateway yang kamu tulis.',
      'Dengan cek gateway ping, rute otomatis dianggap mati bila gateway tidak menjawab, sehingga rute cadangan bisa mengambil alih.',
      'Distance lebih kecil lebih diprioritaskan bila ada rute lain ke tujuan yang sama.'
    ];
  }));

TOOLS.push(T('failover-recursive', 'routing', 'Failover Recursive 2 WAN', 'Recursive Failover, 2 WAN',
  'Dua jalur internet saling menggantikan. Kesehatan jalur dicek lewat DNS publik dengan teknik recursive routing.',
  [
    f('if1', 'Interface WAN 1 (utama)', 'text', 'ether1', { mono: 1 }),
    f('gw1', 'Gateway WAN 1', 'ip', '192.168.1.1', { v: 'ip' }),
    f('if2', 'Interface WAN 2 (cadangan)', 'text', 'ether2', { mono: 1 }),
    f('gw2', 'Gateway WAN 2', 'ip', '192.168.2.1', { v: 'ip' }),
    f('cek1', 'Target cek jalur 1', 'ip', '8.8.8.8', { v: 'ip', help: 'Host internet yang stabil, dipakai sebagai saksi kesehatan jalur 1.' }),
    f('cek2', 'Target cek jalur 2', 'ip', '1.1.1.1', { v: 'ip' })
  ],
  function (v) {
    var L = [];
    L.push('# Langkah 1: kunci target cek ke jalurnya masing masing');
    L.push('/ip route add dst-address=' + v.cek1 + '/32 gateway=' + v.gw1 + ' scope=10 comment="Saksi WAN1"');
    L.push('/ip route add dst-address=' + v.cek2 + '/32 gateway=' + v.gw2 + ' scope=10 comment="Saksi WAN2"');
    L.push('# Langkah 2: gateway semu yang hidupnya tergantung saksi');
    L.push('/ip route add dst-address=10.1.1.1/32 gateway=' + v.cek1 + ' scope=10 target-scope=10 comment="Gateway semu WAN1"');
    L.push('/ip route add dst-address=10.2.2.2/32 gateway=' + v.cek2 + ' scope=10 target-scope=10 comment="Gateway semu WAN2"');
    L.push('# Langkah 3: rute default lewat gateway semu');
    L.push('/ip route add gateway=10.1.1.1 check-gateway=ping distance=1 comment="Default lewat WAN1"');
    L.push('/ip route add gateway=10.2.2.2 check-gateway=ping distance=2 comment="Default lewat WAN2"');
    L.push('# Langkah 4: NAT keluar untuk kedua WAN');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.if1 + ' action=masquerade comment="NAT WAN1"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.if2 + ' action=masquerade comment="NAT WAN2"');
    return H('Failover Recursive 2 WAN') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Masalah failover biasa: gateway modem selalu menjawab ping walau internet di belakangnya putus. Teknik recursive menyelesaikan ini.',
      'Setiap jalur punya saksi berupa host internet nyata. Saksi hanya bisa dicapai lewat jalurnya sendiri.',
      'Gateway semu 10.1.1.1 dan 10.2.2.2 hidup selama saksinya terjangkau. Bila saksi jalur 1 hilang, rute default jalur 1 mati dan trafik pindah ke jalur 2 secara otomatis.',
      'Distance 1 dan 2 menentukan urutan: WAN 1 utama, WAN 2 cadangan.'
    ];
  }));

TOOLS.push(T('lb-pcc', 'routing', 'Load Balancing PCC', 'PCC Load Balancing',
  'Sebar koneksi dari LAN ke beberapa WAN memakai Per Connection Classifier agar tiap koneksi konsisten lewat satu jalur.',
  [
    f('lan', 'Interface LAN', 'text', 'ether5', { mono: 1 }),
    f('jumlah', 'Jumlah WAN', 'select', '2', { opts: ['2', '3'] }),
    f('klas', 'Klasifikasi koneksi', 'select', 'both-addresses-and-ports', { opts: ['both-addresses-and-ports', 'both-addresses', 'src-address', 'src-address-and-port', 'dst-address-and-port'] }),
    f('w1', 'Interface WAN 1', 'text', 'ether1', { mono: 1 }),
    f('g1', 'Gateway WAN 1', 'ip', '192.168.1.1', { v: 'ip' }),
    f('w2', 'Interface WAN 2', 'text', 'ether2', { mono: 1 }),
    f('g2', 'Gateway WAN 2', 'ip', '192.168.2.1', { v: 'ip' }),
    f('w3', 'Interface WAN 3', 'text', 'ether3', { mono: 1, help: 'Hanya dipakai bila jumlah WAN = 3.' }),
    f('g3', 'Gateway WAN 3', 'ip', '192.168.3.1', { v: 'ip', opt: 1 })
  ],
  function (v) {
    var n = parseInt(v.jumlah, 10);
    var wans = [
      { iface: v.w1, gw: v.g1 },
      { iface: v.w2, gw: v.g2 },
      { iface: v.w3, gw: v.g3 }
    ].slice(0, n);
    var L = [];
    L.push('# Tabel routing khusus untuk tiap WAN');
    wans.forEach(function (w, i) { L.push('/routing table add name=to-wan' + (i + 1) + ' fib'); });
    L.push('# Tandai koneksi yang masuk dari tiap WAN agar jawabannya pulang lewat jalur yang sama');
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=input in-interface=' + w.iface + ' action=mark-connection new-connection-mark=wan' + (i + 1) + '-conn passthrough=yes');
    });
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=output connection-mark=wan' + (i + 1) + '-conn action=mark-routing new-routing-mark=to-wan' + (i + 1) + ' passthrough=no');
    });
    L.push('# Bagi koneksi baru dari LAN dengan PCC');
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' dst-address-type=!local per-connection-classifier=' + v.klas + ':' + n + '/' + i + ' action=mark-connection new-connection-mark=wan' + (i + 1) + '-conn passthrough=yes');
    });
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' connection-mark=wan' + (i + 1) + '-conn action=mark-routing new-routing-mark=to-wan' + (i + 1) + ' passthrough=no');
    });
    L.push('# Rute untuk tiap tabel dan rute default utama');
    wans.forEach(function (w, i) {
      L.push('/ip route add gateway=' + w.gw + ' routing-table=to-wan' + (i + 1) + ' check-gateway=ping comment="Rute tabel WAN' + (i + 1) + '"');
      L.push('/ip route add gateway=' + w.gw + ' distance=' + (i + 1) + ' check-gateway=ping comment="Default utama WAN' + (i + 1) + '"');
    });
    L.push('# NAT keluar untuk semua WAN');
    wans.forEach(function (w, i) {
      L.push('/ip firewall nat add chain=srcnat out-interface=' + w.iface + ' action=masquerade comment="NAT WAN' + (i + 1) + '"');
    });
    return H('Load Balancing PCC') + L.join('\n') + '\n';
  },
  function () {
    return [
      'PCC menghash alamat dan port koneksi, lalu hasilnya dibagi rata ke semua WAN. Satu koneksi selalu lewat satu jalur, jadi sesi login dan perbankan tidak putus.',
      'Tanda koneksi dari arah input memastikan jawaban dari internet pulang lewat WAN tempat koneksi itu lahir.',
      'Setiap WAN punya tabel routing sendiri (to-wan1, to-wan2, dan seterusnya) sesuai cara RouterOS v7 memisahkan rute bertanda.',
      'Ini bukan menggabungkan kecepatan dalam satu unduhan, melainkan menyebar banyak koneksi ke banyak jalur.'
    ];
  }));

TOOLS.push(T('lb-ecmp', 'routing', 'Load Balancing ECMP', 'ECMP Load Balancing',
  'Cara paling sederhana menyebar trafik ke dua gateway sekaligus memakai rute berkaki banyak (equal cost multi path).',
  [
    f('lan', 'Interface LAN', 'text', 'ether5', { mono: 1 }),
    f('w1', 'Interface WAN 1', 'text', 'ether1', { mono: 1 }),
    f('g1', 'Gateway WAN 1', 'ip', '192.168.1.1', { v: 'ip' }),
    f('w2', 'Interface WAN 2', 'text', 'ether2', { mono: 1 }),
    f('g2', 'Gateway WAN 2', 'ip', '192.168.2.1', { v: 'ip' })
  ],
  function (v) {
    var L = [];
    L.push('# Tandai koneksi masuk dari tiap WAN agar jawaban pulang lewat jalur asal');
    L.push('/ip firewall mangle add chain=input in-interface=' + v.w1 + ' action=mark-connection new-connection-mark=wan1-conn passthrough=yes');
    L.push('/ip firewall mangle add chain=input in-interface=' + v.w2 + ' action=mark-connection new-connection-mark=wan2-conn passthrough=yes');
    L.push('/ip firewall mangle add chain=output connection-mark=wan1-conn action=mark-routing new-routing-mark=to-wan1 passthrough=no');
    L.push('/ip firewall mangle add chain=output connection-mark=wan2-conn action=mark-routing new-routing-mark=to-wan2 passthrough=no');
    L.push('/routing table add name=to-wan1 fib');
    L.push('/routing table add name=to-wan2 fib');
    L.push('/ip route add gateway=' + v.g1 + ' routing-table=to-wan1 check-gateway=ping');
    L.push('/ip route add gateway=' + v.g2 + ' routing-table=to-wan2 check-gateway=ping');
    L.push('# Rute default ECMP: dua gateway dalam satu rute');
    L.push('/ip route add gateway=' + v.g1 + ',' + v.g2 + ' check-gateway=ping distance=1 comment="Default ECMP"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.w1 + ' action=masquerade');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.w2 + ' action=masquerade');
    return H('Load Balancing ECMP') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Satu rute dengan dua gateway membuat kernel membagi arus paket ke kedua jalur secara bergantian.',
      'ECMP lebih sederhana dari PCC tetapi pembagiannya per arus paket, jadi untuk kebutuhan yang peka urutan paket, PCC biasanya terasa lebih rapi.',
      'Aturan mangle di atas menjaga koneksi yang dimulai dari internet, misalnya port forwarding, agar jawabannya tidak pulang lewat jalur yang salah.'
    ];
  }));

TOOLS.push(T('policy-sosmed', 'routing', 'Policy Routing Aplikasi Populer', 'Policy Routing for Popular Apps',
  'Lewatkan trafik YouTube, TikTok, Facebook, dan WhatsApp ke satu WAN khusus, trafik lain tetap di jalur utama.',
  [
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('gw', 'Gateway WAN khusus aplikasi', 'ip', '192.168.2.1', { v: 'ip' }),
    f('yt', 'YouTube', 'check', true),
    f('tt', 'TikTok', 'check', true),
    f('fb', 'Facebook dan Instagram', 'check', false),
    f('wa', 'WhatsApp', 'check', false)
  ],
  function (v) {
    var apps = [];
    if (v.yt) { apps.push({ nama: 'YouTube', list: 'aplikasi-yt', domain: ['youtube.com', 'googlevideo.com', 'ytimg.com', 'ggpht.com'] }); }
    if (v.tt) { apps.push({ nama: 'TikTok', list: 'aplikasi-tt', domain: ['tiktok.com', 'tiktokcdn.com', 'ibytedtos.com'] }); }
    if (v.fb) { apps.push({ nama: 'Facebook', list: 'aplikasi-fb', domain: ['facebook.com', 'fbcdn.net', 'instagram.com', 'cdninstagram.com'] }); }
    if (v.wa) { apps.push({ nama: 'WhatsApp', list: 'aplikasi-wa', domain: ['whatsapp.com', 'whatsapp.net'] }); }
    var L = [];
    L.push('/routing table add name=rute-aplikasi fib');
    apps.forEach(function (a) {
      L.push('# Domain ' + a.nama);
      a.domain.forEach(function (d) { L.push('/ip firewall address-list add list=' + a.list + ' address=' + d + ' comment=' + q(a.nama)); });
    });
    apps.forEach(function (a) {
      L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' dst-address-list=' + a.list + ' action=mark-routing new-routing-mark=rute-aplikasi passthrough=no comment=' + q('Lewatkan ' + a.nama));
    });
    L.push('/ip route add gateway=' + v.gw + ' routing-table=rute-aplikasi comment="Keluar WAN khusus aplikasi"');
    return H('Policy Routing Aplikasi Populer') + L.join('\n') + '\n';
  },
  function () {
    return [
      'RouterOS bisa mengenali domain dalam address list dan menyelesaikan alamat IP nya secara berkala dari DNS.',
      'Paket dari LAN yang tujuannya masuk daftar aplikasi ditandai, lalu diteruskan ke tabel routing khusus yang keluar lewat gateway pilihanmu.',
      'Trafik selain aplikasi terpilih tidak tersentuh aturan ini dan tetap memakai rute default biasa.',
      'Daftar domain aplikasi berubah dari waktu ke waktu. Bila ada layanan yang lolos, tambahkan domain barunya ke address list yang sama.'
    ];
  }));

TOOLS.push(T('ospf-dasar', 'routing', 'OSPF Dasar', 'Basic OSPF',
  'Nyalakan OSPF agar router saling bertukar rute otomatis dalam satu area backbone.',
  [
    f('nama', 'Nama instance', 'text', 'ospf-utama', { mono: 1 }),
    f('rid', 'Router ID', 'ip', '1.1.1.1', { v: 'ip', help: 'Identitas unik router ini di mata OSPF. Bentuknya seperti alamat IP dan wajib berbeda di tiap router.' }),
    f('area', 'Area ID', 'text', '0.0.0.0', { mono: 1 }),
    f('net', 'Jaringan yang diumumkan (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr' }),
    f('redist', 'Umumkan juga jaringan yang terhubung langsung', 'check', false)
  ],
  function (v) {
    return H('OSPF Dasar') +
      '/routing ospf instance add name=' + v.nama + ' router-id=' + v.rid + (v.redist ? ' redistribute=connected' : '') + '\n' +
      '/routing ospf area add instance=' + v.nama + ' name=area-utama area-id=' + v.area + '\n' +
      '/routing ospf interface-template add area=area-utama networks=' + v.net + '\n';
  },
  function () {
    return [
      'Instance adalah proses OSPF di router ini, dikenali tetangganya lewat Router ID.',
      'Area 0.0.0.0 adalah backbone. Semua router yang bertetangga harus berada di area yang sama untuk bertukar rute.',
      'Interface template menentukan jaringan mana saja yang diumumkan ke tetangga.',
      'Setelah script ini jalan di dua router bertetangga, periksa hasilnya dengan perintah /routing ospf neighbor print.'
    ];
  }));

TOOLS.push(T('bgp-dasar', 'routing', 'BGP Dasar (eBGP)', 'Basic BGP (eBGP)',
  'Bangun sesi eBGP sederhana ke router tetangga, misalnya ke ISP atau antar gedung, dan umumkan satu prefix milikmu.',
  [
    f('as', 'Nomor AS lokal', 'number', '65001', { v: 'num', min: 1, max: 4294967295 }),
    f('rid', 'Router ID', 'ip', '1.1.1.1', { v: 'ip' }),
    f('peer', 'Alamat IP peer', 'ip', '203.0.113.1', { v: 'ip', help: '203.0.113.1 adalah contoh dari blok dokumentasi resmi (TEST-NET-3). Ganti dengan IP peer aslimu.' }),
    f('asr', 'Nomor AS peer', 'number', '65002', { v: 'num', min: 1, max: 4294967295 }),
    f('prefix', 'Prefix yang diumumkan (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr', opt: 1, help: 'Kosongkan bila belum mau mengumumkan prefix apa pun.' })
  ],
  function (v) {
    var L = [];
    if (v.prefix) {
      L.push('/routing filter rule add chain=bgp-keluar rule="if (dst in ' + v.prefix + ') { accept }" comment="Hanya umumkan prefix sendiri"');
      L.push('/routing filter rule add chain=bgp-keluar rule="reject" comment="Tolak sisanya"');
    }
    L.push('/routing bgp instance add name=instansi-lokal as=' + v.as + ' router-id=' + v.rid);
    var conn = '/routing bgp connection add name=peer-tetangga instance=instansi-lokal as=' + v.as +
      ' remote.address=' + v.peer + '/32 remote.as=' + v.asr + ' local.role=ebgp connect=yes listen=yes';
    if (v.prefix) { conn += ' output.filter-chain=bgp-keluar'; }
    L.push(conn);
    return H('BGP Dasar (eBGP)') + L.join('\n') + '\n';
  },
  function () {
    return [
      'BGP adalah protokol yang dipakai antar jaringan besar untuk bertukar jangkauan alamat IP.',
      'Filter keluar memastikan kamu hanya mengumumkan prefix milikmu sendiri. Tanpa filter, kesalahan umum adalah ikut meneruskan prefix orang lain.',
      'Sesi baru terbentuk bila router seberang juga mengarah ke IP routermu dengan nomor AS yang sesuai.',
      'Periksa status sesi dengan perintah /routing bgp session print.'
    ];
  }));

TOOLS.push(T('vrrp', 'routing', 'VRRP (Gateway Cadangan)', 'VRRP (Redundant Gateway)',
  'Dua router berbagi satu alamat gateway virtual. Bila yang utama mati, cadangan mengambil alih alamat itu.',
  [
    f('iface', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('vrid', 'VRID (ID grup)', 'number', '1', { v: 'num', min: 1, max: 255, help: 'Harus sama di kedua router pasangan.' }),
    f('prio', 'Prioritas router ini', 'number', '100', { v: 'num', min: 1, max: 254, help: 'Angka lebih besar menang. Beri 200 untuk master, 100 untuk cadangan.' }),
    f('vip', 'Alamat IP virtual (gateway bersama)', 'cidr', '192.168.88.254/24', { v: 'cidr' }),
    f('preempt', 'Ambil alih lagi setelah master pulih (preemption)', 'check', true)
  ],
  function (v) {
    return H('VRRP (Gateway Cadangan)') +
      '/interface vrrp add name=vrrp-utama interface=' + v.iface + ' vrid=' + v.vrid + ' priority=' + v.prio +
      ' preemption-mode=' + (v.preempt ? 'yes' : 'no') + '\n' +
      '/ip address add address=' + v.vip + ' interface=vrrp-utama comment="Gateway virtual bersama"\n';
  },
  function () {
    return [
      'Jalankan script ini di kedua router dengan VRID dan alamat virtual yang sama, bedakan hanya prioritasnya.',
      'Perangkat LAN cukup memakai alamat virtual sebagai gateway. Mereka tidak perlu tahu router mana yang sedang bertugas.',
      'Bila master mati, cadangan dengan prioritas tertinggi mengambil alih alamat virtual dalam hitungan detik.',
      'Alamat asli tiap router tetap berbeda, misalnya .1 dan .2, sedangkan alamat virtual adalah alamat ketiga yang berpindah.'
    ];
  }));

TOOLS.push(T('lb-pcc-multiwan', 'routing', 'Load Balancing PCC 3 sampai 5 WAN', 'PCC Load Balancing, 3 to 5 WANs',
  'Sebar koneksi LAN ke tiga sampai lima jalur internet sekaligus dengan PCC, lengkap dengan failover bertingkat bila satu jalur putus.',
  [
    f('lan', 'Interface LAN', 'text', 'bridge-lan', { mono: 1, help: 'Interface arah jaringan lokal, contoh bridge-lan atau ether6. Hindari memakai ether1 sampai ether5 bila kelimanya dipakai WAN.' }),
    f('jumlah', 'Jumlah WAN yang dipakai', 'select', '3', { opts: ['3', '4', '5'], help: 'Kolom WAN di luar jumlah ini diabaikan.' }),
    f('klas', 'Klasifikasi koneksi', 'select', 'both-addresses-and-ports', { opts: ['both-addresses-and-ports', 'both-addresses', 'src-address', 'src-address-and-port', 'dst-address-and-port'] }),
    f('w1', 'Interface WAN 1', 'text', 'ether1', { mono: 1 }),
    f('g1', 'Gateway WAN 1', 'ip', '192.168.1.1', { v: 'ip' }),
    f('w2', 'Interface WAN 2', 'text', 'ether2', { mono: 1 }),
    f('g2', 'Gateway WAN 2', 'ip', '192.168.2.1', { v: 'ip' }),
    f('w3', 'Interface WAN 3', 'text', 'ether3', { mono: 1 }),
    f('g3', 'Gateway WAN 3', 'ip', '192.168.3.1', { v: 'ip' }),
    f('w4', 'Interface WAN 4', 'text', 'ether4', { mono: 1, opt: 1, help: 'Hanya dipakai bila jumlah WAN 4 atau 5.' }),
    f('g4', 'Gateway WAN 4', 'ip', '192.168.4.1', { v: 'ip', opt: 1 }),
    f('w5', 'Interface WAN 5', 'text', 'ether5', { mono: 1, opt: 1, help: 'Hanya dipakai bila jumlah WAN 5.' }),
    f('g5', 'Gateway WAN 5', 'ip', '192.168.5.1', { v: 'ip', opt: 1 })
  ],
  function (v) {
    var n = parseInt(v.jumlah, 10);
    var semua = [
      { iface: v.w1, gw: v.g1 },
      { iface: v.w2, gw: v.g2 },
      { iface: v.w3, gw: v.g3 },
      { iface: v.w4, gw: v.g4 },
      { iface: v.w5, gw: v.g5 }
    ].slice(0, n);
    var wans = semua.filter(function (w) { return w.iface && w.gw; });
    var total = wans.length;
    var L = [];
    L.push('# WAN aktif pada script ini: ' + total + ' jalur');
    L.push('# Tabel routing khusus untuk tiap WAN');
    wans.forEach(function (w, i) { L.push('/routing table add name=ke-wan' + (i + 1) + ' fib'); });
    L.push('# Tandai koneksi yang masuk dari tiap WAN agar jawabannya pulang lewat jalur yang sama');
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=input in-interface=' + w.iface + ' action=mark-connection new-connection-mark=wan' + (i + 1) + '-conn passthrough=yes');
    });
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=output connection-mark=wan' + (i + 1) + '-conn action=mark-routing new-routing-mark=ke-wan' + (i + 1) + ' passthrough=no');
    });
    L.push('# Bagi koneksi baru dari LAN dengan PCC, ' + total + ' jalur');
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' dst-address-type=!local per-connection-classifier=' + v.klas + ':' + total + '/' + i + ' action=mark-connection new-connection-mark=wan' + (i + 1) + '-conn passthrough=yes');
    });
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' connection-mark=wan' + (i + 1) + '-conn action=mark-routing new-routing-mark=ke-wan' + (i + 1) + ' passthrough=no');
    });
    L.push('# Rute tiap tabel, lalu rute default utama dengan distance bertingkat untuk failover');
    wans.forEach(function (w, i) {
      L.push('/ip route add gateway=' + w.gw + ' routing-table=ke-wan' + (i + 1) + ' check-gateway=ping comment="Rute tabel WAN' + (i + 1) + '"');
      L.push('/ip route add gateway=' + w.gw + ' distance=' + (i + 1) + ' check-gateway=ping comment="Default cadangan tingkat ' + (i + 1) + '"');
    });
    L.push('# NAT keluar untuk semua WAN');
    wans.forEach(function (w, i) {
      L.push('/ip firewall nat add chain=srcnat out-interface=' + w.iface + ' action=masquerade comment="NAT WAN' + (i + 1) + '"');
    });
    return H('Load Balancing PCC 3 sampai 5 WAN') + L.join('\n') + '\n';
  },
  function () {
    return [
      'PCC menghash alamat dan port tiap koneksi baru, lalu membaginya ke semua WAN yang aktif. Satu koneksi menempel pada satu jalur sampai selesai, jadi sesi login tidak meloncat jalur.',
      'Failover datang dari dua lapis: check-gateway=ping mematikan rute yang gateway-nya tidak menjawab, dan distance bertingkat membuat WAN berikutnya mengambil alih peran default.',
      'Kolom WAN yang gateway-nya kosong akan dilewati. Baris komentar pertama di script menyebut berapa jalur yang benar benar aktif, cocokkan dengan rencanamu.',
      'Seperti PCC pada umumnya, ini menyebar banyak koneksi, bukan menggabungkan kecepatan banyak WAN menjadi satu unduhan.'
    ];
  }));

TOOLS.push(T('vlan-gedung', 'routing', 'VLAN per Gedung (Segmentasi Sekolah dan Kantor)', 'VLANs per Building (School and Office Segmentation)',
  'Pecah satu jaringan fisik menjadi beberapa VLAN terpisah, misalnya Guru, Siswa, CCTV, dan Tamu, masing masing dengan gateway, DHCP, dan pilihan isolasi antar VLAN.',
  [
    f('trunk', 'Interface trunk ke switch', 'text', 'ether2', { mono: 1, help: 'Port yang menuju switch manageable. Semua VLAN lewat port ini dalam keadaan tagged.' }),
    f('bridge', 'Nama bridge VLAN', 'text', 'bridge-gedung', { mono: 1 }),
    f('daftar', 'Daftar VLAN', 'textarea', '10,Guru,192.168.10.0/24\n20,Siswa,192.168.20.0/24\n30,CCTV,192.168.30.0/24\n40,Tamu,192.168.40.0/24', { mono: 1, help: 'Satu VLAN per baris dengan format id,nama,subnet. Subnet ditulis sebagai alamat jaringan, contoh 192.168.20.0/24. Gateway otomatis memakai alamat pertama subnet (akhiran .1 pada /24). Baris yang formatnya salah akan dilewati.' }),
    f('dhcp', 'Aktifkan DHCP server di tiap VLAN', 'check', true, { help: 'Pool dimulai dari alamat ke 10 sampai alamat terakhir yang bisa dipakai dalam subnet.' }),
    f('dns', 'Server DNS untuk semua VLAN', 'text', '8.8.8.8,1.1.1.1', { mono: 1 }),
    f('isolasi', 'Isolasi antar VLAN (blokir akses antar VLAN)', 'check', true, { help: 'Setiap VLAN tetap bisa ke internet, tetapi tidak bisa menjangkau VLAN lain. Cocok agar jaringan Siswa tidak bisa menyentuh CCTV atau perangkat Guru.' }),
    f('bebas', 'VLAN yang dikecualikan dari isolasi', 'text', '', { opt: 1, mono: 1, ph: 'Guru', help: 'Opsional. Tulis nama VLAN persis seperti di daftar, misalnya Guru, bila VLAN itu perlu menjangkau semua VLAN lain, contohnya untuk mengelola CCTV.' })
  ],
  function (v) {
    function cidrOk(s) {
      var p = String(s).split('/');
      if (p.length !== 2) { return false; }
      var o = p[0].split('.');
      if (o.length !== 4) { return false; }
      for (var i = 0; i < 4; i++) { if (!/^\d+$/.test(o[i]) || Number(o[i]) > 255) { return false; } }
      return /^\d+$/.test(p[1]) && Number(p[1]) >= 8 && Number(p[1]) <= 30;
    }
    function bersih(s) { return String(s).replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, ''); }
    var rows = [];
    String(v.daftar).split('\n').forEach(function (line) {
      var p = line.split(',').map(function (s) { return s.trim(); });
      if (p.length >= 3 && /^\d+$/.test(p[0]) && cidrOk(p[2])) {
        var nm = bersih(p[1]);
        rows.push({ id: p[0], nama: nm || ('VLAN' + p[0]), net: p[2] });
      }
    });
    if (!rows.length) {
      return H('VLAN per Gedung') + '# Daftar VLAN kosong atau formatnya salah.\n# Isi satu VLAN per baris dengan format id,nama,subnet, contoh: 10,Guru,192.168.10.0/24\n';
    }
    var B = v.bridge;
    var L = [];
    L.push('# Langkah 1: bridge dengan VLAN filtering');
    L.push('# Perhatian: begitu vlan-filtering aktif, port yang belum diatur VLAN-nya bisa kehilangan akses.');
    L.push('# Jalankan saat kamu bisa menjangkau router dari jalur lain, atau atur dari port yang tidak terdampak dulu.');
    L.push('/interface bridge add name=' + B + ' vlan-filtering=yes comment="Bridge VLAN gedung"');
    L.push('/interface bridge port add bridge=' + B + ' interface=' + v.trunk + ' comment="Trunk ke switch"');
    L.push('# Langkah 2: interface VLAN di atas bridge');
    rows.forEach(function (r) {
      L.push('/interface vlan add name=vlan' + r.id + '-' + r.nama + ' interface=' + B + ' vlan-id=' + r.id + ' comment="VLAN ' + r.nama + '"');
    });
    L.push('# Langkah 3: daftarkan VLAN pada bridge, trunk dan bridge itu sendiri bertanda tagged');
    rows.forEach(function (r) {
      L.push('/interface bridge vlan add bridge=' + B + ' tagged=' + B + ',' + v.trunk + ' vlan-ids=' + r.id);
    });
    L.push('# Langkah 4: gateway tiap VLAN');
    rows.forEach(function (r) {
      var gw = ipAdd(ipPart(r.net), 1);
      L.push('/ip address add address=' + gw + '/' + prefixPart(r.net) + ' interface=vlan' + r.id + '-' + r.nama + ' comment="Gateway VLAN ' + r.nama + '"');
    });
    if (v.dhcp) {
      L.push('# Langkah 5: DHCP server per VLAN');
      rows.forEach(function (r) {
        var pre = Number(prefixPart(r.net));
        var ukuran = Math.pow(2, 32 - pre);
        var dasar = Math.floor(ipToNum(ipPart(r.net)) / ukuran) * ukuran;
        var awal = numToIp(dasar + 10);
        var akhir = numToIp(dasar + ukuran - 2);
        var gw2 = ipAdd(ipPart(r.net), 1);
        L.push('/ip pool add name=pool-vlan' + r.id + ' ranges=' + awal + '-' + akhir);
        L.push('/ip dhcp-server add name=dhcp-vlan' + r.id + ' interface=vlan' + r.id + '-' + r.nama + ' address-pool=pool-vlan' + r.id + ' lease-time=1d disabled=no');
        L.push('/ip dhcp-server network add address=' + r.net + ' gateway=' + gw2 + ' dns-server=' + v.dns + ' comment="Jaringan VLAN ' + r.nama + '"');
      });
    }
    if (v.isolasi) {
      L.push('# Langkah 6: isolasi antar VLAN memakai daftar interface');
      L.push('/interface list add name=VLAN-GEDUNG comment="Semua interface VLAN gedung"');
      rows.forEach(function (r) {
        L.push('/interface list member add list=VLAN-GEDUNG interface=vlan' + r.id + '-' + r.nama);
      });
      var bebasRow = null;
      if (v.bebas) {
        var cari = bersih(v.bebas).toLowerCase();
        rows.forEach(function (r) { if (r.nama.toLowerCase() === cari) { bebasRow = r; } });
      }
      if (bebasRow) {
        L.push('/ip firewall filter add chain=forward in-interface=vlan' + bebasRow.id + '-' + bebasRow.nama + ' out-interface-list=VLAN-GEDUNG action=accept comment="VLAN ' + bebasRow.nama + ' boleh menjangkau VLAN lain"');
        L.push('/ip firewall filter add chain=forward in-interface-list=VLAN-GEDUNG out-interface=vlan' + bebasRow.id + '-' + bebasRow.nama + ' connection-state=established,related action=accept comment="Jawaban untuk VLAN ' + bebasRow.nama + '"');
      }
      L.push('/ip firewall filter add chain=forward in-interface-list=VLAN-GEDUNG out-interface-list=VLAN-GEDUNG action=drop comment="Isolasi antar VLAN"');
      L.push('# Catatan: aturan isolasi ditambahkan di akhir rantai forward. Bila routermu punya aturan drop umum,');
      L.push('# pastikan urutan aturan masih masuk akal, dan uji dari satu perangkat di tiap VLAN setelah menerapkan.');
    }
    return H('VLAN per Gedung (Segmentasi Sekolah dan Kantor)') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Satu kabel trunk membawa semua VLAN dalam keadaan tagged dari router ke switch. Di switch, port akses tiap ruangan diatur untagged ke VLAN tujuannya.',
      'Bridge dengan vlan-filtering adalah cara RouterOS v7 memisahkan VLAN. Interface vlan di atas bridge menjadi pintu tiap segmen, dan alamat pertama subnet menjadi gateway-nya.',
      'DHCP per VLAN membuat tiap segmen mengelola alamatnya sendiri. Perangkat di VLAN Siswa tidak akan pernah menerima alamat dari jaringan Guru.',
      'Isolasi bekerja dengan satu aturan drop antara daftar interface VLAN. Setiap VLAN tetap bebas ke internet lewat gateway-nya, tetapi pergerakan menyamping antar VLAN ditutup.',
      'Kolom pengecualian berguna untuk VLAN pengelola, misalnya Guru atau IT, yang memang perlu menjangkau CCTV dan perangkat VLAN lain.'
    ];
  }));


TOOLS.push(T('remove-all-routing', 'routing', 'Remove All Routing', 'Remove All Routing',
  'Hapus semua rute statis sekaligus, dan bila dipilih, aturan routing serta tabel routing kustom. Tanpa rute, router tidak tahu ke mana meneruskan paket.',
  [
    f('cadangan', 'Buat backup konfigurasi (.rsc) dulu', 'check', true, { help: 'Menyimpan salinan konfigurasi lengkap ke menu Files sebelum ada yang dihapus.' }),
    f('rute', 'Hapus semua rute statis', 'check', true, { help: 'Hanya rute statis yang dihapus. Rute dinamis dari OSPF atau BGP tidak bisa dihapus dengan cara ini.' }),
    f('aturan', 'Hapus semua routing rule', 'check', false, { help: 'Routing rule mengarahkan trafik ke tabel routing tertentu berdasarkan alamat sumber atau penanda.' }),
    f('tabel', 'Hapus semua tabel routing kustom', 'check', false, { help: 'Tabel main tidak bisa dihapus, jadi hanya tabel tambahan yang ikut terhapus.' })
  ],
  function (v) {
    var L = [];
    if (v.cadangan) { L.push('/export file=backup-sebelum-hapus-routing'); }
    if (v.rute) { L.push('/ip route remove [find where dynamic=no]'); }
    if (v.aturan) { L.push('/routing rule remove [find]'); }
    if (v.tabel) { L.push('/routing table remove [find where name!="main"]'); }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang dihapus. Centang minimal satu kelompok.'); }
    return H('Remove All Routing') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Rute statis adalah petunjuk jalan yang ditulis manual: "ke jaringan ini, lewat gateway itu". Menghapus semuanya membuat router hanya mengandalkan rute terhubung langsung dan rute dinamis.',
      'Rute dinamis dari OSPF atau BGP tidak ikut terhapus, karena rute itu dibuat otomatis oleh protokol routing dan akan muncul lagi selama protokolnya masih jalan.',
      'Routing rule dan tabel kustom dipakai policy routing dan load balancing. Menghapusnya membuat trafik yang tadinya dipisah ke jalur khusus kembali mengikuti tabel utama.',
      'Setelah rute dihapus, uji koneksi ke internet dan ke jaringan lain sebelum meninggalkan router. Bila ada yang putus, pulihkan dari backup .rsc yang dibuat di awal.',
      'Backup .rsc menyimpan seluruh konfigurasi ke menu Files. Bila penghapusan ternyata salah, pulihkan dengan menjalankan berkas backup itu dari terminal.'
    ];
  }));


TOOLS.push(T('starlink-lb-pcc', 'routing', 'Starlink Load Balancing PCC', 'Starlink Load Balancing PCC',
  'Sebar koneksi antara Starlink dan satu WAN kedua memakai PCC, agar tiap koneksi konsisten lewat satu jalur.',
  [
    f('lan', 'Interface LAN', 'text', 'ether5', { mono: 1 }),
    f('star', 'Interface Starlink', 'text', 'ether1', { mono: 1 }),
    f('gwstar', 'Gateway Starlink', 'ip', '192.168.100.1', { v: 'ip', help: 'Gateway Starlink bila memakai router Starlink. Bila Starlink mode bypass dan DHCP client di router, isi gateway yang didapat DHCP.' }),
    f('w2', 'Interface WAN kedua', 'text', 'ether2', { mono: 1 }),
    f('gw2', 'Gateway WAN kedua', 'ip', '192.168.2.1', { v: 'ip' }),
    f('klas', 'Klasifikasi koneksi', 'select', 'both-addresses-and-ports', { opts: ['both-addresses-and-ports', 'both-addresses', 'src-address', 'src-address-and-port', 'dst-address-and-port'] })
  ],
  function (v) {
    var wans = [
      { iface: v.star, gw: v.gwstar, nama: 'starlink' },
      { iface: v.w2, gw: v.gw2, nama: 'wan2' }
    ];
    var L = [];
    L.push('# Tabel routing khusus untuk tiap WAN');
    wans.forEach(function (w, i) { L.push('/routing table add name=to-' + w.nama + ' fib'); });
    L.push('# Tandai koneksi yang masuk dari tiap WAN agar jawabannya pulang lewat jalur yang sama');
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=input in-interface=' + w.iface + ' action=mark-connection new-connection-mark=' + w.nama + '-conn passthrough=yes');
    });
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=output connection-mark=' + w.nama + '-conn action=mark-routing new-routing-mark=to-' + w.nama + ' passthrough=no');
    });
    L.push('# Bagi koneksi baru dari LAN dengan PCC');
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' dst-address-type=!local per-connection-classifier=' + v.klas + ':2/' + i + ' action=mark-connection new-connection-mark=' + w.nama + '-conn passthrough=yes');
    });
    wans.forEach(function (w, i) {
      L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' connection-mark=' + w.nama + '-conn action=mark-routing new-routing-mark=to-' + w.nama + ' passthrough=no');
    });
    L.push('# Rute untuk tiap tabel dan rute default utama');
    wans.forEach(function (w, i) {
      L.push('/ip route add gateway=' + w.gw + ' routing-table=to-' + w.nama + ' check-gateway=ping comment="Rute tabel ' + w.nama + '"');
      L.push('/ip route add gateway=' + w.gw + ' distance=' + (i + 1) + ' check-gateway=ping comment="Default utama ' + w.nama + '"');
    });
    L.push('# NAT keluar untuk semua WAN');
    wans.forEach(function (w, i) {
      L.push('/ip firewall nat add chain=srcnat out-interface=' + w.iface + ' action=masquerade comment="NAT ' + w.nama + '"');
    });
    L.push('# Catatan: Starlink memakai CGNAT, jadi port forwarding dari internet tidak bisa masuk. Load balancing tetap jalan untuk trafik keluar.');
    return H('Starlink Load Balancing PCC') + L.join('\n') + '\n';
  },
  function () {
    return [
      'PCC menghash alamat dan port koneksi, lalu hasilnya dibagi rata ke Starlink dan WAN kedua. Satu koneksi selalu lewat satu jalur, jadi sesi login tidak putus.',
      'Tanda koneksi dari arah input memastikan jawaban dari internet pulang lewat WAN tempat koneksi itu lahir.',
      'Setiap WAN punya tabel routing sendiri (to-starlink dan to-wan2) sesuai cara RouterOS v7 memisahkan rute bertanda.',
      'Starlink memakai CGNAT sehingga alamat publiknya dipakai bersama. Itu sebabnya port forwarding dari internet tidak bisa masuk lewat Starlink, dan itu normal, bukan kesalahan script.'
    ];
  }));

TOOLS.push(T('lb-nth', 'routing', 'Load Balancing NTH', 'Load Balancing NTH',
  'Sebar koneksi ke dua WAN dengan penghitung NTH: koneksi baru dibagi bergiliran, tiap koneksi tetap lewat satu jalur.',
  [
    f('lan', 'Interface LAN', 'text', 'ether5', { mono: 1 }),
    f('w1', 'Interface WAN 1', 'text', 'ether1', { mono: 1 }),
    f('g1', 'Gateway WAN 1', 'ip', '192.168.1.1', { v: 'ip' }),
    f('w2', 'Interface WAN 2', 'text', 'ether2', { mono: 1 }),
    f('g2', 'Gateway WAN 2', 'ip', '192.168.2.1', { v: 'ip' })
  ],
  function (v) {
    var L = [];
    L.push('/routing table add name=to-wan1 fib');
    L.push('/routing table add name=to-wan2 fib');
    L.push('# Tandai koneksi masuk dari tiap WAN agar jawaban pulang lewat jalur asal');
    L.push('/ip firewall mangle add chain=input in-interface=' + v.w1 + ' action=mark-connection new-connection-mark=wan1-conn passthrough=yes');
    L.push('/ip firewall mangle add chain=input in-interface=' + v.w2 + ' action=mark-connection new-connection-mark=wan2-conn passthrough=yes');
    L.push('/ip firewall mangle add chain=output connection-mark=wan1-conn action=mark-routing new-routing-mark=to-wan1 passthrough=no');
    L.push('/ip firewall mangle add chain=output connection-mark=wan2-conn action=mark-routing new-routing-mark=to-wan2 passthrough=no');
    L.push('# Bagi koneksi baru dari LAN dengan NTH: hitungan ke-1 ke WAN 1, hitungan ke-2 ke WAN 2, lalu berulang');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' dst-address-type=!local connection-mark=no-mark nth=2,1 action=mark-connection new-connection-mark=wan1-conn passthrough=yes');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' dst-address-type=!local connection-mark=no-mark nth=2,2 action=mark-connection new-connection-mark=wan2-conn passthrough=yes');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' connection-mark=wan1-conn action=mark-routing new-routing-mark=to-wan1 passthrough=no');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' connection-mark=wan2-conn action=mark-routing new-routing-mark=to-wan2 passthrough=no');
    L.push('# Rute untuk tiap tabel dan rute default cadangan');
    L.push('/ip route add gateway=' + v.g1 + ' routing-table=to-wan1 check-gateway=ping comment="Rute tabel WAN1"');
    L.push('/ip route add gateway=' + v.g2 + ' routing-table=to-wan2 check-gateway=ping comment="Rute tabel WAN2"');
    L.push('/ip route add gateway=' + v.g1 + ',' + v.g2 + ' check-gateway=ping distance=1 comment="Default cadangan ECMP"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.w1 + ' action=masquerade comment="NAT WAN1"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.w2 + ' action=masquerade comment="NAT WAN2"');
    return H('Load Balancing NTH') + L.join('\n') + '\n';
  },
  function () {
    return [
      'NTH adalah penghitung: paket pertama dari koneksi baru dihitung ke WAN 1, paket kedua ke WAN 2, lalu berulang. Karena aturan ini hanya menyentuh koneksi yang belum bertanda, satu koneksi tetap lewat satu jalur sampai selesai.',
      'NTH lebih ringan dan lebih mudah dibaca daripada PCC, tetapi pembagiannya mengikuti urutan hitungan, bukan karakteristik koneksi, jadi untuk beban yang tidak merata PCC biasanya membagi lebih adil.',
      'Aturan mangle di atas menjaga koneksi yang dimulai dari internet, misalnya port forwarding, agar jawabannya tidak pulang lewat jalur yang salah.',
      'Rute default ECMP di akhir hanya pengaman untuk trafik yang tidak bertanda. Trafik bertanda tetap memakai tabel routingnya sendiri.'
    ];
  }));

TOOLS.push(T('game-raw-routing', 'routing', 'Rute Game via Raw Filter', 'Games Static Routing Using Filter Raw',
  'Arahkan trafik ke server game lewat satu gateway khusus. Penandaan dilakukan di tabel raw, sebelum connection tracking.',
  [
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('ips', 'Alamat server game (IP atau CIDR)', 'textarea', '103.86.211.0/24\n45.112.90.0/24', { mono: 1, help: 'Satu alamat IP atau CIDR per baris. Ganti dengan alamat server game yang kamu pakai, lihat dokumentasi game itu.' }),
    f('gw', 'Gateway WAN khusus game', 'ip', '192.168.2.1', { v: 'ip' }),
    f('wan', 'Interface WAN khusus game', 'text', 'ether1', { mono: 1 })
  ],
  function (v) {
    var ips = String(v.ips).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var L = [];
    ips.forEach(function (a) { L.push('/ip firewall address-list add list=server-game address=' + a + ' comment="Server game"'); });
    L.push('# Tabel raw memproses paket sebelum connection tracking, jadi penandaan terjadi paling awal');
    L.push('/ip firewall raw add chain=prerouting in-interface=' + v.lan + ' dst-address-list=server-game action=mark-connection new-connection-mark=game-conn passthrough=yes comment="Tandai koneksi game di raw"');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' connection-mark=game-conn action=mark-routing new-routing-mark=ke-game passthrough=no comment="Arahkan game ke gateway khusus"');
    L.push('/routing table add name=ke-game fib');
    L.push('/ip route add gateway=' + v.gw + ' routing-table=ke-game check-gateway=ping comment="Rute game lewat WAN khusus"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.wan + ' action=masquerade comment="NAT WAN game"');
    return H('Rute Game via Raw Filter') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Tabel raw adalah gerbang pertama firewall: paket ditandai di sini sebelum connection tracking mencatatnya, jadi beban CPU untuk koneksi game berkurang.',
      'Daftar server game harus berisi alamat IP asli server game itu. Alamat ini berbeda tiap game dan tiap region, jadi periksa dokumentasi atau pantau koneksi game dengan Torch bila ragu.',
      'Trafik selain ke server game tidak tersentuh aturan ini dan tetap memakai rute default biasa.',
      'NAT di akhir wajib ada karena gateway khusus game adalah jalur keluar yang berbeda dari WAN utama.'
    ];
  }));

TOOLS.push(T('game-mangle-port-routing', 'routing', 'Rute Game via Mangle Port', 'Games Static Routing Using Mangle Port',
  'Arahkan trafik game berdasarkan nomor port tujuannya lewat satu gateway khusus, memakai mangle prerouting.',
  [
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('ports', 'Daftar port game', 'textarea', '3074\n27014-27050\n5000-5500', { mono: 1, help: 'Satu port atau rentang per baris. Port tiap game berbeda, sesuaikan dengan game yang dimainkan di jaringanmu.' }),
    f('proto', 'Protokol', 'select', 'udp', { opts: ['udp', 'tcp'] }),
    f('gw', 'Gateway WAN khusus game', 'ip', '192.168.2.1', { v: 'ip' }),
    f('wan', 'Interface WAN khusus game', 'text', 'ether1', { mono: 1 })
  ],
  function (v) {
    var ports = String(v.ports).split('\n').map(function (s) { return s.trim(); }).filter(Boolean).join(',');
    var L = [];
    L.push('# Tandai koneksi game berdasarkan port tujuannya');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' protocol=' + v.proto + ' dst-port=' + ports + ' action=mark-connection new-connection-mark=game-conn passthrough=yes comment="Tandai koneksi game"');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' connection-mark=game-conn action=mark-routing new-routing-mark=ke-game passthrough=no comment="Arahkan game ke gateway khusus"');
    L.push('/routing table add name=ke-game fib');
    L.push('/ip route add gateway=' + v.gw + ' routing-table=ke-game check-gateway=ping comment="Rute game lewat WAN khusus"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.wan + ' action=masquerade comment="NAT WAN game"');
    return H('Rute Game via Mangle Port') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Mangle menandai koneksi yang port tujuannya cocok dengan daftar game, lalu memberi tanda routing ke tabel khusus game.',
      'Kebanyakan game memakai UDP, tetapi sebagian memakai TCP untuk login dan unduhan. Bila game tertentu tetap lewat jalur utama, periksa protokol aslinya lalu ganti pilihan protokol di atas.',
      'Daftar port adalah perkiraan awal. Bila game tertentu tetap tersendat, periksa port aslinya di dokumentasi game itu lalu tambahkan.',
      'Trafik selain port game tidak tersentuh dan tetap memakai rute default biasa.'
    ];
  }));

TOOLS.push(T('website-static-routing', 'routing', 'Rute Statis Website', 'Website Static Routing',
  'Lewatkan situs tertentu lewat satu gateway khusus, situs lain tetap di jalur utama.',
  [
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('domains', 'Daftar domain situs', 'textarea', 'cdn.game-contoh.com\npatch.game-contoh.com', { mono: 1, help: 'Satu domain per baris. Domain berakhiran .contoh adalah contoh penulisan, ganti dengan domain aslimu.' }),
    f('gw', 'Gateway jalur khusus', 'ip', '192.168.2.1', { v: 'ip' }),
    f('wan', 'Interface WAN jalur khusus', 'text', 'ether1', { mono: 1 })
  ],
  function (v) {
    var domains = String(v.domains).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var L = [];
    domains.forEach(function (d) { L.push('/ip firewall address-list add list=situs-rute address=' + d + ' comment="Situs jalur khusus"'); });
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' dst-address-list=situs-rute action=mark-routing new-routing-mark=ke-situs passthrough=no comment="Tandai situs jalur khusus"');
    L.push('/routing table add name=ke-situs fib');
    L.push('/ip route add gateway=' + v.gw + ' routing-table=ke-situs check-gateway=ping comment="Rute situs lewat jalur khusus"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.wan + ' action=masquerade comment="NAT jalur khusus"');
    return H('Rute Statis Website') + L.join('\n') + '\n';
  },
  function () {
    return [
      'RouterOS bisa mengenali domain dalam address list dan menyelesaikan alamat IP nya secara berkala dari DNS.',
      'Paket dari LAN yang tujuannya masuk daftar situs ditandai, lalu diteruskan ke tabel routing khusus yang keluar lewat gateway pilihanmu.',
      'Trafik selain situs terpilih tidak tersentuh aturan ini dan tetap memakai rute default biasa.',
      'Daftar domain berubah dari waktu ke waktu. Bila ada layanan yang lolos, tambahkan domain barunya ke address list yang sama.'
    ];
  }));

TOOLS.push(T('client-ip-static-routing', 'routing', 'Rute Statis IP Klien Lokal', 'Local Client IP Static Routing',
  'Arahkan klien lokal tertentu berdasarkan alamat IP nya lewat satu gateway khusus, klien lain tetap di jalur utama.',
  [
    f('clients', 'Alamat IP klien', 'textarea', '192.168.88.20\n192.168.88.21', { mono: 1, help: 'Satu alamat IP per baris. Klien ini bisa berupa PC, konsol game, atau perangkat lain yang mau dilewatkan jalur khusus.' }),
    f('gw', 'Gateway jalur khusus', 'ip', '192.168.2.1', { v: 'ip' }),
    f('wan', 'Interface WAN jalur khusus', 'text', 'ether1', { mono: 1 })
  ],
  function (v) {
    var clients = String(v.clients).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var L = [];
    clients.forEach(function (a) { L.push('/ip firewall address-list add list=klien-khusus address=' + a + ' comment="Klien jalur khusus"'); });
    L.push('/ip firewall mangle add chain=prerouting src-address-list=klien-khusus action=mark-routing new-routing-mark=ke-klien passthrough=no comment="Tandai klien jalur khusus"');
    L.push('/routing table add name=ke-klien fib');
    L.push('/ip route add gateway=' + v.gw + ' routing-table=ke-klien check-gateway=ping comment="Rute klien lewat jalur khusus"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.wan + ' action=masquerade comment="NAT jalur khusus"');
    return H('Rute Statis IP Klien Lokal') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Aturan ini membaca alamat sumber paket, jadi hanya klien yang alamatnya terdaftar yang dipindah jalurnya.',
      'Pastikan alamat klien tetap, misalnya lewat DHCP lease statis, karena bila alamatnya berubah oleh DHCP, aturan ini tidak lagi mengenali klien itu.',
      'Klien lain yang tidak terdaftar tidak tersentuh dan tetap memakai rute default biasa.',
      'Satu gateway khusus bisa dipakai bersama oleh beberapa tool rute statis, asal nama tabel routingnya berbeda.'
    ];
  }));

TOOLS.push(T('port-static-routing', 'routing', 'Rute Statis Port TCP/UDP', 'Port TCP/UDP Static Routing',
  'Lewatkan trafik dengan port tujuan tertentu lewat satu gateway khusus, port lain tetap di jalur utama.',
  [
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('proto', 'Protokol', 'select', 'tcp', { opts: ['tcp', 'udp'] }),
    f('ports', 'Daftar port tujuan', 'text', '80,443', { mono: 1, help: 'Pisahkan beberapa port dengan koma, contoh 80,443. Rentang ditulis 8000-8100.' }),
    f('gw', 'Gateway jalur khusus', 'ip', '192.168.2.1', { v: 'ip' }),
    f('wan', 'Interface WAN jalur khusus', 'text', 'ether1', { mono: 1 })
  ],
  function (v) {
    var L = [];
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' protocol=' + v.proto + ' dst-port=' + v.ports + ' action=mark-routing new-routing-mark=ke-port passthrough=no comment="Tandai port jalur khusus"');
    L.push('/routing table add name=ke-port fib');
    L.push('/ip route add gateway=' + v.gw + ' routing-table=ke-port check-gateway=ping comment="Rute port lewat jalur khusus"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.wan + ' action=masquerade comment="NAT jalur khusus"');
    return H('Rute Statis Port TCP/UDP') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Aturan ini membaca port tujuan paket, jadi cocok untuk layanan yang portnya sudah pasti, misalnya web di port 80 dan 443.',
      'Perhatikan protokolnya: web dan unduhan umumnya TCP, sedangkan game dan panggilan suara umumnya UDP. Pilihan yang salah membuat aturan tidak pernah cocok.',
      'Trafik dengan port di luar daftar tidak tersentuh dan tetap memakai rute default biasa.',
      'Bila satu layanan memakai banyak port, daftarkan semuanya dipisah koma, atau buat dua tool terpisah untuk TCP dan UDP.'
    ];
  }));

/* ================= Kategori: Firewall dan NAT ================= */

TOOLS.push(T('nat-masquerade', 'firewall', 'NAT Masquerade', 'NAT Masquerade',
  'Sembunyikan seluruh jaringan lokal di balik satu alamat IP WAN agar bisa mengakses internet.',
  [
    f('out', 'Interface keluar (WAN)', 'text', 'ether1', { mono: 1 }),
    f('src', 'Jaringan sumber (CIDR)', 'cidr', '', { v: 'cidr', opt: 1, ph: '192.168.88.0/24', help: 'Kosongkan untuk memasquerade semua trafik keluar.' }),
    f('komen', 'Komentar', 'text', 'Internet untuk LAN', { opt: 1 })
  ],
  function (v) {
    var s = '/ip firewall nat add chain=srcnat out-interface=' + v.out + ' action=masquerade';
    if (v.src) { s = '/ip firewall nat add chain=srcnat src-address=' + v.src + ' out-interface=' + v.out + ' action=masquerade'; }
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('NAT Masquerade') + s + '\n';
  },
  function () {
    return [
      'Masquerade mengganti alamat sumber privat setiap perangkat LAN menjadi alamat IP WAN router saat paket keluar.',
      'Jawaban dari internet diterjemahkan balik secara otomatis oleh pelacakan koneksi.',
      'Tanpa aturan ini, perangkat LAN tidak bisa menjangkau internet karena alamat privat tidak berlaku di internet.'
    ];
  }));

TOOLS.push(T('port-forwarding', 'firewall', 'Port Forwarding (DST-NAT)', 'Port Forwarding (DST-NAT)',
  'Teruskan satu port dari sisi WAN ke server di jaringan lokal, misalnya web server atau CCTV.',
  [
    f('proto', 'Protokol', 'select', 'tcp', { opts: ['tcp', 'udp'] }),
    f('portLuar', 'Port dari luar (WAN)', 'number', '8080', { v: 'port' }),
    f('ipTujuan', 'IP server lokal', 'ip', '192.168.88.10', { v: 'ip' }),
    f('portTujuan', 'Port di server lokal', 'number', '80', { v: 'port' }),
    f('inIface', 'Interface masuk', 'text', '', { mono: 1, opt: 1, ph: 'ether1', help: 'Kosongkan bila ingin berlaku untuk semua interface masuk.' }),
    f('komen', 'Komentar', 'text', '', { opt: 1, ph: 'Terusan ke web server' })
  ],
  function (v) {
    var s = '/ip firewall nat add chain=dstnat protocol=' + v.proto + ' dst-port=' + v.portLuar;
    if (v.inIface) { s += ' in-interface=' + v.inIface; }
    s += ' action=dst-nat to-addresses=' + v.ipTujuan + ' to-ports=' + v.portTujuan;
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('Port Forwarding (DST-NAT)') + s + '\n';
  },
  function () {
    return [
      'Siapa pun yang membuka alamat WAN routermu pada port luar akan diteruskan ke server lokal tujuan.',
      'Pastikan firewall filter di chain forward tidak menahan koneksi baru ke server ini, dan server memakai router ini sebagai gateway nya.',
      'Bila server diakses dari dalam LAN memakai alamat publik, kamu butuh aturan tambahan. Lihat tool Hairpin NAT.'
    ];
  }));

TOOLS.push(T('hairpin-nat', 'firewall', 'Hairpin NAT', 'Hairpin NAT',
  'Agar server lokal yang sudah di port forwarding tetap bisa diakses dari dalam LAN memakai alamat publik.',
  [
    f('pub', 'Alamat IP publik router', 'ip', '203.0.113.5', { v: 'ip', help: '203.0.113.5 hanyalah contoh dari blok dokumentasi. Ganti dengan IP publik routermu.' }),
    f('proto', 'Protokol', 'select', 'tcp', { opts: ['tcp', 'udp'] }),
    f('portLuar', 'Port publik', 'number', '8080', { v: 'port' }),
    f('ipServer', 'IP server lokal', 'ip', '192.168.88.10', { v: 'ip' }),
    f('portServer', 'Port di server', 'number', '80', { v: 'port' }),
    f('lanNet', 'Jaringan lokal (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr' })
  ],
  function (v) {
    return H('Hairpin NAT') +
      '/ip firewall nat add chain=dstnat src-address=' + v.lanNet + ' dst-address=' + v.pub + ' protocol=' + v.proto + ' dst-port=' + v.portLuar +
      ' action=dst-nat to-addresses=' + v.ipServer + ' to-ports=' + v.portServer + ' comment="Hairpin: tujuan dibelokkan ke server lokal"\n' +
      '/ip firewall nat add chain=srcnat src-address=' + v.lanNet + ' dst-address=' + v.ipServer + ' protocol=' + v.proto + ' dst-port=' + v.portServer +
      ' action=masquerade comment="Hairpin: sumber disamarkan agar jawaban pulang lewat router"\n';
  },
  function () {
    return [
      'Masalahnya: perangkat LAN membuka alamat publik, paket berbelok ke server di ruangan yang sama, dan jawaban server pulang langsung tanpa lewat router sehingga koneksi gagal.',
      'Aturan pertama membelokkan tujuan ke server lokal, sama seperti port forwarding biasa.',
      'Aturan kedua menyamarkan sumber menjadi alamat router, memaksa jawaban server pulang melewati router agar terjemahan NAT nya utuh.'
    ];
  }));

TOOLS.push(T('blokir-situs', 'firewall', 'Blokir Situs', 'Block Websites',
  'Blokir daftar domain dari jaringan lokal memakai address list dan firewall filter.',
  [
    f('daftar', 'Daftar domain yang diblokir', 'textarea', 'situs-judi.contoh\nsitus-dewasa.contoh', { help: 'Satu domain per baris. Domain berakhiran .contoh adalah contoh penulisan, ganti dengan domain aslimu.', mono: 1 }),
    f('kata', 'Kata kunci di URL (opsional)', 'text', '', { opt: 1, ph: 'judi', help: 'Bila diisi, dibuat juga penyaring Layer 7 yang menangkap kata ini di dalam alamat dan isi permintaan HTTP.' }),
    f('komen', 'Komentar aturan', 'text', 'Situs diblokir', { opt: 1 })
  ],
  function (v) {
    var lines = String(v.daftar).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var L = [];
    lines.forEach(function (d) { L.push('/ip firewall address-list add list=situs-diblokir address=' + d + ' comment=' + q(v.komen || 'Diblokir')); });
    L.push('/ip firewall filter add chain=forward dst-address-list=situs-diblokir action=drop comment=' + q(v.komen || 'Situs diblokir'));
    if (v.kata) {
      L.push('/ip firewall layer7-protocol add name=blokir-kata regexp=' + q('^.+(' + v.kata + ').*$'));
      L.push('/ip firewall filter add chain=forward layer7-protocol=blokir-kata action=drop comment="Blokir kata kunci di URL"');
    }
    return H('Blokir Situs') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Address list berisi domain akan diterjemahkan RouterOS menjadi alamat IP secara berkala lewat DNS.',
      'Aturan forward membuang setiap paket yang tujuannya masuk daftar itu.',
      'Keterbatasan yang jujur: situs modern memakai HTTPS dan banyak domain bersama di CDN, jadi pemblokiran di tingkat IP tidak selalu presisi. Penyaring Layer 7 hanya membaca trafik HTTP yang tidak terenkripsi.',
      'Untuk kebutuhan sekolah atau kantor yang serius, pemblokiran biasanya dipadukan dengan DNS filter agar lebih rapi.'
    ];
  }));

TOOLS.push(T('proteksi-router', 'firewall', 'Proteksi Dasar Router', 'Basic Router Protection',
  'Paket aturan firewall untuk menahan serangan umum: koneksi rusak, brute force SSH dan Winbox, serta port scan.',
  [
    f('invalid', 'Buang paket berstatus invalid', 'check', true),
    f('brute', 'Lindungi SSH dan Winbox dari brute force', 'check', true, { help: 'IP yang gagal berulang kali masuk daftar hitam sementara lalu diblokir.' }),
    f('scan', 'Tahan port scanning', 'check', true),
    f('icmp', 'Batasi banjir ping (ICMP)', 'check', true),
    f('layanan', 'Matikan layanan lama (Telnet, FTP, WWW, API)', 'check', false, { help: 'Winbox dan SSH tetap menyala. Pastikan kamu tidak sedang memakai layanan yang dimatikan ini.' })
  ],
  function (v) {
    var L = [];
    L.push('# Terima koneksi yang sudah berjalan dan yang berkaitan');
    L.push('/ip firewall filter add chain=input connection-state=established,related action=accept comment="Terima koneksi berjalan"');
    L.push('/ip firewall filter add chain=forward connection-state=established,related action=accept comment="Terima koneksi berjalan"');
    if (v.invalid) {
      L.push('/ip firewall filter add chain=input connection-state=invalid action=drop comment="Buang paket invalid"');
      L.push('/ip firewall filter add chain=forward connection-state=invalid action=drop comment="Buang paket invalid"');
    }
    if (v.brute) {
      L.push('# Tangga daftar hitam untuk percobaan masuk SSH (22) dan Winbox (8291)');
      L.push('/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 src-address-list=daftar-hitam action=drop comment="Blokir penyerang tercatat"');
      L.push('/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 connection-state=new src-address-list=tahap2 action=add-src-to-address-list address-list=daftar-hitam address-list-timeout=1w comment="Tahap 3 masuk daftar hitam"');
      L.push('/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 connection-state=new src-address-list=tahap1 action=add-src-to-address-list address-list=tahap2 address-list-timeout=1m comment="Tahap 2"');
      L.push('/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 connection-state=new action=add-src-to-address-list address-list=tahap1 address-list-timeout=1m comment="Tahap 1"');
    }
    if (v.scan) {
      L.push('/ip firewall filter add chain=input protocol=tcp psd=21,3s,3,1 action=add-src-to-address-list address-list=portscan address-list-timeout=2w comment="Deteksi port scan"');
      L.push('/ip firewall filter add chain=input src-address-list=portscan action=drop comment="Blokir pemindai port"');
    }
    if (v.icmp) {
      L.push('/ip firewall filter add chain=input protocol=icmp limit=5,5:packet action=accept comment="Ping sewajarnya diterima"');
      L.push('/ip firewall filter add chain=input protocol=icmp action=drop comment="Kelebihan ping dibuang"');
    }
    if (v.layanan) {
      L.push('/ip service disable telnet,ftp,www,api,api-ssl');
    }
    L.push('# Catatan: tambahkan aturan terima dari jaringan pengelola sebelum aturan drop umum milikmu, agar kamu tidak terkunci dari routermu sendiri.');
    return H('Proteksi Dasar Router') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Urutan aturan penting di firewall: aturan yang cocok lebih dulu menang. Jalankan script ini sebelum kamu menambah aturan drop umum di chain input.',
      'Brute force ditahan dengan tangga: percobaan baru dicatat bertahap, dan yang memaksa berulang kali diblokir seminggu.',
      'Script ini sengaja tidak memasang aturan drop semua di akhir chain, karena tiap jaringan punya aturan terima yang berbeda. Tambahkan aturan itu sendiri setelah memastikan akses pengelola aman.'
    ];
  }));

TOOLS.push(T('pisah-game', 'firewall', 'Pisah Trafik Game dan Browsing', 'Split Game and Browsing Traffic',
  'Tandai paket game dan browsing dengan packet mark berbeda, lalu beri prioritas lebih tinggi untuk game di queue tree.',
  [
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('ports', 'Daftar port game (UDP)', 'textarea', '3074\n27014-27050\n5000-5500', { mono: 1, help: 'Satu port atau rentang per baris. Port tiap game berbeda, sesuaikan dengan game yang dimainkan di jaringanmu.' }),
    f('parent', 'Parent queue tree', 'text', 'global', { mono: 1 }),
    f('total', 'Total bandwidth parent (format up/down)', 'text', '10M/50M', { mono: 1, ph: '10M/50M', help: 'Contoh 10M/50M berarti unggah 10 Mbps dan unduh 50 Mbps.' })
  ],
  function (v) {
    var ports = String(v.ports).split('\n').map(function (s) { return s.trim(); }).filter(Boolean).join(',');
    var L = [];
    L.push('# Tandai paket game berdasarkan port UDP yang lazim dipakai game');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' protocol=udp dst-port=' + ports + ' action=mark-packet new-packet-mark=paket-game passthrough=no comment="Tandai game"');
    L.push('# Sisanya yang berupa web ditandai sebagai browsing');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' protocol=tcp dst-port=80,443 action=mark-packet new-packet-mark=paket-browsing passthrough=no comment="Tandai browsing"');
    var bagian = String(v.total).split('/');
    var up = (bagian[0] || '').trim();
    var down = (bagian[1] || bagian[0] || '').trim();
    L.push('# Antrean unduh: game prioritas 1, browsing prioritas 8 (queue tree hanya menerima satu nilai batas per antrean, jadi arah unduh dan unggah dipisah)');
    L.push('/queue tree add name=antrean-unduh parent=' + v.parent + ' max-limit=' + down + ' comment="Induk unduh pemisah trafik"');
    L.push('/queue tree add name=game-unduh parent=antrean-unduh packet-mark=paket-game priority=1 comment="Game didahulukan saat unduh"');
    L.push('/queue tree add name=browsing-unduh parent=antrean-unduh packet-mark=paket-browsing priority=8 comment="Browsing menunggu saat unduh"');
    L.push('# Antrean unggah: pola yang sama untuk arah naik');
    L.push('/queue tree add name=antrean-unggah parent=' + v.parent + ' max-limit=' + up + ' comment="Induk unggah pemisah trafik"');
    L.push('/queue tree add name=game-unggah parent=antrean-unggah packet-mark=paket-game priority=1 comment="Game didahulukan saat unggah"');
    L.push('/queue tree add name=browsing-unggah parent=antrean-unggah packet-mark=paket-browsing priority=8 comment="Browsing menunggu saat unggah"');
    return H('Pisah Trafik Game dan Browsing') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Mangle memberi cap pada paket: cap paket-game untuk port game, cap paket-browsing untuk web.',
      'Queue tree hanya menerima satu nilai batas per antrean, jadi arah unduh dan unggah dibuatkan induk antrean sendiri sendiri.',
      'Queue tree membaca cap itu. Prioritas 1 berarti paket game selalu dilayani lebih dulu saat jalur penuh.',
      'Prioritas bukan menambah kecepatan total. Ia hanya menentukan siapa yang menunggu saat semua orang memakai internet bersamaan.',
      'Daftar port game adalah perkiraan awal. Bila game tertentu tetap tersendat, periksa port aslinya di dokumentasi game itu lalu tambahkan.'
    ];
  }));

TOOLS.push(T('anti-ddos', 'firewall', 'Anti DDoS Attacks', 'Anti DDoS Attacks',
  'Tahan banjir koneksi SYN dari internet: sumber yang membuka koneksi terlalu banyak dalam waktu singkat masuk daftar hitam sementara lalu trafiknya dibuang.',
  [
    f('batas', 'Batas koneksi per IP', 'number', 50, { v: 'num', min: 1, max: 1000, help: 'Jumlah koneksi bersamaan dari satu IP sebelum dianggap menyerang.' }),
    f('list', 'Nama address-list penyerang', 'text', 'ddos-attackers', { mono: 1 }),
    f('timeout', 'Lama IP masuk daftar hitam', 'text', '10m', { mono: 1, help: 'Format waktu RouterOS, contoh 10m, 1h, atau 1d.' }),
    f('wan', 'Interface WAN', 'text', 'ether1', { mono: 1 })
  ],
  function (v) {
    return H('Anti DDoS Attacks') +
      '/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=tcp connection-limit=' + v.batas + ',32 action=add-src-to-address-list address-list=' + v.list + ' address-list-timeout=' + v.timeout + ' comment="Tandai penyerang DDoS"\n' +
      '/ip firewall filter add chain=input in-interface=' + v.wan + ' src-address-list=' + v.list + ' action=drop comment="Buang trafik penyerang DDoS"\n';
  },
  function () {
    return [
      'Aturan pertama menghitung koneksi TCP dari tiap IP di interface WAN, dan bila melewati batas, IP itu dicatat ke address-list selama durasi yang kamu isi.',
      'Aturan kedua membuang semua paket dari IP yang sedang ada di daftar itu, jadi banjir berhenti membebani CPU router.',
      'Peringatan praktis: batas yang terlalu kecil bisa memblokir pengguna sah di belakang satu IP publik yang sama, misalnya satu kantor atau satu warnet, jadi naikkan batasnya bila keluhan muncul.'
    ];
  }));

TOOLS.push(T('anti-hack-exploit', 'firewall', 'Anti Hack Exploit (user.dat)', 'Anti Hack Exploit (user.dat)',
  'Tutup semua pintu layanan kelola router dari arah internet, tetapi tetap buka untuk jaringan pengelola di LAN.',
  [
    f('wan', 'Interface WAN', 'text', 'ether1', { mono: 1 }),
    f('lan', 'Jaringan pengelola (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr', help: 'Hanya jaringan ini yang boleh membuka Winbox, SSH, dan WebFig.' })
  ],
  function (v) {
    return H('Anti Hack Exploit (user.dat)') +
      '/ip firewall filter add chain=input src-address=' + v.lan + ' protocol=tcp dst-port=8291,8728,8729,22,23,80,443 action=accept comment="Izinkan kelola router dari LAN"\n' +
      '/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=tcp dst-port=8291,8728,8729,22,23,80,443 action=drop comment="Tutup layanan kelola dari WAN"\n';
  },
  function () {
    return [
      'Aturan pertama mengizinkan jaringan pengelola membuka layanan kelola: Winbox 8291, API 8728, API-SSL 8729, SSH 22, Telnet 23, Web 80, dan Web-SSL 443.',
      'Aturan kedua membuang semua percobaan dari interface WAN ke port yang sama, jadi pemindai dari internet tidak bisa mengetuk pintu router.',
      'Aturan accept harus berada di atas aturan drop di daftar filter, dan urutan ini sudah dijaga oleh template di atas.',
      'Peringatan praktis: bila kamu mengelola router dari luar lewat VPN atau IP publik lain, tambahkan jaringan itu ke aturan accept sebelum menjalankan script ini, atau kamu bisa terkunci dari router sendiri.'
    ];
  }));

TOOLS.push(T('anti-hack-mikrotik', 'firewall', 'Anti Hack MikroTik', 'Anti Hack MikroTik',
  'Pengerasan umum router: matikan layanan yang tidak dipakai, kunci Winbox ke jaringan LAN, dan batasi layanan tetangga jaringan.',
  [
    f('wan', 'Interface WAN', 'text', 'ether1', { mono: 1 }),
    f('lan', 'Jaringan LAN (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr', help: 'Jaringan yang diizinkan membuka Winbox.' }),
    f('telnet', 'Matikan Telnet', 'check', true),
    f('ftp', 'Matikan FTP', 'check', true),
    f('api', 'Matikan API', 'check', true),
    f('www', 'Matikan layanan Web (WebFig)', 'check', true)
  ],
  function (v) {
    var s = H('Anti Hack MikroTik');
    if (v.telnet) { s += '/ip service set telnet disabled=yes\n'; }
    if (v.ftp) { s += '/ip service set ftp disabled=yes\n'; }
    if (v.api) { s += '/ip service set api disabled=yes\n'; }
    if (v.www) { s += '/ip service set www disabled=yes\n'; }
    s += '/ip service set winbox address=' + v.lan + '\n' +
      '/tool bandwidth-server set enabled=no\n' +
      '/tool mac-server set allowed-interface-list=LAN\n' +
      '/tool mac-server mac-winbox set allowed-interface-list=LAN\n' +
      '/ip neighbor discovery-settings set discover-interface-list=LAN\n' +
      '/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=tcp dst-port=21,22,23,80,443,8291,8728,8729 action=drop comment="Blokir layanan kelola dari WAN"\n';
    return s;
  },
  function () {
    return [
      'Baris pertama sampai keempat mematikan layanan IP yang kamu centang, jadi pintu masuk yang tidak dipakai tidak lagi bisa diketuk dari mana pun.',
      'Winbox kemudian hanya menerima koneksi dari jaringan LAN yang kamu isi, sehingga login dari internet tertutup.',
      'Bandwidth server dimatikan dan MAC server dibatasi ke interface LAN, jadi alat ukur dan login lewat MAC address tidak bisa dipakai dari arah WAN.',
      'Neighbor discovery juga dibatasi ke LAN, supaya router tidak mengumumkan dirinya ke perangkat di luar jaringan lokal.',
      'Baris terakhir adalah jaring pengaman: aturan firewall yang membuang percobaan masuk ke port layanan kelola dari interface WAN, jadi kalaupun sebuah layanan diaktifkan lagi suatu hari, pintu dari internet tetap tertutup.',
      'Peringatan praktis: mematikan layanan Web berarti WebFig ikut mati, dan mematikan API memutus aplikasi yang memakai API MikroTik, jadi centang hanya layanan yang memang tidak kamu pakai.'
    ];
  }));

TOOLS.push(T('anti-netcut', 'firewall', 'Anti Netcut', 'Anti Netcut',
  'Cegah pemutusan dan pembajakan koneksi lewat ARP palsu: bridge hanya menerima jawaban ARP dari alamat yang sudah tercatat.',
  [
    f('bridge', 'Nama bridge LAN', 'text', 'bridge-lan', { mono: 1 }),
    f('gw', 'Alamat IP gateway', 'ip', '192.168.88.1', { v: 'ip' }),
    f('mac', 'MAC address gateway', 'text', 'AA:BB:CC:11:22:33', { mono: 1, help: 'Lihat di menu IP lalu ARP, atau di stiker perangkat gateway.' })
  ],
  function (v) {
    return H('Anti Netcut') +
      '/interface bridge set ' + v.bridge + ' arp=reply-only\n' +
      '/ip dhcp-server set [find interface=' + v.bridge + '] add-arp=yes\n' +
      '/ip arp add address=' + v.gw + ' mac-address=' + v.mac + ' interface=' + v.bridge + ' comment="Gateway statis anti netcut"\n';
  },
  function () {
    return [
      'Baris pertama mengubah bridge ke mode reply-only, artinya router hanya membalas ARP untuk alamat IP yang sudah tercatat di tabel ARP.',
      'Baris kedua membuat DHCP server otomatis mencatat entri ARP setiap kali memberi lease, jadi klien DHCP tetap terhubung tanpa pengaturan manual.',
      'Baris ketiga mencatat gateway secara permanen, supaya alamat gateway tidak bisa dibajak oleh perangkat lain yang mengaku sebagai gateway.',
      'Peringatan praktis: perangkat dengan IP statis yang tidak punya entri ARP akan kehilangan koneksi sampai kamu menambahkan entri ARP statis untuknya, jadi catat dulu semua IP statis sebelum menjalankan script ini.'
    ];
  }));

TOOLS.push(T('anti-ping-wan', 'firewall', 'Anti-Ping WAN', 'Anti-Ping WAN',
  'Sembunyikan router dari pemindai internet dengan menolak ping ICMP echo yang datang dari WAN.',
  [
    f('wan', 'Interface WAN', 'text', 'ether1', { mono: 1 }),
    f('forward', 'Tolak juga ping yang diteruskan ke LAN (chain forward)', 'check', false, { help: 'Aktifkan bila perangkat LAN juga tidak boleh di-ping dari internet.' })
  ],
  function (v) {
    var s = H('Anti-Ping WAN') +
      '/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=icmp icmp-options=8:0 action=drop comment="Tolak ping dari WAN"\n';
    if (v.forward) {
      s += '/ip firewall filter add chain=forward in-interface=' + v.wan + ' protocol=icmp icmp-options=8:0 action=drop comment="Tolak ping terusan dari WAN"\n';
    }
    return s;
  },
  function () {
    return [
      'Aturan pertama membuang paket ping (ICMP echo request) yang ditujukan ke router sendiri dari interface WAN, sehingga pemindai mengira tidak ada perangkat di alamat itu.',
      'Bila opsi forward dicentang, aturan kedua ikut membuang ping yang diteruskan menuju perangkat di LAN.',
      'Peringatan praktis: setelah aturan ini aktif, kamu tidak bisa lagi menguji koneksi internet dengan ping ke IP publik router dari luar, pakai ping dari dalam LAN atau cek lewat log sebagai gantinya.'
    ];
  }));

TOOLS.push(T('block-modem', 'firewall', 'Block Access Modem', 'Block Access Modem',
  'Larang perangkat di LAN membuka halaman admin modem, supaya tidak ada yang mengubah setelan modem sembarangan.',
  [
    f('modem', 'Alamat IP modem', 'ip', '192.168.1.1', { v: 'ip' }),
    f('port', 'Port admin modem', 'select', '80,443', { opts: [{ v: '80,443', l: '80 dan 443 (HTTP dan HTTPS)' }, { v: '80', l: '80 (HTTP saja)' }, { v: '443', l: '443 (HTTPS saja)' }] }),
    f('src', 'Jaringan sumber (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr', help: 'Jaringan klien yang dilarang, biasanya seluruh LAN.' })
  ],
  function (v) {
    return H('Block Access Modem') +
      '/ip firewall filter add chain=forward src-address=' + v.src + ' dst-address=' + v.modem + ' protocol=tcp dst-port=' + v.port + ' action=drop comment="Blokir akses admin modem"\n';
  },
  function () {
    return [
      'Satu aturan ini membuang paket dari jaringan sumber menuju alamat IP modem pada port admin yang dipilih.',
      'Chain forward dipakai karena paketnya hanya lewat router menuju modem, bukan ditujukan ke router sendiri.',
      'Peringatan praktis: aturan ini juga memblokir kamu sendiri bila kamu berada di jaringan sumber itu, jadi jalankan perubahan modem dari jaringan lain atau nonaktifkan dulu aturan ini sementara.'
    ];
  }));

TOOLS.push(T('block-ip', 'firewall', 'Block IP Address', 'Block IP Address',
  'Masukkan satu alamat IP ke daftar blokir lalu buang semua trafiknya, cara cepat menghentikan pengganggu yang sudah diketahui alamatnya.',
  [
    f('addr', 'Alamat IP yang diblokir (CIDR)', 'cidr', '203.0.113.7/32', { v: 'cidr', help: 'Pakai /32 untuk satu alamat, atau prefix lebih besar untuk satu jaringan.' }),
    f('list', 'Nama address-list', 'text', 'blocked', { mono: 1 }),
    f('chain', 'Chain firewall', 'select', 'forward', { opts: ['forward', 'input'] })
  ],
  function (v) {
    return H('Block IP Address') +
      '/ip firewall address-list add list=' + v.list + ' address=' + v.addr + ' comment="Alamat diblokir"\n' +
      '/ip firewall filter add chain=' + v.chain + ' src-address-list=' + v.list + ' action=drop comment="Buang trafik dari daftar blokir"\n';
  },
  function () {
    return [
      'Baris pertama mencatat alamat yang kamu isi ke address-list, jadi alamat lain bisa ditambahkan ke daftar yang sama tanpa membuat aturan baru.',
      'Baris kedua membuang semua paket dari alamat yang ada di daftar itu pada chain yang kamu pilih.',
      'Chain forward memblokir trafik yang lewat menuju internet atau LAN lain, sedangkan chain input memblokir trafik yang ditujukan ke router sendiri.',
      'Peringatan praktis: periksa alamatnya dua kali sebelum menjalankan, karena salah ketik satu angka bisa memblokir pelanggan atau server yang sah.'
    ];
  }));

TOOLS.push(T('block-mac', 'firewall', 'Block MAC Address', 'Block MAC Address',
  'Blokir satu perangkat berdasarkan MAC address-nya, berguna bila perangkat itu terus mengganti alamat IP.',
  [
    f('mac', 'Alamat MAC yang diblokir', 'text', 'AA:BB:CC:11:22:33', { mono: 1, help: 'Format enam pasang heksadesimal dipisah titik dua, contoh AA:BB:CC:11:22:33.' }),
    f('komen', 'Komentar', 'text', '', { opt: 1, ph: 'Perangkat tidak dikenal' })
  ],
  function (v) {
    var s = '/ip firewall filter add chain=forward src-mac-address=' + v.mac + ' action=drop';
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('Block MAC Address') + s + '\n';
  },
  function () {
    return [
      'Satu aturan ini membuang semua paket yang dikirim perangkat dengan MAC address yang kamu isi, di chain forward.',
      'Karena yang dicek adalah MAC address perangkat, aturan ini tetap bekerja walaupun perangkat itu berganti IP lewat DHCP.',
      'Peringatan praktis: MAC address bisa dipalsukan dengan mudah, jadi aturan ini cocok untuk perangkat nakal di jaringan sendiri, bukan untuk pertahanan serius dari internet.'
    ];
  }));

TOOLS.push(T('block-proxy', 'firewall', 'Block Open PROXY', 'Block Open PROXY',
  'Tutup port proxy umum supaya pengguna tidak bisa lolos dari filter atau pembatasan lewat proxy luar.',
  [
    f('ports', 'Daftar port proxy', 'text', '8080,3128,1080,8118', { mono: 1, help: 'Pisahkan dengan koma. 8080 dan 3128 proxy HTTP umum, 1080 SOCKS, 8118 Privoxy.' }),
    f('chain', 'Chain firewall', 'select', 'forward', { opts: ['forward', 'input'] }),
    f('proto', 'Protokol', 'select', 'tcp', { opts: ['tcp', 'udp'] })
  ],
  function (v) {
    return H('Block Open PROXY') +
      '/ip firewall filter add chain=' + v.chain + ' protocol=' + v.proto + ' dst-port=' + v.ports + ' action=drop comment="Blokir port proxy umum"\n';
  },
  function () {
    return [
      'Satu aturan ini membuang paket menuju port proxy yang kamu tulis, pada protokol dan chain yang dipilih.',
      'Chain forward memblokir pengguna LAN yang mencoba memakai proxy di internet, sedangkan chain input memblokir pihak luar yang mencoba memakai router sebagai proxy.',
      'Peringatan praktis: beberapa aplikasi sah juga memakai port 8080, jadi bila ada aplikasi yang tiba-tiba tidak bisa terhubung, periksa dulu apakah portnya ikut terblokir di sini.'
    ];
  }));

TOOLS.push(T('block-recursive-dns', 'firewall', 'Block Open Recursive DNS', 'Block Open Recursive DNS',
  'Tolak query DNS dari internet ke router, supaya router tidak dipakai orang luar sebagai open resolver untuk serangan amplifikasi.',
  [
    f('wan', 'Interface WAN', 'text', 'ether1', { mono: 1 })
  ],
  function (v) {
    return H('Block Open Recursive DNS') +
      '/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=udp dst-port=53 action=drop comment="Tolak query DNS UDP dari WAN"\n' +
      '/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=tcp dst-port=53 action=drop comment="Tolak query DNS TCP dari WAN"\n';
  },
  function () {
    return [
      'Aturan pertama membuang query DNS lewat UDP port 53 yang datang dari interface WAN.',
      'Aturan kedua melakukan hal yang sama untuk DNS lewat TCP port 53, karena DNS modern juga memakai TCP.',
      'Chain input dipakai karena query ini ditujukan ke router sendiri, bukan diteruskan ke perangkat lain.',
      'Peringatan praktis: aturan ini hanya menutup pintu dari WAN, perangkat LAN tetap bisa memakai router sebagai DNS seperti biasa, jadi jangan heran bila tes dari dalam LAN masih menjawab.'
    ];
  }));

TOOLS.push(T('block-port', 'firewall', 'Block Port', 'Block Port',
  'Tutup satu atau beberapa port rawan, misalnya port berbagi file Windows yang sering dipakai worm untuk menyebar di jaringan lokal.',
  [
    f('ports', 'Daftar port yang diblokir', 'text', '135,137-139,445', { mono: 1, help: 'Pisahkan dengan koma, rentang ditulis dengan tanda hubung, contoh 135,137-139,445.' }),
    f('proto', 'Protokol', 'select', 'tcp', { opts: ['tcp', 'udp'] }),
    f('chain', 'Chain firewall', 'select', 'forward', { opts: ['forward', 'input'] })
  ],
  function (v) {
    return H('Block Port') +
      '/ip firewall filter add chain=' + v.chain + ' protocol=' + v.proto + ' dst-port=' + v.ports + ' action=drop comment="Blokir port rawan"\n';
  },
  function () {
    return [
      'Satu aturan ini membuang paket menuju port yang kamu tulis, pada protokol dan chain yang dipilih.',
      'Nilai bawaan menutup port 135, 137 sampai 139, dan 445, yaitu port layanan berbagi file Windows yang paling sering dipakai worm dan ransomware.',
      'Peringatan praktis: menutup port 445 antar perangkat LAN akan mematikan berbagi file dan printer Windows di jaringan lokal, jadi pakai chain input bila hanya ingin menutupnya dari arah internet.'
    ];
  }));

TOOLS.push(T('bypass-local', 'firewall', 'Bypass Local Traffic', 'Bypass Local Traffic',
  'Beri jalan bebas untuk trafik antar perangkat di jaringan lokal yang sama, supaya tidak ikut tersaring aturan blokir di bawahnya.',
  [
    f('lan', 'Jaringan lokal (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr' }),
    f('komen', 'Komentar', 'text', 'Trafik lokal', { opt: 1 })
  ],
  function (v) {
    var s = '/ip firewall filter add chain=forward src-address=' + v.lan + ' dst-address=' + v.lan + ' action=accept';
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('Bypass Local Traffic') + s + '\n';
  },
  function () {
    return [
      'Satu aturan ini menerima semua paket yang sumber dan tujuannya sama-sama berada di jaringan lokal yang kamu isi.',
      'Karena firewall memproses aturan dari atas ke bawah, aturan ini harus diletakkan di atas aturan blokir, kalau tidak, trafik lokal keburu dibuang sebelum sampai ke aturan ini.',
      'Aturan ini berguna di jaringan dengan beberapa segmen, misalnya antar gedung, supaya komunikasi internal tetap lancar sementara aturan blokir tetap menjaga pintu ke internet.',
      'Peringatan praktis: aturan accept yang terlalu longgar bisa membuka celah, jadi batasi hanya ke jaringan lokal yang kamu isi, jangan ke alamat 0.0.0.0/0.'
    ];
  }));

TOOLS.push(T('block-web-l7', 'firewall', 'Block Website (Layer 7)', 'Block Website (Layer 7)',
  'Blokir situs memakai penyaring Layer 7: alamat yang mengandung kata atau domain dalam daftar dikenali dari isi paket lalu dibuang.',
  [
    f('daftar', 'Domain atau kata yang diblokir', 'textarea', 'situs-judi.contoh\nsitus-dewasa.contoh', { mono: 1, help: 'Satu domain atau kata per baris. Domain berakhiran .contoh adalah contoh penulisan, ganti dengan domain aslimu.' }),
    f('chain', 'Chain firewall', 'select', 'forward', { opts: ['forward', 'input'] }),
    f('komen', 'Komentar aturan', 'text', 'Situs diblokir (Layer 7)', { opt: 1 })
  ],
  function (v) {
    var words = String(v.daftar).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var esc = words.map(function (w) { return w.replace(/\./g, '\\.'); }).join('|');
    var L = [];
    L.push('/ip firewall layer7-protocol add name=blokir-situs-l7 regexp=' + q('^.+(' + esc + ').*$'));
    L.push('/ip firewall filter add chain=' + v.chain + ' layer7-protocol=blokir-situs-l7 action=drop comment=' + q(v.komen || 'Situs diblokir Layer 7'));
    return H('Block Website (Layer 7)') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Baris pertama membuat pola Layer 7 dari daftar yang kamu isi. Titik pada domain ditulis sebagai titik biasa di pola, jadi polanya hanya cocok dengan nama domain itu, bukan sembarang karakter.',
      'Aturan filter membuang paket yang isinya cocok dengan pola tersebut, pada chain yang kamu pilih.',
      'Keterbatasan yang jujur: situs modern memakai HTTPS, sehingga isi paketnya terenkripsi dan tidak bisa dibaca Layer 7. Pola ini hanya bekerja pada trafik HTTP yang tidak terenkripsi atau pada nama host yang masih terlihat.',
      'Untuk hasil yang lebih rapi, padukan dengan blokir lewat DNS statis (tool Block Website Static DNS), karena DNS melihat nama domain sebelum koneksi terenkripsi dibuat.'
    ];
  }));

TOOLS.push(T('block-web-dns', 'firewall', 'Block Website (Static DNS)', 'Block Website (Static DNS)',
  'Blokir situs lewat DNS statis router: nama domain dalam daftar dijawab dengan alamat pengalihan, jadi browser tidak pernah sampai ke situs aslinya.',
  [
    f('daftar', 'Domain yang diblokir', 'textarea', 'situs-judi.contoh\nsitus-dewasa.contoh', { mono: 1, help: 'Satu domain per baris. Domain berakhiran .contoh adalah contoh penulisan, ganti dengan domain aslimu.' }),
    f('tujuan', 'Alamat pengalihan (IP)', 'ip', '127.0.0.1', { v: 'ip', help: 'Alamat yang dikembalikan sebagai jawaban DNS. 127.0.0.1 membuat browser gagal tersambung.' }),
    f('remote', 'Nyalakan allow-remote-requests (klien LAN memakai DNS router)', 'check', true)
  ],
  function (v) {
    var lines = String(v.daftar).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var L = [];
    if (v.remote) { L.push('/ip dns set allow-remote-requests=yes'); }
    lines.forEach(function (d) { L.push('/ip dns static add name=' + d + ' address=' + v.tujuan + ' comment="Diblokir"'); });
    return H('Block Website (Static DNS)') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Setiap domain dalam daftar dibuatkan satu entri DNS statis yang menjawab dengan alamat pengalihan, bukan alamat asli situs itu.',
      'Supaya blokir ini terasa, perangkat klien harus memakai router sebagai DNS. Centang opsi pertama agar router menjawab pertanyaan DNS dari LAN, dan pastikan DHCP membagikan alamat router sebagai DNS.',
      'Entri ini hanya cocok untuk nama persis yang ditulis. Subdomain seperti www butuh entrinya sendiri, karena router tidak menebak nama turunan secara otomatis.',
      'Bila perangkat sudah memakai DNS lain secara manual (misalnya 8.8.8.8 langsung di HP), blokir ini tidak berlaku untuk perangkat itu. Tutup jalur itu dengan aturan firewall bila perlu.'
    ];
  }));

TOOLS.push(T('drop-invalid', 'firewall', 'Drop Invalid Packets', 'Drop Invalid Packets',
  'Buang paket berstatus connection-state invalid, yaitu paket yang tidak masuk akal dalam alur koneksi (sering dipakai pemindai dan serangan).',
  [
    f('chain', 'Chain firewall', 'select', 'both', { opts: [{ v: 'both', l: 'Input dan forward' }, { v: 'input', l: 'Input saja' }, { v: 'forward', l: 'Forward saja' }] }),
    f('log', 'Catat paket yang dibuang ke log', 'check', false)
  ],
  function (v) {
    var chains = v.chain === 'both' ? ['input', 'forward'] : [v.chain];
    var L = [];
    chains.forEach(function (c) {
      L.push('/ip firewall filter add chain=' + c + ' connection-state=invalid action=drop' + (v.log ? ' log=yes' : '') + ' comment="Buang paket invalid"');
    });
    return H('Drop Invalid Packets') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Paket invalid adalah paket yang tidak cocok dengan koneksi mana pun yang sedang berjalan, misalnya balasan untuk koneksi yang sudah ditutup, atau paket dengan kombinasi flag TCP yang tidak wajar.',
      'Aturan ini sebaiknya diletakkan sesudah aturan terima untuk koneksi established dan related, supaya paket sah yang sedang berjalan tidak ikut dibuang.',
      'Opsi log hanya untuk diagnosis sesaat. Bila dinyalakan terus, log bisa penuh dengan cepat saat ada pemindaian, jadi matikan lagi setelah selesai memeriksa.'
    ];
  }));

TOOLS.push(T('drop-traceroute', 'firewall', 'Drop Traceroute', 'Drop Traceroute',
  'Sembunyikan router dari traceroute: balasan time-exceeded tidak dikirim dan paket UDP traceroute tidak diteruskan.',
  [
    f('icmp', 'Blokir balasan time-exceeded (ICMP tipe 11)', 'check', true, { help: 'Router tidak lagi membalas paket yang TTL-nya habis, jadi namanya tidak muncul sebagai hop.' }),
    f('udp', 'Blokir UDP traceroute (port 33434 sampai 33534)', 'check', true)
  ],
  function (v) {
    var L = [];
    if (v.icmp) { L.push('/ip firewall filter add chain=output protocol=icmp icmp-options=11:0 action=drop comment="Sembunyikan hop traceroute"'); }
    if (v.udp) { L.push('/ip firewall filter add chain=forward protocol=udp dst-port=33434-33534 action=drop comment="Blokir UDP traceroute"'); }
    if (!L.length) { L.push('# Kedua opsi tidak dicentang, tidak ada aturan yang dibuat. Centang minimal satu opsi.'); }
    return H('Drop Traceroute') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Traceroute bekerja dengan mengirim paket yang TTL-nya sengaja dibuat habis di tiap hop, lalu menunggu balasan time-exceeded dari hop itu. Aturan pertama membuang balasan tersebut, sehingga router ini tidak muncul sebagai hop.',
      'Aturan kedua membuang paket UDP pada rentang port yang dipakai traceroute Unix, sehingga traceroute dari LAN ke internet juga terhenti di router ini.',
      'Peringatan praktis: alat diagnosis jaringan milikmu sendiri juga ikut buta terhadap hop ini, jadi matikan sementara aturan ini saat kamu sedang melacak gangguan rute.',
      'Menyembunyikan hop bukan membuat router tidak terlihat sepenuhnya. Pemindai masih bisa menemukan router lewat cara lain, jadi ini hanya lapisan tambahan, bukan pengganti firewall.'
    ];
  }));

TOOLS.push(T('fasttrack', 'firewall', 'Enable Fasttrack', 'Enable Fasttrack',
  'Aktifkan FastTrack untuk koneksi yang sudah berjalan, supaya paket diteruskan langsung tanpa melewati antrean firewall yang berat.',
  [
    f('terima', 'Tambahkan aturan terima koneksi berjalan sesudahnya', 'check', true, { help: 'Aturan accept pendamping untuk koneksi established dan related yang tidak kena FastTrack.' }),
    f('komen', 'Komentar aturan', 'text', 'Fasttrack koneksi berjalan', { opt: 1 })
  ],
  function (v) {
    var L = [];
    L.push('/ip firewall filter add chain=forward action=fasttrack-connection connection-state=established,related comment=' + q(v.komen || 'Fasttrack koneksi berjalan'));
    if (v.terima) { L.push('/ip firewall filter add chain=forward action=accept connection-state=established,related comment="Terima koneksi berjalan"'); }
    return H('Enable Fasttrack') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Aturan FastTrack hanya menyentuh koneksi yang sudah berjalan (established) dan yang berkaitan dengannya. Koneksi baru tetap lewat firewall seperti biasa, jadi aturan blokir untuk koneksi baru tetap berlaku.',
      'Aturan ini harus berada di urutan paling atas pada chain forward. Bila ada aturan lain di atasnya, paket keburu diproses aturan itu sebelum sampai ke FastTrack.',
      'Paket yang sudah di-FastTrack melewatkan firewall, queue, dan mangle. Artinya pembagian bandwidth dan penandaan paket tidak lagi berlaku untuk koneksi tersebut, jadi jangan nyalakan FastTrack bila queue adalah kebutuhan utama jaringanmu.',
      'Saat mendiagnosis gangguan, matikan sementara aturan FastTrack, karena paket yang melompatinya tidak tercatat di hitungan aturan firewall.'
    ];
  }));

TOOLS.push(T('protect-btest', 'firewall', 'Protect Btest Server', 'Protect Btest Server',
  'Amankan server Bandwidth Test (port 2000): matikan bila tidak dipakai, atau kunci dengan login dan batasi sumbernya ke jaringan lokal.',
  [
    f('mode', 'Mode perlindungan', 'select', 'off', { opts: [{ v: 'off', l: 'Matikan server btest' }, { v: 'limit', l: 'Batasi: wajib login dan hanya dari LAN' }] }),
    f('lan', 'Jaringan yang diizinkan (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr', help: 'Dipakai bila mode di atas "Batasi". Di luar jaringan ini, percobaan btest dibuang firewall.' })
  ],
  function (v) {
    var L = [];
    if (v.mode === 'off') {
      L.push('/tool bandwidth-server set enabled=no');
    } else {
      L.push('/tool bandwidth-server set enabled=yes authenticate=yes max-sessions=5');
      L.push('/ip firewall filter add chain=input protocol=tcp dst-port=2000 src-address=!' + v.lan + ' action=drop comment="Btest hanya dari LAN"');
    }
    return H('Protect Btest Server') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Server Bandwidth Test menerima perintah uji kecepatan dari siapa saja. Tanpa pengaman, orang luar bisa membanjiri CPU dan bandwidth router hanya dengan menjalankan tes berulang kali.',
      'Mode matikan adalah yang paling aman dan cukup untuk kebanyakan router, karena tes kecepatan biasanya hanya dibutuhkan sesekali.',
      'Mode batasi menyalakan autentikasi, jadi penguji wajib login dengan akun router, membatasi lima sesi bersamaan, dan menutup port 2000 dari semua alamat di luar jaringan yang kamu isi.',
      'Bila mode batasi dipilih, pastikan alamat laptop penguji masuk ke jaringan yang diizinkan, dan ingat password akun router saat menjalankan tes.'
    ];
  }));

TOOLS.push(T('protect-mac-server', 'firewall', 'Protect Mac Server', 'Protect Mac Server',
  'Batasi layanan MAC server ke daftar interface tertentu, supaya router tidak bisa dijangkau lewat alamat MAC dari sembarang port.',
  [
    f('daftar', 'Nama interface list yang diizinkan', 'text', 'LAN', { mono: 1, help: 'Daftar interface bawaan RouterOS: LAN, WAN, all, none. Pakai LAN agar hanya port LAN yang bisa MAC Telnet dan MAC Winbox.' }),
    f('ping', 'Matikan ping lewat MAC server', 'check', true),
    f('winbox', 'Matikan MAC Winbox', 'check', false, { help: 'Bila dicentang, router tidak lagi bisa dibuka lewat MAC address di Winbox. Pastikan akses IP ke router sudah aman dulu.' })
  ],
  function (v) {
    var L = [];
    L.push('/tool mac-server set allowed-interface-list=' + v.daftar);
    if (v.winbox) { L.push('/tool mac-server mac-winbox set enabled=no'); }
    else { L.push('/tool mac-server mac-winbox set allowed-interface-list=' + v.daftar); }
    if (v.ping) { L.push('/tool mac-server ping set enabled=no'); }
    return H('Protect Mac Server') + L.join('\n') + '\n';
  },
  function () {
    return [
      'MAC server memungkinkan akses ke router lewat alamat MAC tanpa perlu alamat IP. Itu penyelamat saat IP router lupa, tetapi juga pintu masuk bagi siapa saja yang tersambung ke port yang sama.',
      'Baris pertama membatasi MAC Telnet ke daftar interface yang kamu isi, biasanya LAN, sehingga port WAN tidak lagi bisa dipakai untuk mengetuk router lewat MAC.',
      'Baris kedua melakukan hal yang sama untuk MAC Winbox, kecuali bila kamu memilih mematikannya sekalian.',
      'Ping lewat MAC berguna untuk memeriksa kabel, tetapi jarang dibutuhkan sehari-hari, jadi dimatikan secara bawaan di sini.'
    ];
  }));

TOOLS.push(T('protect-neighbor', 'firewall', 'Protect Neighbors Discovery', 'Protect Neighbors Discovery',
  'Atur siapa yang boleh melihat router lewat Neighbor Discovery (MNDP, CDP, LLDP): batasi ke interface LAN atau matikan sama sekali.',
  [
    f('mode', 'Mode perlindungan', 'select', 'limit', { opts: [{ v: 'limit', l: 'Batasi ke interface list tertentu' }, { v: 'off', l: 'Matikan discovery sepenuhnya' }] }),
    f('daftar', 'Nama interface list yang diizinkan', 'text', 'LAN', { mono: 1, help: 'Dipakai bila mode di atas "Batasi". Daftar bawaan: LAN, WAN, all, none.' })
  ],
  function (v) {
    var list = v.mode === 'off' ? 'none' : v.daftar;
    return H('Protect Neighbors Discovery') +
      '/ip neighbor discovery-settings set discover-interface-list=' + list + '\n';
  },
  function () {
    return [
      'Neighbor Discovery membuat router mengumumkan identitasnya (nama, alamat, dan versi) ke perangkat tetangga, supaya Winbox dan The Dude bisa menemukannya otomatis.',
      'Pengumuman ini juga bisa dibaca pihak yang tidak berkepentingan, misalnya penyusup yang sudah masuk ke satu segmen jaringan. Membatasinya ke interface LAN menutup pengumuman ke arah WAN.',
      'Mode matikan sepenuhnya berguna untuk router yang menghadap internet langsung, tetapi Winbox tidak lagi bisa menemukan router ini lewat daftar Neighbors, jadi catat alamat IP-nya sebelum mematikan.',
      'Perubahan ini tidak memengaruhi koneksi yang sudah berjalan. Ia hanya mengatur ke mana pengumuman discovery dikirim.'
    ];
  }));


TOOLS.push(T('remove-all-firewall', 'firewall', 'Remove All Firewall', 'Remove All Firewall',
  'Hapus semua aturan firewall sekaligus: filter, NAT, mangle, dan pilihan lain. BERBAHAYA: router kehilangan semua proteksi dan semua port forwarding. Buat backup dulu sebelum menjalankan.',
  [
    f('cadangan', 'Buat backup konfigurasi (.rsc) dulu', 'check', true, { help: 'Menyimpan salinan konfigurasi lengkap ke menu Files sebelum ada yang dihapus.' }),
    f('filter', 'Hapus semua aturan filter', 'check', true),
    f('nat', 'Hapus semua aturan NAT', 'check', true),
    f('mangle', 'Hapus semua aturan mangle', 'check', true),
    f('raw', 'Hapus juga aturan raw', 'check', false, { help: 'Raw memproses paket sebelum connection tracking. Biasanya hanya dipakai teknisi lanjutan.' }),
    f('addrlist', 'Hapus semua address list', 'check', false, { help: 'Address list dipakai aturan blokir dan pisah trafik. Menghapusnya membuat aturan yang merujuk daftar itu kehilangan targetnya.' }),
    f('l7', 'Hapus semua protokol Layer 7', 'check', false, { help: 'Protokol Layer 7 dipakai untuk mengenali isi paket, misalnya untuk memblokir situs tertentu.' })
  ],
  function (v) {
    var L = [];
    if (v.cadangan) { L.push('/export file=backup-sebelum-hapus-firewall'); }
    if (v.filter) { L.push('/ip firewall filter remove [find]'); }
    if (v.nat) { L.push('/ip firewall nat remove [find]'); }
    if (v.mangle) { L.push('/ip firewall mangle remove [find]'); }
    if (v.raw) { L.push('/ip firewall raw remove [find]'); }
    if (v.addrlist) { L.push('/ip firewall address-list remove [find]'); }
    if (v.l7) { L.push('/ip firewall layer7-protocol remove [find]'); }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang dihapus. Centang minimal satu kelompok.'); }
    return H('Remove All Firewall') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Filter adalah dinding pelindung router: menghapus semua aturannya berarti semua paket dibiarkan lewat, termasuk yang tadinya diblokir dari internet.',
      'NAT mengatur masquerade dan port forwarding. Setelah dihapus, perangkat LAN tidak lagi bisa ke internet dan layanan yang dipublikasikan lewat port forwarding ikut mati.',
      'Mangle dipakai untuk menandai paket (pisah trafik, prioritas, dan load balancing). Menghapusnya membuat queue dan policy routing yang bergantung pada tanda itu berhenti bekerja.',
      'Backup .rsc menyimpan seluruh konfigurasi ke menu Files. Bila penghapusan ternyata salah, pulihkan dengan menjalankan berkas backup itu dari terminal.',
      'Jalankan script ini hanya dari koneksi yang aman (kabel atau MAC Winbox), karena setelah filter hilang, akses ke router menjadi terbuka dari semua arah.'
    ];
  }));


TOOLS.push(T('fasttrack-generator', 'firewall', 'Generator Script Fasttrack', 'Fasttrack Script Generator',
  'Racik script FastTrack lengkap: tandai koneksi VPN agar tidak difasttrack, lewati koneksi bertanda bila perlu, lalu terima koneksi berjalan dan buang paket invalid.',
  [
    f('vpniface', 'Nama interface VPN', 'text', 'wg0', { mono: 1, help: 'Nama interface VPN. Hanya dipakai bila kecualikan VPN dicentang.' }),
    f('vpn', 'Kecualikan trafik VPN dari fasttrack', 'check', true, { help: 'Trafik VPN dilewati fasttrack karena enkripsi dan routing bertanda butuh pemrosesan penuh.' }),
    f('tandai', 'Jangan fasttrack koneksi yang sudah ditandai mangle', 'check', false, { help: 'Bila dicentang, koneksi yang sudah diberi tanda oleh mangle, misalnya untuk queue atau routing, tetap diproses penuh dan tidak difasttrack.' }),
    f('invalid', 'Buang juga paket invalid sesudahnya', 'check', true)
  ],
  function (v) {
    var L = [];
    L.push('# Fasttrack harus berada di urutan paling atas chain forward. Bila ada aturan lain di atasnya, pindahkan aturan ini ke atas lewat Winbox.');
    if (v.vpn) {
      L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.vpniface + ' action=mark-connection new-connection-mark=vpn-conn passthrough=yes comment="Tandai koneksi VPN agar tidak difasttrack"');
    }
    var tandai = v.tandai ? ' connection-mark=no-mark' : (v.vpn ? ' connection-mark=!vpn-conn' : '');
    L.push('/ip firewall filter add chain=forward connection-state=established,related' + tandai + ' action=fasttrack-connection comment="Fasttrack koneksi berjalan"');
    L.push('/ip firewall filter add chain=forward connection-state=established,related action=accept comment="Terima koneksi berjalan"');
    if (v.invalid) { L.push('/ip firewall filter add chain=forward connection-state=invalid action=drop comment="Buang paket invalid"'); }
    return H('Generator Script Fasttrack') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Aturan FastTrack hanya menyentuh koneksi yang sudah berjalan (established) dan yang berkaitan dengannya. Koneksi baru tetap lewat firewall seperti biasa, jadi aturan blokir untuk koneksi baru tetap berlaku.',
      'Paket yang sudah di-FastTrack melewatkan firewall, queue, dan mangle. Karena itu koneksi VPN dan koneksi bertanda bisa dikecualikan, supaya enkripsi dan pembagian bandwidth tetap bekerja.',
      'Aturan ini harus berada di urutan paling atas pada chain forward. Bila ada aturan lain di atasnya, paket keburu diproses aturan itu sebelum sampai ke FastTrack.',
      'Saat mendiagnosis gangguan, matikan sementara aturan FastTrack, karena paket yang melompatinya tidak tercatat di hitungan aturan firewall.'
    ];
  }));

TOOLS.push(T('remote-access-publik', 'firewall', 'Akses Jarak Jauh dari IP Publik Statis', 'Remote Access ISP "Public IP Static"',
  'Kunci Winbox dan SSH supaya hanya bisa dibuka dari satu alamat IP publik statismu. Upaya masuk dari alamat lain langsung dibuang.',
  [
    f('ip', 'Alamat IP publik statis pengelola', 'ip', '203.0.113.50', { v: 'ip', help: 'Alamat IP publik di lokasi pengelola. Hanya alamat ini yang boleh masuk. Nilai 203.0.113.50 adalah contoh dari blok dokumentasi, ganti dengan IP aslimu.' }),
    f('winbox', 'Izinkan Winbox (port 8291)', 'check', true),
    f('ssh', 'Izinkan SSH (port 22)', 'check', false),
    f('wan', 'Interface WAN', 'text', 'ether1', { mono: 1 })
  ],
  function (v) {
    var L = [];
    L.push('# Hanya IP pengelola yang boleh menyentuh layanan jarak jauh router');
    if (v.winbox) {
      L.push('/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=tcp dst-port=8291 src-address=' + v.ip + ' action=accept comment="Winbox hanya dari IP pengelola"');
      L.push('/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=tcp dst-port=8291 src-address=!' + v.ip + ' action=drop comment="Tolak Winbox dari IP lain"');
    }
    if (v.ssh) {
      L.push('/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=tcp dst-port=22 src-address=' + v.ip + ' action=accept comment="SSH hanya dari IP pengelola"');
      L.push('/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=tcp dst-port=22 src-address=!' + v.ip + ' action=drop comment="Tolak SSH dari IP lain"');
    }
    if (!v.winbox && !v.ssh) { L.push('# Tidak ada layanan yang dipilih, tidak ada aturan yang dibuat. Centang minimal satu layanan.'); }
    return H('Akses Jarak Jauh dari IP Publik Statis') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Setiap layanan yang dipilih mendapat dua aturan: terima dari IP pengelola, lalu buang dari semua alamat lain. Aturan terima harus berada di atas aturan buang.',
      'Tanda seru pada src-address=!IP berarti "semua alamat kecuali IP ini". Itulah yang membuat kunci ini bekerja.',
      'Tool ini hanya aman untuk IP publik yang benar benar statis. Bila IP lokasimu berubah karena DHCP ISP, kamu terkunci dari routermu sendiri sampai datang langsung ke lokasinya.',
      'Uji dulu dari alamat IP yang diizinkan sebelum menutup sesi Winbox yang sedang berjalan, supaya ada jalan kembali bila ada yang keliru.'
    ];
  }));

TOOLS.push(T('sembunyi-isp', 'firewall', 'Sembunyikan Routerboard dari ISP', 'MikroTik Ninja: Hide Routerboard from ISP',
  'Sembunyikan router dari sisi ISP: matikan neighbor discovery ke WAN, matikan MAC server dan MAC Winbox, matikan bandwidth test, dan bila mau, samarkan nama identitas.',
  [
    f('wan', 'Interface WAN (arah ISP)', 'text', 'ether1', { mono: 1 }),
    f('lan', 'Interface LAN (tetap boleh melihat router)', 'text', 'ether2', { mono: 1 }),
    f('discovery', 'Matikan neighbor discovery ke arah ISP', 'check', true, { help: 'Router tidak lagi mengumumkan dirinya lewat discovery di semua interface kecuali LAN.' }),
    f('macserver', 'Matikan MAC server dan MAC Winbox', 'check', true, { help: 'Setelah ini Winbox hanya bisa lewat alamat IP, bukan lewat alamat MAC.' }),
    f('btest', 'Matikan server bandwidth test', 'check', true),
    f('identity', 'Samarkan nama identitas router', 'check', false),
    f('nama', 'Nama identitas baru', 'text', 'Router', { help: 'Hanya dipakai bila samarkan identitas dicentang.' })
  ],
  function (v) {
    var L = [];
    if (v.discovery) {
      L.push('/ip neighbor discovery set [find] discover=no');
      L.push('/ip neighbor discovery set [find interface=' + v.lan + '] discover=yes');
    }
    if (v.macserver) {
      L.push('/tool mac-server set allowed-interface-list=none');
      L.push('/tool mac-server mac-winbox set allowed-interface-list=none');
      L.push('/tool mac-server ping set enabled=no');
    }
    if (v.btest) { L.push('/tool bandwidth-server set enabled=no'); }
    if (v.identity) { L.push('/system identity set name=' + v.nama); }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang disembunyikan. Centang minimal satu pilihan.'); }
    return H('Sembunyikan Routerboard dari ISP') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Neighbor discovery dimatikan di semua interface lalu dinyalakan lagi hanya untuk LAN, jadi perangkat di sisi ISP tidak lagi melihat router, tetapi perangkat LAN tetap bisa menemukannya.',
      'MAC server yang dimatikan berarti Winbox dan Telnet lewat alamat MAC berhenti total. Itu disengaja: akses MAC adalah jalur yang tidak butuh alamat IP dan sering dipakai pemindai jaringan.',
      'Server bandwidth test yang menyala bisa dipakai orang luar untuk membebani CPU router. Mematikannya menghemat CPU dan menutup satu pintu yang terlihat dari luar.',
      'Menyamarkan identitas hanya mengubah nama yang tampil. Ini bukan keamanan sungguhan, hanya membuat router tidak langsung dikenali dari namanya.'
    ];
  }));

TOOLS.push(T('proteksi-lanjut', 'firewall', 'Proteksi Lanjutan RouterOS', 'Advanced MikroTik Router-OS Protection',
  'Paket proteksi tingkat lanjut: blokir alamat bogon dari WAN, proteksi SYN flood, tahan amplifikasi DNS, batasi koneksi baru, dan rapikan layanan.',
  [
    f('wan', 'Interface WAN', 'text', 'ether1', { mono: 1 }),
    f('bogon', 'Blokir alamat bogon dari WAN', 'check', true, { help: 'Alamat bogon adalah alamat yang tidak seharusnya muncul dari internet, misalnya alamat privat dan alamat dokumentasi.' }),
    f('syn', 'Nyalakan proteksi SYN flood (TCP syncookies)', 'check', true),
    f('dnsamp', 'Blokir amplifikasi DNS dari WAN (UDP 53)', 'check', true, { help: 'Mencegah router dipakai sebagai penguat serangan DNS ke korban lain.' }),
    f('limit', 'Batasi koneksi baru per IP', 'check', true),
    f('batas', 'Batas koneksi baru per IP', 'number', 100, { v: 'num', min: 10, max: 1000 }),
    f('gantiport', 'Pindah port Winbox ke nomor lain', 'check', false, { help: 'Bila dicentang, port layanan Winbox diubah. Ingat port barunya, dan sesuaikan aturan firewall yang menyebut port 8291.' }),
    f('portbaru', 'Port Winbox baru', 'number', 8291, { v: 'port' }),
    f('layanan', 'Matikan layanan lama (Telnet, FTP, WWW, API)', 'check', true)
  ],
  function (v) {
    var L = [];
    L.push('# Terima koneksi yang sudah berjalan dan yang berkaitan');
    L.push('/ip firewall filter add chain=input connection-state=established,related action=accept comment="Terima koneksi berjalan"');
    L.push('/ip firewall filter add chain=forward connection-state=established,related action=accept comment="Terima koneksi berjalan"');
    L.push('/ip firewall filter add chain=input connection-state=invalid action=drop comment="Buang paket invalid"');
    L.push('/ip firewall filter add chain=forward connection-state=invalid action=drop comment="Buang paket invalid"');
    if (v.bogon) {
      L.push('# Daftar alamat bogon: alamat yang tidak seharusnya muncul dari internet');
      ['0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '169.254.0.0/16', '172.16.0.0/12', '192.0.2.0/24', '192.168.0.0/16', '198.51.100.0/24', '203.0.113.0/24', '224.0.0.0/4', '240.0.0.0/4'].forEach(function (a) { L.push('/ip firewall address-list add list=bogon address=' + a + ' comment="Alamat bogon"'); });
      L.push('/ip firewall filter add chain=input in-interface=' + v.wan + ' src-address-list=bogon action=drop comment="Buang trafik dari alamat bogon"');
    }
    if (v.syn) { L.push('/ip settings set tcp-syncookies=yes'); }
    if (v.dnsamp) { L.push('/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=udp dst-port=53 action=drop comment="Tolak DNS dari WAN agar router tidak jadi penguat serangan"'); }
    if (v.limit) { L.push('/ip firewall filter add chain=input in-interface=' + v.wan + ' protocol=tcp connection-limit=' + v.batas + ',32 action=drop comment="Batasi koneksi baru per IP"'); }
    if (v.gantiport) { L.push('/ip service set winbox port=' + v.portbaru); }
    if (v.layanan) { L.push('/ip service disable telnet,ftp,www,api,api-ssl'); }
    L.push('# Catatan: tambahkan aturan terima dari jaringan pengelola sebelum aturan drop umum milikmu, agar kamu tidak terkunci dari routermu sendiri.');
    return H('Proteksi Lanjutan RouterOS') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Alamat bogon adalah alamat yang secara aturan tidak boleh menjadi sumber trafik internet. Membuangnya di pintu masuk menutup banyak pola serangan palsu sekaligus.',
      'SYN cookies membuat router tetap bisa menjawab jabat tangan TCP baru walau sedang dibanjiri permintaan SYN palsu, tanpa menyimpan antrean besar di memori.',
      'Serangan amplifikasi DNS memakai server DNS yang terbuka untuk membanjiri korban. Menutup port 53 dari WAN mencegah routermu dipakai sebagai penguat serangan itu.',
      'Batas koneksi baru melindungi CPU dari satu IP yang membuka koneksi berulang kali. Nilai yang terlalu kecil bisa mengganggu jaringan padat, jadi naikkan bila keluhan muncul.',
      'Memindah port Winbox hanya mengaburkan, bukan mengamankan. Tetap kunci akses Winbox dengan aturan firewall, misalnya lewat tool Akses Jarak Jauh dari IP Publik Statis.'
    ];
  }));

TOOLS.push(T('block-websites-generator', 'firewall', 'Generator Blokir Situs', 'Block Websites Generator',
  'Blokir situs per kategori (judi, dewasa, media sosial, game, streaming) ditambah domain buatanmu, dengan jadwal jam blokir bila perlu.',
  [
    f('judi', 'Kategori judi', 'check', true),
    f('dewasa', 'Kategori dewasa', 'check', true),
    f('sosmed', 'Kategori media sosial', 'check', false),
    f('game', 'Kategori game', 'check', false),
    f('streaming', 'Kategori streaming', 'check', false),
    f('custom', 'Domain tambahan', 'textarea', '', { mono: 1, opt: 1, help: 'Satu domain per baris. Domain berakhiran .contoh adalah contoh penulisan, ganti dengan domain aslimu.' }),
    f('jadwal', 'Aktifkan jadwal jam blokir', 'check', false, { help: 'Bila dicentang, aturan blokir hanya berlaku pada jam dan hari yang dipilih. Jam router harus benar, atur NTP dulu.' }),
    f('mulai', 'Jam mulai blokir', 'text', '21:00', { help: 'Format jam:menit. Hanya dipakai bila jadwal dicentang.' }),
    f('selesai', 'Jam selesai blokir', 'text', '06:00', { help: 'Format jam:menit. Hanya dipakai bila jadwal dicentang.' }),
    f('hari', 'Hari berlaku', 'select', 'Setiap hari', { opts: ['Setiap hari', 'Senin sampai Jumat', 'Akhir pekan'] })
  ],
  function (v) {
    var kat = [];
    if (v.judi) { kat.push({ nama: 'Judi', list: 'blokir-judi', domain: ['judol-contoh.com', 'togel-contoh.com', 'slot-contoh.com'] }); }
    if (v.dewasa) { kat.push({ nama: 'Dewasa', list: 'blokir-dewasa', domain: ['dewasa-contoh.com', 'porno-contoh.com'] }); }
    if (v.sosmed) { kat.push({ nama: 'Media sosial', list: 'blokir-sosmed', domain: ['facebook.com', 'instagram.com', 'x.com', 'tiktok.com'] }); }
    if (v.game) { kat.push({ nama: 'Game', list: 'blokir-game', domain: ['roblox.com', 'steamcommunity.com', 'epicgames.com'] }); }
    if (v.streaming) { kat.push({ nama: 'Streaming', list: 'blokir-streaming', domain: ['youtube.com', 'netflix.com', 'twitch.tv'] }); }
    var L = [];
    function jam(s) { var t = String(s).trim(); return t.length === 5 ? t + ':00' : t; }
    var waktu = '';
    if (v.jadwal) {
      var hari = v.hari === 'Senin sampai Jumat' ? 'mon,tue,wed,thu,fri' : (v.hari === 'Akhir pekan' ? 'sat,sun' : 'sun,mon,tue,wed,thu,fri,sat');
      waktu = ' time=' + jam(v.mulai) + '-' + jam(v.selesai) + ',' + hari;
    }
    kat.forEach(function (k) {
      L.push('# Kategori ' + k.nama);
      k.domain.forEach(function (d) { L.push('/ip firewall address-list add list=' + k.list + ' address=' + d + ' comment=' + q(k.nama)); });
      L.push('/ip firewall filter add chain=forward dst-address-list=' + k.list + ' action=drop' + waktu + ' comment=' + q('Blokir ' + k.nama));
    });
    var custom = String(v.custom).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (custom.length) {
      L.push('# Domain tambahan');
      custom.forEach(function (d) { L.push('/ip firewall address-list add list=blokir-custom address=' + d + ' comment="Blokir tambahan"'); });
      L.push('/ip firewall filter add chain=forward dst-address-list=blokir-custom action=drop' + waktu + ' comment="Blokir domain tambahan"');
    }
    if (!L.length) { L.push('# Tidak ada kategori yang dipilih dan tidak ada domain tambahan, tidak ada aturan yang dibuat.'); }
    return H('Generator Blokir Situs') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Setiap kategori punya address list sendiri, jadi kamu bisa menyalakan atau mematikan satu kategori tanpa mengganggu kategori lain.',
      'Address list berisi domain akan diterjemahkan RouterOS menjadi alamat IP secara berkala lewat DNS. Aturan forward membuang setiap paket yang tujuannya masuk daftar itu.',
      'Jadwal memakai jam router, jadi pastikan NTP sudah sinkron. Rentang jam yang melewati tengah malam, misalnya 21:00 sampai 06:00, didukung langsung oleh pencocok waktu firewall.',
      'Keterbatasan yang jujur: situs modern memakai HTTPS dan banyak domain bersama di CDN, jadi pemblokiran di tingkat IP tidak selalu presisi. Domain berakhiran .contoh wajib diganti dengan domain asli yang mau diblokir.'
    ];
  }));

TOOLS.push(T('blokir-aplikasi', 'firewall', 'Blokir YouTube, TikTok, WA, FB, dan Lainnya', 'Block For Youtube, Tiktok, WA, FB, etc.',
  'Blokir aplikasi populer dengan sekali centang: YouTube, TikTok, WhatsApp, Facebook, dan Instagram.',
  [
    f('yt', 'YouTube', 'check', true),
    f('tt', 'TikTok', 'check', true),
    f('wa', 'WhatsApp', 'check', false),
    f('fb', 'Facebook', 'check', false),
    f('ig', 'Instagram', 'check', false)
  ],
  function (v) {
    var apps = [];
    if (v.yt) { apps.push({ nama: 'YouTube', list: 'blokir-yt', domain: ['youtube.com', 'googlevideo.com', 'ytimg.com', 'ggpht.com'] }); }
    if (v.tt) { apps.push({ nama: 'TikTok', list: 'blokir-tt', domain: ['tiktok.com', 'tiktokcdn.com', 'ibytedtos.com'] }); }
    if (v.wa) { apps.push({ nama: 'WhatsApp', list: 'blokir-wa', domain: ['whatsapp.com', 'whatsapp.net'] }); }
    if (v.fb) { apps.push({ nama: 'Facebook', list: 'blokir-fb', domain: ['facebook.com', 'fbcdn.net'] }); }
    if (v.ig) { apps.push({ nama: 'Instagram', list: 'blokir-ig', domain: ['instagram.com', 'cdninstagram.com'] }); }
    var L = [];
    apps.forEach(function (a) {
      L.push('# Aplikasi ' + a.nama);
      a.domain.forEach(function (d) { L.push('/ip firewall address-list add list=' + a.list + ' address=' + d + ' comment=' + q(a.nama)); });
      L.push('/ip firewall filter add chain=forward dst-address-list=' + a.list + ' action=drop comment=' + q('Blokir ' + a.nama));
    });
    if (!L.length) { L.push('# Tidak ada aplikasi yang dipilih, tidak ada aturan yang dibuat. Centang minimal satu aplikasi.'); }
    return H('Blokir YouTube, TikTok, WA, FB, dan Lainnya') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Setiap aplikasi punya address list sendiri dengan domain domain utamanya, jadi satu aplikasi bisa dibuka lagi tanpa mengganggu blokir aplikasi lain.',
      'RouterOS menyelesaikan domain dalam address list menjadi alamat IP secara berkala lewat DNS, lalu aturan forward membuang paket menuju alamat itu.',
      'Keterbatasan yang jujur: aplikasi besar memakai banyak domain dan CDN bersama, jadi sebagian konten bisa tetap lolos lewat domain yang belum terdaftar. Tambahkan domain yang lolos ke address list yang sama.',
      'Blokir ini berlaku untuk semua perangkat di LAN. Bila ada perangkat yang harus tetap bisa membuka aplikasi itu, buat pengecualian dengan aturan accept di atas aturan drop ini.'
    ];
  }));

/* ================= Kategori: Queue ================= */

TOOLS.push(T('simple-queue', 'queue', 'Simple Queue per Target', 'Simple Queue per Target',
  'Batasi kecepatan satu alamat IP atau satu jaringan dengan simple queue, opsional dengan burst.',
  [
    f('nama', 'Nama antrean', 'text', 'Pelanggan-01', {}),
    f('target', 'Target (IP atau CIDR)', 'cidr', '192.168.88.10/32', { v: 'cidr', help: 'Akhiran /32 berarti tepat satu perangkat.' }),
    f('up', 'Batas unggah (max-limit up)', 'text', '2M', { mono: 1, ph: '2M' }),
    f('down', 'Batas unduh (max-limit down)', 'text', '5M', { mono: 1, ph: '5M' }),
    f('burstOn', 'Aktifkan burst', 'check', false),
    f('burstUp', 'Burst unggah', 'text', '4M', { mono: 1 }),
    f('burstDown', 'Burst unduh', 'text', '10M', { mono: 1 }),
    f('limitAt', 'Limit terjamin (limit-at, format up/down)', 'text', '', { mono: 1, opt: 1, ph: '1M/2M' })
  ],
  function (v) {
    var s = '/queue simple add name=' + q(v.nama) + ' target=' + v.target + ' max-limit=' + v.up + '/' + v.down;
    if (v.burstOn) {
      var bu = rateToK(v.burstUp); var bd = rateToK(v.burstDown);
      if (bu && bd) {
        s += ' burst-limit=' + v.burstUp + '/' + v.burstDown +
          ' burst-threshold=' + fmtK(Math.round(bu * 0.75)) + '/' + fmtK(Math.round(bd * 0.75)) + ' burst-time=8s/8s';
      }
    }
    if (v.limitAt) { s += ' limit-at=' + v.limitAt; }
    return H('Simple Queue per Target') + s + '\n';
  },
  function () {
    return [
      'Max-limit adalah langit langit kecepatan target ini, ditulis sebagai unggah lalu unduh.',
      'Burst memberi lonjakan singkat di atas max-limit selama rata rata pemakaian masih di bawah threshold (75 persen dari burst limit).',
      'Limit-at adalah jatah terjamin yang dipesan untuk target ini bila ia berada di bawah antrean induk. Kosongkan bila antrean berdiri sendiri.'
    ];
  }));

TOOLS.push(T('queue-tree-pcq', 'queue', 'Queue Tree dengan PCQ', 'Queue Tree with PCQ',
  'Bagi bandwidth secara adil ke banyak pengguna memakai PCQ, cara klasik untuk warnet, kos, dan RT RW net.',
  [
    f('parent', 'Parent antrean', 'text', 'global', { mono: 1 }),
    f('totalDown', 'Total unduh semua pengguna', 'text', '50M', { mono: 1 }),
    f('totalUp', 'Total unggah semua pengguna', 'text', '20M', { mono: 1 }),
    f('perDown', 'Jatah PCQ per pengguna unduh', 'text', '5M', { mono: 1 }),
    f('perUp', 'Jatah PCQ per pengguna unggah', 'text', '2M', { mono: 1 })
  ],
  function (v) {
    var L = [];
    L.push('/queue type add name=pcq-unduh kind=pcq pcq-rate=' + v.perDown + ' pcq-classifier=dst-address');
    L.push('/queue type add name=pcq-unggah kind=pcq pcq-rate=' + v.perUp + ' pcq-classifier=src-address');
    L.push('/queue tree add name=unduh-semua parent=' + v.parent + ' max-limit=' + v.totalDown + ' queue=pcq-unduh comment="Unduh dibagi rata PCQ"');
    L.push('/queue tree add name=unggah-semua parent=' + v.parent + ' max-limit=' + v.totalUp + ' queue=pcq-unggah comment="Unggah dibagi rata PCQ"');
    L.push('# Catatan: queue tree membaca paket bertanda atau trafik parent. Padukan dengan mangle penanda paket dari LAN bila parent bukan global.');
    return H('Queue Tree dengan PCQ') + L.join('\n') + '\n';
  },
  function () {
    return [
      'PCQ membuat sub antrean otomatis untuk setiap alamat. Unduh diklasifikasikan per alamat tujuan, unggah per alamat sumber.',
      'Setiap pengguna mendapat jatah per pengguna, dan total semuanya dibatasi max-limit antrean induk.',
      'Hasilnya adil secara mekanis: satu pengguna yang rakus tidak bisa menghabiskan jatah pengguna lain yang sedang aktif.'
    ];
  }));

TOOLS.push(T('burst-calculator', 'queue', 'Kalkulator Burst Limit', 'Burst Limit Calculator',
  'Hitung burst limit, threshold, dan limit-at dari max-limit, lalu hasilkan simple queue yang memakai angka itu.',
  [
    f('nama', 'Nama antrean', 'text', 'Pelanggan-Burst', {}),
    f('target', 'Target (IP atau CIDR)', 'cidr', '192.168.88.10/32', { v: 'cidr' }),
    f('max', 'Max-limit simetris (Mbps)', 'text', '4', { mono: 1, v: 'num', help: 'Angka Mbps untuk unggah dan unduh. Desimal boleh, contoh 2.5' }),
    f('mult', 'Pengali burst', 'select', '2', { opts: [{ v: '1.5', l: '1,5 kali (halus)' }, { v: '2', l: '2 kali (umum)' }, { v: '3', l: '3 kali (agresif)' }] }),
    f('waktu', 'Burst time (detik)', 'select', '8', { opts: ['8', '16'] })
  ],
  function (v) {
    var maxK = Math.round(parseFloat(v.max) * 1024);
    var burstK = Math.round(maxK * parseFloat(v.mult));
    var thrK = Math.round(maxK * 0.75);
    var atK = Math.round(maxK * 0.5);
    return H('Kalkulator Burst Limit') +
      '# Hasil hitung untuk antrean ini:\n' +
      '#   max-limit       = ' + fmtK(maxK) + '\n' +
      '#   burst-limit     = ' + fmtK(burstK) + '  (' + v.mult + ' kali max-limit)\n' +
      '#   burst-threshold = ' + fmtK(thrK) + '  (75 persen dari max-limit)\n' +
      '#   burst-time      = ' + v.waktu + ' detik\n' +
      '#   limit-at        = ' + fmtK(atK) + '  (50 persen dari max-limit)\n' +
      '/queue simple add name=' + q(v.nama) + ' target=' + v.target +
      ' max-limit=' + fmtK(maxK) + '/' + fmtK(maxK) +
      ' burst-limit=' + fmtK(burstK) + '/' + fmtK(burstK) +
      ' burst-threshold=' + fmtK(thrK) + '/' + fmtK(thrK) +
      ' burst-time=' + v.waktu + 's/' + v.waktu + 's' +
      ' limit-at=' + fmtK(atK) + '/' + fmtK(atK) + '\n';
  },
  function (v) {
    var maxK = Math.round(parseFloat(v.max) * 1024);
    return [
      'Rumus yang dipakai: burst limit adalah max-limit dikali pengali pilihanmu (' + fmtK(Math.round(maxK * parseFloat(v.mult))) + ').',
      'Threshold ditaruh di 75 persen dari max-limit, mengikuti contoh resmi dokumentasi MikroTik: selama rata rata pemakaian di bawah threshold, lonjakan burst diizinkan.',
      'Burst time adalah jendela rata rata perhitungan, bukan lama lonjakan yang dijanjikan.',
      'Limit-at 50 persen memberi jatah terjamin bila antrean ini berbagi induk dengan antrean lain.',
      'Efek yang terasa oleh pengguna: membuka halaman dan memulai unduhan terasa ngebut, unduhan panjang menetap di max-limit.'
    ];
  }));

TOOLS.push(T('queue-prioritas-aplikasi', 'queue', 'Prioritas Aplikasi di Queue Tree', 'App Priority in Queue Tree',
  'Beri porsi dan prioritas berbeda untuk YouTube, TikTok, dan WhatsApp memakai daftar domain dan queue tree.',
  [
    f('parent', 'Parent queue tree', 'text', 'global', { mono: 1 }),
    f('total', 'Total bandwidth induk (Mbps, unduh)', 'text', '50', { mono: 1, v: 'num' }),
    f('pyt', 'Porsi YouTube (persen)', 'number', '40', { v: 'num', min: 1, max: 90 }),
    f('ptt', 'Porsi TikTok (persen)', 'number', '30', { v: 'num', min: 1, max: 90 }),
    f('pwa', 'Porsi WhatsApp (persen)', 'number', '10', { v: 'num', min: 1, max: 50 })
  ],
  function (v) {
    var totalK = Math.round(parseFloat(v.total) * 1024);
    function porsi(p) { return fmtK(Math.round(totalK * parseInt(p, 10) / 100)); }
    var L = [];
    L.push('# Daftar domain aplikasi');
    [['aplikasi-yt', ['youtube.com', 'googlevideo.com', 'ytimg.com']], ['aplikasi-tt', ['tiktok.com', 'tiktokcdn.com']], ['aplikasi-wa', ['whatsapp.com', 'whatsapp.net']]].forEach(function (a) {
      a[1].forEach(function (d) { L.push('/ip firewall address-list add list=' + a[0] + ' address=' + d); });
    });
    L.push('# Tandai paket per aplikasi');
    L.push('/ip firewall mangle add chain=prerouting dst-address-list=aplikasi-yt action=mark-packet new-packet-mark=paket-yt passthrough=no comment="Tandai YouTube"');
    L.push('/ip firewall mangle add chain=prerouting dst-address-list=aplikasi-tt action=mark-packet new-packet-mark=paket-tt passthrough=no comment="Tandai TikTok"');
    L.push('/ip firewall mangle add chain=prerouting dst-address-list=aplikasi-wa action=mark-packet new-packet-mark=paket-wa passthrough=no comment="Tandai WhatsApp"');
    L.push('# Antrean per aplikasi');
    L.push('/queue tree add name=induk-aplikasi parent=' + v.parent + ' max-limit=' + fmtK(totalK) + ' comment="Induk prioritas aplikasi"');
    L.push('/queue tree add name=yt parent=induk-aplikasi packet-mark=paket-yt max-limit=' + porsi(v.pyt) + ' priority=3 comment="YouTube"');
    L.push('/queue tree add name=tt parent=induk-aplikasi packet-mark=paket-tt max-limit=' + porsi(v.ptt) + ' priority=5 comment="TikTok"');
    L.push('/queue tree add name=wa parent=induk-aplikasi packet-mark=paket-wa max-limit=' + porsi(v.pwa) + ' priority=2 comment="WhatsApp didahulukan walau porsinya kecil"');
    return H('Prioritas Aplikasi di Queue Tree') + L.join('\n') + '\n';
  },
  function (v) {
    return [
      'Porsi dihitung dari total induk: YouTube ' + v.pyt + ' persen, TikTok ' + v.ptt + ' persen, WhatsApp ' + v.pwa + ' persen. Sisa pita dipakai trafik lain di luar antrean anak ini.',
      'WhatsApp diberi prioritas lebih tinggi (angka kecil) karena panggilannya peka jeda, walau kebutuhan pitanya kecil.',
      'Prioritas bekerja saat induk penuh: antrean berprioritas kecil dilayani lebih dulu dari antrean lain.'
    ];
  }));


TOOLS.push(T('remove-all-queue', 'queue', 'Remove All Queue', 'Remove All Queue',
  'Hapus semua antrean sekaligus: simple queue, queue tree, dan tipe antrean kustom. Setelah dihapus, semua pembagian bandwidth berhenti dan trafik berjalan tanpa batas.',
  [
    f('cadangan', 'Buat backup konfigurasi (.rsc) dulu', 'check', true, { help: 'Menyimpan salinan konfigurasi lengkap ke menu Files sebelum ada yang dihapus.' }),
    f('simple', 'Hapus semua simple queue', 'check', true),
    f('tree', 'Hapus semua queue tree', 'check', true),
    f('tipe', 'Hapus juga tipe antrean kustom', 'check', false, { help: 'Hanya tipe buatan sendiri yang dihapus. Tipe bawaan RouterOS (default, default-small, dan sejenisnya) tidak bisa dihapus.' })
  ],
  function (v) {
    var L = [];
    if (v.cadangan) { L.push('/export file=backup-sebelum-hapus-queue'); }
    if (v.simple) { L.push('/queue simple remove [find]'); }
    if (v.tree) { L.push('/queue tree remove [find]'); }
    if (v.tipe) { L.push('/queue type remove [find where builtin=no]'); }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang dihapus. Centang minimal satu kelompok.'); }
    return H('Remove All Queue') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Simple queue membatasi kecepatan per alamat IP atau per subnet. Setelah dihapus, tidak ada lagi batas kecepatan, jadi satu perangkat bisa menghabiskan seluruh bandwidth.',
      'Queue tree mengatur pembagian bandwidth bertingkat dengan prioritas. Menghapusnya membuat antrean induk dan anak hilang bersamaan.',
      'Tipe antrean kustom (misalnya PCQ buatan sendiri) hanya dihapus bila opsinya dicentang. Tipe bawaan RouterOS aman karena memang tidak bisa dihapus.',
      'Backup .rsc menyimpan seluruh konfigurasi ke menu Files. Bila penghapusan ternyata salah, pulihkan dengan menjalankan berkas backup itu dari terminal.'
    ];
  }));

/* ================= Kategori: Hotspot dan PPP ================= */

TOOLS.push(T('hotspot-server', 'hotspot', 'Hotspot Server Lengkap', 'Complete Hotspot Server',
  'Satu paket membangun hotspot: alamat, pool, DHCP, profil hotspot, server hotspot, dan satu pengguna awal.',
  [
    f('iface', 'Interface hotspot', 'text', 'ether2', { mono: 1 }),
    f('net', 'Jaringan hotspot (CIDR)', 'cidr', '192.168.5.0/24', { v: 'cidr' }),
    f('gw', 'Alamat router di jaringan hotspot', 'ip', '192.168.5.1', { v: 'ip' }),
    f('from', 'Awal pool', 'ip', '192.168.5.10', { v: 'ip' }),
    f('to', 'Akhir pool', 'ip', '192.168.5.250', { v: 'ip' }),
    f('dnsname', 'Nama DNS halaman login', 'text', 'hotspot.sekolah.lokal', { mono: 1, help: 'Pengguna mengetik nama ini di browser untuk membuka halaman login.' }),
    f('user', 'Pengguna hotspot awal', 'text', 'operator', {}),
    f('pass', 'Password pengguna awal', 'text', '', { mono: 1 })
  ],
  function (v) {
    var L = [];
    L.push('/ip address add address=' + v.gw + '/' + prefixPart(v.net) + ' interface=' + v.iface + ' comment="Gateway hotspot"');
    L.push('/ip pool add name=pool-hotspot ranges=' + v.from + '-' + v.to);
    L.push('/ip dhcp-server add name=dhcp-hotspot interface=' + v.iface + ' address-pool=pool-hotspot lease-time=1d disabled=no');
    L.push('/ip dhcp-server network add address=' + v.net + ' gateway=' + v.gw + ' dns-server=' + v.gw);
    L.push('/ip dns set allow-remote-requests=yes');
    L.push('/ip hotspot profile add name=profil-hotspot dns-name=' + v.dnsname + ' hotspot-address=' + v.gw + ' html-directory=hotspot login-by=http-chap,http-pap');
    L.push('/ip hotspot add name=hotspot-utama interface=' + v.iface + ' address-pool=pool-hotspot profile=profil-hotspot disabled=no');
    L.push('/ip hotspot user add name=' + q(v.user) + ' password=' + q(v.pass) + ' comment="Pengguna awal dari RacikRouter"');
    return H('Hotspot Server Lengkap') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Urutan dibuat berurutan seperti wizard bawaan MikroTik: alamat dulu, lalu pool, DHCP, profil, dan terakhir server hotspot nya.',
      'DNS router dinyalakan untuk permintaan dari LAN karena halaman login memakai nama DNS, bukan angka IP.',
      'Pengguna awal berguna untuk mencoba login pertama kali. Ganti passwordnya setelah pengujian.',
      'Halaman login bawaan bisa diganti memakai tool Template Login di situs ini.'
    ];
  }));

TOOLS.push(T('hotspot-user-profile', 'hotspot', 'Profil Pengguna Voucher Hotspot', 'Hotspot Voucher User Profile',
  'Buat profil voucher (batas kecepatan, jumlah perangkat bersama, masa aktif) dan satu contoh pengguna.',
  [
    f('profil', 'Nama profil', 'text', 'voucher-2mbps', { mono: 1 }),
    f('rate', 'Rate limit (unggah/unduh)', 'text', '2M/2M', { mono: 1, ph: '2M/2M' }),
    f('shared', 'Perangkat bersama per akun (shared users)', 'number', '1', { v: 'num', min: 1, max: 100 }),
    f('user', 'Contoh nama pengguna', 'text', '', { opt: 1, ph: 'tamu01' }),
    f('pass', 'Password pengguna contoh', 'text', '', { opt: 1, mono: 1 }),
    f('uptime', 'Batas total waktu pakai (limit uptime)', 'text', '', { opt: 1, ph: '5h', help: 'Contoh 5h untuk lima jam, 1d untuk satu hari. Berlaku pada pengguna contoh.' })
  ],
  function (v) {
    var L = [];
    L.push('/ip hotspot user profile add name=' + q(v.profil) + ' rate-limit=' + v.rate + ' shared-users=' + v.shared + ' status-autorefresh=1m');
    if (v.user) {
      var u = '/ip hotspot user add name=' + q(v.user) + ' profile=' + q(v.profil);
      if (v.pass) { u += ' password=' + q(v.pass); }
      if (v.uptime) { u += ' limit-uptime=' + v.uptime; }
      L.push(u);
    }
    return H('Profil Pengguna Voucher Hotspot') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Profil adalah cetakan voucher: semua pengguna berprofil sama mewarisi rate limit dan jumlah perangkat yang sama.',
      'Shared users 1 berarti satu akun hanya boleh dipakai satu perangkat. Naikkan bila voucher memang dijual untuk beberapa perangkat.',
      'Limit uptime menempel pada pengguna, bukan profil, karena masa aktif tiap voucher bisa berbeda walau cetakannya sama.'
    ];
  }));

TOOLS.push(T('pppoe-server', 'hotspot', 'PPPoE Server', 'PPPoE Server',
  'Layanan PPPoE untuk pelanggan rumahan model RT RW net: pool, profil, dan server dalam satu script.',
  [
    f('iface', 'Interface ke pelanggan', 'text', 'ether2', { mono: 1 }),
    f('svc', 'Nama layanan (service name)', 'text', 'pppoe-lokal', { mono: 1 }),
    f('gw', 'Alamat lokal router (local address)', 'ip', '10.10.10.1', { v: 'ip' }),
    f('from', 'Awal pool pelanggan', 'ip', '10.10.10.10', { v: 'ip' }),
    f('to', 'Akhir pool pelanggan', 'ip', '10.10.10.250', { v: 'ip' }),
    f('dns', 'DNS untuk pelanggan', 'text', '8.8.8.8,1.1.1.1', { mono: 1 })
  ],
  function (v) {
    var L = [];
    L.push('/ip pool add name=pool-pppoe ranges=' + v.from + '-' + v.to);
    L.push('/ppp profile add name=profil-pppoe local-address=' + v.gw + ' remote-address=pool-pppoe dns-server=' + v.dns);
    L.push('/interface pppoe-server server add interface=' + v.iface + ' service-name=' + v.svc + ' default-profile=profil-pppoe one-session-per-host=yes disabled=no');
    L.push('# Tambahkan pelanggan dengan pola ini:');
    L.push('# /ppp secret add name="nama-pelanggan" password="ganti-sendiri" service=pppoe profile=profil-pppoe');
    return H('PPPoE Server') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Setiap pelanggan nanti membuat koneksi PPPoE dari router rumahnya memakai nama dan password dari PPP secret.',
      'One session per host mencegah satu akun dipakai menyambung dari dua tempat sekaligus.',
      'Batas kecepatan pelanggan PPPoE biasanya diatur per PPP secret memakai rate-limit, atau lewat profil tambahan.'
    ];
  }));

TOOLS.push(T('pppoe-client', 'hotspot', 'PPPoE Client (Dial ke ISP)', 'PPPoE Client (Dial to ISP)',
  'Router menghubungi ISP memakai PPPoE, umum untuk layanan fiber yang memberi modem mode bridge.',
  [
    f('iface', 'Interface ke modem atau ONT', 'text', 'ether1', { mono: 1 }),
    f('user', 'Nama pengguna dari ISP', 'text', '', { mono: 1 }),
    f('pass', 'Password dari ISP', 'text', '', { mono: 1 }),
    f('droute', 'Jadikan rute default', 'check', true),
    f('pdns', 'Pakai DNS dari ISP', 'check', true)
  ],
  function (v) {
    return H('PPPoE Client (Dial ke ISP)') +
      '/interface pppoe-client add name=pppoe-isp interface=' + v.iface + ' user=' + q(v.user) + ' password=' + q(v.pass) +
      ' add-default-route=' + (v.droute ? 'yes' : 'no') + ' use-peer-dns=' + (v.pdns ? 'yes' : 'no') + ' disabled=no\n';
  },
  function () {
    return [
      'Nama pengguna dan password persis seperti yang diberikan ISP, termasuk akhiran domain bila ada, misalnya nama@fiber.contoh.',
      'Setelah tersambung, interface pppoe-isp inilah yang menjadi WAN sesungguhnya. Aturan NAT dan firewall sebaiknya menunjuk ke interface ini, bukan ether fisiknya.'
    ];
  }));

TOOLS.push(T('user-manager', 'hotspot', 'User Manager Lokal Dasar', 'Basic Local User Manager',
  'Aktifkan User Manager bawaan RouterOS v7 sebagai pusat akun voucher, dihubungkan lewat RADIUS lokal.',
  [
    f('secret', 'Shared secret RADIUS', 'text', '', { mono: 1, help: 'Kata sandi bersama antara router dan User Manager. Karena keduanya di mesin yang sama, alamat yang dipakai 127.0.0.1.' }),
    f('user', 'Pengguna pengelola User Manager', 'text', 'kasir', {}),
    f('pass', 'Password pengelola', 'text', '', { mono: 1 })
  ],
  function (v) {
    var L = [];
    L.push('/user-manager set enabled=yes');
    L.push('/radius add address=127.0.0.1 secret=' + q(v.secret) + ' service=hotspot timeout=3s comment="RADIUS ke User Manager lokal"');
    L.push('/user-manager router add name=router-ini address=127.0.0.1 shared-secret=' + q(v.secret));
    L.push('/user-manager user add name=' + q(v.user) + ' password=' + q(v.pass) + ' group=full');
    L.push('# Terakhir, pada profil server hotspot aktifkan pemakaian RADIUS:');
    L.push('# /ip hotspot profile set [find] use-radius=yes');
    return H('User Manager Lokal Dasar') + L.join('\n') + '\n';
  },
  function () {
    return [
      'User Manager adalah aplikasi bawaan RouterOS untuk mengelola akun dan voucher dalam jumlah banyak, terpisah dari daftar pengguna hotspot biasa.',
      'Router berbicara ke User Manager memakai protokol RADIUS. Karena satu mesin, alamatnya 127.0.0.1 dan penjaganya adalah shared secret yang sama di kedua sisi.',
      'Baris terakhir masih berupa komentar karena mengaktifkan use-radius pada profil hotspot adalah perubahan besar. Jalankan manual setelah kamu yakin profil mana yang dimaksud.',
      'Setelah aktif, halaman pengelolaan User Manager bisa dibuka dari peramban di jaringan lokal pada alamat router.'
    ];
  }));

TOOLS.push(T('pppoe-isolasi', 'hotspot', 'Isolasi Pelanggan PPPoE', 'PPPoE Customer Isolation',
  'PPPoE server yang sejak awal memisahkan pelanggan satu sama lain: satu sesi per akun, ARP reply only, split horizon, peringatan DHCP asing, dan blokir trafik antar pelanggan.',
  [
    f('iface', 'Interface ke pelanggan', 'text', 'bridge-pelanggan', { mono: 1, help: 'Interface tempat PPPoE server mendengarkan, biasanya bridge yang mengarah ke pelanggan.' }),
    f('svc', 'Nama layanan (service name)', 'text', 'pppoe-lokal', { mono: 1 }),
    f('net', 'Jaringan pelanggan (CIDR)', 'cidr', '10.20.20.0/24', { v: 'cidr', help: 'Dipakai aturan blokir antar pelanggan agar sesama alamat dalam jaringan ini tidak saling menjangkau.' }),
    f('gw', 'Alamat lokal router (local address)', 'ip', '10.20.20.1', { v: 'ip' }),
    f('from', 'Awal pool pelanggan', 'ip', '10.20.20.10', { v: 'ip' }),
    f('to', 'Akhir pool pelanggan', 'ip', '10.20.20.250', { v: 'ip' }),
    f('dns', 'DNS untuk pelanggan', 'text', '8.8.8.8,1.1.1.1', { mono: 1 }),
    f('rate', 'Batas kecepatan profil (rate limit)', 'text', '5M/5M', { mono: 1, help: 'Format turun/naik dari sisi pelanggan, contoh 5M/5M atau 10M/5M. Terapkan juga per akun di PPP secret bila tiap pelanggan berbeda paket.' }),
    f('arpOnly', 'ARP reply only pada interface pelanggan', 'check', true, { help: 'Router hanya menjawab ARP dan tidak mempercayai ARP dari sisi pelanggan, mengurangi risiko perebutan alamat (ARP spoofing).' }),
    f('horizon', 'Bridge split horizon untuk port pelanggan', 'check', true, { help: 'Semua port anggota bridge interface pelanggan diberi horizon yang sama, sehingga trafik antar port tidak diteruskan pada lapisan bridge.' }),
    f('antiRogue', 'Peringatan DHCP server asing (rogue DHCP)', 'check', true, { help: 'Router mencatat peringatan ke log bila ada perangkat pelanggan yang menyalakan DHCP server sendiri dan membagikan alamat liar.' }),
    f('blokirSesama', 'Blokir komunikasi antar pelanggan', 'check', true, { help: 'Trafik forward dari jaringan pelanggan menuju jaringan pelanggan itu sendiri dibuang. Pelanggan tetap bisa ke internet, tetapi tidak bisa memindai atau menyerang tetangganya.' })
  ],
  function (v) {
    var L = [];
    L.push('# Bagian 1: pool, profil, dan server PPPoE');
    L.push('/ip pool add name=pool-pppoe-aman ranges=' + v.from + '-' + v.to);
    L.push('/ppp profile add name=profil-pppoe-aman local-address=' + v.gw + ' remote-address=pool-pppoe-aman dns-server=' + v.dns + ' rate-limit=' + v.rate + ' only-one=yes change-tcp-mss=yes');
    L.push('/interface pppoe-server server add interface=' + v.iface + ' service-name=' + v.svc + ' default-profile=profil-pppoe-aman one-session-per-host=yes disabled=no');
    L.push('# Tambahkan pelanggan dengan pola ini:');
    L.push('# /ppp secret add name="nama-pelanggan" password="ganti-sendiri" service=pppoe profile=profil-pppoe-aman');
    if (v.arpOnly) {
      L.push('# Bagian 2: ARP reply only');
      L.push('# Dua baris berikut saling melengkapi: yang bekerja adalah baris yang jenis interfacenya cocok (bridge atau ethernet fisik), baris lainnya diam saja.');
      L.push(':foreach i in=[/interface bridge find name=' + q(v.iface) + '] do={/interface bridge set $i arp=reply-only}');
      L.push(':foreach i in=[/interface ethernet find name=' + q(v.iface) + '] do={/interface ethernet set $i arp=reply-only}');
    }
    if (v.horizon) {
      L.push('# Bagian 3: split horizon pada port bridge pelanggan');
      L.push('# Berlaku bila interface pelanggan adalah bridge. Semua port anggotanya saling terisolasi pada lapisan bridge.');
      L.push('/interface bridge port set [find bridge=' + v.iface + '] horizon=10');
    }
    if (v.antiRogue) {
      L.push('# Bagian 4: peringatan DHCP server asing');
      L.push('/ip dhcp-server alert add interface=' + v.iface + ' alert-timeout=none on-alert={:log warning "DHCP asing terdeteksi pada interface pelanggan, periksa perangkat yang baru terpasang"} disabled=no');
    }
    if (v.blokirSesama) {
      L.push('# Bagian 5: blokir trafik antar pelanggan');
      L.push('/ip firewall filter add chain=forward src-address=' + v.net + ' dst-address=' + v.net + ' action=drop comment="Isolasi antar pelanggan PPPoE"');
    }
    return H('Isolasi Pelanggan PPPoE') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Dasarnya sama dengan PPPoE server biasa: pool alamat, profil berisi local address dan rate limit, lalu server pada interface pelanggan. Bedanya, pengamanannya ikut dibuat sejak awal.',
      'Only-one pada profil dan one-session-per-host pada server membuat satu akun hanya bisa hidup dalam satu sesi dari satu perangkat. Akun yang dipakai bersama akan saling menendang.',
      'ARP reply only dan split horizon bekerja pada lapisan akses: tetangga satu segmen tidak bisa merebut alamat lewat ARP, dan port bridge tidak saling meneruskan trafik.',
      'Peringatan DHCP asing menjaga skenario klasik RT RW net: router pelanggan yang terbalik arah kabelnya bisa membagikan alamat liar ke satu segmen. Sekarang kejadian itu tercatat di log.',
      'Aturan terakhir menutup jalan pintas terakhir: walau sama sama pelanggan, trafik dari jaringan pelanggan ke jaringan pelanggan dibuang di forward, sementara jalan ke internet tetap terbuka.'
    ];
  }));

TOOLS.push(T('bypass-hotspot-binding', 'hotspot', 'Bypass Hotspot IP Binding', 'Bypass Hotspot IP Binding',
  'Bebaskan satu alamat IP dari kewajiban login hotspot (type bypassed), cocok untuk printer, CCTV, atau perangkat yang tidak bisa membuka halaman login.',
  [
    f('ip', 'Alamat IP perangkat', 'ip', '192.168.5.50', { v: 'ip' }),
    f('mac', 'Alamat MAC perangkat (opsional)', 'text', '', { opt: 1, mono: 1, ph: 'AA:BB:CC:DD:EE:FF', help: 'Bila diisi, bypass hanya berlaku untuk pasangan IP dan MAC ini.' }),
    f('server', 'Nama server hotspot (opsional)', 'text', '', { opt: 1, help: 'Kosongkan bila hanya ada satu server hotspot.' }),
    f('komen', 'Komentar', 'text', '', { opt: 1, ph: 'Printer lantai 1' })
  ],
  function (v) {
    var s = '/ip hotspot ip-binding add address=' + v.ip + ' type=bypassed';
    if (v.mac) { s += ' mac-address=' + v.mac; }
    if (v.server) { s += ' server=' + q(v.server); }
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('Bypass Hotspot IP Binding') + s + '\n';
  },
  function () {
    return [
      'Satu baris ini mendaftarkan alamat IP ke daftar ip-binding hotspot dengan type bypassed, artinya perangkat itu langsung online tanpa membuka halaman login.',
      'Bila alamat MAC ikut diisi, bypass hanya berlaku untuk pasangan IP dan MAC itu. Perangkat lain yang memakai IP yang sama tetap harus login.',
      'Pakai bypass hanya untuk perangkat milik sendiri yang memang tidak bisa login, seperti printer, CCTV, atau sensor. Jangan bypass perangkat tamu, karena mereka lalu tidak tercatat sebagai pengguna hotspot.',
      'Perangkat yang di-bypass tidak lagi dibatasi profil voucher, jadi kecepatannya mengikuti aturan umum jaringan, bukan paket voucher.'
    ];
  }));

TOOLS.push(T('clear-hotspot-cookies', 'hotspot', 'Clear Hotspot Cookies', 'Clear Hotspot Cookies',
  'Hapus cookie login hotspot yang tersimpan di router, supaya semua pengguna harus login ulang. Pilihan tambahan: putuskan juga pengguna yang sedang aktif.',
  [
    f('cookie', 'Hapus semua cookie hotspot', 'check', true),
    f('aktif', 'Putuskan juga pengguna aktif', 'check', false, { help: 'Pengguna yang sedang online langsung terputus dan harus login ulang.' })
  ],
  function (v) {
    var L = [];
    if (v.cookie) { L.push('/ip hotspot cookie remove [find]'); }
    if (v.aktif) { L.push('/ip hotspot active remove [find]'); }
    if (!L.length) { L.push('# Kedua opsi tidak dicentang, tidak ada yang dihapus. Centang minimal satu opsi.'); }
    return H('Clear Hotspot Cookies') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Cookie hotspot membuat pengguna tidak perlu login ulang setiap kali tersambung. Menghapus semua cookie berarti semua perangkat harus login lagi pada kunjungan berikutnya.',
      'Ini berguna setelah mengganti password voucher massal, setelah pergantian pengelola, atau saat ada perangkat asing yang dicurigai memakai cookie curian.',
      'Opsi kedua memutuskan pengguna yang sedang aktif saat itu juga. Tanpa opsi ini, pengguna yang sedang online tetap online sampai sesinya habis, tetapi harus login ulang pada sambungan berikutnya.',
      'Peringatan praktis: jangan jalankan ini pada jam sibuk tanpa pemberitahuan, karena semua pengguna akan melihat halaman login secara bersamaan.'
    ];
  }));

TOOLS.push(T('generate-vouchers', 'hotspot', 'Generate Vouchers', 'Generate Vouchers',
  'Cetak sejumlah voucher hotspot sekaligus: kode acak yang berbeda tiap lembar, lengkap dengan profil, batas waktu pakai, dan password yang sama dengan kodenya.',
  [
    f('prefix', 'Awalan kode voucher', 'text', 'VCR-', { mono: 1, help: 'Awalan ini menempel di depan setiap kode, misalnya VCR-AB12CD.' }),
    f('jumlah', 'Jumlah voucher', 'number', 5, { v: 'num', min: 1, max: 100 }),
    f('panjang', 'Panjang kode acak (huruf dan angka)', 'number', 6, { v: 'num', min: 4, max: 12 }),
    f('profil', 'Profil pengguna hotspot', 'text', 'default', { mono: 1, help: 'Nama profil yang sudah ada di router, misalnya profil dari tool Profil Pengguna Voucher Hotspot.' }),
    f('uptime', 'Batas total waktu pakai per voucher (opsional)', 'text', '', { opt: 1, ph: '1d', help: 'Contoh 5h untuk lima jam, 1d untuk satu hari. Kosongkan bila voucher berlaku tanpa batas waktu.' })
  ],
  function (v) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var n = parseInt(v.jumlah, 10) || 1;
    var len = parseInt(v.panjang, 10) || 6;
    var seen = {};
    var L = [];
    L.push('# ' + n + ' voucher hotspot, profil ' + v.profil + ', kode dibuat acak saat script digenerate');
    for (var i = 0; i < n; i++) {
      var kode = '';
      do {
        kode = '';
        for (var j = 0; j < len; j++) { kode += chars.charAt(Math.floor(Math.random() * chars.length)); }
      } while (seen[kode]);
      seen[kode] = true;
      var u = '/ip hotspot user add name=' + q(v.prefix + kode) + ' password=' + q(kode) + ' profile=' + q(v.profil);
      if (v.uptime) { u += ' limit-uptime=' + v.uptime; }
      u += ' comment="Voucher RacikRouter"';
      L.push(u);
    }
    return H('Generate Vouchers') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Setiap voucher dibuat sebagai satu pengguna hotspot: nama pengguna berisi awalan ditambah kode acak, passwordnya sama dengan kode acaknya, jadi cukup satu kode untuk dicetak di lembar voucher.',
      'Kode acak memakai huruf dan angka yang tidak mudah tertukar (tanpa 0, O, 1, dan I), dan dijamin berbeda satu sama lain dalam satu batch.',
      'Profil menentukan kecepatan dan jumlah perangkat per voucher. Pastikan nama profil yang ditulis sudah ada di router, karena profil yang belum ada membuat pengguna gagal dibuat.',
      'Kode dibuat ulang setiap kali script di-generate, jadi salin atau unduh hasilnya segera setelah jumlah dan profilnya cocok, sebelum mengubah kolom apa pun.',
      'Batas waktu pakai menempel pada tiap pengguna, bukan pada profil, sehingga satu batch bisa punya masa aktif yang berbeda dengan batch lain walau profilnya sama.'
    ];
  }));

TOOLS.push(T('hotspot-ip-binding', 'hotspot', 'Hotspot IP Binding (MAC)', 'Hotspot IP Binding (MAC)',
  'Ikat satu alamat MAC ke aturan hotspot: lewati login (bypassed), pakai login normal dengan IP tetap (regular), atau tolak sama sekali (blocked).',
  [
    f('mac', 'Alamat MAC perangkat', 'text', 'AA:BB:CC:DD:EE:FF', { mono: 1 }),
    f('ip', 'Alamat IP yang diikat (opsional)', 'ip', '', { opt: 1, v: 'ip', help: 'Bila diisi, perangkat ini selalu mendapat alamat ini di hotspot.' }),
    f('tipe', 'Jenis binding', 'select', 'bypassed', { opts: [{ v: 'bypassed', l: 'Bypassed: tanpa login, langsung online' }, { v: 'regular', l: 'Regular: tetap login, IP diikat' }, { v: 'blocked', l: 'Blocked: perangkat ditolak' }] }),
    f('server', 'Nama server hotspot (opsional)', 'text', '', { opt: 1 }),
    f('komen', 'Komentar', 'text', '', { opt: 1 })
  ],
  function (v) {
    var s = '/ip hotspot ip-binding add mac-address=' + v.mac + ' type=' + v.tipe;
    if (v.ip) { s += ' address=' + v.ip; }
    if (v.server) { s += ' server=' + q(v.server); }
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('Hotspot IP Binding (MAC)') + s + '\n';
  },
  function () {
    return [
      'Binding mengikat alamat MAC ke satu perlakuan tetap di hotspot, sebelum halaman login sempat muncul.',
      'Bypassed berarti perangkat langsung online tanpa login, cocok untuk perangkat milik sendiri yang tidak bisa membuka halaman login.',
      'Regular berarti perangkat tetap harus login, tetapi selalu mendapat alamat IP yang sama, sehingga mudah dikenali dan dicatat.',
      'Blocked berarti perangkat langsung ditolak, berguna untuk mengusir perangkat yang sudah tidak diizinkan tanpa harus mengganti password semua pengguna.',
      'Urutan binding dibaca dari atas ke bawah, jadi bila satu MAC cocok dengan dua binding, yang paling atas yang menang. Periksa daftar binding lama sebelum menambah yang baru.'
    ];
  }));

TOOLS.push(T('ppp-secret', 'hotspot', 'PPP Secret', 'PPP Secret',
  'Tambah satu akun PPP (PPPoE, PPTP, L2TP, SSTP, atau OpenVPN) lengkap dengan profil dan batas kecepatan.',
  [
    f('user', 'Nama pengguna', 'text', '', { mono: 1 }),
    f('pass', 'Password', 'text', '', { mono: 1 }),
    f('service', 'Layanan (service)', 'select', 'pppoe', { opts: ['any', 'pppoe', 'pptp', 'l2tp', 'sstp', 'ovpn'] }),
    f('profil', 'Profil PPP', 'text', 'default', { mono: 1 }),
    f('rate', 'Batas kecepatan (rate limit, opsional)', 'text', '', { opt: 1, mono: 1, ph: '5M/5M', help: 'Format unduh/unggah dari sisi pelanggan, contoh 5M/5M. Kosongkan bila memakai rate limit dari profil.' }),
    f('komen', 'Komentar', 'text', '', { opt: 1 })
  ],
  function (v) {
    var s = '/ppp secret add name=' + q(v.user) + ' password=' + q(v.pass) + ' service=' + v.service + ' profile=' + q(v.profil);
    if (v.rate) { s += ' rate-limit=' + v.rate; }
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('PPP Secret') + s + '\n';
  },
  function () {
    return [
      'Satu baris ini mendaftarkan akun PPP: nama pengguna dan password untuk login, layanan yang boleh dipakai akun itu, dan profil yang mengatur alamat serta DNS pelanggan.',
      'Service any berarti akun ini bisa dipakai di semua layanan PPP yang aktif, sedangkan pilihan lain mengunci akun hanya ke satu layanan.',
      'Rate limit di akun mengalahkan rate limit di profil, jadi pelanggan dengan paket berbeda bisa memakai profil yang sama dengan batas kecepatan sendiri sendiri.',
      'Setelah akun dibuat, pelanggan tinggal menyambung dari router rumahnya memakai nama dan password ini. Periksa status koneksinya di menu PPP Active Connections.'
    ];
  }));


TOOLS.push(T('remove-all-hotspot', 'hotspot', 'Remove All Hotspot', 'Remove All Hotspot',
  'Hapus layanan hotspot sekaligus: server, pengguna, profil, binding, cookie, dan walled garden. Semua pengguna hotspot langsung terputus.',
  [
    f('cadangan', 'Buat backup konfigurasi (.rsc) dulu', 'check', true, { help: 'Menyimpan salinan konfigurasi lengkap ke menu Files sebelum ada yang dihapus.' }),
    f('server', 'Hapus semua server hotspot', 'check', true),
    f('user', 'Hapus semua pengguna hotspot', 'check', true),
    f('profil', 'Hapus profil pengguna (kecuali default)', 'check', false, { help: 'Profil default tidak bisa dihapus, jadi hanya profil buatan sendiri yang ikut terhapus.' }),
    f('binding', 'Hapus semua IP binding', 'check', false, { help: 'IP binding berisi perangkat yang dibebaskan dari login atau yang ditolak.' }),
    f('cookie', 'Hapus semua cookie hotspot', 'check', true, { help: 'Cookie membuat pengguna tidak perlu login ulang. Menghapusnya memaksa semua perangkat login lagi.' }),
    f('walled', 'Hapus semua walled garden', 'check', false, { help: 'Walled garden berisi situs yang bisa dibuka tanpa login, seperti halaman pembayaran.' })
  ],
  function (v) {
    var L = [];
    if (v.cadangan) { L.push('/export file=backup-sebelum-hapus-hotspot'); }
    if (v.server) { L.push('/ip hotspot remove [find]'); }
    if (v.user) { L.push('/ip hotspot user remove [find]'); }
    if (v.profil) { L.push('/ip hotspot user profile remove [find where name!="default"]'); }
    if (v.binding) { L.push('/ip hotspot ip-binding remove [find]'); }
    if (v.cookie) { L.push('/ip hotspot cookie remove [find]'); }
    if (v.walled) {
      L.push('/ip hotspot walled-garden remove [find]');
      L.push('/ip hotspot walled-garden ip remove [find]');
    }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang dihapus. Centang minimal satu kelompok.'); }
    return H('Remove All Hotspot') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Server hotspot adalah layanan yang menampilkan halaman login. Menghapusnya mematikan halaman login, sehingga perangkat baru tidak lagi diminta login dan tidak lagi mendapat akses.',
      'Pengguna hotspot berisi semua akun voucher. Setelah dihapus, tidak ada akun yang bisa dipakai login, termasuk akun yang sedang aktif.',
      'Profil pengguna mengatur kecepatan dan batas tiap akun. Profil default tidak bisa dihapus, jadi hanya profil buatanmu yang ikut hilang.',
      'Cookie dan IP binding adalah jalan pintas login. Menghapusnya berarti semua perangkat harus login ulang dari awal, tanpa pengecualian.',
      'Backup .rsc menyimpan seluruh konfigurasi ke menu Files. Bila penghapusan ternyata salah, pulihkan dengan menjalankan berkas backup itu dari terminal.'
    ];
  }));

TOOLS.push(T('remove-all-ppp', 'hotspot', 'Remove All PPP', 'Remove All PPP',
  'Hapus semua akun dan layanan PPP sekaligus: secret, koneksi aktif, profil, dan server PPPoE. Semua pelanggan PPPoE langsung terputus.',
  [
    f('cadangan', 'Buat backup konfigurasi (.rsc) dulu', 'check', true, { help: 'Menyimpan salinan konfigurasi lengkap ke menu Files sebelum ada yang dihapus.' }),
    f('aktif', 'Putuskan semua koneksi PPP aktif', 'check', true),
    f('secret', 'Hapus semua PPP secret (akun)', 'check', true),
    f('profil', 'Hapus profil PPP (kecuali bawaan)', 'check', false, { help: 'Profil default dan default-encryption tidak bisa dihapus, jadi hanya profil buatan sendiri yang ikut terhapus.' }),
    f('server', 'Hapus semua server PPPoE', 'check', false)
  ],
  function (v) {
    var L = [];
    if (v.cadangan) { L.push('/export file=backup-sebelum-hapus-ppp'); }
    if (v.aktif) { L.push('/ppp active remove [find]'); }
    if (v.secret) { L.push('/ppp secret remove [find]'); }
    if (v.profil) { L.push('/ppp profile remove [find where name!="default" and name!="default-encryption"]'); }
    if (v.server) { L.push('/interface pppoe-server server remove [find]'); }
    if (!L.length) { L.push('# Tidak ada yang dipilih, tidak ada yang dihapus. Centang minimal satu kelompok.'); }
    return H('Remove All PPP') + L.join('\n') + '\n';
  },
  function () {
    return [
      'PPP secret adalah daftar akun pelanggan (nama pengguna dan password). Menghapusnya berarti tidak ada pelanggan yang bisa login lagi, walau server PPPoE masih menyala.',
      'Koneksi aktif diputuskan dulu sebelum akun dihapus, supaya pelanggan yang sedang online langsung terputus dan tidak menggantung.',
      'Profil PPP mengatur alamat, DNS, dan batas kecepatan pelanggan. Profil bawaan tidak bisa dihapus, jadi hanya profil buatanmu yang ikut hilang.',
      'Server PPPoE adalah layanan yang menerima sambungan pelanggan. Menghapusnya mematikan layanan, sehingga tidak ada pelanggan baru yang bisa tersambung.',
      'Backup .rsc menyimpan seluruh konfigurasi ke menu Files. Bila penghapusan ternyata salah, pulihkan dengan menjalankan berkas backup itu dari terminal.'
    ];
  }));

TOOLS.push(T('walled-garden', 'hotspot', 'Walled Garden', 'Walled Garden',
  'Izinkan situs atau alamat IP tertentu dibuka tanpa login hotspot. Cocok untuk halaman pembayaran, toko aplikasi, atau situs yang wajib bisa dibuka sebelum pengguna sempat login.',
  [
    f('tipe', 'Jenis entri', 'select', 'domain', { opts: [{ v: 'domain', l: 'Domain (dst-host)' }, { v: 'ip', l: 'Alamat IP (dst-address)' }] }),
    f('target', 'Domain atau alamat IP', 'text', 'play.google.com', { mono: 1, help: 'Untuk domain, tanda * bisa dipakai untuk semua subdomain, contoh *.whatsapp.net.' }),
    f('server', 'Nama server hotspot (opsional)', 'text', '', { opt: 1, help: 'Kosongkan bila hanya ada satu server hotspot.' }),
    f('komen', 'Komentar', 'text', '', { opt: 1, ph: 'Toko aplikasi' })
  ],
  function (v) {
    var s;
    if (v.tipe === 'ip') { s = '/ip hotspot walled-garden ip add dst-address=' + q(v.target); }
    else { s = '/ip hotspot walled-garden add dst-host=' + q(v.target); }
    if (v.server) { s += ' server=' + q(v.server); }
    if (v.komen) { s += ' comment=' + q(v.komen); }
    return H('Walled Garden') + s + '\n';
  },
  function () {
    return [
      'Walled garden adalah daftar pengecualian hotspot: alamat di daftar ini bisa dibuka tanpa login, sementara situs lain tetap terkunci di balik halaman login.',
      'Jenis domain (dst-host) dipakai untuk nama situs, sedangkan jenis alamat IP (dst-address) dipakai untuk server yang alamatnya tetap, misalnya server pembayaran.',
      'Tanda bintang pada domain berarti semua subdomain ikut diizinkan, contoh *.whatsapp.net mengizinkan semua alamat di bawah whatsapp.net.',
      'Batasi walled garden hanya untuk situs yang benar-benar perlu, seperti toko aplikasi dan halaman pembayaran. Daftar yang terlalu longgar sama saja dengan membuka hotspot tanpa login.'
    ];
  }));

/* ================= Kategori: VPN ================= */

TOOLS.push(T('wireguard', 'vpn', 'WireGuard Server dan Satu Peer', 'WireGuard Server and One Peer',
  'VPN modern bawaan RouterOS v7: satu interface server dan satu peer, misalnya laptop admin.',
  [
    f('nama', 'Nama interface', 'text', 'wg-admin', { mono: 1 }),
    f('port', 'Port dengar (UDP)', 'number', '13231', { v: 'port' }),
    f('ipwg', 'Alamat router di jaringan VPN', 'cidr', '10.10.10.1/24', { v: 'cidr' }),
    f('peerNama', 'Nama peer', 'text', 'laptop-admin', { mono: 1 }),
    f('peerKey', 'Public key peer', 'text', '', { mono: 1, help: 'Buat pasangan kunci di aplikasi WireGuard perangkat peer, lalu tempel public key nya di sini.' }),
    f('peerAllowed', 'Alamat peer di VPN (allowed address)', 'cidr', '10.10.10.2/32', { v: 'cidr' }),
    f('endpoint', 'Endpoint peer (host:port, opsional)', 'text', '', { opt: 1, mono: 1, ph: 'vpn.kantor.contoh:13231', help: 'Isi hanya bila peer yang memulai koneksi dari alamat tetap dan router perlu menelepon balik.' })
  ],
  function (v) {
    var L = [];
    L.push('/interface wireguard add name=' + v.nama + ' listen-port=' + v.port + ' comment="Server WireGuard"');
    L.push('/ip address add address=' + v.ipwg + ' interface=' + v.nama);
    var peer = '/interface wireguard peers add interface=' + v.nama + ' name=' + v.peerNama + ' public-key=' + q(v.peerKey) + ' allowed-address=' + v.peerAllowed;
    if (v.endpoint) {
      var ep = String(v.endpoint).split(':');
      peer += ' endpoint-address=' + ep[0] + ' endpoint-port=' + (ep[1] || v.port) + ' persistent-keepalive=25s';
    }
    L.push(peer);
    L.push('/ip firewall filter add chain=input protocol=udp dst-port=' + v.port + ' action=accept comment="Izinkan WireGuard masuk" place-before=0');
    return H('WireGuard Server dan Satu Peer') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Router membuat kunci privatnya sendiri saat interface dibuat. Public key router bisa dilihat dengan perintah /interface wireguard print, lalu dimasukkan ke konfigurasi peer.',
      'Allowed address adalah identitas peer di dalam tunnel. Satu peer satu alamat /32 menghindari tabrakan.',
      'Aturan firewall membuka port UDP WireGuard. Baris ini ditaruh paling atas chain input (place-before 0) agar tidak kalah oleh aturan drop umum.',
      'Di sisi peer, isi endpoint dengan alamat publik router dan allowed address 0.0.0.0/0 bila semua trafik peer mau dilewatkan tunnel, atau cukup jaringan lokalmu bila hanya untuk akses admin.'
    ];
  }));

TOOLS.push(T('l2tp-server', 'vpn', 'L2TP IPsec Server', 'L2TP IPsec Server',
  'Server VPN klasik yang didukung bawaan oleh Windows, Android, dan iOS tanpa aplikasi tambahan.',
  [
    f('gw', 'Alamat lokal untuk klien VPN', 'ip', '10.20.20.1', { v: 'ip' }),
    f('from', 'Awal pool klien', 'ip', '10.20.20.10', { v: 'ip' }),
    f('to', 'Akhir pool klien', 'ip', '10.20.20.50', { v: 'ip' }),
    f('dns', 'DNS untuk klien', 'text', '8.8.8.8', { mono: 1 }),
    f('secret', 'IPsec secret (pre-shared key)', 'text', '', { mono: 1 }),
    f('user', 'Pengguna VPN pertama', 'text', 'kantor', {}),
    f('pass', 'Password pengguna', 'text', '', { mono: 1 })
  ],
  function (v) {
    var L = [];
    L.push('/ip pool add name=pool-l2tp ranges=' + v.from + '-' + v.to);
    L.push('/ppp profile add name=profil-l2tp local-address=' + v.gw + ' remote-address=pool-l2tp dns-server=' + v.dns);
    L.push('/interface l2tp-server server set enabled=yes use-ipsec=yes ipsec-secret=' + q(v.secret) + ' default-profile=profil-l2tp authentication=mschap2');
    L.push('/ppp secret add name=' + q(v.user) + ' password=' + q(v.pass) + ' service=l2tp profile=profil-l2tp');
    L.push('/ip firewall filter add chain=input protocol=udp dst-port=500,4500,1701 action=accept comment="Izinkan L2TP IPsec masuk" place-before=0');
    return H('L2TP IPsec Server') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Klien mendapat alamat dari pool VPN dan seolah berada di jaringan lokal yang aman.',
      'IPsec secret adalah kata sandi bersama tingkat tunnel, berbeda dari password pengguna. Keduanya wajib cocok di sisi klien.',
      'Tiga port UDP dibuka: 500 dan 4500 untuk IPsec, 1701 untuk L2TP.'
    ];
  }));

TOOLS.push(T('sstp-server', 'vpn', 'SSTP Server', 'SSTP Server',
  'Server VPN di atas HTTPS port 443, cocok menembus jaringan yang hanya membuka port web. Membutuhkan sertifikat.',
  [
    f('cert', 'Nama sertifikat server', 'text', 'server-vpn', { mono: 1, help: 'Buat dulu lewat tool Generator Sertifikat di kategori ini.' }),
    f('port', 'Port SSTP', 'number', '443', { v: 'port' }),
    f('gw', 'Alamat lokal untuk klien VPN', 'ip', '10.30.30.1', { v: 'ip' }),
    f('from', 'Awal pool klien', 'ip', '10.30.30.10', { v: 'ip' }),
    f('to', 'Akhir pool klien', 'ip', '10.30.30.50', { v: 'ip' }),
    f('user', 'Pengguna VPN pertama', 'text', 'kantor', {}),
    f('pass', 'Password pengguna', 'text', '', { mono: 1 })
  ],
  function (v) {
    var L = [];
    L.push('/ip pool add name=pool-sstp ranges=' + v.from + '-' + v.to);
    L.push('/ppp profile add name=profil-sstp local-address=' + v.gw + ' remote-address=pool-sstp');
    L.push('/interface sstp-server server set enabled=yes certificate=' + v.cert + ' default-profile=profil-sstp port=' + v.port + ' authentication=mschap2 tls-version=only-1.2');
    L.push('/ppp secret add name=' + q(v.user) + ' password=' + q(v.pass) + ' service=sstp profile=profil-sstp');
    L.push('/ip firewall filter add chain=input protocol=tcp dst-port=' + v.port + ' action=accept comment="Izinkan SSTP masuk" place-before=0');
    return H('SSTP Server') + L.join('\n') + '\n';
  },
  function () {
    return [
      'SSTP membungkus VPN dalam sambungan TLS, bentuknya sama dengan membuka situs HTTPS, sehingga lolos di banyak jaringan kantor dan hotel.',
      'Sertifikat wajib ada dan namanya harus sama persis dengan yang dibuat di tool Generator Sertifikat.',
      'Klien Windows bisa menyambung tanpa aplikasi tambahan lewat pengaturan VPN bawaan.'
    ];
  }));

TOOLS.push(T('sertifikat', 'vpn', 'Generator Sertifikat (CA dan Server)', 'Certificate Generator (CA and Server)',
  'Buat otoritas sertifikat lokal dan satu sertifikat server, bahan wajib untuk SSTP, OpenVPN, dan IPsec.',
  [
    f('ca', 'Nama CA', 'text', 'CA-Lokal', { mono: 1 }),
    f('cnca', 'Common name CA', 'text', 'CA Router Kantor', {}),
    f('server', 'Nama sertifikat server', 'text', 'server-vpn', { mono: 1 }),
    f('san', 'Alamat IP publik server (SAN)', 'ip', '', { v: 'ip', opt: 1, ph: '203.0.113.10', help: 'Diisi alamat IP yang akan dipakai klien untuk menyambung, agar sertifikat lolos pemeriksaan nama.' }),
    f('hari', 'Masa berlaku (hari)', 'number', '3650', { v: 'num', min: 30, max: 36500 })
  ],
  function (v) {
    var L = [];
    L.push('/certificate add name=' + v.ca + ' common-name=' + q(v.cnca) + ' key-usage=key-cert-sign,crl-sign days-valid=' + v.hari);
    L.push('/certificate sign [find name=' + q(v.ca) + ']');
    var srv = '/certificate add name=' + v.server + ' common-name=' + q(v.server) + ' key-usage=tls-server days-valid=' + v.hari;
    if (v.san) { srv += ' subject-alt-name=IP:' + v.san; }
    L.push(srv);
    L.push('/certificate sign [find name=' + q(v.server) + '] ca=' + v.ca);
    L.push('/certificate set [find name=' + q(v.server) + '] trusted=yes');
    return H('Generator Sertifikat (CA dan Server)') + L.join('\n') + '\n';
  },
  function () {
    return [
      'CA adalah penandatangan lokal milikmu. Sertifikat server yang ditandatangani CA ini dipercaya oleh klien yang sudah memasang sertifikat CA.',
      'Proses sign bisa memakan beberapa detik di router kecil. Tunggu sampai prompt terminal kembali sebelum menjalankan baris berikutnya.',
      'Isi SAN dengan alamat IP publik yang dipakai klien menyambung. Tanpa SAN yang cocok, banyak klien modern menolak sertifikat walau CA nya benar.'
    ];
  }));

TOOLS.push(T('pptp-client', 'vpn', 'PPTP Client', 'PPTP Client',
  'Router menyambung sebagai klien ke server PPTP, misalnya ke kantor pusat yang masih memakai PPTP.',
  [
    f('server', 'Alamat server PPTP', 'text', 'vpn.kantor.contoh', { mono: 1 }),
    f('user', 'Nama pengguna', 'text', '', { mono: 1 }),
    f('pass', 'Password', 'text', '', { mono: 1 }),
    f('droute', 'Jadikan rute default', 'check', false, { help: 'Aktifkan hanya bila memang semua trafik router mau dilewatkan tunnel ini.' })
  ],
  function (v) {
    return H('PPTP Client') +
      '# Catatan keamanan: enkripsi PPTP sudah dianggap lemah. Pakai hanya untuk menyambung ke server lama, dan rencanakan pindah ke WireGuard atau L2TP IPsec.\n' +
      '/interface pptp-client add name=pptp-kantor connect-to=' + v.server + ' user=' + q(v.user) + ' password=' + q(v.pass) +
      ' add-default-route=' + (v.droute ? 'yes' : 'no') + ' disabled=no\n';
  },
  function () {
    return [
      'Tool ini tetap disediakan karena banyak kantor lama masih menjalankan server PPTP, dan tugas teknisi lapangan sering menuntut menyambung ke sana.',
      'Untuk kebutuhan baru, jangan pilih PPTP. WireGuard dan L2TP IPsec di kategori ini jauh lebih aman.'
    ];
  }));

TOOLS.push(T('ovpn-client', 'vpn', 'OpenVPN Client Dasar', 'Basic OpenVPN Client',
  'Router menyambung sebagai klien OpenVPN ke server yang sudah ada, dengan autentikasi pengguna.',
  [
    f('server', 'Alamat server OpenVPN', 'text', 'vpn.kantor.contoh', { mono: 1 }),
    f('port', 'Port server', 'number', '1194', { v: 'port' }),
    f('user', 'Nama pengguna', 'text', '', { mono: 1 }),
    f('pass', 'Password', 'text', '', { mono: 1 }),
    f('mode', 'Mode', 'select', 'ip', { opts: [{ v: 'ip', l: 'ip (tunnel point to point)' }, { v: 'ethernet', l: 'ethernet (tap, menjembatani LAN)' }] }),
    f('cert', 'Nama sertifikat klien (opsional)', 'text', '', { opt: 1, mono: 1, help: 'Isi bila server meminta sertifikat klien. Sertifikat harus sudah diimpor ke router.' })
  ],
  function (v) {
    var s = '/interface ovpn-client add name=ovpn-kantor connect-to=' + v.server + ' port=' + v.port +
      ' user=' + q(v.user) + ' password=' + q(v.pass) + ' mode=' + v.mode;
    if (v.cert) { s += ' certificate=' + v.cert; }
    s += ' disabled=no';
    return H('OpenVPN Client Dasar') + s + '\n';
  },
  function () {
    return [
      'Pengaturan cipher dan auth mengikuti bawaan RouterOS dan server. Bila server memakai pengaturan khusus, samakan lewat Winbox di menu interface ovpn-kantor setelah script ini jalan.',
      'Mode ethernet hanya dipakai bila desainnya memang menjembatani dua LAN. Untuk akses jarak jauh biasa, mode ip adalah pilihan yang benar.'
    ];
  }));


TOOLS.push(T('all-traffic-vpn', 'vpn', 'Semua Trafik Lewat Tunnel VPN', 'All Traffic to VPN Tunnel',
  'Arahkan seluruh trafik LAN melewati tunnel VPN, lengkap dengan kill switch yang memutus internet bila tunnel mati.',
  [
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('vpniface', 'Nama interface VPN', 'text', 'wg0', { mono: 1, help: 'Nama interface VPN yang sudah tersambung, misalnya wg0 untuk WireGuard atau ovpn-out1 untuk OpenVPN.' }),
    f('kill', 'Blokir internet bila tunnel mati (kill switch)', 'check', true, { help: 'Bila dicentang, ditambahkan rute blackhole cadangan supaya trafik tidak bocor lewat WAN biasa saat tunnel putus.' })
  ],
  function (v) {
    var L = [];
    L.push('/routing table add name=ke-vpn fib');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' action=mark-routing new-routing-mark=ke-vpn passthrough=no comment="Semua trafik LAN ke tunnel VPN"');
    L.push('/ip route add dst-address=0.0.0.0/0 gateway=' + v.vpniface + ' routing-table=ke-vpn distance=1 comment="Default lewat VPN"');
    if (v.kill) { L.push('/ip route add dst-address=0.0.0.0/0 type=blackhole routing-table=ke-vpn distance=10 comment="Kill switch: buang trafik bila tunnel mati"'); }
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.vpniface + ' action=masquerade comment="NAT keluar VPN"');
    return H('Semua Trafik Lewat Tunnel VPN') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Semua paket dari LAN ditandai dan diteruskan ke tabel routing khusus yang gatewaynya adalah interface VPN, jadi tidak ada trafik LAN yang keluar lewat WAN biasa.',
      'Trafik router sendiri tidak ditandai, jadi router tetap bisa memeriksa pembaruan dan DNS lewat jalur biasanya.',
      'Kill switch bekerja lewat jarak rute: rute blackhole berjarak 10 hanya aktif bila rute VPN berjarak 1 mati karena interface tunnel turun.',
      'Pastikan tunnel VPN sudah tersambung sebelum menjalankan script ini. Bila tunnel belum ada, trafik LAN langsung terbuang oleh kill switch.'
    ];
  }));

TOOLS.push(T('vpn-game-port-routing', 'vpn', 'Rute Game via VPN (Port)', 'VPN Routing Port Games',
  'Lewatkan trafik game berdasarkan nomor port tujuannya melewati tunnel VPN, trafik lain tetap di jalur biasa.',
  [
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('ports', 'Daftar port game', 'textarea', '3074\n27014-27050\n5000-5500', { mono: 1, help: 'Satu port atau rentang per baris. Port tiap game berbeda, sesuaikan dengan game yang dimainkan di jaringanmu.' }),
    f('proto', 'Protokol', 'select', 'udp', { opts: ['udp', 'tcp'] }),
    f('vpniface', 'Nama interface VPN', 'text', 'wg0', { mono: 1, help: 'Nama interface VPN yang sudah tersambung, misalnya wg0 untuk WireGuard atau ovpn-out1 untuk OpenVPN.' })
  ],
  function (v) {
    var ports = String(v.ports).split('\n').map(function (s) { return s.trim(); }).filter(Boolean).join(',');
    var L = [];
    L.push('# Tandai koneksi game berdasarkan port tujuannya');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' protocol=' + v.proto + ' dst-port=' + ports + ' action=mark-connection new-connection-mark=game-vpn passthrough=yes comment="Tandai koneksi game"');
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' connection-mark=game-vpn action=mark-routing new-routing-mark=ke-vpn-game passthrough=no comment="Arahkan game ke tunnel VPN"');
    L.push('/routing table add name=ke-vpn-game fib');
    L.push('/ip route add dst-address=0.0.0.0/0 gateway=' + v.vpniface + ' routing-table=ke-vpn-game comment="Rute game lewat VPN"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.vpniface + ' action=masquerade comment="NAT keluar VPN"');
    return H('Rute Game via VPN (Port)') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Hanya koneksi game yang portnya cocok dengan daftar yang dilewatkan tunnel VPN. Trafik lain tetap keluar lewat WAN biasa.',
      'Kebanyakan game memakai UDP, tetapi sebagian memakai TCP untuk login dan unduhan. Bila game tertentu tetap lewat jalur biasa, periksa protokol aslinya lalu ganti pilihan protokol di atas.',
      'Daftar port adalah perkiraan awal. Bila game tertentu tetap tersendat, periksa port aslinya di dokumentasi game itu lalu tambahkan.',
      'Tunnel VPN menambah jeda karena enkripsi dan jarak server. Bila ping game memburuk lewat VPN, pindahkan game itu kembali ke WAN biasa.'
    ];
  }));

TOOLS.push(T('vpn-game-ip-routing', 'vpn', 'Rute Game via VPN (IP Server)', 'VPN Routing IP Address Games',
  'Lewatkan trafik ke server game berdasarkan alamat IP servernya melewati tunnel VPN, trafik lain tetap di jalur biasa.',
  [
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('ips', 'Alamat server game (IP atau CIDR)', 'textarea', '103.86.211.0/24\n45.112.90.0/24', { mono: 1, help: 'Satu alamat IP atau CIDR per baris. Ganti dengan alamat server game yang kamu pakai, lihat dokumentasi game itu.' }),
    f('vpniface', 'Nama interface VPN', 'text', 'wg0', { mono: 1, help: 'Nama interface VPN yang sudah tersambung, misalnya wg0 untuk WireGuard atau ovpn-out1 untuk OpenVPN.' })
  ],
  function (v) {
    var ips = String(v.ips).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var L = [];
    ips.forEach(function (a) { L.push('/ip firewall address-list add list=server-game-vpn address=' + a + ' comment="Server game lewat VPN"'); });
    L.push('/ip firewall mangle add chain=prerouting in-interface=' + v.lan + ' dst-address-list=server-game-vpn action=mark-routing new-routing-mark=ke-vpn-game passthrough=no comment="Arahkan server game ke tunnel VPN"');
    L.push('/routing table add name=ke-vpn-game fib');
    L.push('/ip route add dst-address=0.0.0.0/0 gateway=' + v.vpniface + ' routing-table=ke-vpn-game comment="Rute game lewat VPN"');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.vpniface + ' action=masquerade comment="NAT keluar VPN"');
    return H('Rute Game via VPN (IP Server)') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Cara ini lebih tepat daripada berdasarkan port, karena yang dipindah hanya server game yang terdaftar, bukan semua trafik yang kebetulan memakai port yang sama.',
      'Daftar server game harus berisi alamat IP asli server game itu. Alamat ini berbeda tiap game dan tiap region, jadi periksa dokumentasi atau pantau koneksi game dengan Torch bila ragu.',
      'Trafik selain ke server game tidak tersentuh aturan ini dan tetap memakai rute default biasa.',
      'Tunnel VPN menambah jeda karena enkripsi dan jarak server. Bila ping game memburuk lewat VPN, pindahkan game itu kembali ke WAN biasa.'
    ];
  }));

TOOLS.push(T('vpn-remote-client', 'vpn', 'Klien VPN Jarak Jauh (SSTP, L2TP, PPTP, OVPN)', 'VPN Remote SSTP - L2TP - PPTP - OVPN',
  'Satu form untuk menyambung router sebagai klien ke server VPN jarak jauh. Pilih protokolnya, isi server dan akun, lalu tentukan jaringan kantor yang dirutekan lewat VPN.',
  [
    f('proto', 'Protokol VPN', 'select', 'sstp', { opts: [{ v: 'sstp', l: 'SSTP (port 443, menembus firewall ketat)' }, { v: 'l2tp', l: 'L2TP IPsec (bawaan Windows, Android, iOS)' }, { v: 'pptp', l: 'PPTP (lama, hanya bila server memaksa)' }, { v: 'ovpn', l: 'OpenVPN (port 1194)' }] }),
    f('server', 'Alamat server VPN', 'text', 'vpn.kantor.contoh', { mono: 1, help: 'Nama host atau alamat IP publik server VPN.' }),
    f('user', 'Nama pengguna', 'text', 'kantor', {}),
    f('pass', 'Password', 'text', '', { mono: 1 }),
    f('secret', 'IPsec secret (khusus L2TP)', 'text', '', { mono: 1, opt: 1, help: 'Kata sandi bersama tingkat tunnel untuk L2TP. Kosongkan bila server tidak memakainya, maka IPsec dimatikan.' }),
    f('jaringan', 'Jaringan kantor di ujung VPN (opsional)', 'text', '', { mono: 1, opt: 1, ph: '10.20.0.0/16', help: 'Bila diisi, jaringan itu dirutekan lewat VPN. Bila kosong, tidak ada rute tambahan dan hanya trafik ke jaringan itu yang perlu diatur manual.' })
  ],
  function (v) {
    var L = [];
    var nama = 'vpn-jarak-jauh';
    if (v.proto === 'sstp') {
      L.push('/interface sstp-client add name=' + nama + ' connect-to=' + v.server + ' user=' + q(v.user) + ' password=' + q(v.pass) + ' profile=default-encryption tls-version=only-1.2 verify-server-certificate=no disabled=no comment="Klien VPN SSTP"');
    } else if (v.proto === 'l2tp') {
      var ipsec = v.secret ? ' use-ipsec=yes ipsec-secret=' + q(v.secret) : ' use-ipsec=no';
      L.push('/interface l2tp-client add name=' + nama + ' connect-to=' + v.server + ' user=' + q(v.user) + ' password=' + q(v.pass) + ipsec + ' disabled=no comment="Klien VPN L2TP"');
    } else if (v.proto === 'pptp') {
      L.push('/interface pptp-client add name=' + nama + ' connect-to=' + v.server + ' user=' + q(v.user) + ' password=' + q(v.pass) + ' disabled=no comment="Klien VPN PPTP"');
    } else {
      L.push('/interface ovpn-client add name=' + nama + ' connect-to=' + v.server + ' port=1194 user=' + q(v.user) + ' password=' + q(v.pass) + ' mode=ip protocol=tcp disabled=no comment="Klien VPN OpenVPN"');
    }
    if (v.jaringan) { L.push('/ip route add dst-address=' + v.jaringan + ' gateway=' + nama + ' comment="Jaringan kantor lewat VPN"'); }
    return H('Klien VPN Jarak Jauh (SSTP, L2TP, PPTP, OVPN)') + L.join('\n') + '\n';
  },
  function () {
    return [
      'SSTP membungkus VPN dalam TLS di port 443 sehingga lolos di jaringan yang hanya membuka port web. Opsi verify-server-certificate dimatikan di script ini, jadi ganti ke yes dan pasang sertifikat CA bila servermu menyediakannya.',
      'L2TP memakai IPsec secret sebagai kata sandi bersama tingkat tunnel, berbeda dari password pengguna. Bila secret dikosongkan, IPsec dimatikan dan L2TP berjalan tanpa enkripsi.',
      'PPTP adalah protokol lama tanpa enkripsi yang kuat. Pakai hanya bila server di ujung sana memang tidak menyediakan protokol lain.',
      'Kolom jaringan kantor menentukan apa yang lewat tunnel. Bila dikosongkan, tunnel tersambung tetapi tidak ada trafik yang diarahkan ke sana sampai kamu menambahkan rutenya sendiri.'
    ];
  }));

/* ================= Kategori: IPv6 ================= */

TOOLS.push(T('ipv6-pd', 'ipv6', 'IPv6 dari ISP dengan DHCPv6 Prefix Delegation', 'IPv6 from ISP via DHCPv6 PD',
  'Minta blok prefix IPv6 dari ISP, lalu bagikan alamat ke LAN agar perangkat mendapat IPv6 publik.',
  [
    f('wan', 'Interface WAN', 'text', 'ether1', { mono: 1 }),
    f('lan', 'Interface LAN', 'text', 'ether2', { mono: 1 }),
    f('pool', 'Nama pool prefix', 'text', 'pool-isp6', { mono: 1 })
  ],
  function (v) {
    return H('IPv6 dengan DHCPv6 Prefix Delegation') +
      '/ipv6 dhcp-client add interface=' + v.wan + ' request=prefix pool-name=' + v.pool + ' add-default-route=yes use-peer-dns=no\n' +
      '/ipv6 address add address=::1/64 from-pool=' + v.pool + ' interface=' + v.lan + ' advertise=yes comment="Alamat LAN dari prefix ISP"\n' +
      '# Perangkat LAN menerima alamat otomatis lewat router advertisement. Periksa status klien dengan: /ipv6 dhcp-client print\n';
  },
  function () {
    return [
      'Banyak ISP fiber di Indonesia membagikan IPv6 lewat prefix delegation, biasanya blok /56 atau /60.',
      'Baris pertama meminta prefix ke ISP dan membuat rute default IPv6.',
      'Baris kedua mengambil satu /64 dari prefix itu untuk LAN dan mengiklankannya, jadi HP dan laptop langsung punya IPv6 tanpa DHCPv6 server terpisah.',
      'Jangan lupa memasang firewall IPv6. Lihat tool Firewall IPv6 Dasar di kategori ini, karena IPv6 publik berarti setiap perangkat bisa dijangkau dari internet bila tidak disaring.'
    ];
  }));

TOOLS.push(T('ipv6-firewall', 'ipv6', 'Firewall IPv6 Dasar', 'Basic IPv6 Firewall',
  'Set aturan dasar firewall IPv6 yang setara pola aman IPv4: terima yang berkaitan, tolak yang asing dari WAN.',
  [
    f('wan', 'Interface WAN', 'text', 'ether1', { mono: 1 })
  ],
  function (v) {
    var L = [];
    L.push('# Chain input: melindungi router itu sendiri');
    L.push('/ipv6 firewall filter add chain=input connection-state=established,related action=accept comment="Terima koneksi berjalan"');
    L.push('/ipv6 firewall filter add chain=input connection-state=invalid action=drop comment="Buang paket invalid"');
    L.push('/ipv6 firewall filter add chain=input protocol=icmpv6 action=accept comment="ICMPv6 wajib untuk IPv6 sehat"');
    L.push('/ipv6 firewall filter add chain=input in-interface=' + v.wan + ' action=drop comment="Tolak akses baru dari WAN"');
    L.push('# Chain forward: melindungi perangkat LAN');
    L.push('/ipv6 firewall filter add chain=forward connection-state=established,related action=accept comment="Terima koneksi berjalan"');
    L.push('/ipv6 firewall filter add chain=forward connection-state=invalid action=drop comment="Buang paket invalid"');
    L.push('/ipv6 firewall filter add chain=forward protocol=icmpv6 action=accept comment="ICMPv6 wajib untuk IPv6 sehat"');
    L.push('/ipv6 firewall filter add chain=forward in-interface=' + v.wan + ' connection-state=new action=drop comment="Tolak koneksi baru dari WAN ke LAN"');
    return H('Firewall IPv6 Dasar') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Di IPv6 tidak ada NAT yang menyembunyikan perangkat. Firewall inilah satu satunya pelindung LAN, jadi tool ini penting.',
      'ICMPv6 tidak boleh diblokir total: penemuan tetangga dan pengaturan MTU di IPv6 berjalan lewat protokol ini.',
      'Aturan terakhir chain forward menahan semua koneksi baru dari arah WAN, sementara trafik balasan dari sesi yang dimulai LAN tetap diterima aturan pertama.'
    ];
  }));

TOOLS.push(T('ipv6-route', 'ipv6', 'Rute Statis IPv6', 'IPv6 Static Route',
  'Arahkan trafik IPv6 menuju satu jaringan tujuan lewat gateway tertentu.',
  [
    f('dst', 'Jaringan tujuan IPv6 (CIDR)', 'text', '2001:db8:2::/48', { mono: 1, help: '2001:db8 adalah blok khusus dokumentasi, jadi aman dipakai contoh. Ganti dengan jaringan tujuan aslimu.' }),
    f('gw', 'Gateway IPv6', 'text', 'fe80::1', { mono: 1, help: 'Gateway link local (fe80::) wajib menyebut interface keluarnya.' }),
    f('iface', 'Interface keluar (untuk gateway link local)', 'text', 'ether1', { mono: 1, opt: 1 }),
    f('jarak', 'Distance', 'number', '1', { v: 'num', min: 1, max: 255 })
  ],
  function (v) {
    var gw = v.gw;
    if (v.iface && gw.indexOf('%') === -1 && gw.toLowerCase().indexOf('fe80') === 0) { gw = gw + '%' + v.iface; }
    return H('Rute Statis IPv6') + '/ipv6 route add dst-address=' + v.dst + ' gateway=' + gw + ' distance=' + v.jarak + '\n';
  },
  function () {
    return [
      'Alamat link local hanya berlaku di satu segmen kabel, jadi RouterOS menuntut nama interface setelah tanda persen.',
      'Bila gateway berupa alamat global (bukan fe80::), interface tidak perlu ditulis dan akan diabaikan oleh script ini.'
    ];
  }));

/* ================= Kategori: Wireless ================= */

TOOLS.push(T('ap-rumahan', 'wireless', 'Access Point Rumahan', 'Home Access Point',
  'Nyalakan WiFi satu radio dengan nama jaringan dan kata sandi WPA2, untuk perangkat wireless klasik maupun wifiwave2.',
  [
    f('tipe', 'Jenis perangkat', 'select', 'wifi', { opts: [{ v: 'wifi', l: 'Baru: menu /interface wifi (wifiwave2, ax)' }, { v: 'wireless', l: 'Lama: menu /interface wireless' }] }),
    f('iface', 'Nama interface radio', 'text', 'wifi1', { mono: 1, help: 'Umumnya wifi1 atau wlan1 untuk radio pertama, wifi2 atau wlan2 untuk radio kedua.' }),
    f('ssid', 'Nama jaringan (SSID)', 'text', 'RumahKami', {}),
    f('pass', 'Kata sandi WiFi (minimal 8 karakter)', 'text', '', { mono: 1, help: 'Kosong tidak diizinkan oleh WPA2. Pakai kalimat yang mudah diingat penghuni rumah, bukan tanggal lahir.' })
  ],
  function (v) {
    if (v.tipe === 'wifi') {
      return H('Access Point Rumahan (wifiwave2)') +
        '/interface wifi security add name=profil-rumah authentication-types=wpa2-psk passphrase=' + q(v.pass) + '\n' +
        '/interface wifi set [find default-name=' + v.iface + '] configuration.ssid=' + q(v.ssid) + ' security=profil-rumah disabled=no comment="WiFi rumah"\n';
    }
    return H('Access Point Rumahan (wireless)') +
      '/interface wireless security-profiles add name=profil-rumah authentication-types=wpa2-psk unicast-ciphers=aes-ccm group-ciphers=aes-ccm wpa2-pre-shared-key=' + q(v.pass) + ' mode=dynamic-keys\n' +
      '/interface wireless set [find default-name=' + v.iface + '] ssid=' + q(v.ssid) + ' security-profile=profil-rumah mode=ap-bridge disabled=no\n';
  },
  function () {
    return [
      'Pilih jenis perangkat sesuai menu yang ada di Winbox router kamu. Router ax keluaran baru memakai menu wifi, router lama memakai menu wireless.',
      'Profil keamanan dibuat terpisah agar kelak mudah dipakai ulang untuk radio kedua atau SSID tamu.',
      'Script hanya menyentuh interface yang namanya kamu tulis. Periksa nama default radionya lewat /interface print sebelum menjalankan.'
    ];
  }));

TOOLS.push(T('capsman-manager', 'wireless', 'CAPsMAN Manager', 'CAPsMAN Manager',
  'Jadikan router ini pengendali pusat banyak access point CAP: satu tempat mengatur SSID dan keamanan semua AP.',
  [
    f('tipe', 'Jenis CAPsMAN', 'select', 'wifi', { opts: [{ v: 'wifi', l: 'Baru: wifi CAPsMAN (perangkat ax)' }, { v: 'lama', l: 'Lama: CAPsMAN klasik' }] }),
    f('ssid', 'Nama jaringan (SSID) bersama', 'text', 'SekolahNet', {}),
    f('pass', 'Kata sandi bersama', 'text', '', { mono: 1 }),
    f('negara', 'Negara (aturan kanal radio)', 'text', 'Indonesia', {})
  ],
  function (v) {
    if (v.tipe === 'wifi') {
      return H('CAPsMAN Manager (wifi)') +
        '/interface wifi capsman set enabled=yes\n' +
        '/interface wifi security add name=keamanan-bersama authentication-types=wpa2-psk passphrase=' + q(v.pass) + '\n' +
        '/interface wifi configuration add name=cfg-bersama ssid=' + q(v.ssid) + ' security=keamanan-bersama country=' + q(v.negara) + '\n' +
        '/interface wifi provisioning add action=create-dynamic-enabled master-configuration=cfg-bersama comment="Semua CAP menerima konfigurasi bersama"\n';
    }
    return H('CAPsMAN Manager (klasik)') +
      '/capsman manager set enabled=yes\n' +
      '/capsman security add name=keamanan-bersama authentication-types=wpa2-psk encryption=aes-ccm passphrase=' + q(v.pass) + '\n' +
      '/capsman configuration add name=cfg-bersama ssid=' + q(v.ssid) + ' security=keamanan-bersama country=indonesia\n' +
      '/capsman provisioning add action=create-dynamic-enabled master-configuration=cfg-bersama comment="Semua CAP menerima konfigurasi bersama"\n';
  },
  function () {
    return [
      'Manager adalah otaknya. Setiap AP yang mendaftar sebagai CAP akan menerima SSID dan kata sandi dari konfigurasi bersama ini.',
      'Provisioning create dynamic enabled berarti AP baru yang muncul langsung diberi konfigurasi tanpa persetujuan manual satu per satu. Cocok untuk jaringan sekolah dan kantor, kurang cocok bila kamu ingin menyaring AP asing.',
      'Setelah manager siap, jalankan tool CAP untuk sisi access point pada tiap AP.'
    ];
  }));

TOOLS.push(T('capsman-cap', 'wireless', 'CAP untuk Sisi Access Point', 'CAP for the Access Point Side',
  'Daftarkan access point ini ke CAPsMAN manager agar konfigurasinya diatur dari pusat.',
  [
    f('tipe', 'Jenis CAP', 'select', 'wifi', { opts: [{ v: 'wifi', l: 'Baru: wifi CAP (perangkat ax)' }, { v: 'lama', l: 'Lama: CAP klasik' }] }),
    f('mgr', 'Alamat IP CAPsMAN manager', 'ip', '192.168.88.1', { v: 'ip' }),
    f('disc', 'Interface penemuan (biasanya bridge)', 'text', 'bridge', { mono: 1 })
  ],
  function (v) {
    if (v.tipe === 'wifi') {
      return H('CAP (wifi)') +
        '/interface wifi cap set enabled=yes discovery-interfaces=' + v.disc + ' caps-man-addresses=' + v.mgr + '\n' +
        '# Setelah baris ini, radio pada AP ini dikendalikan manager. Cek pendaftaran di manager lewat menu CAPsMAN, tab Remote Cap.\n';
    }
    return H('CAP (klasik)') +
      '/interface wireless cap set enabled=yes discovery-interfaces=' + v.disc + ' caps-man-addresses=' + v.mgr + ' interfaces=wlan1,wlan2\n' +
      '# Bila AP hanya punya satu radio, hapus wlan2 dari daftar interfaces di atas.\n';
  },
  function () {
    return [
      'CAP menyerahkan kendali radionya ke manager. Mengganti SSID atau kata sandi sesudah ini dilakukan di manager, bukan di AP.',
      'Discovery interface adalah jalan AP menemukan manager di jaringan kabel. Umumnya interface bridge tempat kabel LAN menancap.',
      'Simpan akses lokal ke AP ini, misalnya lewat MAC Winbox, untuk berjaga bila manager sedang mati.'
    ];
  }));

/* ================= Kategori: Container ================= */

TOOLS.push(T('container-adguard', 'container', 'AdGuard Home di Container', 'AdGuard Home in a Container',
  'Jalankan AdGuard Home (penyaring iklan berbasis DNS, sekelas Pi-hole) di dalam router memakai fitur container RouterOS 7.',
  [
    f('vethIp', 'Alamat IP container', 'cidr', '172.17.0.2/24', { v: 'cidr' }),
    f('gwIp', 'Alamat bridge container di router', 'cidr', '172.17.0.1/24', { v: 'cidr' }),
    f('rootDir', 'Folder data container', 'text', 'disk1/adguardhome', { mono: 1, help: 'Nama disk dilihat di /disk print (contohnya disk1 atau sata1). Disk baru wajib diformat ext4 dulu dengan /disk format lalu nama slotnya ditulis di sini. Sangat disarankan memakai penyimpanan terpisah (USB atau disk tambahan), bukan memori internal router.' }),
    f('image', 'Nama image di registry', 'text', 'adguard/adguardhome:latest', { mono: 1 }),
    f('jadikanDns', 'Jadikan container sebagai DNS jaringan', 'check', true, { help: 'Mengarahkan DNS router ke container. Perangkat LAN harus memakai router sebagai DNS agar penyaringan bekerja.' })
  ],
  function (v) {
    var cIp = ipPart(v.vethIp); var gIp = ipPart(v.gwIp);
    var disk = (v.rootDir.split('/')[0] || 'disk1');
    var pfx = parseInt(prefixPart(v.vethIp), 10);
    var netBase = Math.floor(ipToNum(cIp) / Math.pow(2, 32 - pfx)) * Math.pow(2, 32 - pfx);
    var netCidr = numToIp(netBase) + '/' + pfx;
    var L = [];
    L.push('# PRASYARAT WAJIB sebelum script ini (cek dulu, script ini TIDAK memasang paket apa pun):');
    L.push('# 1. Paket container sudah terpasang. Cek dengan /system package print, harus ada baris bernama container.');
    L.push('#    Bila belum ada: unduh paket tambahan (extra packages) dari mikrotik.com sesuai versi RouterOS dan arsitektur routermu,');
    L.push('#    ambil berkas container.npk, unggah ke menu Files, lalu nyalakan ulang router.');
    L.push('# 2. Mode container sudah aktif. Cek dengan /system device-mode print, harus tertulis container: yes.');
    L.push('#    Bila belum: jalankan /system device-mode update container=yes, lalu DALAM 5 MENIT tekan tombol reset/mode');
    L.push('#    pada router ATAU matikan dan nyalakan lagi dayanya. Reboot biasa dari menu MEMBATALKAN perubahan ini.');
    L.push('# 3. Arsitektur router harus ARM, ARM64, atau x86 (cek /system resource print). Router MIPS/MMIPS seperti hEX RB750Gr3 tidak bisa menjalankan container.');
    L.push('# 4. Disk untuk data container sudah diformat ext4 dan nama slotnya sama dengan yang tertulis di kolom Folder data (cek /disk print).');
    L.push('# Bila baris /interface veth atau /container menjawab "bad command name", artinya prasyarat nomor 1 belum terpenuhi, berhenti di sini dan lengkapi dulu prasyaratnya.');
    L.push('/interface veth add name=veth-adguard address=' + v.vethIp + ' gateway=' + gIp);
    L.push('/interface bridge add name=bridge-container comment="Jembatan khusus container"');
    L.push('/interface bridge port add bridge=bridge-container interface=veth-adguard');
    L.push('/ip address add address=' + v.gwIp + ' interface=bridge-container');
    L.push('/ip firewall nat add chain=srcnat src-address=' + netCidr + ' action=masquerade comment="NAT jaringan container"');
    L.push('# Sebelum baris /container add: pastikan /ip dns print berisi DNS publik yang hidup (misalnya 1.1.1.1), karena router perlu menyelesaikan alamat registry untuk menarik image.');
    L.push('/container config set registry-url=https://registry-1.docker.io tmpdir=' + disk + '/container-tmp');
    L.push('/container add remote-image=' + v.image + ' interface=veth-adguard root-dir=' + v.rootDir + ' start-on-boot=yes logging=yes comment="adguard"');
    L.push('# Tunggu unduhan image selesai (cek /container print, status stopped dan tidak error), lalu nyalakan:');
    L.push('# /container start [find comment="adguard"]');
    if (v.jadikanDns) {
      L.push('# SETELAH container berstatus running, jalankan baris DNS ini (sengaja tidak otomatis, agar DNS tidak menunjuk ke container yang belum menyala):');
      L.push('# /ip dns set servers=' + cIp + ' allow-remote-requests=yes');
      L.push('# Arahkan juga DNS klien DHCP ke router ini agar semua perangkat melewati penyaring.');
    }
    L.push('# Verifikasi: perintah ping ' + cIp + ' dari terminal router harus dibalas, lalu buka panel http://' + cIp + ':3000 untuk wizard awal AdGuard.');
    L.push('# Uji blokir dari terminal router setelah DNS diarahkan: /ip dns cache flush lalu put [resolve youtube.com]; jawaban 0.0.0.0 artinya domain itu diblokir AdGuard.');
    return H('AdGuard Home di Container') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Catatan setup ini ditulis dari pengujian langsung di RouterOS 7.21 dan 7.25 (CHR di VirtualBox dan rig RouterOS asli). Ikuti urutannya dari atas ke bawah dan jangan melompat: hampir semua kegagalan setup AdGuard berasal dari langkah yang terlewat, bukan dari scriptnya.',
      'Persyaratan yang tidak bisa dilewati: fitur container hanya ada di RouterOS 7 untuk arsitektur ARM, ARM64, dan x86. Router MIPS/MMIPS (misalnya hEX RB750Gr3) tidak didukung sama sekali. Cek arsitekturmu di /system resource print pada baris architecture-name.',
      'Langkah 1, pasang paket container. Paket ini tidak termasuk RouterOS bawaan. Unduh paket tambahan (extra packages) dari mikrotik.com yang versinya PERSIS sama dengan RouterOS dan arsitektur routermu, ambil container.npk, unggah lewat menu Files (posisikan di daftar paling luar, bukan di dalam folder), lalu nyalakan ulang router. Setelah itu /system package print harus memuat baris container. Versi yang meleset satu angka pun akan ditolak.',
      'Langkah 2, aktifkan mode container dengan /system device-mode update container=yes. Dalam 5 menit kamu wajib menekan tombol reset/mode pada bodi router atau mematikan dan menyalakan dayanya; reboot biasa dari menu justru membatalkan perubahan. Khusus CHR dan mesin virtual lain, tombol fisiknya diganti dengan mematikan total mesin virtualnya lalu menyalakannya lagi (di VirtualBox: Power Off lalu Power On, di Proxmox: Stop lalu Start). Verifikasi dengan /system device-mode print sampai tertulis container: yes.',
      'Gejala prasyarat belum lengkap sangat khas: baris /interface veth dan /container menjawab "bad command name" karena kedua menu itu memang belum ada, dan device-mode yang sudah yes TIDAK membuat menunya muncul bila paketnya belum terpasang. Paket yang menyediakan menu, device-mode hanya memberi izin. Itu bukan salah ketik, dan menjalankan ulang script yang sama tidak akan menolong sebelum paketnya terpasang.',
      'Langkah 3, siapkan disk untuk data container SEBELUM menjalankan script. Cek /disk print: disk tambahan (flashdisk USB, SSD, atau disk virtual kedua) harus diformat ext4 dengan perintah /disk format <nama-slot> file-system=ext4, lalu tulis nama slotnya (misalnya sata1 atau disk1) pada kolom Folder data di formulir tool ini. Jangan memakai memori internal router: image AdGuard berukuran puluhan MB dan butuh ruang untuk diekstrak, sedangkan disk utama bawaan CHR hanya sekitar 90 MB sehingga pasti gagal di tengah jalan. Folder tmpdir otomatis mengikuti disk yang sama dengan folder data.',
      'Langkah 4, cek DNS router sebelum menjalankan script. Pastikan /ip dns print berisi DNS publik yang hidup (misalnya 1.1.1.1 atau 8.8.8.8), karena router memakai DNS itu untuk menyelesaikan alamat Docker Hub saat menarik image. Bila DNS router kosong atau menunjuk ke server yang sudah mati, unduhan image akan gagal dengan pesan resolving error walaupun semua langkah lain benar.',
      'Isi scriptnya sendiri: container mendapat alamat sendiri lewat interface veth yang dijembatani bridge khusus, terpisah rapi dari LAN utama, dan baris NAT masquerade untuk jaringan container membuat AdGuard bisa menjangkau DNS publik di internet sebagai hulunya.',
      'Langkah 5, jalankan script lalu pantau unduhannya. Tempel seluruh script, lalu cek /container print berkala: status akan sibuk selama image ditarik dan diekstrak (bisa beberapa menit), targetnya berhenti di status stopped tanpa error. Baru setelah itu nyalakan dengan /container start [find comment="adguard"] dan cek lagi sampai statusnya running.',
      'Langkah 6, selesaikan wizard AdGuard. Setelah running, buka panelnya di http://' + '172.17.0.2:3000 (sesuaikan dengan alamat IP container yang kamu pakai) untuk membuat akun admin; biarkan port web 3000 dan port DNS 53 apa adanya. Verifikasi cepat dari terminal router: perintah ping ke alamat IP container harus dibalas.',
      'Bila panel tidak terbuka dari komputermu padahal container running dan ping dari terminal router dibalas, berarti komputermu tidak punya rute ke jaringan container. Ini wajar bila routermu berupa CHR di VirtualBox atau mesin virtual lain yang jaringannya terpisah dari komputer induknya. Solusinya tambahkan rute statis di komputer yang menunjuk jaringan container lewat alamat IP router (di Windows lewat CMD administrator: route add 172.17.0.0 mask 255.255.255.0 <alamat IP router>, tambahkan -p di depan add agar permanen), atau buka panel dari perangkat yang memang berada di belakang router itu.',
      'Langkah 7, arahkan DNS dengan urutan yang benar. Perangkat di jaringan JANGAN diarahkan langsung ke alamat IP container. Desainnya: perangkat memakai router sebagai DNS mereka (atur dns-server pada DHCP ke alamat LAN router), dan router meneruskan ke container lewat baris /ip dns set servers=<IP container> allow-remote-requests=yes yang dijalankan SETELAH container running (di script baris ini sengaja berbentuk komentar di bagian akhir). Dashboard AdGuard yang masih menunjukkan 0 kueri dan 0 klien berarti belum ada perangkat yang bertanya lewat jalur ini, bukan tanda AdGuard rusak.',
      'Cara menguji blokir dari terminal router: jalankan /ip dns cache flush, lalu put [resolve youtube.com]. Jawaban 0.0.0.0 artinya domain itu diblokir AdGuard, jawaban alamat IP asli artinya lolos. Flush cache wajib dilakukan setiap habis mengubah aturan, karena router menyimpan jawaban lama dan bisa menipu hasil tesmu. Pakai domain pembanding yang tidak diblokir (misalnya google.com) untuk memastikan DNS-nya sendiri sehat.',
      'Memblokir YouTube, TikTok, dan layanan sejenis bukan pekerjaan daftar blokir iklan bawaan, melainkan menu Penyaring lalu Layanan yang diblokir di dashboard AdGuard. Satu jebakan terakhir saat menguji dari browser: browser modern punya DNS sendiri lewat fitur Use secure DNS (DNS-over-HTTPS) yang melompati DNS lokal sepenuhnya. Matikan fitur itu di browser dan tutup total browsernya sebelum menguji, kalau tidak situs akan terasa tetap lolos padahal rantai DNS-mu sudah benar.',
      'Bila percobaan pertamamu gagal di tengah jalan karena prasyarat belum lengkap, menjalankan script untuk kedua kalinya akan memunculkan error already have pada bridge dan alamat IP sisa percobaan lama. Itu sisa, bukan error baru. Bersihkan dulu dengan /ip address remove [find interface=bridge-container], /interface bridge remove [find name=bridge-container], dan /ip firewall nat remove [find comment="NAT jaringan container"], baru tempel ulang scriptnya.',
      'Risiko yang harus diingat setelah semua berjalan: bila DNS jaringan diarahkan ke container, container yang mati berarti resolusi nama seluruh jaringan ikut mati. Banyak teknisi memasang DNS cadangan publik sebagai jalan keluar darurat, dan mengaktifkan start-on-boot (sudah termasuk di script ini) agar AdGuard menyala sendiri setiap router menyala ulang.'
    ];
  }));

/* ================= Kategori: Kalkulator ================= */

TOOLS.push(T('kalkulator-subnet', 'kalkulator', 'Kalkulator Subnet IPv4', 'IPv4 Subnet Calculator',
  'Masukkan satu jaringan CIDR, hasilnya network, broadcast, rentang host, dan jumlah alamat. Bukan script, murni hitungan.',
  [
    f('net', 'Jaringan (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr', help: 'Contoh 10.20.30.0/26. Alamat yang kamu tulis akan diratakan ke alamat jaringan sebenarnya.' })
  ],
  function (v) {
    var ip = ipPart(v.net); var p = parseInt(prefixPart(v.net), 10);
    var base = Math.floor(ipToNum(ip) / Math.pow(2, 32 - p)) * Math.pow(2, 32 - p);
    var total = Math.pow(2, 32 - p);
    var mask = numToIp(4294967295 - (total - 1));
    var wild = numToIp(total - 1);
    var bcast = base + total - 1;
    var privat = (base >= ipToNum('10.0.0.0') && base < ipToNum('11.0.0.0')) ||
      (base >= ipToNum('172.16.0.0') && base < ipToNum('172.32.0.0')) ||
      (base >= ipToNum('192.168.0.0') && base < ipToNum('192.169.0.0'));
    var L = [];
    L.push('Hasil hitung subnet');
    L.push('');
    L.push('Masukan kamu     : ' + v.net);
    L.push('Alamat jaringan  : ' + numToIp(base) + '/' + p);
    L.push('Netmask          : ' + mask);
    L.push('Wildcard mask    : ' + wild);
    L.push('Broadcast        : ' + numToIp(bcast));
    if (p >= 31) {
      L.push('Rentang host     : pada /' + p + ' tidak ada skema host klasik (tautan point to point atau satu alamat)');
      L.push('Jumlah alamat    : ' + total);
    } else {
      L.push('Host pertama     : ' + numToIp(base + 1));
      L.push('Host terakhir    : ' + numToIp(bcast - 1));
      L.push('Jumlah alamat    : ' + total);
      L.push('Host bisa dipakai: ' + (total - 2));
    }
    L.push('Sifat            : ' + (privat ? 'privat (RFC 1918), untuk jaringan lokal' : 'publik atau khusus, bukan blok privat RFC 1918'));
    return L.join('\n') + '\n';
  },
  function () {
    return [
      'Alamat jaringan didapat dengan meratakan alamat masukan ke kelipatan ukuran bloknya. Jadi menulis 192.168.88.37/24 tetap dihitung sebagai jaringan 192.168.88.0/24.',
      'Dua alamat selalu terpakai oleh skema klasik: alamat jaringan itu sendiri dan broadcast, sehingga host yang bisa dipakai adalah total dikurangi dua.',
      'Prefix /31 dan /32 adalah pengecualian untuk tautan khusus, sehingga baris rentang host ditampilkan berbeda.'
    ];
  }, { kind: 'calc' }));

TOOLS.push(T('kalkulator-pool', 'kalkulator', 'Kalkulator Pool DHCP', 'DHCP Pool Calculator',
  'Dari satu jaringan, hitung saran gateway, cadangan alamat statis, dan rentang pool DHCP yang rapi.',
  [
    f('net', 'Jaringan (CIDR)', 'cidr', '192.168.88.0/24', { v: 'cidr' }),
    f('cadangan', 'Jumlah alamat statis yang disisihkan setelah gateway', 'number', '9', { v: 'num', min: 0, max: 1000, help: 'Untuk printer, access point, server, dan perangkat tetap lainnya.' })
  ],
  function (v) {
    var p = parseInt(prefixPart(v.net), 10);
    var total = Math.pow(2, 32 - p);
    var base = Math.floor(ipToNum(ipPart(v.net)) / total) * total;
    var cad = parseInt(v.cadangan, 10);
    var gw = base + 1;
    var statisAwal = base + 2;
    var statisAkhir = base + 1 + cad;
    var poolAwal = statisAkhir + 1;
    var poolAkhir = base + total - 2;
    var L = [];
    L.push('Saran susunan alamat untuk ' + numToIp(base) + '/' + p);
    L.push('');
    L.push('Gateway (router) : ' + numToIp(gw));
    if (cad > 0) {
      L.push('Cadangan statis  : ' + numToIp(statisAwal) + ' sampai ' + numToIp(statisAkhir) + ' (' + cad + ' alamat)');
    } else {
      L.push('Cadangan statis  : tidak ada');
    }
    L.push('Pool DHCP        : ' + numToIp(poolAwal) + ' sampai ' + numToIp(poolAkhir));
    L.push('Isi pool         : ' + (poolAkhir - poolAwal + 1) + ' alamat');
    L.push('');
    L.push('Baris siap tempel untuk pool ini:');
    L.push('/ip pool add name=pool-lan ranges=' + numToIp(poolAwal) + '-' + numToIp(poolAkhir));
    return L.join('\n') + '\n';
  },
  function () {
    return [
      'Pola yang dipakai adalah pola lapangan yang umum: alamat pertama untuk router, beberapa alamat berikutnya dicadangkan untuk perangkat tetap, sisanya dibagikan DHCP.',
      'Perangkat statis sengaja ditaruh di luar pool agar DHCP tidak pernah memberikan alamat yang sama ke perangkat lain.',
      'Bila isi pool negatif atau sangat kecil, jaringanmu terlalu sempit untuk jumlah cadangan itu. Kecilkan cadangan atau lebarkan prefix.'
    ];
  }, { kind: 'calc' }));

/* ================= Kategori: Wizard Paket ================= */

TOOLS.push(T('wizard-rtrwnet', 'wizard', 'Wizard Paket RT RW Net', 'RT RW Net Package Wizard',
  'Satu form untuk satu router pelanggan siap jualan: WAN, LAN, DHCP, NAT, proteksi dasar, dan antrean per pelanggan.',
  [
    f('wanTipe', 'Cara router mendapat internet', 'select', 'dhcp', { g: 'WAN', opts: [{ v: 'dhcp', l: 'Otomatis (DHCP client dari modem atau ISP)' }, { v: 'static', l: 'Statis (isi alamat dan gateway sendiri)' }] }),
    f('wanIface', 'Interface WAN', 'text', 'ether1', { g: 'WAN', mono: 1 }),
    f('wanIp', 'Alamat statis WAN (bila statis)', 'cidr', '', { g: 'WAN', v: 'cidr', opt: 1, ph: '192.168.1.2/24' }),
    f('wanGw', 'Gateway statis WAN (bila statis)', 'ip', '', { g: 'WAN', v: 'ip', opt: 1, ph: '192.168.1.1' }),
    f('lanIface', 'Interface LAN ke pelanggan', 'text', 'ether2', { g: 'LAN', mono: 1 }),
    f('lanIp', 'Alamat router di LAN', 'cidr', '192.168.10.1/24', { g: 'LAN', v: 'cidr' }),
    f('from', 'Awal pool DHCP', 'ip', '192.168.10.11', { g: 'LAN', v: 'ip' }),
    f('to', 'Akhir pool DHCP', 'ip', '192.168.10.200', { g: 'LAN', v: 'ip' }),
    f('jumlah', 'Jumlah pelanggan awal', 'number', '10', { g: 'Pelanggan', v: 'num', min: 1, max: 50, help: 'Satu simple queue dibuat untuk tiap pelanggan, mulai dari alamat awal pool.' }),
    f('bwUp', 'Bandwidth unggah per pelanggan', 'text', '1M', { g: 'Pelanggan', mono: 1 }),
    f('bwDown', 'Bandwidth unduh per pelanggan', 'text', '3M', { g: 'Pelanggan', mono: 1 }),
    f('awalan', 'Awalan nama antrean pelanggan', 'text', 'pelanggan-', { g: 'Pelanggan', mono: 1 })
  ],
  function (v) {
    var L = [];
    L.push('/system identity set name=Router-RTRWNet');
    L.push('# Bagian WAN');
    if (v.wanTipe === 'dhcp') {
      L.push('# Hapus DHCP client lama di interface WAN dulu (misalnya bawaan pabrik router) agar tidak bentrok');
      L.push('/ip dhcp-client remove [find interface=' + v.wanIface + ']');
      L.push('/ip dhcp-client add interface=' + v.wanIface + ' disabled=no add-default-route=yes use-peer-dns=yes');
    } else {
      if (v.wanIp) { L.push('/ip address add address=' + v.wanIp + ' interface=' + v.wanIface + ' comment="WAN statis"'); }
      if (v.wanGw) { L.push('/ip route add gateway=' + v.wanGw + ' distance=1 comment="Default statis"'); }
      L.push('/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes');
    }
    L.push('# Bagian LAN dan DHCP');
    L.push('/ip address add address=' + v.lanIp + ' interface=' + v.lanIface + ' comment="Gateway pelanggan"');
    L.push('/ip pool add name=pool-pelanggan ranges=' + v.from + '-' + v.to);
    L.push('/ip dhcp-server add name=dhcp-pelanggan interface=' + v.lanIface + ' address-pool=pool-pelanggan lease-time=1d disabled=no');
    L.push('/ip dhcp-server network add address=' + netPart(v.lanIp) + '/' + prefixPart(v.lanIp) + ' gateway=' + ipPart(v.lanIp) + ' dns-server=' + ipPart(v.lanIp));
    L.push('# Bagian NAT dan proteksi dasar');
    L.push('/ip firewall nat add chain=srcnat out-interface=' + v.wanIface + ' action=masquerade comment="Internet untuk pelanggan"');
    L.push('/ip firewall filter add chain=input connection-state=established,related action=accept comment="Terima koneksi berjalan"');
    L.push('/ip firewall filter add chain=input connection-state=invalid action=drop comment="Buang paket invalid"');
    L.push('/ip firewall filter add chain=input in-interface=' + v.wanIface + ' action=drop comment="Tahan akses kelola dari arah WAN"');
    L.push('# Bagian antrean pelanggan');
    var n = parseInt(v.jumlah, 10);
    for (var i = 0; i < n; i++) {
      L.push('/queue simple add name=' + q(v.awalan + (i + 1)) + ' target=' + ipAdd(v.from, i) + '/32 max-limit=' + v.bwUp + '/' + v.bwDown + ' comment="Antrean pelanggan ' + (i + 1) + '"');
    }
    return H('Wizard Paket RT RW Net') + L.join('\n') + '\n';
  },
  function (v) {
    return [
      'Paket ini mengasumsikan model usaha yang umum: pelanggan mendapat alamat dari DHCP, dan antrean menempel pada alamat awal pool secara berurutan.',
      'Aturan terakhir chain input menahan akses kelola router dari arah WAN. Akses Winbox tetap terbuka dari sisi LAN pelanggan, jadi kelola router dari dalam jaringanmu sendiri.',
      'Dalam praktiknya, alamat pelanggan sebaiknya dibuat statis lewat DHCP lease static agar antrean tidak berpindah orang saat alamat berubah.',
      'Daftar antrean dibuat untuk ' + v.jumlah + ' pelanggan pertama dari pool. Pelanggan berikutnya tinggal meniru pola baris antrean yang sama.'
    ];
  }, { kind: 'wizard' }));

TOOLS.push(T('wizard-hotspot-sekolah', 'wizard', 'Wizard Paket Hotspot Sekolah', 'School Hotspot Package Wizard',
  'Hotspot satu sekolah: identitas, jaringan tamu dan guru, profil voucher, pengawasan gateway, dan backup terjadwal.',
  [
    f('nama', 'Nama sekolah (identitas router)', 'text', 'SMK-Contoh', { g: 'Sekolah', help: 'Dipakai juga sebagai nama identitas router. Hindari spasi.' }),
    f('iface', 'Interface hotspot', 'text', 'ether2', { g: 'Jaringan', mono: 1 }),
    f('net', 'Jaringan hotspot (CIDR)', 'cidr', '192.168.20.0/24', { g: 'Jaringan', v: 'cidr' }),
    f('gw', 'Alamat router di jaringan hotspot', 'ip', '192.168.20.1', { g: 'Jaringan', v: 'ip' }),
    f('from', 'Awal pool', 'ip', '192.168.20.10', { g: 'Jaringan', v: 'ip' }),
    f('to', 'Akhir pool', 'ip', '192.168.20.250', { g: 'Jaringan', v: 'ip' }),
    f('dnsname', 'Nama DNS halaman login', 'text', 'hotspot.smk.lokal', { g: 'Jaringan', mono: 1 }),
    f('rate', 'Rate limit profil siswa (unggah/unduh)', 'text', '2M/3M', { g: 'Pengguna', mono: 1 }),
    f('shared', 'Perangkat bersama per akun siswa', 'number', '1', { g: 'Pengguna', v: 'num', min: 1, max: 10 }),
    f('uptime', 'Batas waktu pakai akun siswa per hari', 'text', '10h', { g: 'Pengguna', mono: 1, help: 'Diterapkan pada pola pembuatan akun siswa di penjelasan, bukan pada profil.' }),
    f('gwInt', 'Gateway internet sekolah (untuk netwatch)', 'ip', '192.168.1.1', { g: 'Perawatan', v: 'ip' }),
    f('email', 'Email untuk backup (opsional)', 'text', '', { g: 'Perawatan', opt: 1, ph: 'admin@sekolah.sch.id', help: 'Bila diisi, ditambahkan scheduler ekspor konfigurasi. Pengiriman email memakai pengaturan /tool e-mail yang harus sudah diatur lebih dulu.' })
  ],
  function (v) {
    var L = [];
    L.push('/system identity set name=' + v.nama);
    L.push('# Jaringan hotspot');
    L.push('/ip address add address=' + v.gw + '/' + prefixPart(v.net) + ' interface=' + v.iface + ' comment="Gateway hotspot sekolah"');
    L.push('/ip pool add name=pool-sekolah ranges=' + v.from + '-' + v.to);
    L.push('/ip dhcp-server add name=dhcp-sekolah interface=' + v.iface + ' address-pool=pool-sekolah lease-time=12h disabled=no');
    L.push('/ip dhcp-server network add address=' + v.net + ' gateway=' + v.gw + ' dns-server=' + v.gw);
    L.push('/ip dns set allow-remote-requests=yes');
    L.push('# Hotspot dan profil pengguna');
    L.push('/ip hotspot profile add name=profil-sekolah dns-name=' + v.dnsname + ' hotspot-address=' + v.gw + ' html-directory=hotspot login-by=http-chap,http-pap');
    L.push('/ip hotspot add name=hotspot-sekolah interface=' + v.iface + ' address-pool=pool-sekolah profile=profil-sekolah disabled=no');
    L.push('/ip hotspot user profile add name=siswa rate-limit=' + v.rate + ' shared-users=' + v.shared + ' status-autorefresh=1m');
    L.push('/ip hotspot user profile add name=guru shared-users=3 status-autorefresh=1m');
    L.push('/ip hotspot user add name=operator password="ganti-setelah-terpasang" profile=guru comment="Akun operator awal, wajib ganti password"');
    L.push('# Pola membuat akun siswa: /ip hotspot user add name="nis-siswa" password="acak" profile=siswa limit-uptime=' + v.uptime);
    L.push('# Perawatan: awasi gateway dan backup mingguan');
    L.push('/tool netwatch add host=' + v.gwInt + ' interval=1m down-script={:log error "Netwatch sekolah: gateway internet tidak terjangkau"} up-script={:log info "Netwatch sekolah: gateway internet kembali"}');
    L.push('/system scheduler add name=backup-mingguan interval=7d start-time=02:00:00 on-event={/export hide-sensitive file="backup-sekolah"} comment="Ekspor konfigurasi mingguan"');
    if (v.email) {
      L.push('/system scheduler add name=kirim-backup-sekolah interval=7d start-time=02:30:00 on-event={/tool e-mail send to=' + q(v.email) + ' subject="Backup konfigurasi hotspot sekolah" file="backup-sekolah.rsc"} comment="Kirim hasil ekspor ke email"');
    }
    return H('Wizard Paket Hotspot Sekolah') + L.join('\n') + '\n';
  },
  function () {
    return [
      'Dua profil dibuat: siswa dengan batas kecepatan, guru tanpa batas bawaan profil dan boleh tiga perangkat.',
      'Akun operator awal sengaja memakai password penanda yang mencolok agar tidak lupa diganti setelah pemasangan.',
      'Limit uptime diterapkan saat akun siswa dibuat, karena masa berlaku tiap angkatan bisa berbeda.',
      'Scheduler mingguan mengekspor konfigurasi ke berkas backup-sekolah.rsc di router. Bila email diisi, berkas yang sama dikirim ke email itu 30 menit setelahnya.'
    ];
  }, { kind: 'wizard' }));

/* ================= Kategori: Template Login ================= */

function loginHtml(v, preview) {
  var warna = v.warnaCustom && v.warnaCustom.trim() ? v.warnaCustom.trim() : v.warna;
  var gelap = v.gaya !== 'terang';
  var bg = gelap ? '#10161D' : '#F7F2E7';
  var panel = gelap ? '#171F28' : '#FFFDF6';
  var teks = gelap ? '#E9E2D0' : '#22303C';
  var redup = gelap ? '#9BA8A0' : '#55645A';
  var action = preview ? '#' : '$(link-login-only)';
  var errBlock = preview ? '' : '$(if error)<div class="error">$(error)</div>$(endif)';
  var userVal = preview ? '' : '$(username)';
  var chap = '';
  var onsubmit = '';
  if (!preview) {
    chap = '$(if chap-id)\n<form name="sendin" action="$(link-login-only)" method="post" style="display:none">\n<input type="hidden" name="username">\n<input type="hidden" name="password">\n<input type="hidden" name="dst" value="$(link-orig)">\n<input type="hidden" name="popup" value="true">\n</form>\n<script src="/md5.js"></script>\n<script>\nfunction doLogin() {\n  document.sendin.username.value = document.login.username.value;\n  document.sendin.password.value = hexMD5(\'$(chap-id)\' + document.login.password.value + \'$(chap-challenge)\');\n  document.sendin.submit();\n  return false;\n}\n</script>\n$(endif)\n';
    onsubmit = '$(if chap-id) onsubmit="return doLogin()" $(endif)';
  }
  var trial = preview ? '' : '$(if trial == \'yes\')<p class="trial">Tamu? Coba akses terbatas: <a href="$(link-login-only)?dst=$(link-orig-esc)&amp;username=T-$(mac-esc)">masuk sebagai tamu</a></p>$(endif)';
  return '<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Masuk, ' + v.usaha + '</title>\n<style>\n' +
    'body{margin:0;font-family:Arial,Helvetica,sans-serif;background:' + bg + ';color:' + teks + ';min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}\n' +
    '.kotak{background:' + panel + ';border-top:5px solid ' + warna + ';border-radius:10px;padding:28px 26px;max-width:360px;width:100%;box-sizing:border-box}\n' +
    'h1{font-size:21px;margin:0 0 4px}\n' +
    '.tagline{color:' + redup + ';font-size:14px;margin:0 0 20px}\n' +
    'label{display:block;font-size:13px;font-weight:bold;margin:14px 0 5px}\n' +
    'input{width:100%;box-sizing:border-box;padding:11px;border:1px solid ' + redup + ';border-radius:6px;font-size:15px;background:transparent;color:' + teks + '}\n' +
    'button{width:100%;margin-top:20px;padding:12px;border:0;border-radius:6px;background:' + warna + ';color:#ffffff;font-size:15px;font-weight:bold;cursor:pointer}\n' +
    '.error{background:#f9e7e4;color:#8f1d22;border-radius:6px;padding:10px 12px;font-size:13px;margin-bottom:12px}\n' +
    '.trial{font-size:13px;color:' + redup + ';text-align:center;margin:16px 0 0}\n' +
    '.trial a{color:' + warna + '}\n' +
    '</style>\n</head>\n<body>\n' +
    chap +
    '<div class="kotak">\n<h1>' + v.usaha + '</h1>\n<p class="tagline">' + v.tagline + '</p>\n' +
    errBlock + '\n' +
    '<form name="login" action="' + action + '" method="post" ' + onsubmit + '>\n' +
    (preview ? '' : '<input type="hidden" name="dst" value="$(link-orig)">\n<input type="hidden" name="popup" value="true">\n') +
    '<label for="username">Nama pengguna</label>\n<input id="username" name="username" type="text" value="' + userVal + '" autocomplete="username">\n' +
    '<label for="password">Kata sandi</label>\n<input id="password" name="password" type="password" autocomplete="current-password">\n' +
    '<button type="submit">Masuk</button>\n</form>\n' +
    trial + '\n</div>\n</body>\n</html>\n';
}

TOOLS.push(T('login-hotspot', 'template', 'Template Halaman Login Hotspot', 'Hotspot Login Page Template',
  'Racik berkas login.html untuk hotspot MikroTik: nama usaha, kalimat pembuka, dan warna aksen bisa diganti, pratinjau langsung tampil.',
  [
    f('usaha', 'Nama usaha atau sekolah', 'text', 'Kopi Senja', {}),
    f('tagline', 'Kalimat di bawah nama', 'text', 'Masuk untuk mulai memakai internet', {}),
    f('warna', 'Warna aksen', 'select', '#E8710A', { swatch: 1, opts: [{ v: '#E8710A', l: 'Oranye patch' }, { v: '#2F7D12', l: 'Hijau daun' }, { v: '#1D6FB8', l: 'Biru laut' }, { v: '#C0392B', l: 'Merah bata' }, { v: '#6C3FB5', l: 'Ungu anggur' }] }),
    f('warnaCustom', 'Warna sendiri (kode hex, opsional)', 'text', '', { opt: 1, mono: 1, ph: '#0F766E', help: 'Bila diisi, warna ini mengalahkan pilihan di atas.' }),
    f('gaya', 'Gaya halaman', 'select', 'gelap', { opts: [{ v: 'gelap', l: 'Gelap' }, { v: 'terang', l: 'Terang' }] })
  ],
  function () { return ''; },
  function () {
    return [
      'Unduh hasilnya sebagai login.html, lalu unggah ke router lewat menu Files di Winbox ke folder hotspot (atau folder html yang dipakai profil hotspotmu), menimpa berkas login.html yang lama.',
      'Variabel MikroTik seperti $(link-login-only), $(error), dan $(chap-id) sengaja dipertahankan. Hotspot mengisinya sendiri saat halaman disajikan ke pengguna.',
      'Blok CHAP menjaga password tidak terkirim sebagai teks biasa, sama seperti halaman bawaan MikroTik.',
      'Tautan mode tamu (trial) hanya muncul bila mode trial memang aktif di profil server hotspotmu.'
    ];
  }, { kind: 'login' }));

/* ================= Database Script ================= */

var SNIPPETS = [
  {
    judul: 'Backup konfigurasi berkala ke penyimpanan router',
    desc: 'Scheduler mingguan membuat backup biner dan ekspor teks dengan nama tetap, sehingga berkas lama tertimpa dan penyimpanan tidak penuh.',
    kode: '/system scheduler add name=backup-mingguan interval=7d start-time=02:00:00 on-event={/system backup save name=backup-tetap; /export hide-sensitive file=backup-tetap} comment="Backup berkala RacikRouter"'
  },
  {
    judul: 'Reboot terjadwal di jam sepi',
    desc: 'Menyegarkan router seminggu sekali pada jam yang jarang dipakai. Pastikan tidak ada proses penting pada jam itu.',
    kode: '/system scheduler add name=reboot-mingguan interval=7d start-time=04:00:00 on-event="/system reboot" comment="Reboot terjadwal, pastikan jam ini memang sepi"'
  },
  {
    judul: 'Kirim 10 baris log terakhir ke Telegram',
    desc: 'Jalankan manual dari terminal atau jadikan script berkala. Ganti TOKENBOT dan IDCHAT dengan milikmu.',
    kode: ':local isi "";\n:local total [:len [/log find]];\n:local mulai ($total - 10);\n:if ($mulai < 0) do={ :set mulai 0 }\n:foreach i in=[/log find] do={\n  :set isi ($isi . "%0A" . [/log get $i message]);\n}\n/tool fetch url=("https://api.telegram.org/botTOKENBOT/sendMessage?chat_id=IDCHAT&text=Log%20terbaru:" . $isi) output=none;'
  },
  {
    judul: 'Pisahkan log DHCP ke berkas sendiri',
    desc: 'Log DHCP biasanya paling ramai dan menenggelamkan log penting. Snippet ini memindahkannya ke berkas disk terpisah.',
    kode: '/system logging action add name=log-dhcp target=disk disk-file-name=log-dhcp disk-lines-per-file=500 disk-file-count=2\n/system logging add action=log-dhcp topics=dhcp comment="DHCP ke berkas sendiri"'
  },
  {
    judul: 'Nonaktifkan pengguna hotspot yang masa pakainya habis',
    desc: 'Script memeriksa pengguna hotspot yang uptime nya sudah mencapai limit-uptime, lalu menonaktifkannya. Pasang di scheduler tiap jam.',
    kode: ':foreach u in=[/ip hotspot user find] do={\n  :local lim [/ip hotspot user get $u limit-uptime];\n  :local up [/ip hotspot user get $u uptime];\n  :if ([:len $lim] > 0 && $up >= $lim) do={\n    /ip hotspot user disable $u;\n    :log info ("Pengguna hotspot " . [/ip hotspot user get $u name] . " dinonaktifkan, masa pakai habis");\n  }\n}'
  },
  {
    judul: 'Laporan ke Telegram setiap ada pelanggan PPPoE tersambung',
    desc: 'Tempelkan sebagai on-up pada profil PPPoE. Ganti TOKENBOT, IDCHAT, dan nama profil dengan milikmu.',
    kode: '/ppp profile set [find name="profil-pppoe"] on-up={/tool fetch url=("https://api.telegram.org/botTOKENBOT/sendMessage?chat_id=IDCHAT&text=PPPoE%20tersambung:%20" . $user . "%20dari%20" . $"remote-address") output=none}'
  },
  {
    judul: 'Failover sederhana dengan Netwatch',
    desc: 'Bila saksi internet tidak terjangkau, rute berlabel WAN-utama dinonaktifkan agar rute cadangan distance berikutnya yang bekerja.',
    kode: '/tool netwatch add host=8.8.8.8 interval=30s down-script={/ip route set [find comment="WAN-utama"] disabled=yes; :log warning "Netwatch: WAN utama turun"} up-script={/ip route set [find comment="WAN-utama"] disabled=no; :log info "Netwatch: WAN utama pulih"}'
  },
  {
    judul: 'Kunci Winbox hanya dari jaringan pengelola',
    desc: 'Dua lapis: batasi alamat sumber layanan Winbox, dan saring port 8291 di firewall input. Ganti jaringan pengelola dengan jaringanmu.',
    kode: '/ip service set winbox address=192.168.88.0/24\n/ip firewall filter add chain=input protocol=tcp dst-port=8291 src-address=192.168.88.0/24 action=accept comment="Winbox dari jaringan pengelola" place-before=0\n/ip firewall filter add chain=input protocol=tcp dst-port=8291 action=drop comment="Winbox dari tempat lain ditolak" place-before=1'
  },
  {
    judul: 'Ekspor daftar pengguna hotspot ke berkas teks',
    desc: 'Hasilnya berkas daftar-pengguna.rsc di router, berguna untuk arsip dan audit berkala.',
    kode: '/ip hotspot user export file=daftar-pengguna'
  },
  {
    judul: 'Periksa dan paksa sinkronisasi NTP',
    desc: 'Script berkala: bila status NTP bukan synchronized, catat peringatan ke log agar cepat ketahuan.',
    kode: '/system scheduler add name=cek-ntp interval=1h on-event={:if ([/system ntp client get status] != "synchronized") do={ :log warning "NTP belum sinkron, periksa server NTP dan koneksi internet" }} comment="Pengawas sinkronisasi jam"'
  }
];

var DOWNLOADS = [
  { name: 'WinBox Klasik (v3)', plat: 'Windows', g: 'desktop',
    descId: 'Aplikasi utama untuk mengelola RouterOS dari PC. Versi klasik yang paling banyak dipakai teknisi, ringan dan lengkap.',
    descEn: 'The main app for managing RouterOS from a PC. The classic release most technicians use, light and complete.',
    links: [
      { lId: 'Unduh 64-bit', lEn: 'Download 64-bit', url: 'https://download.mikrotik.com/routeros/winbox/3.43/winbox64.exe' },
      { lId: 'Unduh 32-bit', lEn: 'Download 32-bit', url: 'https://download.mikrotik.com/routeros/winbox/3.43/winbox.exe' }
    ] },
  { name: 'WinBox 4', plat: 'Windows / Linux / macOS', g: 'desktop',
    descId: 'WinBox generasi baru dengan tampilan modern dan mode gelap. Tersedia untuk tiga sistem operasi di halaman resmi MikroTik.',
    descEn: 'The new generation WinBox with a modern look and dark mode. Available for three operating systems on the official MikroTik page.',
    links: [ { lId: 'Halaman unduh resmi', lEn: 'Official download page', url: 'https://mikrotik.com/download/winbox' } ] },
  { name: 'Netinstall', plat: 'Windows / Linux', g: 'desktop',
    descId: 'Tool resmi untuk memasang ulang RouterOS lewat kabel jaringan, penyelamat saat router gagal boot atau lupa kata sandi.',
    descEn: 'The official tool to reinstall RouterOS over a network cable, the rescue path when a router fails to boot or the password is lost.',
    links: [ { lId: 'Halaman unduh resmi', lEn: 'Official download page', url: 'https://mikrotik.com/download/tools' } ] },
  { name: 'The Dude Client', plat: 'Windows', g: 'desktop',
    descId: 'Klien pemantau jaringan The Dude. Menggambar peta perangkat, memantau status naik turun, dan memberi peringatan saat ada perangkat mati.',
    descEn: 'The Dude network monitoring client. It maps your devices, watches up and down status, and alerts you when a device goes offline.',
    links: [ { lId: 'Halaman unduh resmi', lEn: 'Official download page', url: 'https://mikrotik.com/download/tools' } ] },
  { name: 'FlashFig', plat: 'Windows', g: 'desktop',
    descId: 'Mengirim satu berkas konfigurasi awal ke banyak router baru sekaligus saat pertama dinyalakan. Hemat waktu untuk pemasangan massal.',
    descEn: 'Pushes one initial configuration file to many new routers at once on first boot. Saves time on bulk deployments.',
    links: [ { lId: 'Halaman unduh resmi', lEn: 'Official download page', url: 'https://mikrotik.com/download/tools' } ] },
  { name: 'Bandwidth Test', plat: 'Windows', g: 'desktop',
    descId: 'Tool resmi untuk menguji kecepatan nyata antar perangkat MikroTik atau dari PC ke router, memakai protokol btest RouterOS.',
    descEn: 'The official tool to measure real throughput between MikroTik devices or from a PC to a router, using the RouterOS btest protocol.',
    links: [ { lId: 'Halaman unduh resmi', lEn: 'Official download page', url: 'https://mikrotik.com/download/tools' } ] },
  { name: 'Neighbour Viewer dan Mac Telnet', plat: 'Windows', g: 'desktop',
    descId: 'Melihat router MikroTik lain yang satu jaringan dan menyambung lewat alamat MAC. Penyelamat saat alamat IP router lupa.',
    descEn: 'Discovers other MikroTik routers on the same network and connects by MAC address. A lifesaver when the router IP is forgotten.',
    links: [ { lId: 'Halaman unduh resmi', lEn: 'Official download page', url: 'https://mikrotik.com/download/tools' } ] },
  { name: 'MikroTik Pro', plat: 'Android / iOS', g: 'mobile',
    descId: 'Aplikasi resmi untuk mengelola router dari HP, memantau trafik, dan mengubah setelan dasar tanpa membuka laptop.',
    descEn: 'The official app to manage your router from a phone, watch traffic, and change basic settings without opening a laptop.',
    links: [ { lId: 'Halaman unduh resmi', lEn: 'Official download page', url: 'https://mikrotik.com/download/mobile' } ] },
  { name: 'Back To Home (MikroTik VPN)', plat: 'Android / iOS', g: 'mobile',
    descId: 'Aplikasi VPN resmi MikroTik. Beberapa ketukan saja, HP tersambung aman ke jaringan rumah atau sekolah lewat router kamu.',
    descEn: 'The official MikroTik VPN app. A few taps and your phone connects securely to your home or school network through your router.',
    links: [ { lId: 'Halaman unduh resmi', lEn: 'Official download page', url: 'https://mikrotik.com/download/mobile' } ] },
  { name: 'MikroTik CHR', plat: 'Virtual / Cloud', g: 'sistem',
    descId: 'RouterOS versi mesin virtual untuk PC, server, atau cloud. Cocok untuk belajar, lab uji, dan router virtual sungguhan. Di halaman yang sama juga ada RouterOS dan SwitchOS.',
    descEn: 'The virtual machine edition of RouterOS for PCs, servers, or cloud. Good for learning, test labs, and real virtual routers. The same page also carries RouterOS and SwitchOS.',
    links: [ { lId: 'Halaman unduh resmi', lEn: 'Official download page', url: 'https://mikrotik.com/download/routeros' } ] },
  { name: 'MikroTik.mib', plat: 'Semua platform', g: 'sistem',
    descId: 'Berkas MIB resmi MikroTik untuk pemantauan SNMP. Dibaca oleh Zabbix, The Dude, dan tool pemantau lain agar isi router terbaca benar.',
    descEn: 'The official MikroTik MIB file for SNMP monitoring. Read by Zabbix, The Dude, and other monitoring tools so router values are interpreted correctly.',
    links: [ { lId: 'Halaman unduh resmi', lEn: 'Official download page', url: 'https://mikrotik.com/download/tools' } ] }
];

window.RR = { cats: CATS, tools: TOOLS, snippets: SNIPPETS, downloads: DOWNLOADS, loginHtml: loginHtml };

})();
