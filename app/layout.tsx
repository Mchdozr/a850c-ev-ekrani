import type { Metadata } from "next";
import { Fraunces, Inter, Nunito_Sans } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-display",
  axes: ["SOFT", "opsz"],
});

const body = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-body",
});

const soft = Nunito_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-soft",
});

export const metadata: Metadata = {
  title: "A 850 C ev ekranı",
  description:
    "Arçelik A 850 C Google TV için kendi giriş ekranınızı tasarlayın. Sideload edilen Ev ekranı uygulaması varsayılan Ana Sayfa olabilir; üretici logosu ve Google başlatıcısı değişmez.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${soft.variable} dark h-full antialiased`}
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
