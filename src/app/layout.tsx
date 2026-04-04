import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import SideNavigation from "./_components/editor/SideNavigation";
import TopNavigation from "./_components/TopNavigation";

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
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manropeSans.variable}  h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TopNavigation />
        <div className="grid min-h-screen grid-cols-[var(--sidebar-width)_1fr] bg-[var(--color-background-page)]">
          <SideNavigation />
          <div>{children}</div>
        </div>
      </body>
    </html>
  );
}
