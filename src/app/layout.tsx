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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "InviteMagic | Luxury Digital Wedding Invitations & Verified Wedding Vendors",
    template: "%s | InviteMagic",
  },
  description: "Create luxury animated wedding invitation websites with interactive envelope unboxing, music, Google Maps, digital gift registry (UPI), instant RSVP tracking, and connect with top verified wedding vendors.",
  keywords: [
    "digital wedding invitations",
    "animated wedding invitation website",
    "online wedding card",
    "wedding invite maker",
    "luxury e-invitation",
    "Indian wedding invitations",
    "interactive wedding card",
    "wedding RSVP tracker",
    "wedding vendor directory",
    "mehendi artists",
    "wedding photographers",
    "bridal makeup artists",
    "wedding banquet halls",
    "wedding decor",
    "Save the Date website",
    "Nikah invitations",
    "Shaadi e-card",
    "Kalyanam website"
  ],
  authors: [{ name: "InviteMagic Team", url: siteUrl }],
  creator: "InviteMagic",
  publisher: "InviteMagic",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/logo-icon.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "InviteMagic",
    title: "InviteMagic | Luxury Digital Wedding Invitations & Vendor Directory",
    description: "Create luxury animated wedding invitation websites with interactive envelope unboxing, music, digital gift registry, and instant RSVP tracking.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "InviteMagic - Luxury Digital Wedding Invitations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InviteMagic | Luxury Digital Wedding Invitations",
    description: "Create luxury animated wedding invitation websites with envelope unboxing, music, UPI gifts, and RSVP tracking.",
    images: ["/logo.png"],
    creator: "@invitemagic",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: "Weddings & Celebrations",
};

import JsonLd from "@/components/JsonLd";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "InviteMagic",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "InviteMagic offers luxury digital wedding invitation websites with animated envelope unboxing, interactive features, digital gift collections, and verified wedding vendor directory.",
    "sameAs": [
      "https://instagram.com/invitemagic",
      "https://twitter.com/invitemagic",
      "https://facebook.com/invitemagic"
    ]
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "InviteMagic",
    "url": siteUrl,
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${cinzel.variable} ${alexBrush.variable} ${notoUrdu.variable} ${notoHindi.variable} ${notoKannada.variable} h-full antialiased`}
    >
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={webAppSchema} />
      </head>
      <body className="min-h-full flex flex-col bg-[#0d0d11] text-[#f3f4f6]">
        {children}
      </body>
    </html>
  );
}
