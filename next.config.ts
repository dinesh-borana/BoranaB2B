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
      // Google Drive thumbnails + Firebase/GCS storage
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      // Vercel blob storage
      { protocol: "https", hostname: "**.vercel-blob.com" },
      // Generic https fallback for any other CDN
      { protocol: "https", hostname: "**.amazonaws.com" },
      // Catch-all: admins control which URLs are entered, so allow any HTTPS host
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "react-hook-form"],
    // Client-side router cache for dynamic pages (default = 0 in Next 15+)
    // 30 s means navigating back to a visited page is instant within that window
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
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
