/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const rawBackendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
    const backendUrl = rawBackendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
