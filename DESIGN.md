# DESIGN.md, RacikRouter

## Catatan penggantian

Dokumen ini menggantikan DESIGN.md v2 (compact, bilah atas plus strip chip kategori).
Desain v3 ini adalah penggantian dunia visual atas pilihan user 9 Nov 2026 pukul 22.12:
user memilih referensi nomor 2, gaya Dashboard Cloudflare, dan memerintahkan rombaknya
dikerjakan pada run Hari 2 (10 Nov 2026) sekalian penambahan tool. Yang diambil dari
referensi itu hanya bahasa polanya (sidebar kiri, bilah atas tipis, permukaan terang
bersih, aksen oranye hemat). Tanpa logo, tanpa nama, tanpa menjiplak mereknya:
identitas tetap RacikRouter, dan hasilnya harus terasa lebih matang dari referensinya
untuk konteks alat MikroTik berbahasa Indonesia.

## Design Read

Reading this as: halaman Operate (alat kerja) untuk teknisi jaringan dan mahasiswa
yang sedang belajar MikroTik, dalam bahasa visual dashboard operasional yang bersih
dan padat, dial ENERGY 2 / RHYTHM 1 / MOTION 1.

Kata kunci: operasional, bersih, padat, tenang. Pengguna membuka situs ini untuk
bekerja dan membandingkan banyak tool dengan cepat, jadi kepadatan yang teratur
mengalahkan dekorasi, dan satu aksen oranye yang hemat mengalahkan warna yang ramai.
Ritme sengaja seragam (RHYTHM 1) karena lembar kerja memang dibaca sebagai daftar
yang konsisten, bukan sebagai rangkaian kejutan.

## Struktur layout

- Sidebar kiri tetap mulai lebar 1024px, berisi ikon plus label untuk Beranda,
  Database Script, dan semua kategori beserta jumlah tool. Alasan: navigasi yang
  selalu terlihat memangkas satu ketukan dibanding strip chip yang harus digeser,
  dan jumlah tool per kategori memberi gambaran isi sebelum diklik.
- Grup navigasi bisa dilipat (Menu, Kategori), keadaan lipatannya tersimpan di
  browser. Alasan: teknisi yang sudah hafal kategori bisa menyembunyikan daftar
  panjang itu dan fokus ke dua menu utama.
- Bilah atas tipis satu baris berisi pencarian global, toggle bahasa ID/EN, dan
  toggle tema. Alasan: tiga kontrol yang dipakai di semua halaman pantas berada di
  satu tempat yang selalu terjangkau, tanpa memakan tinggi layar.
- Di bawah 1024px sidebar menjadi drawer dari tombol menu (Escape menutup,
  ketuk latar menutup, fokus kembali ke tombol menu). Alasan: di layar kecil
  navigasi tidak boleh mencuri lebar konten, tetapi harus bisa dibuka dengan satu
  ketukan dan ditutup tanpa mouse.
- Beranda tanpa judul raksasa: judul 18px dan satu baris subjudul kecil, lalu
  daftar langsung mulai. Alasan: pengguna datang untuk tool, bukan untuk membaca
  pembuka.
- Daftar tool berbentuk baris padat satu baris (nama, deskripsi satu baris
  terpotong rapi, bintang favorit), tersusun 1 kolom di layar sempit, 2 kolom
  mulai 1280px, 3 kolom mulai 1680px. Alasan: baris satu baris adalah satuan
  pindai tercepat pada lembar kerja, dan kolom ganda memanfaatkan layar lebar
  tanpa mengorbankan kepadatan. Ambang kolom digeser dari v2 karena sidebar
  mengambil 236px lebar layar.
- Bagian Favorit dan Terakhir Dipakai tampil sebagai catatan ramping satu baris
  saat kosong, dan sebagai baris yang sama saat terisi. Alasan: status kosong
  tidak layak memakan ruang sebesar konten utama.
- Halaman tool: kepala padat (kembali, judul 21px, chip kategori, bintang dalam
  satu baris), di bawahnya form 55 persen dan konsol 45 persen yang sticky di
  desktop mulai 1024px. Alasan: hasil script tetap produk utama, form adalah
  alat pengubahnya.
- Form disusun grid 2 kolom mulai 1440px (runtuh ke 1 kolom di bawah itu) dengan
  label 12px di atas input dan jarak antar kolom 11px. Alasan: teknisi mengisi
  banyak kolom pendek seperti interface, IP, dan port; dua kolom memangkas gulir
  hampir separuh, tetapi kolom yang terlalu sempit justru memperlambat pengisian.
- Di bawah 1024px halaman tool menjadi satu kolom dan tombol Salin serta Unduh
  pindah ke bilah aksi yang menempel di bawah layar. Alasan: dua tindakan
  terpenting harus selalu dalam jangkauan ibu jari, tidak ikut bergulir bersama
  konsol.

## Palet

Wajah utama adalah tema terang: panel putih di atas abu sangat muda, garis batas
halus, bayangan sangat tipis pada panel. Tema gelap tetap ada dan berfungsi penuh
sebagai mode alternatif dengan pola layout yang sama persis, karena alat teknisi
banyak dipakai malam hari. Aksen oranye (#F48120, sekeluarga oranye patch #E8710A
yang dipakai sejak v1) hanya untuk aksi utama, status aktif, dan fokus. Konsol
tetap gelap di kedua tema. Alasan: konsol adalah representasi terminal sungguhan
dan titik fokus halaman; menggantinya ikut tema akan mengaburkan hierarki itu.

### Tema terang (wajah utama)

| Peran | Nilai | Alasan satu baris |
| --- | --- | --- |
| Latar | #F4F6F8 | Abu sangat muda, cukup gelap untuk memisahkan panel putih tanpa terasa suram. |
| Panel | #FFFFFF | Putih bersih untuk bidang kerja, memantulkan bahasa dashboard operasional. |
| Garis | #DDE3E9 | Garis halus, cukup kontras untuk memisahkan bidang tanpa terasa keras. |
| Teks utama | #16191D | Arang netral, kontras 17,63 banding 1 pada panel. |
| Teks redup | #5B6773 | Abu kebiruan gelap, terukur 5,78 banding 1 pada panel. |
| Aksen | #F48120 | Oranye operasional, satu satunya warna identitas, hanya untuk aksi utama dan status aktif. |
| Teks aksen | #B45309 | Oranye digelapkan khusus teks agar lolos WCAG AA di latar terang. |
| Teks di atas aksen | #201303 | Cokelat sangat gelap, kontras 6,93 banding 1 pada tombol oranye. |

### Tema gelap (mode alternatif)

| Peran | Nilai | Alasan satu baris |
| --- | --- | --- |
| Latar | #101214 | Arang netral, tanpa rona biru atau hangat yang mencolok. |
| Panel | #17191D | Satu tingkat di atas latar, cukup untuk memisahkan bidang kerja dibantu garis tepi. |
| Garis | #26292F | Garis tegas adalah alat pemisah utama sistem ini, menggantikan bayangan. |
| Teks utama | #E8EAED | Putih netral, kontras 14,60 banding 1 pada panel. |
| Teks redup | #9AA3AD | Abu netral, terukur 6,89 banding 1 pada panel. |
| Aksen | #F48120 | Oranye yang sama dengan tema terang, identitas tidak berubah antar tema. |
| Teks aksen | #F99D4D | Varian oranye lebih terang khusus teks kecil agar lolos WCAG AA di latar gelap. |

Semua pasangan teks dan permukaan diukur numerik: 22 dari 22 pasangan lolos WCAG AA
(rentang 4,53 sampai 17,63 banding 1), termasuk kedua tema dan konsol yang tetap gelap.

## Tipografi

- UI: IBM Plex Sans (Google Fonts, fallback system sans). Alasan: dirancang untuk
  antarmuka profesional yang padat, keterbacaan tinggi di ukuran kecil, dan satu
  keluarga dengan IBM Plex Mono sehingga UI dan script terasa satu sistem.
  Dipertahankan dari v2 atas alasan yang sama.
- Mono: IBM Plex Mono, hanya untuk isi script, angka, dan label kecil bergaya tag
  port. Alasan: di produk ini mono adalah bahasa kode dan data sungguhan, bukan
  kostum teknis.
- Skala rapat: isi dasar 14px dengan line-height 1,45, judul halaman tool 21px,
  judul beranda 18px, judul bagian 14,5px, label kolom 12px, deskripsi baris 12px.
  Alasan: kepadatan dicapai dari skala dan jarak yang disiplin, bukan dari
  memperkecil teks sampai sulit dibaca.

## Radius, target sentuh, gerakan

- Radius: panel 8px, input dan tombol 6px, item navigasi 6px. Alasan: sudut yang
  lebih tegak lurus adalah karakter lembar kerja; radius besar membaca sebagai
  kartu konsumen yang longgar.
- Bayangan hanya di tema terang, sangat tipis (offset 1px, blur 2 sampai 3px,
  opasitas 0,04 sampai 0,05) pada panel, bilah atas, dan kartu penjelasan.
  Alasan: bayangan adalah penanda elevasi yang hemat, bukan dekorasi; di tema
  gelap garis tepi sudah cukup sebagai pemisah.
- Target sentuh minimal 40px untuk tombol, baris tool, dan item navigasi; tombol
  bilah aksi mobile 44px. Alasan: compact berarti hemat ruang visual, bukan
  mengorbankan ketukan.
- Gerakan hanya transisi warna saat hover, putaran panah grup navigasi, dan
  geseran drawer (MOTION 1). Alasan: alat kerja yang dipakai berulang menghargai
  respons seketika, bukan koreografi.
- Motif identitas tetap label mono bergaya tag port patch panel ("02 / ROUTING")
  pada kepala kategori dan kepala tool, dipertahankan dari v2. Alasan: nomor urut
  kategori membawa informasi posisi nyata dalam daftar, dan label port adalah
  bahasa visual asli dunia teknisi jaringan, bukan bahasa referensinya.

## Bukti verifikasi v3

- Uji lebar layar pada Chrome headless: beranda dan halaman tool pada lebar 320,
  390, 768, 1024, 1280, 1600, semuanya scrollWidth sama dengan clientWidth
  (nol overflow horizontal).
- Regresi fungsi 36 dari 36 lulus di Chrome headless: pencarian menyaring tepat,
  edit form mengubah script langsung, validasi error muncul dan pulih (tombol
  salin dan unduh nonaktif selama error), favorit tersimpan dan tampil di beranda,
  tema dan bahasa berganti nyata, salin menampilkan "Tersalin.", tombol unduh aktif
  saat isian valid, 10 cuplikan ter-render, pratinjau login ter-render, sidebar
  terlihat di desktop dengan 14 item navigasi dan status aktif yang benar, grup
  kategori bisa dilipat, drawer terbuka dari tombol menu dan tertutup oleh Escape,
  bilah aksi mobile tampil di bawah 1024px dan tersembunyi di desktop, tanpa error JS.
- Uji render data: 73 tool dan 10 cuplikan, template dan penjelasan, 0 error.
- Kontras: 22 dari 22 pasangan lolos WCAG AA.
- Perbaikan selama verifikasi: tombol menu dan tombol tutup sidebar sempat tampil
  di desktop karena aturan display kalah spesifisitas dari kelas tombol umum,
  diperbaiki dengan menaikkan spesifisitas selektor; garis outline oranye sempat
  muncul di bawah halaman tool pendek karena elemen main difokuskan lewat script,
  diperbaiki dengan mematikan outline khusus untuk main (bukan tab stop).
- Tangkapan layar pembanding tersimpan di folder preview-v3 (beranda dan halaman
  tool pada 6 lebar, plus tema gelap pada 1280).
