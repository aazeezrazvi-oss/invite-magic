import React from 'react';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

export const metadata: Metadata = {
  title: 'Free Wedding Vendor Registration & Partner Portal | InviteMagic',
  description: 'Register your wedding business for free on InviteMagic. Join top mehendi artists, bridal makeup artists, wedding photographers, banquet venues, and caterers across India.',
  alternates: {
    canonical: `${siteUrl}/vendors/portal`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/vendors/portal`,
    siteName: 'InviteMagic',
    title: 'Free Wedding Vendor Registration | InviteMagic',
    description: 'Grow your wedding business with InviteMagic. 100% free profile registration for wedding vendors.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VendorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
