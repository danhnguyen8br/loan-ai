const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Specify the monorepo root for proper file tracing
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Note: 'standalone' mode is for Docker/self-hosted deployments
  // Vercel handles optimization automatically, so we don't need it here
  // Uncomment below for Docker/Railway deployments:
  // output: 'standalone',
}

module.exports = nextConfig
