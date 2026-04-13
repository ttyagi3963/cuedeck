import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import TopNavigation from "./_components/navigation/TopNavigation";
import AppGrid from "./_components/layout/AppGrid";
import Footer from "./_components/navigation/Footer";

const manropeSans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | FlightCast",
    default: "FlightCast Dynamic Ads Editor",
  },
  description: "Dynamic ads editor take-home",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${manropeSans.variable}  h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <div className="flex w-full flex-1 flex-col min-w-0 shadow-sm">
            <TopNavigation />
            <AppGrid>{children}</AppGrid>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
