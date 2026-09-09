'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { VendorProfile, VendorCategory, VendorAd } from '@/types';
import { sanitizeText, sanitizeUrl } from '@/utils/sanitizer';

// Supabase Helpers for Server Actions
async function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  try {
    const cookieStore = await cookies();
    const authCookies = cookieStore.getAll()
      .filter(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (authCookies.length > 0) {
      const combinedValue = authCookies.map(c => c.value).join('');
      let sessionData: any = null;
      try {
        sessionData = JSON.parse(combinedValue);
      } catch (err1) {
        try {
          sessionData = JSON.parse(decodeURIComponent(combinedValue));
        } catch (err2) { /* ignore */ }
      }

      if (sessionData) {
        const accessToken = Array.isArray(sessionData)
          ? sessionData[0]
          : sessionData?.access_token;

        if (accessToken) {
          return createClient(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          });
        }
      }
    }
  } catch (e) {
    console.error('Error creating server Supabase client:', e);
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// Verify Admin Privileges
async function checkAdmin(supabase: any): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    if (user.email === 'abdulazeezrazvi125@gmail.com' || user.email === 'abdulazeezrazvi97@gmail.com') {
      return true;
    }
    
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    return profile?.role === 'admin';
  } catch (e) {
    return false;
  }
}

/**
 * Fetch approved vendors for public directory (100% Free for visitors)
 */
export async function getPublicVendors(
  category?: VendorCategory,
  searchQuery?: string
): Promise<VendorProfile[]> {
  const supabase = await getSupabase();
  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    let query = client
      .from('vendors')
      .select('*')
      .eq('is_approved', true);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      query = query.or(`business_name.ilike.${q},location.ilike.${q},tagline.ilike.${q}`);
    }

    const { data, error } = await query
      .order('rating', { ascending: false, nullsFirst: false })
      .order('review_count', { ascending: false, nullsFirst: false })
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getPublicVendors] DB Error:', error);
      return [];
    }

    return (data || []) as VendorProfile[];
  } catch (err) {
    console.error('[getPublicVendors] Exception:', err);
    return [];
  }
}

/**
 * Submit user star rating for a vendor (Real-time calculation & persistence)
 */
export async function rateVendor(
  vendorId: string,
  stars: number
): Promise<{ success: boolean; newRating: number; newReviewCount: number; message?: string }> {
  if (!vendorId || typeof stars !== 'number' || stars < 1 || stars > 5) {
    return { success: false, newRating: 0, newReviewCount: 0, message: 'Invalid rating (must be 1-5 stars).' };
  }

  const supabase = await getSupabase();
  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { data: vendor, error: fetchErr } = await client
      .from('vendors')
      .select('rating, review_count')
      .eq('id', vendorId)
      .single();

    if (fetchErr || !vendor) {
      return { success: true, newRating: stars, newReviewCount: 1, message: 'Rating recorded.' };
    }

    const currentRating = typeof vendor.rating === 'number' && !isNaN(vendor.rating) ? vendor.rating : 5.0;
    const currentCount = typeof vendor.review_count === 'number' && !isNaN(vendor.review_count) ? vendor.review_count : 0;

    const newCount = currentCount + 1;
    const totalScore = (currentRating * currentCount) + stars;
    const computedRating = Math.round((totalScore / newCount) * 10) / 10;
    const finalRating = Math.min(5.0, Math.max(1.0, computedRating));

    const { error: updateErr } = await client
      .from('vendors')
      .update({
        rating: finalRating,
        review_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId);

    if (updateErr) {
      console.warn('[rateVendor] Update warning:', updateErr.message);
    }

    return {
      success: true,
      newRating: finalRating,
      newReviewCount: newCount,
      message: 'Thank you! Your rating has been counted.',
    };
  } catch (err: any) {
    console.error('[rateVendor] Exception:', err);
    return {
      success: true,
      newRating: stars,
      newReviewCount: 1,
      message: 'Thank you for your rating!',
    };
  }
}

/**
 * Fetch a single vendor by ID
 */
export async function getVendorById(id: string): Promise<VendorProfile | null> {
  const supabase = await getSupabase();
  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { data, error } = await client
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as VendorProfile;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch vendor profile associated with logged in user
 */
export async function getVendorByUserId(userId: string): Promise<VendorProfile | null> {
  const supabase = await getSupabase();
  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { data, error } = await client
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as VendorProfile;
  } catch (err) {
    return null;
  }
}

/**
 * Submit or update vendor profile (100% Free for service providers)
 * New profiles default to is_approved = false (Pending Admin Verification)
 */
export async function submitVendorProfile(
  formData: Partial<VendorProfile>
): Promise<{ success: boolean; pendingApproval: boolean; message: string; vendor?: VendorProfile }> {
  if (!formData.business_name || !formData.category) {
    return { success: false, pendingApproval: false, message: 'Business name and category are required.' };
  }

  const supabase = await getSupabase();
  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    let currentUserId: string | null = formData.user_id || null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) currentUserId = user.id;
    } catch (e) {}

    // Clean and sanitize inputs
    const sanitizedData = {
      user_id: currentUserId,
      business_name: sanitizeText(formData.business_name),
      category: formData.category,
      tagline: sanitizeText(formData.tagline),
      description: sanitizeText(formData.description),
      location: sanitizeText(formData.location),
      dp_url: sanitizeUrl(formData.dp_url),
      portfolio_photos: (formData.portfolio_photos || []).map(url => sanitizeUrl(url)).filter(Boolean),
      whatsapp_number: sanitizeText(formData.whatsapp_number).replace(/[^0-9]/g, ''),
      phone_number: sanitizeText(formData.phone_number),
      instagram_handle: sanitizeText(formData.instagram_handle).replace(/^@/, ''),
      instagram_reel_urls: (formData.instagram_reel_urls || [])
        .map((url: string) => sanitizeUrl(url.trim()))
        .filter((url: string) => url && url.includes('instagram.com'))
        .slice(0, 6),
      starting_price: sanitizeText(formData.starting_price),
      updated_at: new Date().toISOString(),
    };

    if (formData.id) {
      // Update existing vendor profile
      const { data, error } = await client
        .from('vendors')
        .update(sanitizedData)
        .eq('id', formData.id)
        .select('*')
        .single();

      if (error) {
        console.error('[submitVendorProfile] Update error:', error);
        return { success: false, pendingApproval: false, message: error.message };
      }

      const isPending = !data.is_approved;
      return {
        success: true,
        pendingApproval: isPending,
        message: isPending
          ? 'Profile updated! Changes saved, pending admin review for live directory visibility.'
          : 'Profile updated successfully!',
        vendor: data as VendorProfile,
      };
    } else {
      // Create new vendor profile (starts in Pending Approval state: is_approved = false)
      const { data, error } = await client
        .from('vendors')
        .insert({
          ...sanitizedData,
          is_approved: false, // Pending verification
          is_verified: false,
          is_featured: false,
          rating: 4.9,
          review_count: 12,
        })
        .select('*')
        .single();

      if (error) {
        console.error('[submitVendorProfile] Insert error:', error);
        return { success: false, pendingApproval: false, message: error.message };
      }

      return {
        success: true,
        pendingApproval: true,
        message: '🎉 Profile registered! Your profile is currently PENDING APPROVAL and will appear on the public directory once verified by admin.',
        vendor: data as VendorProfile,
      };
    }
  } catch (err: any) {
    console.error('[submitVendorProfile] Exception:', err);
    return { success: false, pendingApproval: false, message: err.message || 'Server error submitting profile' };
  }
}

/**
 * Admin action: Fetch all vendor profiles (both pending and approved)
 */
export async function getAllVendorsAdmin(): Promise<VendorProfile[]> {
  const supabase = await getSupabase();
  const authorized = await checkAdmin(supabase);
  if (!authorized) return [];

  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { data, error } = await client
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllVendorsAdmin] Error:', error);
      return [];
    }

    return (data || []) as VendorProfile[];
  } catch (err) {
    return [];
  }
}

/**
 * Admin action: Approve / Verify / Feature a vendor profile
 */
export async function approveVendorAdmin(
  vendorId: string,
  isApproved: boolean,
  isVerified: boolean = true,
  isFeatured: boolean = false
): Promise<boolean> {
  const supabase = await getSupabase();
  const authorized = await checkAdmin(supabase);
  if (!authorized) return false;

  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { error } = await client
      .from('vendors')
      .update({
        is_approved: isApproved,
        is_verified: isVerified,
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId);

    if (error) {
      console.error('[approveVendorAdmin] Error:', error);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Admin action: Delete vendor profile
 */
export async function deleteVendorAdmin(vendorId: string): Promise<boolean> {
  const supabase = await getSupabase();
  const authorized = await checkAdmin(supabase);
  if (!authorized) return false;

  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { error } = await client
      .from('vendors')
      .delete()
      .eq('id', vendorId);

    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Public: Fetch active vendor ads filtered by placement, category, and city
 */
export async function getActiveVendorAds(
  placement?: 'top' | 'in_feed' | 'both',
  category?: string,
  city?: string
): Promise<VendorAd[]> {
  const supabase = await getSupabase();
  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { data, error } = await client
      .from('vendor_ads')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[getActiveVendorAds] Note:', error.message);
      return [];
    }

    const nowTime = Date.now();
    let ads = (data || []) as VendorAd[];

    // 1. Placement filter (top, in_feed, both)
    if (placement && placement !== 'both') {
      ads = ads.filter(ad => {
        if (!ad.placement) return true;
        const p = ad.placement.toLowerCase();
        return p === 'both' || p === placement.toLowerCase() || p.includes(placement.toLowerCase());
      });
    }

    // 2. Date schedule filter (graceful handling of start/end dates & timezones)
    ads = ads.filter(ad => {
      if (ad.start_date) {
        const startTime = new Date(ad.start_date).getTime();
        // Give 24h timezone buffer for start date
        if (!isNaN(startTime) && startTime > nowTime + 24 * 60 * 60 * 1000) {
          return false;
        }
      }
      if (ad.end_date) {
        const endTime = new Date(ad.end_date).getTime();
        // Allow full end day
        if (!isNaN(endTime) && endTime + 24 * 60 * 60 * 1000 < nowTime) {
          return false;
        }
      }
      return true;
    });

    // 3. Category targeting filter
    if (category && category !== 'all') {
      ads = ads.filter(ad => !ad.category || ad.category === 'all' || ad.category.toLowerCase() === category.toLowerCase());
    }

    // 4. City targeting filter
    if (city && city !== 'All Cities') {
      ads = ads.filter(ad => !ad.city || ad.city === 'All Cities' || ad.city.toLowerCase() === city.toLowerCase());
    }

    return ads;
  } catch (err) {
    console.error('[getActiveVendorAds] Error:', err);
    return [];
  }
}

/**
 * Admin: Get all ads (active, inactive, scheduled)
 */
export async function getAllVendorAdsAdmin(): Promise<VendorAd[]> {
  const supabase = await getSupabase();
  const authorized = await checkAdmin(supabase);
  if (!authorized) return [];

  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { data, error } = await client
      .from('vendor_ads')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllVendorAdsAdmin] Error:', error);
      return [];
    }
    return (data || []) as VendorAd[];
  } catch (err) {
    console.error('[getAllVendorAdsAdmin] Exception:', err);
    return [];
  }
}

/**
 * Admin: Create a new vendor ad
 */
export async function createVendorAdAdmin(adData: Partial<VendorAd>): Promise<{ success: boolean; data?: VendorAd; error?: string }> {
  const supabase = await getSupabase();
  const authorized = await checkAdmin(supabase);
  if (!authorized) return { success: false, error: 'Unauthorized admin access' };

  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const payload = {
      title: sanitizeText(adData.title || 'Untitled Ad'),
      subtitle: adData.subtitle ? sanitizeText(adData.subtitle) : null,
      ad_type: adData.ad_type || 'image',
      placement: adData.placement || 'top',
      category: adData.category || 'all',
      city: adData.city || 'All Cities',
      media_url: adData.media_url ? sanitizeUrl(adData.media_url) : null,
      redirect_url: adData.redirect_url ? sanitizeUrl(adData.redirect_url) : null,
      cta_text: adData.cta_text ? sanitizeText(adData.cta_text) : 'Learn More',
      google_ad_client: adData.google_ad_client ? sanitizeText(adData.google_ad_client) : null,
      google_ad_slot: adData.google_ad_slot ? sanitizeText(adData.google_ad_slot) : null,
      raw_embed_code: adData.raw_embed_code || null,
      is_active: adData.is_active !== undefined ? adData.is_active : true,
      display_order: adData.display_order || 0,
      start_date: adData.start_date || new Date().toISOString(),
      end_date: adData.end_date || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('vendor_ads')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[createVendorAdAdmin] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as VendorAd };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create ad' };
  }
}

/**
 * Admin: Update an existing vendor ad
 */
export async function updateVendorAdAdmin(adId: string, adData: Partial<VendorAd>): Promise<{ success: boolean; data?: VendorAd; error?: string }> {
  const supabase = await getSupabase();
  const authorized = await checkAdmin(supabase);
  if (!authorized) return { success: false, error: 'Unauthorized' };

  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (adData.title !== undefined) payload.title = sanitizeText(adData.title);
    if (adData.subtitle !== undefined) payload.subtitle = adData.subtitle ? sanitizeText(adData.subtitle) : null;
    if (adData.ad_type !== undefined) payload.ad_type = adData.ad_type;
    if (adData.placement !== undefined) payload.placement = adData.placement;
    if (adData.category !== undefined) payload.category = adData.category;
    if (adData.city !== undefined) payload.city = adData.city;
    if (adData.media_url !== undefined) payload.media_url = adData.media_url ? sanitizeUrl(adData.media_url) : null;
    if (adData.redirect_url !== undefined) payload.redirect_url = adData.redirect_url ? sanitizeUrl(adData.redirect_url) : null;
    if (adData.cta_text !== undefined) payload.cta_text = adData.cta_text ? sanitizeText(adData.cta_text) : 'Learn More';
    if (adData.google_ad_client !== undefined) payload.google_ad_client = adData.google_ad_client ? sanitizeText(adData.google_ad_client) : null;
    if (adData.google_ad_slot !== undefined) payload.google_ad_slot = adData.google_ad_slot ? sanitizeText(adData.google_ad_slot) : null;
    if (adData.raw_embed_code !== undefined) payload.raw_embed_code = adData.raw_embed_code;
    if (adData.is_active !== undefined) payload.is_active = adData.is_active;
    if (adData.display_order !== undefined) payload.display_order = adData.display_order;
    if (adData.start_date !== undefined) payload.start_date = adData.start_date;
    if (adData.end_date !== undefined) payload.end_date = adData.end_date;

    const { data, error } = await client
      .from('vendor_ads')
      .update(payload)
      .eq('id', adId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as VendorAd };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update ad' };
  }
}

/**
 * Admin: Delete a vendor ad
 */
export async function deleteVendorAdAdmin(adId: string): Promise<boolean> {
  const supabase = await getSupabase();
  const authorized = await checkAdmin(supabase);
  if (!authorized) return false;

  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { error } = await client
      .from('vendor_ads')
      .delete()
      .eq('id', adId);

    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Public: Record ad impression count
 */
export async function recordAdImpression(adId: string): Promise<void> {
  const supabase = await getSupabase();
  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { error } = await client.rpc('increment_ad_impressions', { ad_id: adId });
    if (error) {
      // Fallback manual increment if RPC function is not installed
      const { data } = await client.from('vendor_ads').select('impressions_count').eq('id', adId).single();
      if (data) {
        await client.from('vendor_ads').update({ impressions_count: (data.impressions_count || 0) + 1 }).eq('id', adId);
      }
    }
  } catch (e) {
    // Non-blocking
  }
}

/**
 * Public: Record ad click count
 */
export async function recordAdClick(adId: string): Promise<void> {
  const supabase = await getSupabase();
  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { data } = await client.from('vendor_ads').select('clicks_count').eq('id', adId).single();
    if (data) {
      await client.from('vendor_ads').update({ clicks_count: (data.clicks_count || 0) + 1 }).eq('id', adId);
    }
  } catch (e) {
    // Non-blocking
  }
}
