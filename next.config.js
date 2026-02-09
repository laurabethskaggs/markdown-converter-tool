/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    wasm: true
  },
  webpack: (config) => {
    config.experiments = config.experiments || {};
    config.experiments.asyncWebAssembly = true;
    return config;
  }
};

module.exports = nextConfig;
