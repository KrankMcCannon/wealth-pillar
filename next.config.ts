import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Configure allowed remote image sources
    remotePatterns: [
      // Avatar service
      { protocol: 'https', hostname: 'api.dicebear.com' },
      // Authentication service
      { protocol: 'https', hostname: 'images.clerk.dev' },
      // Database service
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
    // Optimize images during build and at runtime
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for 1 year (immutable in production)
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Responsive image sizes for common breakpoints
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
