import type { ReactNode } from "react";
import type { Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { themeInitScript } from "@/components/layout/ThemeToggle";

/**
 * Graphik (Commercial Type) for the whole site: titles, text, menus and buttons.
 * Files in src/app/fonts. A web licence from commercialtype.com is required before launch.
 */
const brand = localFont({
  variable: "--font-brand",
  display: "swap",
  src: [
    { path: "./fonts/Graphik-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/Graphik-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Graphik-RegularItalic.otf", weight: "400", style: "italic" },
    { path: "./fonts/Graphik-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/Graphik-Semibold.otf", weight: "600", style: "normal" },
  ],
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Tints the iPhone status bar / Safari toolbar in the site colours.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFE6D8" },
    { media: "(prefers-color-scheme: dark)", color: "#112f44" },
  ],
};

/** Root layout: fonts only. The html lang is set per locale in [locale]/layout. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${brand.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
        {children}
      </body>
    </html>
  );
}
