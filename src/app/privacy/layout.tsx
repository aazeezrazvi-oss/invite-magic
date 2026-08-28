import React from 'react';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

export const metadata: Metadata = {
  title: 'Privacy Policy | InviteMagic',
  description: 'Read the InviteMagic Privacy Policy to learn how we protect your personal data, guest details, and RSVP information.',
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
