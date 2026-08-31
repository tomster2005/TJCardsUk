import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Collectra — Trading Card Catalogue & Collection Tracker",
    template: "%s | Collectra",
  },
  description: "Browse, buy and track trading cards with Collectra. Explore football, Disney and more — complete checklists, individual card pages and collection tools all in one place.",
  metadataBase: new URL("https://collectrauk.com"),
  openGraph: {
    title: "Collectra — Trading Card Catalogue & Collection Tracker",
    description: "Browse, buy and track trading cards with Collectra. Explore football, Disney and more — complete checklists, individual card pages and collection tools all in one place.",
    url: "https://collectrauk.com",
    siteName: "Collectra",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Collectra — Trading Card Catalogue & Collection Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collectra — Trading Card Catalogue & Collection Tracker",
    description: "Browse, buy and track trading cards with Collectra. Football, Disney and more.",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4200997769629587"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full bg-[#f8f6f2] text-zinc-800">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
