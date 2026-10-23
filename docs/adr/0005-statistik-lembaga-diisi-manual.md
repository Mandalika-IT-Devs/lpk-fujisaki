---
status: accepted
date: 2026-10-23
---

# Statistik lembaga diisi manual, tidak dihitung dari data sistem

Situs publik menampilkan jumlah siswa per level, per bidang kerja, dan jumlah alumni di Jepang. Siswa dan alumni yang sudah ada sebelum sistem ini tidak dimasukkan ke sistem, jadi angka yang dihitung dari data sistem akan jauh di bawah kenyataan selama bertahun-tahun. Karena itu Admin mengisi angka statistik secara manual beserta tanggal datanya. Sistem hanya menjumlahkan total siswa dan memeriksa bahwa jumlah per bidang kerja sama dengan total itu.

## Considered Options

- **Dihitung otomatis dari data sistem.** Ditolak karena data lama tidak ada di sistem.
- **Angka dasar manual ditambah hitungan otomatis.** Ditolak karena angka mudah terhitung dua kali begitu Admin memperbarui angka dasarnya.

## Consequences

- Jangan "memperbaiki" statistik menjadi hitungan otomatis tanpa keputusan pemilik yang mengubah ADR ini.
