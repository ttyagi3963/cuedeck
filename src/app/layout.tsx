import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";
import SideNavigation from "./_components/navigation/SideNavigation";
import TopNavigation from "./_components/navigation/TopNavigation";
import Footer from "./_components/navigation/Footer";

const manropeSans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | FlightCast Dynamic Ads Editor ",
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
        <div className="mx-auto flex w-full flex-1 flex-col max-w-[var(--layout-max-width)] shadow-sm">
          <TopNavigation />
          <div className="grid flex-1 grid-cols-[var(--layout-columns)] bg-background-page">
            <SideNavigation />
            <main>{children}</main>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
