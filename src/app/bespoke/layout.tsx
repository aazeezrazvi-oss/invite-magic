import React from 'react';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

export const metadata: Metadata = {
  title: 'Custom Bespoke Wedding Invitation Websites | Luxury Handcrafted E-Invites',
  description: 'Request a 100% custom-designed animated wedding invitation website tailored to your royal theme, culture, and music. Handcrafted luxury digital invitations with dedicated concierge support.',
  keywords: [
    'bespoke wedding invitations',
    'custom digital wedding website',
    'luxury wedding invitations online',
    'animated wedding website maker',
    'custom royal wedding e-invite',
    'personalized wedding card designer'
  ],
  alternates: {
    canonical: `${siteUrl}/bespoke`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/bespoke`,
    siteName: 'InviteMagic',
    title: 'Custom Bespoke Wedding Invitation Websites | Luxury Handcrafted E-Invites',
    description: 'Get a 100% custom-designed animated wedding invitation website tailored to your wedding theme and music.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'InviteMagic Bespoke Luxury Wedding Invitations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Bespoke Wedding Invitation Websites | InviteMagic',
    description: 'Handcrafted luxury digital wedding invitations tailored to your royal theme.',
    images: ['/logo.png'],
  },
};

export default function BespokeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
