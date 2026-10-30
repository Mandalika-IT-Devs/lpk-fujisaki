import Link from "next/link";
import { ChipStatus } from "@/components/chip-status";
import { IkonPanahKanan, IkonPanahKiri } from "@/components/ikon";
import { KodeStasiun, nomorStasiun } from "@/components/kode-stasiun";
import { TombolKedua } from "@/components/tombol";
import type {
  HalamanDaftar,
  SaringanPendaftaran,
} from "@/domain/daftar-pendaftaran";
import { TAHAP } from "@/domain/tahap";
import { formatAngka, formatTanggalWib } from "@/lib/format";
import type { BarisDaftarPendaftaran } from "@/server/pendaftaran";
import { alamatPendaftaran } from "./alamat-pendaftaran";
import { alamatDaftar } from "./saringan";

const GAYA_KEPALA = "py-2 pr-4 font-semibold";
const GAYA_SEL = "py-2 pr-4";

const namaTahap = (nomor: number) =>
  TAHAP.find((tahap) => tahap.nomor === nomor)?.nama;

/**
 * Satu halaman daftar pendaftaran (PRD §11.1): nomor pendaftaran, nama, program, bidang kerja, tahap, status, dan
 * tanggal kirim (WIB), dari yang paling baru dikirim; lalu tautan ke halaman sebelum dan sesudahnya. Nomor pendaftaran
 * menautkan ke halaman pendaftaran itu (§11.2).
 */
export function DaftarPendaftaran({
  daftar,
  saringan,
  adaSaringan,
}: {
  daftar: HalamanDaftar<BarisDaftarPendaftaran>;
  saringan: SaringanPendaftaran;
  adaSaringan: boolean;
}) {
  if (daftar.jumlah === 0) {
    return (
      <p className="max-w-[60ch] text-teks-2">
        {adaSaringan
          ? "Tidak ada pendaftaran yang cocok dengan saringan dan pencarian ini. Ubah saringan atau pencariannya, atau hapus saringan untuk melihat semua pendaftaran."
          : "Belum ada pendaftaran. Pendaftaran tampil di sini begitu calon peserta mengirim formulir pendaftarannya."}
      </p>
    );
  }

  const { halaman, jumlahHalaman } = daftar;
  return (
    <div className="grid gap-4">
      <p className="text-body-kecil text-teks-2">
        {`Menampilkan ${formatAngka(daftar.dari)}–${formatAngka(daftar.sampai)} dari ${formatAngka(daftar.jumlah)} pendaftaran.`}
      </p>
      {/* Di HP daftar bergeser ke samping di dalam bingkainya sendiri, bukan halamannya. Bingkai ini relative
          supaya judul tabel sr-only (posisi absolut) ikut terpotong bingkai, tidak melebarkan halaman. */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse text-left">
          <caption className="sr-only">Daftar pendaftaran</caption>
          <thead>
            <tr className="border-b-2 border-navy text-body-kecil">
              <th scope="col" className={GAYA_KEPALA}>
                Nomor pendaftaran
              </th>
              <th scope="col" className={GAYA_KEPALA}>
                Nama
              </th>
              <th scope="col" className={GAYA_KEPALA}>
                Program
              </th>
              <th scope="col" className={GAYA_KEPALA}>
                Bidang kerja
              </th>
              <th scope="col" className={GAYA_KEPALA}>
                Tahap
              </th>
              <th scope="col" className={GAYA_KEPALA}>
                Status
              </th>
              <th scope="col" className="py-2 font-semibold whitespace-nowrap">
                Tanggal kirim
              </th>
            </tr>
          </thead>
          <tbody>
            {daftar.baris.map((pendaftaran) => (
              <tr key={pendaftaran.nomor} className="border-b border-garis">
                <th
                  scope="row"
                  className="py-2 pr-4 font-papan text-nomor whitespace-nowrap"
                >
                  <Link href={alamatPendaftaran(pendaftaran.nomor)}>
                    {pendaftaran.nomor}
                  </Link>
                </th>
                <td className={`${GAYA_SEL} font-semibold`}>
                  {pendaftaran.namaLengkap}
                </td>
                <td className={GAYA_SEL}>{pendaftaran.program}</td>
                <td className={GAYA_SEL}>{pendaftaran.bidangKerja}</td>
                <td className={GAYA_SEL}>
                  <span className="flex items-center gap-2">
                    <KodeStasiun
                      nomor={nomorStasiun(pendaftaran.tahap)}
                      ukuran="kecil"
                    />
                    {namaTahap(pendaftaran.tahap)}
                  </span>
                </td>
                <td className={GAYA_SEL}>
                  <ChipStatus status={pendaftaran.status} />
                </td>
                <td className="py-2 whitespace-nowrap">
                  {formatTanggalWib(pendaftaran.dikirimPada)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {jumlahHalaman > 1 && (
        <nav
          aria-label="Halaman daftar pendaftaran"
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          {halaman > 1 && (
            <TombolKedua href={alamatDaftar(saringan, halaman - 1)}>
              <IkonPanahKiri />
              Sebelumnya
            </TombolKedua>
          )}
          <p className="text-body-kecil text-teks-2">
            Halaman {halaman} dari {jumlahHalaman}
          </p>
          {halaman < jumlahHalaman && (
            <TombolKedua href={alamatDaftar(saringan, halaman + 1)}>
              Berikutnya
              <IkonPanahKanan />
            </TombolKedua>
          )}
        </nav>
      )}
    </div>
  );
}
