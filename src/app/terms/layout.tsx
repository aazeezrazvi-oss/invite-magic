import React from 'react';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

export const metadata: Metadata = {
  title: 'Terms of Service | InviteMagic',
  description: 'Read the InviteMagic Terms of Service covering usage of digital wedding invitation websites, digital gifts, and vendor directory services.',
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
