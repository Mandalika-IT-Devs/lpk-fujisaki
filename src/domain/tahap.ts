/**
 * Enam tahap dan langkahnya (PRD §7.1). Alurnya tetap dan sama untuk semua program (ADR-0003).
 * Nomor tahap 1–6 tampil sebagai kode stasiun FG 01–FG 06 (docs/DESIGN.md).
 */
export type Tahap = {
  nomor: number;
  nama: string;
  langkah: readonly { kode: string; nama: string }[];
};

export const TAHAP: readonly Tahap[] = [
  {
    nomor: 1,
    nama: "Pendaftaran dan seleksi",
    langkah: [
      { kode: "L1.1", nama: "Berkas pendaftaran diterima" },
      { kode: "L1.2", nama: "Pemeriksaan fisik" },
      { kode: "L1.3", nama: "Psikotes" },
      { kode: "L1.4", nama: "Tes matematika" },
      { kode: "L1.5", nama: "Pra-MCU" },
    ],
  },
  {
    nomor: 2,
    nama: "Belajar bahasa Jepang",
    langkah: [
      { kode: "L2.1", nama: "Pembelajaran bahasa Jepang" },
      { kode: "L2.2", nama: "Pengenalan budaya Jepang" },
      { kode: "L2.3", nama: "Pengenalan kebiasaan organisasi Jepang" },
      { kode: "L2.4", nama: "Ujian bahasa Jepang" },
    ],
  },
  {
    nomor: 3,
    nama: "Belajar tokutei ginou",
    langkah: [
      { kode: "L3.1", nama: "Pelatihan teori dan praktik" },
      { kode: "L3.2", nama: "Pengenalan budaya kerja Jepang" },
      { kode: "L3.3", nama: "Ujian keterampilan SSW" },
    ],
  },
  {
    nomor: 4,
    nama: "Job matching",
    langkah: [
      { kode: "L4.1", nama: "Wawancara lembaga pendamping" },
      { kode: "L4.2", nama: "Wawancara perusahaan penerima" },
      { kode: "L4.3", nama: "MCU" },
      { kode: "L4.4", nama: "Tanda tangan kontrak kerja" },
      { kode: "L4.5", nama: "Pembuatan paspor" },
    ],
  },
  {
    nomor: 5,
    nama: "Magang kerja",
    langkah: [{ kode: "L5.1", nama: "Magang kerja di perusahaan Indonesia" }],
  },
  {
    nomor: 6,
    nama: "Persiapan berangkat",
    langkah: [
      { kode: "L6.1", nama: "Review bahasa dan percakapan (1 bulan)" },
      { kode: "L6.2", nama: "COE terbit" },
      { kode: "L6.3", nama: "Visa terbit" },
      { kode: "L6.4", nama: "Berangkat" },
    ],
  },
];
