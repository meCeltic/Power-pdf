/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // pdf-parse ships a debug block that reads a test file when bundled; keep it external
        serverComponentsExternalPackages: ["pdf-parse", "@prisma/client", "prisma"],
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false
        config.resolve.alias.encoding = false
        return config
    }
};

export default nextConfig;
