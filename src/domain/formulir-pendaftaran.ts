/**
 * Formulir pendaftaran: pilihan isiannya (PRD §6.1). Formulir tidak menanyakan NIK, tinggi badan, atau berat badan
 * (§12.2, ADR-0004).
 */

export const PILIHAN_JENIS_KELAMIN = ["Laki-laki", "Perempuan"] as const;

/** ▶ Keputusan OD-10. */
export const PILIHAN_PENDIDIKAN_TERAKHIR = [
  "SMP",
  "SMA",
  "SMK",
  "Paket C",
  "D1",
  "D2",
  "D3",
  "D4",
  "S1",
  "S2",
] as const;

/** Keterangan awal dari calon peserta; level siswa ditentukan oleh kelasnya (§9.1). */
export const PILIHAN_KEMAMPUAN_BAHASA_JEPANG = [
  "Belum pernah belajar",
  "N5",
  "N4",
  "N3",
  "N2",
] as const;

/** Pilihan bidang kerja bagi yang belum menentukan; bukan sebuah bidang kerja (PRD §4.2). */
export const BIDANG_KERJA_BELUM_TAHU = "Belum tahu";

/**
 * Isian wajib formulir pendaftaran, dalam urutan PRD §6.1. Jurusan pendidikan terakhir dan pengalaman kerja tidak
 * wajib. Bidang kerja yang diminati terisi bila berisi sebuah bidang kerja atau "Belum tahu".
 */
export const ISIAN_WAJIB = [
  "namaLengkap",
  "jenisKelamin",
  "tempatLahir",
  "tanggalLahir",
  "kabupatenKota",
  "provinsi",
  "pendidikanTerakhir",
  "programId",
  "bidangKerja",
  "kemampuanBahasaJepang",
  "namaKontakDarurat",
  "hubunganKontakDarurat",
  "nomorHpKontakDarurat",
] as const;

export type IsianWajib = (typeof ISIAN_WAJIB)[number];

/** 38 provinsi Indonesia, urut abjad supaya mudah dicari di daftar pilihan. */
export const DAFTAR_PROVINSI = [
  "Aceh",
  "Bali",
  "Banten",
  "Bengkulu",
  "Daerah Istimewa Yogyakarta",
  "DKI Jakarta",
  "Gorontalo",
  "Jambi",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Kalimantan Barat",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Kepulauan Bangka Belitung",
  "Kepulauan Riau",
  "Lampung",
  "Maluku",
  "Maluku Utara",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Tengah",
  "Riau",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tengah",
  "Sulawesi Tenggara",
  "Sulawesi Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Sumatera Utara",
] as const;
