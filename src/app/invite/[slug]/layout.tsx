import React from 'react';
import type { Metadata } from 'next';
import { getInvitationBySlug } from '@/app/actions';
import JsonLd from '@/components/JsonLd';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    return {
      title: 'Wedding Invitation | InviteMagic',
      description: 'View digital wedding invitation, event schedule, and RSVP online.',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const groom = invitation.groom_name || 'Groom';
  const bride = invitation.bride_name || 'Bride';
  const title = `Wedding of ${groom} & ${bride} | Wedding Invitation`;
  const description = invitation.invitation_message || `With joyous hearts, we invite you to celebrate the wedding ceremony of ${groom} and ${bride}. View our event timeline, venue directions, and RSVP online.`;
  const imageUrl = invitation.groom_photo || invitation.bride_photo || `${siteUrl}/logo.png`;
  const canonicalUrl = `${siteUrl}/invite/${slug}`;

  const isPublic = Boolean(invitation.is_published && !invitation.is_suspended);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: canonicalUrl,
      title: `Wedding Invitation: ${groom} & ${bride}`,
      description,
      siteName: 'InviteMagic',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Wedding Invitation for ${groom} & ${bride}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Wedding Invitation: ${groom} & ${bride}`,
      description,
      images: [imageUrl],
    },
    robots: {
      index: isPublic,
      follow: isPublic,
    },
  };
}

export default async function InviteLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

  const invitation = await getInvitationBySlug(slug);

  // Generate Event structured data (Schema.org) for search engine indexing
  const primaryEvent = invitation?.events?.[0];
  const eventDate = primaryEvent ? `${primaryEvent.event_date}T${primaryEvent.event_time || '10:00:00'}` : undefined;

  const eventSchema = invitation ? {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": `Wedding Ceremony of ${invitation.groom_name || 'Groom'} & ${invitation.bride_name || 'Bride'}`,
    "description": invitation.invitation_message || `Wedding ceremony and celebrations for ${invitation.groom_name} & ${invitation.bride_name}`,
    "startDate": eventDate,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": primaryEvent?.venue_name || "Wedding Venue",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": primaryEvent?.venue_address || "Venue Address"
      }
    },
    "image": [
      invitation.groom_photo || invitation.bride_photo || `${siteUrl}/logo.png`
    ],
    "organizer": {
      "@type": "Person",
      "name": invitation.parents_names || `${invitation.groom_name} & ${invitation.bride_name} Families`
    }
  } : null;

  return (
    <>
      {eventSchema && <JsonLd data={eventSchema} />}
      {children}
    </>
  );
}
