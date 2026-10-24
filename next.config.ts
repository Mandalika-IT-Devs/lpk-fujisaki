import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md adalah berkas terlindungi: `next dev` tidak boleh menambahkan bloknya sendiri ke sana.
  agentRules: false,
  experimental: {
    // forbidden(): rute khusus Admin menjawab 403 kepada Staf (src/app/panel/penjaga.ts).
    authInterrupts: true,
  },
};

export default nextConfig;
