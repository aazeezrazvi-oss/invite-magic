import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | InviteMagic',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
