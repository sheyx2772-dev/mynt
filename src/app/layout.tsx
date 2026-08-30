import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mynt — Mint your identity.",
  description:
    "Mynt is a digital identity and networking platform. Claim a rare handle, get your NFC card, and turn every tap into a lead.",
  // iOS reads these rather than the manifest when added to the home screen.
  appleWebApp: {
    capable: true,
    title: "Mynt",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  // Tints the browser and system UI around an installed window.
  themeColor: "#0e0a1b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-mynt-black">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
