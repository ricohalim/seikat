import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEIKAT - Portal IKADBP",
  description: "Portal Resmi Ikatan Alumni Djarum Beasiswa Plus",
  openGraph: {
    title: "SEIKAT - Portal IKADBP",
    description: "Portal resmi untuk berjejaring sesama alumni Djarum Beasiswa Plus.",
    type: "website",
    locale: "id_ID",
    siteName: "SEIKAT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="id" — konten seluruhnya Bahasa Indonesia, penting untuk SEO & screen reader
    <html lang="id" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Sonner Toaster — satu-satunya sistem toast di seluruh aplikasi */}
        <Toaster
          position="top-center"
          richColors
          duration={4000}
          closeButton
        />
      </body>
    </html>
  );
}
