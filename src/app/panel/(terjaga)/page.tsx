import { redirect } from "next/navigation";
import { pastikanPegawai } from "../penjaga";

/** Panel pegawai dibuka di Pendaftaran, satu-satunya menu yang dimiliki Staf dan Admin. */
export default async function HalamanPanel() {
  await pastikanPegawai();
  redirect("/panel/pendaftaran");
}
