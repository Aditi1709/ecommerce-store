import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportWidget from "@/components/SupportWidget";
import Script from "next/script";
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "STOREFRONT — Modern Essentials",
  description: "Thoughtfully designed essentials from independent merchants.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`}>
      <body className="antialiased bg-[#FAF8F5] text-[#18181B] min-h-screen flex flex-col selection:bg-[#D95D39] selection:text-white">
        <AuthProvider>
          <CartProvider>
            {/* Colorful Announcement Bar */}
            <div className="bg-[#0F3D2E] text-[#FAF8F5] text-xs font-medium tracking-wide text-center py-2.5 px-4">
              Free Express Shipping Over ₹999 &nbsp;•&nbsp; Use Code{" "}
              <span className="font-bold text-[#FBBF24] underline underline-offset-4">SAVE20</span>{" "}
              for 20% Off
            </div>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
            <SupportWidget />
          </CartProvider>
        </AuthProvider>
        <Script
  src="http://localhost:6001/youpi.js"
  data-youpi-key="00000000-0000-0000-0000-000000000001"
  strategy="afterInteractive"
/>
      </body>
    </html>
  );
}