import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md adalah berkas terlindungi: `next dev` tidak boleh menambahkan bloknya sendiri ke sana.
  agentRules: false,
};

export default nextConfig;
