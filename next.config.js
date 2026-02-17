/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow file uploads up to 10MB
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
