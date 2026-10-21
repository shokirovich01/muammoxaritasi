import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "MuammoXaritasi — mahalliy muammolarni xaritada xabar qiling",
  description: "O‘zbekiston bo‘ylab yo‘l chuqurlari, ko‘cha chiroqlari, chiqindi va suv oqishi kabi muammolarni xaritada xabar qiling.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
