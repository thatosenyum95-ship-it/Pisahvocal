# PisahSuara — prototipe pemisah vokal dan musik

Website statis untuk GitHub Pages. Audio diproses lokal di browser; tidak perlu akun, backend, atau unggah file ke server.

## Penting tentang kualitas
Versi ini **bukan AI** dan bukan pemisah stem berkualitas studio. Ia hanya membuat perkiraan sederhana dari sinyal stereo:
- Perkiraan vokal: `(L + R) / 2`
- Perkiraan musik: `(L - R) / 2`

Teknik ini tidak benar-benar memisahkan semua vokal dari semua instrumen. Hasilnya bergantung pada mixing lagu; file mono tidak didukung untuk pemisahan berarti.

## Mengaktifkan GitHub Pages
1. Buka **Settings → Pages** di repository.
2. Pada bagian **Build and deployment**, pilih **Deploy from a branch**.
3. Pilih branch `main` dan folder `/(root)`, lalu tekan **Save**.
4. Tunggu sampai URL Pages muncul.

Tidak ada API key atau layanan berbayar yang diperlukan untuk prototipe ini.