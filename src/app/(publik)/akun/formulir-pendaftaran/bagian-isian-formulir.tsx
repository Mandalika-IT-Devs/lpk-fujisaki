import type { ReactNode } from "react";
import { IkonPanahBawah, IkonSeru } from "@/components/ikon";
import {
  BIDANG_KERJA_BELUM_TAHU,
  DAFTAR_PROVINSI,
  PILIHAN_JENIS_KELAMIN,
  PILIHAN_KEMAMPUAN_BAHASA_JEPANG,
  PILIHAN_PENDIDIKAN_TERAKHIR,
} from "@/domain/formulir-pendaftaran";
import { cn } from "@/lib/utils";
import type { PilihanFormulirPendaftaran } from "@/server/formulir-pendaftaran";
import { GAYA_ISIAN, GAYA_LABEL } from "@/app/panel/akses-pegawai";
import {
  type GalatIsian,
  type IsianFormulirPendaftaran,
  LABEL_ISIAN,
  type NamaIsian,
  NILAI_BELUM_TAHU,
} from "./isian-formulir";

// Isian yang salah (docs/DESIGN.md belum punya gaya error isian): border navy, dan pesan di bawah isian dengan ikon
// tanda seru dan teks navy, seperti jawaban langsung "Tidak memenuhi"; tidak memakai oranye.
const GAYA_ISIAN_FORMULIR = cn(GAYA_ISIAN, "aria-invalid:border-navy");
const GAYA_PILIHAN = cn(
  GAYA_ISIAN_FORMULIR,
  "cursor-pointer appearance-none pr-10",
);
const GAYA_ISIAN_PANJANG = cn(GAYA_ISIAN_FORMULIR, "h-auto min-h-28 py-2.5");
const GAYA_KETERANGAN = "text-keterangan text-teks-2";

const PILIH_SALAH_SATU = "Pilih salah satu";

/** Atribut isian untuk pembaca layar: tanda salah, lalu keterangan dan pesan kesalahan yang menjelaskannya. */
function atributIsian(nama: NamaIsian, galat: GalatIsian, keterangan = false) {
  const dijelaskan = [
    keterangan && `keterangan-${nama}`,
    galat[nama] && `galat-${nama}`,
  ].filter(Boolean);
  return {
    id: nama,
    name: nama,
    "aria-invalid": galat[nama] ? true : undefined,
    "aria-describedby": dijelaskan.join(" ") || undefined,
  };
}

function PesanGalat({ nama, galat }: { nama: NamaIsian; galat: GalatIsian }) {
  if (!galat[nama]) return null;
  return (
    <p
      id={`galat-${nama}`}
      className="flex items-start gap-2 text-body-kecil font-medium text-navy"
    >
      <span className="mt-px">
        <IkonSeru />
      </span>
      <span>{galat[nama]}</span>
    </p>
  );
}

/** Label di atas isian, dengan keterangan dan pesan kesalahannya di bawah isian. */
function Kolom({
  nama,
  galat,
  tidakWajib = false,
  keterangan,
  children,
}: {
  nama: NamaIsian;
  galat: GalatIsian;
  tidakWajib?: boolean;
  keterangan?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid content-start gap-1">
      <label htmlFor={nama} className={GAYA_LABEL}>
        {LABEL_ISIAN[nama]}
        {tidakWajib && (
          <span className="font-normal text-teks-2"> (tidak wajib)</span>
        )}
      </label>
      {children}
      {keterangan && (
        <p id={`keterangan-${nama}`} className={GAYA_KETERANGAN}>
          {keterangan}
        </p>
      )}
      <PesanGalat nama={nama} galat={galat} />
    </div>
  );
}

/** Select dengan panah navy di kanan (docs/DESIGN.md, Inputs / Fields) dan pilihan kosong di atas. */
function Pilihan({
  nama,
  galat,
  nilai,
  autoComplete = "off",
  keterangan = false,
  children,
}: {
  nama: NamaIsian;
  galat: GalatIsian;
  nilai: string;
  autoComplete?: string;
  keterangan?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        {...atributIsian(nama, galat, keterangan)}
        autoComplete={autoComplete}
        defaultValue={nilai}
        className={GAYA_PILIHAN}
      >
        <option value="">{PILIH_SALAH_SATU}</option>
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-navy">
        <IkonPanahBawah />
      </span>
    </div>
  );
}

/** Tingkat judul setiap bagian isian: h2 bila formulir ini isi utama halaman, h3 bila berada di bawah judul h2. */
type TingkatJudul = "h2" | "h3";

function Bagian({
  id,
  judul,
  tingkatJudul,
  children,
}: {
  id: string;
  judul: string;
  tingkatJudul: TingkatJudul;
  children: ReactNode;
}) {
  const Judul = tingkatJudul;
  return (
    <section aria-labelledby={id} className="grid gap-5">
      <Judul id={id} className="font-papan text-title-kecil">
        {judul}
      </Judul>
      {children}
    </section>
  );
}

/**
 * Semua isian formulir pendaftaran PRD §6.1, dalam urutan tabelnya, tanpa isian NIK, tinggi badan, atau berat badan
 * (§12.2). Dipakai formulir pemilik akun dan formulir ubah isian pegawai, jadi isian, label, dan tanda isian yang
 * salah sama di keduanya. Isiannya tidak terkendali; pemakainya memasang ulang komponen ini dengan kunci baru sesudah
 * setiap action, supaya setiap isian berangkat dari `isian`.
 */
export function BagianIsianFormulir({
  isian,
  galat,
  pilihan,
  tingkatJudul = "h2",
}: {
  isian: IsianFormulirPendaftaran;
  galat: GalatIsian;
  pilihan: PilihanFormulirPendaftaran;
  tingkatJudul?: TingkatJudul;
}) {
  return (
    <>
      <Bagian
        id="bagian-data-diri"
        judul="Data diri"
        tingkatJudul={tingkatJudul}
      >
        <Kolom nama="namaLengkap" galat={galat}>
          <input
            {...atributIsian("namaLengkap", galat)}
            type="text"
            autoComplete="name"
            defaultValue={isian.namaLengkap}
            className={GAYA_ISIAN_FORMULIR}
          />
        </Kolom>
        <div className="grid gap-1">
          <p id="label-jenisKelamin" className={GAYA_LABEL}>
            {LABEL_ISIAN.jenisKelamin}
          </p>
          <div
            role="radiogroup"
            aria-labelledby="label-jenisKelamin"
            aria-invalid={galat.jenisKelamin ? true : undefined}
            aria-describedby={
              galat.jenisKelamin ? "galat-jenisKelamin" : undefined
            }
            className="flex flex-wrap gap-x-8"
          >
            {PILIHAN_JENIS_KELAMIN.map((jenis) => (
              <label
                key={jenis}
                className="flex min-h-11 cursor-pointer items-center gap-3"
              >
                <input
                  type="radio"
                  name="jenisKelamin"
                  value={jenis}
                  defaultChecked={isian.jenisKelamin === jenis}
                  className="size-6 shrink-0 cursor-pointer accent-jalur"
                />
                {jenis}
              </label>
            ))}
          </div>
          <PesanGalat nama="jenisKelamin" galat={galat} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
          <Kolom nama="tempatLahir" galat={galat}>
            <input
              {...atributIsian("tempatLahir", galat)}
              type="text"
              autoComplete="off"
              defaultValue={isian.tempatLahir}
              className={GAYA_ISIAN_FORMULIR}
            />
          </Kolom>
          <Kolom nama="tanggalLahir" galat={galat}>
            <input
              {...atributIsian("tanggalLahir", galat)}
              type="date"
              autoComplete="bday"
              defaultValue={isian.tanggalLahir}
              className={GAYA_ISIAN_FORMULIR}
            />
          </Kolom>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
          <Kolom nama="kabupatenKota" galat={galat}>
            <input
              {...atributIsian("kabupatenKota", galat)}
              type="text"
              autoComplete="address-level2"
              defaultValue={isian.kabupatenKota}
              className={GAYA_ISIAN_FORMULIR}
            />
          </Kolom>
          <Kolom nama="provinsi" galat={galat}>
            <Pilihan
              nama="provinsi"
              galat={galat}
              nilai={isian.provinsi}
              autoComplete="address-level1"
            >
              {DAFTAR_PROVINSI.map((provinsi) => (
                <option key={provinsi} value={provinsi}>
                  {provinsi}
                </option>
              ))}
            </Pilihan>
          </Kolom>
        </div>
      </Bagian>

      <Bagian
        id="bagian-pendidikan"
        judul="Pendidikan"
        tingkatJudul={tingkatJudul}
      >
        <Kolom nama="pendidikanTerakhir" galat={galat}>
          <Pilihan
            nama="pendidikanTerakhir"
            galat={galat}
            nilai={isian.pendidikanTerakhir}
          >
            {PILIHAN_PENDIDIKAN_TERAKHIR.map((pendidikan) => (
              <option key={pendidikan} value={pendidikan}>
                {pendidikan}
              </option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom nama="jurusanPendidikan" galat={galat} tidakWajib>
          <input
            {...atributIsian("jurusanPendidikan", galat)}
            type="text"
            autoComplete="off"
            defaultValue={isian.jurusanPendidikan}
            className={GAYA_ISIAN_FORMULIR}
          />
        </Kolom>
      </Bagian>

      <Bagian
        id="bagian-program"
        judul="Program dan pengalaman"
        tingkatJudul={tingkatJudul}
      >
        <Kolom nama="programId" galat={galat}>
          <Pilihan nama="programId" galat={galat} nilai={isian.programId}>
            {pilihan.program.map((program) => (
              <option key={program.id} value={program.id}>
                {program.nama}
              </option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom nama="bidangKerja" galat={galat}>
          <Pilihan nama="bidangKerja" galat={galat} nilai={isian.bidangKerja}>
            {pilihan.bidangKerja.map((bidang) => (
              <option key={bidang.id} value={bidang.id}>
                {bidang.nama}
              </option>
            ))}
            <option value={NILAI_BELUM_TAHU}>{BIDANG_KERJA_BELUM_TAHU}</option>
          </Pilihan>
        </Kolom>
        <Kolom
          nama="kemampuanBahasaJepang"
          galat={galat}
          keterangan="Keterangan awal saja. Levelmu nanti ditentukan oleh kelas di lembaga."
        >
          <Pilihan
            nama="kemampuanBahasaJepang"
            galat={galat}
            nilai={isian.kemampuanBahasaJepang}
            keterangan
          >
            {PILIHAN_KEMAMPUAN_BAHASA_JEPANG.map((kemampuan) => (
              <option key={kemampuan} value={kemampuan}>
                {kemampuan}
              </option>
            ))}
          </Pilihan>
        </Kolom>
        <Kolom nama="pengalamanKerja" galat={galat} tidakWajib>
          <textarea
            {...atributIsian("pengalamanKerja", galat)}
            defaultValue={isian.pengalamanKerja}
            className={GAYA_ISIAN_PANJANG}
          />
        </Kolom>
      </Bagian>

      <Bagian
        id="bagian-kontak-darurat"
        judul="Kontak darurat"
        tingkatJudul={tingkatJudul}
      >
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
          <Kolom nama="namaKontakDarurat" galat={galat}>
            <input
              {...atributIsian("namaKontakDarurat", galat)}
              type="text"
              autoComplete="off"
              defaultValue={isian.namaKontakDarurat}
              className={GAYA_ISIAN_FORMULIR}
            />
          </Kolom>
          <Kolom
            nama="hubunganKontakDarurat"
            galat={galat}
            keterangan="Misalnya Ibu, Ayah, atau Kakak."
          >
            <input
              {...atributIsian("hubunganKontakDarurat", galat, true)}
              type="text"
              autoComplete="off"
              defaultValue={isian.hubunganKontakDarurat}
              className={GAYA_ISIAN_FORMULIR}
            />
          </Kolom>
        </div>
        <Kolom
          nama="nomorHpKontakDarurat"
          galat={galat}
          keterangan="Nomor HP Indonesia, misalnya 0812-3456-7890."
        >
          <input
            {...atributIsian("nomorHpKontakDarurat", galat, true)}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            defaultValue={isian.nomorHpKontakDarurat}
            className={GAYA_ISIAN_FORMULIR}
          />
        </Kolom>
      </Bagian>
    </>
  );
}
