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
    // Configurer l'alias @ pour pointer vers la racine du projet
    config.resolve.alias['@'] = require('path').resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;
