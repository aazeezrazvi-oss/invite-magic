import React from 'react';
import type { Metadata } from 'next';
import { getVendorById, getVendorSlug } from '@/app/vendor-actions';
import JsonLd from '@/components/JsonLd';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

const categoryLabels: Record<string, string> = {
  mehendi: 'Mehendi Artist',
  makeup: 'Bridal Makeup & Hair Specialist',
  photography: 'Wedding Photographer & Cinematographer',
  decor: 'Wedding Decorator & Floral Designer',
  catering: 'Wedding Catering & Food Service',
  dj_music: 'DJ & Wedding Music',
  planner: 'Wedding Planner & Event Coordinator',
  venue: 'Wedding Venue & Banquet Hall',
  other: 'Wedding Specialist',
};

const categorySchemaTypes: Record<string, string> = {
  venue: 'EventVenue',
  catering: 'FoodEstablishment',
  photography: 'ProfessionalService',
  makeup: 'ProfessionalService',
  mehendi: 'ProfessionalService',
  decor: 'ProfessionalService',
  planner: 'ProfessionalService',
  dj_music: 'EntertainmentBusiness',
  other: 'LocalBusiness',
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

  const vendor = await getVendorById(id);

  if (!vendor) {
    return {
      title: 'Wedding Vendor Profile | InviteMagic',
      description: 'Explore verified wedding vendors, portfolios, and reviews.',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const vendorSlug = getVendorSlug(vendor);
  const categoryName = categoryLabels[vendor.category] || 'Wedding Specialist';
  const locationText = vendor.location ? ` in ${vendor.location}` : '';
  const title = `${vendor.business_name} - ${categoryName}${locationText} | Reviews & Contact`;
  const ratingText = vendor.rating ? ` ⭐ Rated ${vendor.rating}/5.0 (${vendor.review_count || 0} reviews).` : '';
  const description = vendor.tagline || vendor.description || `Connect directly with ${vendor.business_name}, verified wedding ${categoryName}${locationText}.${ratingText} View portfolio, pricing, and contact via WhatsApp.`;
  const imageUrl = vendor.dp_url || (vendor.portfolio_photos && vendor.portfolio_photos[0]) || `${siteUrl}/logo.png`;
  const canonicalUrl = `${siteUrl}/vendors/profile/${vendorSlug}`;

  return {
    title,
    description,
    keywords: [
      vendor.business_name,
      `${vendor.business_name} ${vendor.location || ''}`.trim(),
      `${vendor.business_name} wedding`,
      `${vendor.business_name} reviews`,
      `${vendor.business_name} contact`,
      `${categoryName} near me`,
      `wedding ${categoryName} near me`,
      `best ${categoryName} in ${vendor.location || 'India'}`,
      `hire ${categoryName} ${locationText}`.trim(),
      'verified wedding vendor'
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'profile',
      locale: 'en_US',
      url: canonicalUrl,
      title: `${vendor.business_name} | Wedding ${categoryName}`,
      description,
      siteName: 'InviteMagic',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${vendor.business_name} - Wedding Vendor`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${vendor.business_name} | Wedding ${categoryName}`,
      description,
      images: [imageUrl],
    },
    robots: {
      index: Boolean(vendor.is_approved),
      follow: true,
    },
  };
}

export default async function VendorProfileLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';

  const vendor = await getVendorById(id);
  const vendorSlug = vendor ? getVendorSlug(vendor) : id;
  const canonicalUrl = `${siteUrl}/vendors/profile/${vendorSlug}`;

  const categoryName = vendor ? (categoryLabels[vendor.category] || 'Wedding Specialist') : 'Wedding Specialist';
  const schemaType = vendor ? (categorySchemaTypes[vendor.category] || 'LocalBusiness') : 'LocalBusiness';

  // BreadcrumbList schema for rich Google search result breadcrumbs
  const breadcrumbSchema = vendor ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Wedding Vendors",
        "item": `${siteUrl}/vendors`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryName,
        "item": `${siteUrl}/vendors?category=${vendor.category}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": vendor.business_name,
        "item": canonicalUrl
      }
    ]
  } : null;

  // LocalBusiness / ProfessionalService structured data for Google Local / "Near Me" search
  const vendorSchema = vendor ? {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": vendor.business_name,
    "description": vendor.tagline || vendor.description || `Wedding ${categoryName} services`,
    "url": canonicalUrl,
    "image": vendor.dp_url || (vendor.portfolio_photos && vendor.portfolio_photos[0]) || `${siteUrl}/logo.png`,
    "telephone": vendor.phone_number || vendor.whatsapp_number || undefined,
    "priceRange": vendor.starting_price ? `₹${vendor.starting_price}+` : "₹₹",
    "areaServed": vendor.location ? [vendor.location, "Nearby Cities", "India"] : ["India"],
    "serviceType": [
      categoryName,
      `Wedding ${categoryName}`,
      `Wedding Services in ${vendor.location || 'India'}`
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": vendor.location || "India",
      "addressCountry": "IN"
    },
    ...(vendor.review_count && vendor.review_count > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": vendor.rating || 5.0,
        "reviewCount": vendor.review_count || 1,
        "bestRating": "5",
        "worstRating": "1"
      }
    } : {})
  } : null;

  return (
    <>
      {breadcrumbSchema && <JsonLd data={breadcrumbSchema} />}
      {vendorSchema && <JsonLd data={vendorSchema} />}
      {children}
    </>
  );
}
