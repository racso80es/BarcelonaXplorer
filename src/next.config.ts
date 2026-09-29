import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    serverExternalPackages: ['@lancedb/lancedb', 'apache-arrow'],
    agentRules: false,
};

export default nextConfig;
