/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['lh3.googleusercontent.com'],
    },
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    },
    output: 'standalone',
    generateBuildId: async () => {
        return 'build-' + Date.now()
    },
}

module.exports = nextConfig