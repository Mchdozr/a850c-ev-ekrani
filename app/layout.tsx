import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const body = localFont({
  src: "../public/fonts/Inter.ttf",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
});

const soft = localFont({
  src: "../public/fonts/NunitoSans.ttf",
  weight: "200 900",
  display: "swap",
  variable: "--font-nunito-sans",
});

export const metadata: Metadata = {
  title: "A 850 C ev ekranı",
  description:
    "Arçelik A 850 C Google TV için kendi giriş ekranınızı tasarlayın. Sideload edilen Ev ekranı uygulaması varsayılan Ana Sayfa olabilir; üretici logosu ve Google başlatıcısı değişmez.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${body.variable} ${soft.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
