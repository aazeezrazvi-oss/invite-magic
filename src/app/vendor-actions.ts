'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { VendorProfile, VendorCategory } from '@/types';
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
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false })
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
