import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond, Great_Vibes, Alex_Brush } from "@next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

// Fonts below all ship a "vietnamese" subset so diacritics (ệ, ầ, ộ, ...) render correctly.
const ovo = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-ovo",
});

const legan = EB_Garamond({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-legan",
});

const thesignature = Alex_Brush({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-thesignature",
});

const wonder = Great_Vibes({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-wonder",
});


export const metadata: Metadata = {
  title: `The Wedding of ${config.coupleNames}`,
  description: `Wedding Invitation of ${config.coupleNames}, made by Peter Shaan`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-[#0a0a0a]  ${ovo.variable} ${thesignature.variable} ${wonder.variable} ${legan.variable}  antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
