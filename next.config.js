/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignorer @swaggerexpert/cookie côté client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@swaggerexpert/cookie': false,
        ws: false,
        bufferutil: false,
        'utf-8-validate': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;