import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Collectra",
  description: "A collector-first platform for managing trading card collections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f8f6f2] text-zinc-800">
        <AuthProvider>
          <CartProvider>
            <CollectionProvider>{children}</CollectionProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
