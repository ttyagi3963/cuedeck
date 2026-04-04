import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
