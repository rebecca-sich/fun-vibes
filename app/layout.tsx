import type { Metadata } from "next";
import { Inter, Syne, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Good Vibes All The Time",
  description: "Vibe-coded projects that spark joy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${syne.variable} ${cormorant.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
