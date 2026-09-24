import type { Metadata } from "next";
import { Playfair_Display, Dancing_Script, Be_Vietnam_Pro, Quicksand } from "@next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

// Fonts below all ship a "vietnamese" subset so diacritics (ệ, ầ, ộ, ...) render correctly.
const playfair = Playfair_Display({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
});

const dancing = Dancing_Script({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-dancing",
});

const vietnam = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-vietnam",
});

const quicksand = Quicksand({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: `The Wedding of ${config.coupleNames}`,
  description: `Wedding Invitation of ${config.coupleNames}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-[#FCF5F2] ${playfair.variable} ${dancing.variable} ${vietnam.variable} ${quicksand.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
