import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NavigationProgress } from "@/components/NavigationProgress";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Borana B2B — Ordering Portal",
  description:
    "Wholesale ordering portal for Borana Creation imitation jewellery.",
  applicationName: "Borana B2B",
  appleWebApp: {
    capable: true,
    title: "Borana B2B",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b1a2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
