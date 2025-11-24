const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export'는 사용하지 않음 (웹은 SSR 유지)
  images: {
    domains: ['storage.googleapis.com', 'firebasestorage.googleapis.com'],
  },
};

module.exports = withPWA(nextConfig);

