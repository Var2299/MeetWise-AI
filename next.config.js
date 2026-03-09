/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcrypt', 'mongodb'],
  },
};

module.exports = nextConfig;
