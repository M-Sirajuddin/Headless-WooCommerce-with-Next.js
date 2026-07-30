/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'woocommerce-1331608-4874165.cloudwaysapps.com',
      },
    ],
  },
  typescript: {
    // Fail the build on TypeScript errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // The bundled Next lint pipeline is incompatible with ESLint 9 (the
    // `extensions` option was removed). Run `npm run lint` separately
    // instead of during `next build`.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
