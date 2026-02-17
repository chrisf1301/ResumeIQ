/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Serverless function configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
}

module.exports = nextConfig
