import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
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

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ecommerce-store-bay-five.vercel.app"),
  title: {
    default: "Zenoo",
    template: "%s | Zenoo",
  },
  description: "Everyday Apparel, Footwear & Minimal Gear",
  openGraph: {
    title: "Zenoo",
    description: "Everyday Apparel, Footwear & Minimal Gear",
    url: "https://ecommerce-store-bay-five.vercel.app",
    siteName: "Zenoo",
    type: "website",
    images: [
      {
        url: "/og-logo.png",
        width: 1200,
        height: 630,
        alt: "Zenoo Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenoo",
    description: "Everyday Apparel, Footwear & Minimal Gear",
    images: ["/og-logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${playfair.variable}`}>
      <body className="antialiased bg-[#F8BAC4] text-[#231819] min-h-screen p-2 sm:p-4 md:p-6 selection:bg-[#C81E1E] selection:text-white">
        <AuthProvider>
          <CartProvider>
            <div className="zenoo-shell max-w-[1280px] mx-auto bg-[#FAF3EB] rounded-[28px] sm:rounded-[36px] shadow-[0_24px_60px_rgba(140,35,50,0.14)] overflow-x-clip min-h-[calc(100vh-3rem)] flex flex-col border border-[#F5D6DC]">
              {/* Crimson & Blush Announcement Bar */}
              <div className="bg-[#FAD2D8] text-[#9B1C1C] text-xs font-medium tracking-wide text-center py-2.5 px-4 border-b border-[#F2BCC5] rounded-t-[28px] sm:rounded-t-[36px]">
                ✦ Free Express Shipping Over ₹999 &nbsp;•&nbsp; Use Code{" "}
                <span className="font-bold text-[#C81E1E] underline underline-offset-4">SAVE20</span>{" "}
                for 20% Off ✦
              </div>
              <Navbar />
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
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
