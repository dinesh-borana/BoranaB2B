import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 640, 750, 1080],
    imageSizes: [32, 64, 128, 160, 256],
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: [
      // Cloudinary (primary image host)
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      // Unsplash (seeds/demo)
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
      // Supabase storage
      { protocol: "https", hostname: "**.supabase.co" },
      // Google / Firebase storage
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      // Vercel blob storage
      { protocol: "https", hostname: "**.vercel-blob.com" },
      // Generic https fallback for any other CDN
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "react-hook-form"],
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
