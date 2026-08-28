import type { MetadataRoute } from 'next';
import { supabase } from '@/utils/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://invitemagic.com';
  const currentDate = new Date().toISOString();

  // Static marketing and public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/vendors`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/bespoke`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Dynamic published wedding invitations
  let inviteRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: invites } = await supabase
      .from('invitations')
      .select('slug, updated_at, created_at')
      .eq('is_published', true)
      .eq('is_suspended', false);

    if (invites && invites.length > 0) {
      inviteRoutes = invites.map((invite) => ({
        url: `${siteUrl}/invite/${invite.slug}`,
        lastModified: invite.updated_at || invite.created_at || currentDate,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Error fetching invitations for sitemap:', error);
  }

  // Dynamic verified wedding vendor profiles
  let vendorRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: vendors } = await supabase
      .from('vendor_profiles')
      .select('id, updated_at, created_at')
      .eq('is_verified', true);

    if (vendors && vendors.length > 0) {
      vendorRoutes = vendors.map((vendor) => ({
        url: `${siteUrl}/vendors/profile/${vendor.id}`,
        lastModified: vendor.updated_at || vendor.created_at || currentDate,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Error fetching vendors for sitemap:', error);
  }

  return [...staticRoutes, ...inviteRoutes, ...vendorRoutes];
}
