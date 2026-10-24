import type { ReactNode } from "react";
import { menuPanelPegawai } from "@/domain/panel-pegawai";
import { pastikanPegawai } from "../penjaga";
import { keluar } from "./aksi";
import { MenuPanel } from "./menu-panel";

const NAMA_PERAN = { admin: "Admin", staf: "Staf" } as const;

/** Kerangka panel pegawai: bar atas dengan pegawai yang masuk, lalu menu sesuai perannya. */
export default async function TataLetakPanel({
  children,
}: {
  children: ReactNode;
}) {
  const pegawai = await pastikanPegawai();
  const menu = menuPanelPegawai(pegawai.peran).map(({ kunci, nama }) => ({
    alamat: `/panel/${kunci}`,
    nama,
  }));

  return (
    <>
      <header className="border-b border-garis bg-dasar">
        <div className="wadah flex min-h-15 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 lg:min-h-17">
          <p className="flex items-baseline gap-2">
            <span className="font-papan text-merek text-oranye">Fujisaki</span>
            <span className="text-keterangan leading-none font-semibold text-teks-2">
              Panel pegawai
            </span>
          </p>
          <div className="flex items-center gap-2">
            <p className="text-body-kecil">
              <span className="font-semibold">{pegawai.nama}</span>
              <span className="text-teks-2">
                {" "}
                · {NAMA_PERAN[pegawai.peran]}
              </span>
            </p>
            <form action={keluar}>
              <button
                type="submit"
                className="cursor-pointer rounded-sudut px-3 py-2.5 font-bold text-jalur hover:bg-jalur-pucat hover:text-jalur-tua"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="wadah grid gap-6 py-6 lg:grid-cols-[14rem_1fr] lg:gap-8 lg:py-8">
        <MenuPanel menu={menu} />
        <main>{children}</main>
      </div>
    </>
  );
}
