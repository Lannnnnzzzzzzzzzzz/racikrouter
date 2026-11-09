# DESIGN.md, RacikRouter

## Design Read

Reading this as: halaman Operate (alat kerja) untuk teknisi jaringan dan mahasiswa yang sedang belajar MikroTik, dalam bahasa visual meja kerja teknisi dengan panel hasil berbentuk konsol sungguhan, dial ENERGY 2 / RHYTHM 2 / MOTION 1.

Pengguna membuka situs ini untuk bekerja, bukan untuk dibujuk. Karena itu beranda langsung berisi pencarian dan daftar tool, tanpa hero marketing, tanpa statistik, tanpa testimoni.

## Palet

Berbasis prinsip Solarized: hindari hitam dan putih murni, permukaan berwarna hangat, kontras dijaga di koridor nyaman untuk dibaca lama.

### Tema gelap (default)

| Peran | Nilai | Alasan satu baris |
| --- | --- | --- |
| Latar | #10161D | Charcoal berbiru hangat, cukup gelap untuk fokus ke konsol tanpa hitam pekat yang melelahkan mata. |
| Panel | #171F28 | Satu tingkat di atas latar agar area kerja terbaca sebagai bidang terpisah. |
| Panel konsol | #0B0F14 | Paling gelap karena konsol adalah titik fokus, script harus paling menonjol di layar. |
| Teks utama | #E9E2D0 | Putih kertas hangat, kontras tinggi di atas latar gelap tanpa silau putih murni. |
| Teks redup | #9BA8A0 | Abu kehijauan untuk keterangan sekunder, tetap di atas ambang WCAG AA pada latar dan panel. |
| Aksen | #E8710A | Oranye kabel patch, satu satunya warna identitas, dipakai hemat pada tombol utama, status aktif, dan fokus. |
| Valid | #7BD95E (gelap), #2F7D12 (terang) | Hijau status hanya untuk pesan validasi lolos, porsi kecil. |
| Error | #FF9D97 (gelap), #C62F35 (terang) | Merah lembut untuk pesan error inline, dibaca jelas tanpa berteriak. |

### Tema terang

| Peran | Nilai | Alasan satu baris |
| --- | --- | --- |
| Latar | #F7F2E7 | Krem kertas agar tema terang tetap satu keluarga dengan teks hangat tema gelap. |
| Panel | #FFFDF6 | Kertas lebih terang untuk bidang kerja, konsisten dengan latar krem. |
| Teks utama | #22303C | Biru arang, kontras tinggi di atas krem. |
| Aksen | #E8710A (isi tombol), #A84A00 (teks aksen) | Oranye yang sama untuk isi, varian lebih gelap khusus teks agar lolos WCAG AA di latar terang. |

Konsol tetap gelap di kedua tema. Alasan: konsol adalah representasi terminal sungguhan, dan menjaga titik fokus yang sama di kedua tema.

## Tipografi

- Judul dan UI: Archivo (Google Fonts, fallback system sans). Alasan: grotesque tegas dengan karakter teknis yang hangat, bukan huruf default yang generik.
- Mono: IBM Plex Mono (fallback monospace), HANYA untuk isi script, angka hasil kalkulator, dan label kecil bergaya tag port. Alasan: di produk ini mono adalah bahasa kode sungguhan, bukan kostum dekorasi.
- Skala: judul halaman 28px, judul bagian 13px huruf kapital berjarak wajar pada tag kategori, isi 15px, keterangan 13px.

## Motif identitas

Label kecil mono bergaya label port patch panel, contohnya "03 / QUEUE", muncul pada judul kategori dan baris tool. Alasan: teknisi jaringan membaca meja kerjanya lewat label port, motif ini membuat situs terasa milik dunia mereka, dan nomor urut kategori membawa informasi posisi yang nyata.

## Radius dan elevasi

- Panel 12px, input dan tombol 8px, chip dan tag 6px. Alasan: radius mengikuti ukuran komponen, bukan pill di mana mana.
- Elevasi dinyatakan dengan perbedaan warna permukaan dan garis tepi 1px, bukan bayangan melayang. Alasan: meja kerja itu datar, kedalaman datang dari susunan bidang, bukan efek melayang.
- Satu pengecualian bayangan: drawer mobile, karena ia memang melayang di atas konten.

## Keputusan besar lain

- Daftar tool berbentuk baris berkelompok per kategori, bukan grid kartu seragam. Alasan: teknisi memindai daftar seperti membaca daftar port, baris lebih cepat dipindai daripada kartu.
- Panel hasil selalu paling menonjol dan di desktop menempel (sticky) saat form digulir. Alasan: hasil script adalah produk utama halaman, form hanya alat untuk mengubahnya.
- Script diperbarui langsung pada setiap ketikan, tanpa tombol generate. Alasan: hubungan sebab akibat antara isian dan hasil harus terasa seketika, seperti terminal sungguhan.
- Gerakan hanya transisi warna dan drawer (MOTION 1). Alasan: alat kerja tidak perlu koreografi, respons cepat lebih berharga daripada animasi.
- Toggle tema dan bahasa diletakkan di header, selalu terlihat. Alasan: keduanya pengaturan sesi yang sering diganti saat bekerja, bukan menu tersembunyi.
- Tidak ada ikon dekoratif generik. Ikon hanya pada tindakan nyata (salin, unduh, bintang favorit, menu, tutup, tema) dan digambar sebagai SVG satu gaya garis. Alasan: setiap ikon harus menunjuk tindakan, bukan menghias.
