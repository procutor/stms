/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['lh3.googleusercontent.com'],
    },
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    },
    webpack: (config, { isServer }) => {
        // Fix for next-auth ESM module resolution in webpack
        config.resolve.alias = {
            ...config.resolve.alias,
            'nextauth': 'next-auth',
        };
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
    generateBuildId: async () => {
        return 'build-' + Date.now()
    },
}

module.exports = nextConfig