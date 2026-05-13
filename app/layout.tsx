import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Fraunces, Manrope } from "next/font/google";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Gogosica Quest",
  description: "A gamified wellness love letter.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gogosica Quest"
  }
};

export const viewport: Viewport = {
  themeColor: "#f3e6d7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Gogosica Quest" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Script
          src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
