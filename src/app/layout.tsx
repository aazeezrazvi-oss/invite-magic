import type { Metadata } from "next";
import {
  Inter,
  Playfair_Display,
  Cinzel,
  Alex_Brush,
  Noto_Nastaliq_Urdu,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const alexBrush = Alex_Brush({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alex-brush",
});

const notoUrdu = Noto_Nastaliq_Urdu({
  weight: "400",
  subsets: ["arabic"],
  variable: "--font-noto-urdu",
});

const notoHindi = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-hindi",
});

const notoKannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  variable: "--font-noto-kannada",
});

export const metadata: Metadata = {
  title: "InviteMagic | No-Code Wedding Invitations & Digital Gifts",
  description: "Create premium animated wedding invitation websites, track RSVPs, and collect digital gifts via UPI with InviteMagic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${cinzel.variable} ${alexBrush.variable} ${notoUrdu.variable} ${notoHindi.variable} ${notoKannada.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0d0d11] text-[#f3f4f6]">
        {children}
      </body>
    </html>
  );
}
