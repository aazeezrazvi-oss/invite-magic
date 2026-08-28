import React from 'react';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

export const metadata: Metadata = {
  title: 'Top Verified Wedding Vendors Directory | Mehendi, Photos, Makeup & Venues',
  description: 'Discover and connect directly with verified wedding professionals across India. Browse portfolios, ratings, verified phone/WhatsApp contacts for bridal makeup, wedding photography, mehendi artists, caterers, decorators, and venues.',
  keywords: [
    'wedding vendors directory',
    'verified wedding vendors',
    'bridal makeup artist',
    'wedding photographers',
    'mehendi artists',
    'wedding banquet halls',
    'wedding decorators',
    'wedding catering services',
    'wedding planners India',
    'DJ and wedding music'
  ],
  alternates: {
    canonical: `${siteUrl}/vendors`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/vendors`,
    siteName: 'InviteMagic',
    title: 'Verified Wedding Vendors Directory | InviteMagic',
    description: 'Discover and contact top verified wedding vendors — makeup artists, photographers, mehendi artists, venues, and decorators.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'InviteMagic Wedding Vendors Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verified Wedding Vendors Directory | InviteMagic',
    description: 'Discover and contact top verified wedding vendors for your special day.',
    images: ['/logo.png'],
  },
};

export default function VendorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
