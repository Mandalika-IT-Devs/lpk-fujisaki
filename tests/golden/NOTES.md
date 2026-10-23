# Fixture golden

Folder ini berisi contoh hitungan yang benar, yang diturunkan dari PRD.

Folder ini hanya-baca. Agent tidak boleh mengubahnya, karena folder ini termasuk berkas terlindungi. Kalau sebuah test merah, yang diperbaiki adalah kodenya, bukan fixture di sini.

Setiap aturan PRD punya satu berkas JSON, misalnya `denda-keterlambatan.json`. Isinya kasus-kasus dengan input, output yang diharapkan, dan rujukan ke PRD §.

## Aturan yang belum punya golden

<!-- Catat di sini aturan PRD yang belum punya contoh hitungan. -->

| Aturan | PRD | Alasan belum ada golden |
|---|---|---|
| Kata sandi minimal 8 karakter | §5.1 | Diatur lewat konfigurasi pustaka autentikasi, bukan fungsi domain. Diuji lewat test end-to-end. |
| Tautan verifikasi email berlaku 24 jam | §5.3 | Sama seperti di atas. |
| Tautan atur ulang kata sandi berlaku 1 jam | §5.4 | Sama seperti di atas. |
| Tautan atur kata sandi pegawai baru berlaku 24 jam | §5.5 | Sama seperti di atas. |
| Jenis ujian yang menyelesaikan L2.4 Ujian bahasa Jepang | §9.3 | Menunggu OD-13. |
| Penghapusan otomatis untuk penutupan dengan alasan Dikeluarkan | §12.4 | Menunggu OD-17. Kasus lain ada di `penghapusan-otomatis.json`. |

Daftar fixture yang sudah ada:

| Berkas | PRD |
|---|---|
| `statistik-lembaga.json` | §3.3 |
| `foto-galeri.json` | §3.4 |
| `nomor-whatsapp.json` | §5.2 |
| `batas-usia.json` | §6.3 |
| `nomor-pendaftaran.json` | §6.4 |
| `pindah-tahap.json` | §7.3 |
| `langkah-percobaan.json` | §7.4 |
| `tes-internal.json` | §8.3 |
| `penghapusan-otomatis.json` | §12.4 |
