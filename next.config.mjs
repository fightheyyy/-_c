/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce build time by disabling unnecessary features
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimize image handling
  images: {
    domains: ['43.139.19.144'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '43.139.19.144',
        port: '8000',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  // Reduce bundle size
  swcMinify: true,
  // Increase build timeout
  experimental: {
    // Optimize compilation
    optimizeCss: true,
    // Reduce memory usage
    memoryBasedWorkersCount: true,
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Optimize webpack
  webpack: (config, { dev, isServer }) => {
    // Optimize for production builds only
    if (!dev && !isServer) {
      // Split chunks more aggressively
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
      };
      
      // Minimize all JavaScript
      config.optimization.minimize = true;
    }
    
    return config;
  },
};

export default nextConfig;
