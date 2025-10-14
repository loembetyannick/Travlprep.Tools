/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image configuration for external domains (Pinterest images)
  images: {
    domains: ['i.pinimg.com'],
    unoptimized: true
  },
  
  // Disable ESLint during build to avoid warnings blocking deployment
  eslint: {
    ignoreDuringBuilds: true
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228'
  }
};

export default nextConfig;
