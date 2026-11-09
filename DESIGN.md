# DESIGN.md, RacikRouter

## Catatan penggantian

Dokumen ini menggantikan DESIGN.md versi pertama. Desain lama (sidebar tetap, judul besar, kartu longgar, font Archivo) dinilai user jelek, terlalu boros ruang, dan kurang rapat. Desain v2 ini adalah penggantian dunia visual secara total atas arahan user: tampilan compact dan responsif sempurna di segala device adalah syarat keras, bukan pilihan.

## Design Read

Reading this as: halaman Operate (alat kerja) untuk teknisi jaringan dan mahasiswa yang sedang belajar MikroTik, dalam bahasa visual lembar spesifikasi teknis yang padat dan rapi, dial ENERGY 2 / RHYTHM 1 / MOTION 1.

Kata kunci: compact, rapat, informatif, tanpa ruang kosong boros. Pengguna membuka situs ini untuk bekerja dan membandingkan banyak tool dengan cepat, jadi kepadatan yang teratur mengalahkan dekorasi. Ritme sengaja seragam (RHYTHM 1) karena lembar spesifikasi memang dibaca sebagai tabel yang konsisten, bukan sebagai rangkaian kejutan.

## Struktur layout

- Bilah atas satu blok sticky berisi dua baris tipis: baris pertama merek kecil, pencarian global, toggle bahasa dan tema; baris kedua strip chip kategori yang bisa digeser horizontal. Alasan: semua navigasi dan pencarian selalu terjangkau tanpa memakan kolom konten seperti sidebar lama.
- Sidebar dan drawer dihapus total. Alasan: chip kategori yang sama dipakai di semua ukuran layar, jadi perilakunya konsisten dan lebar konten penuh untuk daftar tool.
- Beranda tanpa judul raksasa: judul 18px dan satu baris subjudul kecil, lalu daftar langsung mulai. Alasan: pengguna datang untuk tool, bukan untuk membaca pembuka.
- Daftar tool berbentuk baris padat satu baris (nama, deskripsi satu baris terpotong rapi, bintang favorit), tersusun 1 kolom di layar sempit, 2 kolom mulai 880px, 3 kolom mulai 1400px. Alasan: baris satu baris adalah satuan pindai tercepat pada lembar spesifikasi, dan kolom ganda memanfaatkan layar lebar tanpa mengorbankan kepadatan.
- Bagian Favorit dan Terakhir Dipakai tampil sebagai catatan ramping satu baris saat kosong, dan sebagai baris yang sama saat terisi. Alasan: status kosong tidak layak memakan ruang sebesar konten utama.
- Halaman tool: kepala padat (kembali, judul 21px, chip kategori, bintang dalam satu baris), di bawahnya form 55 persen dan konsol 45 persen yang sticky di desktop. Alasan: hasil script tetap produk utama, form adalah alat pengubahnya.
- Form disusun grid 2 kolom untuk kolom pendek (runtuh ke 1 kolom di bawah 1080px) dengan label 12px di atas input dan jarak antar kolom 11px. Alasan: teknisi mengisi banyak kolom pendek seperti interface, IP, dan port; dua kolom memangkas gulir hampir separuh.
- Di bawah 720px halaman tool menjadi satu kolom dan tombol Salin serta Unduh pindah ke bilah aksi yang menempel di bawah layar. Alasan: dua tindakan terpenting harus selalu dalam jangkauan ibu jari, tidak ikut bergulir bersama konsol.

## Palet

Keluarga warna ramah mata dari versi pertama dipertahankan (permukaan hangat, tanpa hitam dan putih murni), tetapi strukturnya disegarkan: permukaan dibedakan garis 1px tegas, bukan bayangan.

### Tema gelap (default)

| Peran | Nilai | Alasan satu baris |
| --- | --- | --- |
| Latar | #0D1218 | Charcoal berbiru hangat, sedikit lebih dalam dari versi lama agar baris padat tetap tenang dibaca. |
| Panel | #141B23 | Satu tingkat di atas latar, cukup untuk memisahkan bidang kerja dibantu garis tepi. |
| Garis | #26313D | Garis tegas adalah alat pemisah utama sistem ini, menggantikan bayangan. |
| Teks utama | #E9E2D0 | Putih kertas hangat, kontras 13 sampai 15 banding 1 pada semua permukaan gelap. |
| Teks redup | #98A4AE | Abu netral untuk keterangan sekunder, terukur 6,8 banding 1 pada panel. |
| Aksen | #E8710A | Oranye kabel patch, satu satunya warna identitas, hanya untuk aksi utama, chip aktif, dan fokus. |
| Teks aksen | #EE8438 | Varian oranye lebih terang khusus teks kecil agar lolos WCAG AA di latar gelap. |

### Tema terang

| Peran | Nilai | Alasan satu baris |
| --- | --- | --- |
| Latar | #F4EFE3 | Krem kertas, satu keluarga dengan teks hangat tema gelap. |
| Panel | #FFFDF6 | Kertas lebih terang untuk bidang kerja. |
| Garis | #DDD3BC | Garis krem tegas, cukup kontras untuk memisahkan bidang tanpa terasa keras. |
| Teks utama | #22303C | Biru arang, kontras di atas 11 banding 1 pada latar dan panel. |
| Teks redup | #52604F | Abu kehijauan gelap, terukur minimal 5,8 banding 1 pada latar terang. |
| Teks aksen | #A84A00 | Oranye digelapkan khusus teks agar lolos WCAG AA di latar terang. |

Konsol tetap gelap di kedua tema (#070B0F, kepala #0E141B). Alasan: konsol adalah representasi terminal sungguhan dan titik fokus halaman; menggantinya ikut tema akan mengaburkan hierarki itu.

Semua pasangan teks dan permukaan diukur numerik: 25 dari 25 pasangan lolos WCAG AA (rentang 5,02 sampai 15,28 banding 1).

## Tipografi

- UI: IBM Plex Sans (Google Fonts, fallback system sans). Alasan: dirancang untuk antarmuka profesional yang padat, keterbacaan tinggi di ukuran kecil, dan satu keluarga dengan IBM Plex Mono sehingga UI dan script terasa satu sistem.
- Mono: IBM Plex Mono, hanya untuk isi script, angka, dan label kecil bergaya tag port. Alasan: di produk ini mono adalah bahasa kode dan data sungguhan, bukan kostum teknis.
- Skala rapat: isi dasar 14px dengan line-height 1,45, judul halaman tool 21px, judul beranda 18px, judul bagian 14,5px, label kolom 12px, deskripsi baris 12px. Alasan: kepadatan dicapai dari skala dan jarak yang disiplin, bukan dari memperkecil teks sampai sulit dibaca.

## Radius, target sentuh, gerakan

- Radius diperkecil: panel 8px, input dan tombol 6px, chip 4px. Alasan: sudut yang lebih tegak lurus adalah karakter lembar spesifikasi; radius besar membaca sebagai kartu konsumen yang longgar.
- Target sentuh minimal 40px untuk tombol, baris tool, dan chip bisa ditekan nyaman; tombol bilah aksi mobile 44px. Alasan: compact berarti hemat ruang visual, bukan mengorbankan ketukan.
- Gerakan hanya transisi warna saat hover dan gulir halus (MOTION 1). Alasan: alat kerja yang dipakai berulang menghargai respons seketika, bukan koreografi.
- Motif identitas tetap label mono bergaya tag port patch panel ("02 / ROUTING") pada kepala kategori dan kepala tool. Alasan: nomor urut kategori membawa informasi posisi nyata dalam daftar, dan label port adalah bahasa visual asli dunia teknisi jaringan.

## Bukti verifikasi v2

- Uji lebar layar pada Chrome headless: beranda dan halaman tool pada lebar 320, 390, 768, 1024, 1280, 1600, semuanya scrollWidth sama dengan clientWidth (nol overflow horizontal).
- Regresi fungsi 33 dari 33 lulus: pencarian global menyaring tepat, edit form mengubah script langsung, validasi error muncul dan pulih, favorit tersimpan dan tampil di beranda, tema dan bahasa berganti nyata, salin dan unduh aktif, pratinjau login ter-render, bilah aksi mobile tampil di bawah 720px dan tersembunyi di desktop, tanpa error JS.
- Uji render data: 55 tool dan 10 cuplikan, template dan penjelasan, 0 error.
- Tangkapan layar pembanding tersimpan di folder preview-v2.
