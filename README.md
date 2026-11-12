# RacikRouter

Generator script MikroTik RouterOS v7 yang berjalan sepenuhnya di browser. Pilih tool, isi kolomnya, script langsung jadi mengikuti isianmu. Hasilnya bisa disalin ke terminal MikroTik atau diunduh sebagai berkas `.rsc`. Gratis, tanpa akun, tanpa server, tanpa proses build.

RacikRouter adalah proyek magang yang dibuat dari nol. Semua script di tools.js ditulis sendiri dari pengetahuan RouterOS, bukan salinan dari situs generator mana pun.

## Cara menjalankan

Pilih salah satu:

1. Buka berkas `index.html` langsung di browser (klik dua kali). Semua fitur utama bekerja dari berkas lokal.
2. Jalankan server statis sederhana di folder ini, misalnya:

   ```bash
   python3 -m http.server 8000
   ```

   lalu buka `http://localhost:8000`.
3. Unggah folder ini ke layanan hosting statis apa pun (GitHub Pages, Netlify, Cloudflare Pages, atau web server sekolah). Tidak ada langkah build.

Service worker (`sw.js`) hanya aktif bila situs disajikan lewat http atau https, dan fungsinya menyimpan berkas aplikasi agar situs bisa dibuka kembali tanpa jaringan.

## Isi proyek

| Berkas | Fungsi |
| --- | --- |
| `index.html` | Kerangka halaman: sidebar navigasi (menu, kategori beserta jumlah tool), bilah atas tipis (pencarian, toggle bahasa dan tema), dan wadah tampilan. |
| `styles.css` | Seluruh gaya, tema terang (wajah utama) dan gelap, tata letak desktop dan mobile. |
| `app.js` | Mesin aplikasi: router hash, render form dari skema, validasi, konsol hasil, favorit, riwayat, pencarian, ganti tema dan bahasa, sidebar dan drawer. |
| `tools.js` | Data: 12 kategori, 109 tool, 10 cuplikan database script, dan 11 item unduhan resmi. Tiap tool berisi skema form, fungsi pembuat script, dan penjelasan Bahasa Indonesia. |
| `manifest.webmanifest` dan `icon.svg` | Metadata agar situs bisa dipasang seperti aplikasi (PWA). |
| `sw.js` | Service worker penyimpan berkas aplikasi untuk pemakaian luring. |
| `DESIGN.md` | Arah desain: palet, tipografi, dan alasan setiap keputusan besar. |
| `preview/` | Tangkapan layar hasil verifikasi desain pertama (desktop dan mobile). |
| `preview-v3/` | Tangkapan layar hasil rombak desain gaya dashboard (beranda dan tool pada lebar 320 sampai 1600, plus tema gelap). |

## Cakupan tool (109)

- Dasar dan Sistem: 34 tool (identitas dan NTP, IP LAN, DHCP server, DHCP client, DNS, ganti password, Netwatch, backup ke email, laporan Telegram, watchdog pemulihan, Kid Control, tambah pengguna admin, pool IP, reboot otomatis, ekspor backup .rsc, pelindung bootloader, bersihkan cache DNS, bersihkan log terminal, kontrol layanan IP, kembalikan nama interface, ping tool, ganti alamat MAC, hapus tabel ARP, hapus DHCP server dan client, hapus DNS, hapus semua alamat IP, hapus semua IP pool, hapus interface dan bridge, nol-kan semua penghitung, reset MAC semua interface, setup RoMON, shutdown reset dan reboot, catatan sistem terminal, traceroute).
- Routing: 11 tool (rute statis, failover recursive, load balancing PCC, load balancing PCC 3 sampai 5 WAN, load balancing ECMP, policy routing aplikasi, OSPF, BGP, VRRP, VLAN per gedung untuk segmentasi sekolah dan kantor, hapus semua routing).
- Firewall dan NAT: 27 tool (masquerade, port forwarding, hairpin NAT, blokir situs, proteksi dasar, pisah trafik game, anti DDoS, anti hack exploit, anti hack MikroTik, anti netcut, anti ping WAN, blokir akses modem, blokir IP, blokir MAC, blokir proxy terbuka, blokir DNS rekursif terbuka, blokir port, bypass trafik lokal, blokir situs Layer 7, blokir situs DNS statis, buang paket invalid, blokir traceroute, FastTrack, lindungi server btest, lindungi MAC server, lindungi Neighbor Discovery, hapus semua firewall).
- Queue: 5 tool (simple queue, queue tree PCQ, kalkulator burst, prioritas aplikasi, hapus semua queue).
- Hotspot dan PPP: 14 tool (hotspot server, profil voucher, PPPoE server, PPPoE client, isolasi pelanggan PPPoE, User Manager, bypass IP binding, bersihkan cookie hotspot, generate voucher, IP binding MAC, PPP secret, hapus semua hotspot, hapus semua PPP, walled garden).
- VPN: 6 tool (WireGuard, L2TP, SSTP, sertifikat, PPTP client, OpenVPN client).
- IPv6: 3 tool (DHCPv6 prefix delegation, firewall IPv6, rute statis IPv6).
- Wireless: 3 tool (AP rumahan, CAPsMAN manager, CAP).
- Container: 1 tool (AdGuard Home di container).
- Kalkulator: 2 tool (subnet IPv4, pool DHCP). Hasilnya teks hitungan, bukan script.
- Wizard Paket: 2 wizard (paket RT RW Net, paket hotspot sekolah).
- Template Login: 1 tool (halaman login hotspot dengan pratinjau langsung dan unduhan login.html).
- Database Script: 10 cuplikan siap salin untuk tugas berulang.
- Unduhan Resmi: 11 item tautan unduh aplikasi dan berkas resmi MikroTik (WinBox klasik dan WinBox 4, Netinstall, The Dude, FlashFig, Bandwidth Test, Neighbour Viewer dan Mac Telnet, MikroTik Pro, Back To Home, CHR, MikroTik.mib) dengan penjelasan singkat per item. Berkasnya langsung dari server MikroTik.

## Fitur aplikasi

- Script diperbarui langsung pada setiap ketikan, tanpa tombol generate.
- Validasi isian (format IP, CIDR, port, angka, rentang) dengan pesan error di bawah kolom yang salah. Tombol salin dan unduh nonaktif selama ada error.
- Penjelasan bagian per bagian dalam Bahasa Indonesia di setiap halaman tool.
- Favorit dan riwayat terakhir dipakai, tersimpan di localStorage browser.
- Pencarian tool langsung dari beranda.
- Navigasi sidebar di desktop (mulai 1024px) dengan jumlah tool per kategori dan grup yang bisa dilipat; di layar kecil menjadi drawer dari tombol menu, Escape menutupnya.
- Tema terang sebagai wajah utama dan tema gelap sebagai mode alternatif, keduanya penuh dan bisa diganti kapan pun.
- Bahasa antarmuka Indonesia dan Inggris (lihat batasan di bawah).
- Navigasi ramah keyboard: Tab untuk berpindah, Escape menutup drawer di mobile, indikator fokus selalu terlihat.
- Setiap hasil script diawali komentar berbahasa Indonesia dan disesuaikan untuk RouterOS v7.

## Batasan yang jujur

- Toggle bahasa Inggris hanya mengubah label antarmuka, nama kategori, dan nama tool. Isi form, teks penjelasan, dan isi script tetap Bahasa Indonesia.
- Script adalah hasil racikan dari isian. Tetap baca dan sesuaikan sebelum menjalankan di router produksi, terutama bagian yang menyangkut firewall, password, dan token.
- Beberapa tool memakai nilai contoh dari blok dokumentasi resmi (misalnya 203.0.113.x untuk TEST-NET-3 dan 2001:db8:: untuk IPv6). Nilai contoh itu selalu ditandai di keterangan kolom.
- Situs ini tidak berafiliasi dengan MikroTik. RouterOS dan MikroTik adalah merek milik pemiliknya.

## Cara menambah tool baru

Tambahkan satu objek lewat pola `T(...)` di `tools.js`: tentukan id, kategori, nama Indonesia dan Inggris, deskripsi, array kolom (`f(...)`), fungsi `template(values)` yang mengembalikan string script, dan fungsi `explain(values)` yang mengembalikan array kalimat penjelasan. Mesin di `app.js` akan merender form, validasi, konsol, dan tombolnya secara otomatis.
