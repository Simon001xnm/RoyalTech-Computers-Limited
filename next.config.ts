
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      }
    ],
  },
  experimental: {
    allowedDevOrigins: [
      '6000-firebase-studio-1746964565760.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev',
      '9000-firebase-studio-1746964565760.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev',
      'localhost:9002'
    ],
  },
};

module.exports = nextConfig;
