import React from 'react';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

export const metadata: Metadata = {
  title: 'Top Wedding Vendors Near Me | Verified Mehendi Artists, Makeup & Photographers',
  description: 'Find verified wedding vendors near you. Connect directly with top mehendi artists, bridal makeup artists, wedding photographers, banquet halls, caterers, and decorators in your city with phone & WhatsApp contact.',
  keywords: [
    'wedding vendors near me',
    'mehendi artist near me',
    'bridal mehendi artist near me',
    'bridal makeup artist near me',
    'wedding photographers near me',
    'wedding decorators near me',
    'wedding banquet halls near me',
    'wedding catering near me',
    'wedding planners near me',
    'wedding DJ near me',
    'wedding services directory India',
    'best mehendi designers near me',
    'mehendi artists in Bangalore',
    'mehendi artists in Mumbai',
    'mehendi artists in Delhi NCR',
    'mehendi artists in Hyderabad'
  ],
  alternates: {
    canonical: `${siteUrl}/vendors`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/vendors`,
    siteName: 'InviteMagic',
    title: 'Top Wedding Vendors Near Me | Verified Directory | InviteMagic',
    description: 'Find top-rated mehendi artists, bridal makeup artists, and wedding photographers near you with direct WhatsApp contact.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'InviteMagic Wedding Vendors Directory Near You',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top Wedding Vendors Near Me | InviteMagic',
    description: 'Find top-rated mehendi artists, bridal makeup, and photographers near you.',
    images: ['/logo.png'],
  },
};

export default function VendorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const directorySchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Wedding Vendors Directory - Find Wedding Services Near Me",
    "description": "Directory of verified local wedding vendors across India including mehendi artists, bridal makeup, photography, decor, catering, and banquet venues.",
    "url": `${siteUrl}/vendors`,
    "mainEntity": {
      "@type": "ItemList",
      "name": "Wedding Vendor Categories",
      "itemListElement": [
        {
          "@type": "SiteNavigationElement",
          "position": 1,
          "name": "Mehendi Artists Near Me",
          "url": `${siteUrl}/vendors?category=mehendi`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 2,
          "name": "Bridal Makeup & Hair Artists Near Me",
          "url": `${siteUrl}/vendors?category=makeup`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 3,
          "name": "Wedding Photographers Near Me",
          "url": `${siteUrl}/vendors?category=photography`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 4,
          "name": "Wedding Decorators & Floral Designers Near Me",
          "url": `${siteUrl}/vendors?category=decor`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 5,
          "name": "Wedding Banquet Halls & Venues Near Me",
          "url": `${siteUrl}/vendors?category=venue`
        }
      ]
    }
  };

  return (
    <>
      <JsonLd data={directorySchema} />
      {children}
    </>
  );
}

