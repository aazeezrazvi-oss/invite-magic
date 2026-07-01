'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Invitation, RSVP, ReferralCode, MediaAsset } from '@/types';
import { revalidatePath } from 'next/cache';

// Helper to construct a dynamic, authenticated Supabase client for Server Actions using cookies
async function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  try {
    const cookieStore = await cookies();
    
    // Find all cookies matching Supabase auth pattern (sb-<project-ref>-auth-token or sb-<project-ref>-auth-token.<index>)
    const authCookies = cookieStore.getAll()
      .filter(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[getSupabase] Matching auth cookies count: ${authCookies.length}`);

    if (authCookies.length > 0) {
      console.log(`[getSupabase] Found cookies:`, authCookies.map(c => c.name));
      // Concatenate values from all chunks (or use single cookie if not chunked)
      const combinedValue = authCookies.map(c => c.value).join('');
      
      let sessionData: any = null;
      try {
        sessionData = JSON.parse(combinedValue);
      } catch (err1) {
        try {
          sessionData = JSON.parse(decodeURIComponent(combinedValue));
        } catch (err2) {
          console.error('[getSupabase] Failed to parse Supabase session cookie:', err1, err2);
        }
      }

      if (sessionData) {
        // Supabase cookie value can be [access_token, refresh_token...] or { access_token: ... }
        const accessToken = Array.isArray(sessionData)
          ? sessionData[0]
          : sessionData?.access_token;

        if (accessToken) {
          console.log(`[getSupabase] Successfully found accessToken (length: ${accessToken.length})`);
          return createClient(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          });
        } else {
          console.log(`[getSupabase] No accessToken found in parsed sessionData`);
        }
      }
    } else {
      console.log(`[getSupabase] No matching cookies found. Available cookies:`, cookieStore.getAll().map(c => c.name));
    }
  } catch (e) {
    console.error('Error creating server Supabase client:', e);
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Helper to fetch full invitation by slug
export async function getInvitationBySlug(slug: string): Promise<Partial<Invitation> | null> {
  console.log(`[getInvitationBySlug] Fetching invitation for slug: "${slug}"`);
  const supabase = await getSupabase();
  try {
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (inviteError || !invitation) {
      console.error(`[getInvitationBySlug] Error fetching invitation for slug "${slug}":`, inviteError);
      return null;
    }
    console.log(`[getInvitationBySlug] Successfully fetched invitation (ID: ${invitation.id}) for slug "${slug}"`);

    // Fetch the owner's subscription tier
    const { data: owner } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', invitation.user_id)
      .single();

    const { data: styling } = await supabase
      .from('styling_preferences')
      .select('*')
      .eq('invitation_id', invitation.id)
      .single();

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('invitation_id', invitation.id);

    const { data: gift_collection } = await supabase
      .from('gift_collection_details')
      .select('*')
      .eq('invitation_id', invitation.id)
      .single();

    return {
      ...invitation,
      owner_tier: owner?.subscription_tier || 'free',
      styling: styling || undefined,
      events: events || [],
      gift_collection: gift_collection || undefined,
    };
  } catch (error) {
    console.error('Error in getInvitationBySlug:', error);
    return null;
  }
}

// Action to upgrade subscription tier in the database
export async function upgradeUserSubscription(userId: string, tier: 'basic' | 'premium' | 'vip'): Promise<boolean> {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error upgrading subscription:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error in upgradeUserSubscription:', e);
    return false;
  }
}

// Action to save/update full invitation data
export async function saveInvitation(invitationData: Partial<Invitation>): Promise<{ success: boolean; error?: string }> {
  if (!invitationData.id) return { success: false, error: 'No invitation ID provided' };
  const supabase = await getSupabase();
  
  try {
    const { 
      id, 
      styling, 
      events, 
      gift_collection, 
      slug, 
      owner_tier, 
      owner, 
      created_at, 
      updated_at, 
      ...coreDetails 
    } = invitationData as any;

    // 1. Update Core Invitation Table
    const { error: inviteError } = await supabase
      .from('invitations')
      .update({
        ...coreDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (inviteError) {
      console.error('Error saving core invitation details:', inviteError);
      return { success: false, error: inviteError.message };
    }

    // 2. Update Styling Preferences
    if (styling) {
      // Discard created_at/updated_at from nested styling object
      const { created_at: s_created, updated_at: s_updated, ...stylingProps } = styling;
      const { error: stylingError } = await supabase
        .from('styling_preferences')
        .upsert({
          ...stylingProps,
          invitation_id: id,
          updated_at: new Date().toISOString(),
        });
      if (stylingError) {
        console.error('Error saving styling preferences:', stylingError);
        return { success: false, error: stylingError.message };
      }
    }

    // 3. Update Events Table (delete and insert new events for simplicity)
    if (events) {
      const { error: deleteEventsError } = await supabase
        .from('events')
        .delete()
        .eq('invitation_id', id);

      if (deleteEventsError) {
        console.error('Error deleting prior events:', deleteEventsError);
        return { success: false, error: deleteEventsError.message };
      }

      if (events.length > 0) {
        const eventsToInsert = (events as any[]).map((e: any) => ({
          invitation_id: id,
          event_name: e.event_name,
          event_date: e.event_date,
          event_time: e.event_time,
          venue_name: e.venue_name,
          venue_address: e.venue_address,
          google_maps_link: e.google_maps_link,
        }));

        const { error: insertEventsError } = await supabase
          .from('events')
          .insert(eventsToInsert);

        if (insertEventsError) {
          console.error('Error inserting events:', insertEventsError);
          return { success: false, error: insertEventsError.message };
        }
      }
    }

    // 4. Update Gift Details
    if (gift_collection) {
      // Discard created_at/updated_at from nested gift_collection object
      const { created_at: g_created, updated_at: g_updated, ...giftProps } = gift_collection;
      const { error: giftError } = await supabase
        .from('gift_collection_details')
        .upsert({
          ...giftProps,
          invitation_id: id,
          updated_at: new Date().toISOString(),
        });

      if (giftError) {
        console.error('Error saving gift collection details:', giftError);
        return { success: false, error: giftError.message };
      }
    }

    // Revalidate paths
    if (slug) {
      revalidatePath(`/invite/${slug}`);
      revalidatePath(`/dashboard/edit/${slug}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in saveInvitation action:', error);
    return { success: false, error: error?.message || 'Server Action execution error' };
  }
}

// Action to submit RSVP
export async function submitRsvp(rsvp: Omit<RSVP, 'id' | 'created_at'>): Promise<boolean> {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from('rsvp')
      .insert(rsvp);

    if (error) {
      console.error('Error submitting RSVP:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in submitRsvp action:', error);
    return false;
  }
}

// Action to trigger a mock gift transaction click
export async function registerGiftClick(invitationId: string, senderName: string, amount: number, message: string): Promise<boolean> {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from('gift_transactions')
      .insert({
        invitation_id: invitationId,
        sender_name: senderName,
        amount,
        message,
        status: 'completed' // Simple completed state for mock UPI click logs
      });

    if (error) {
      console.error('Error registering gift click:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in registerGiftClick action:', error);
    return false;
  }
}

// -------------------------------------------------------------
// Admin & Referrals & Media Assets Server Actions
// -------------------------------------------------------------

// Fetch all database tables for admin view
export async function getAdminDashboardData(): Promise<{
  users: any[];
  invitations: any[];
  payments: any[];
  referrals: ReferralCode[];
  mediaAssets: MediaAsset[];
} | null> {
  const supabase = await getSupabase();
  try {
    // 1. Fetch Users
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersErr) throw usersErr;

    // 2. Fetch Invitations and join users email
    const { data: invitations, error: invErr } = await supabase
      .from('invitations')
      .select('*, users(email)')
      .order('created_at', { ascending: false });

    if (invErr) throw invErr;

    // 3. Fetch Payments and join users email
    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('*, users(email)')
      .order('created_at', { ascending: false });

    if (payErr) throw payErr;

    // 4. Fetch Referral Codes
    const { data: referrals, error: refErr } = await supabase
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (refErr) throw refErr;

    // 5. Fetch Media Assets
    const { data: mediaAssets, error: mediaErr } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (mediaErr) throw mediaErr;

    // Format invitations/payments owner emails for easier usage on client side
    const formattedInvitations = (invitations || []).map((inv: any) => ({
      id: inv.id,
      slug: inv.slug,
      user_id: inv.user_id,
      is_published: inv.is_published,
      is_suspended: inv.is_suspended || false,
      owner: inv.users?.email || 'Unknown User',
    }));

    const formattedPayments = (payments || []).map((pay: any) => ({
      id: pay.id,
      email: pay.users?.email || 'Unknown User',
      orderId: pay.order_id,
      paymentId: pay.payment_id,
      amount: pay.amount,
      status: pay.status,
      tier: pay.tier,
      created_at: pay.created_at,
    }));

    return {
      users: users || [],
      invitations: formattedInvitations,
      payments: formattedPayments,
      referrals: referrals || [],
      mediaAssets: mediaAssets || [],
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return null;
  }
}

// Admin action to change a user's subscription tier
export async function updateUserTierAdmin(userId: string, tier: 'free' | 'basic' | 'premium' | 'vip'): Promise<boolean> {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_expires_at: tier === 'free' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error in updateUserTierAdmin:', error);
    return false;
  }
}

// Admin action to toggle suspended status of invitation link
export async function toggleInvitationSuspensionAdmin(invitationId: string, isSuspended: boolean): Promise<boolean> {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from('invitations')
      .update({
        is_suspended: isSuspended,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error in toggleInvitationSuspensionAdmin:', error);
    return false;
  }
}

// Admin action to create new referral codes
export async function createReferralCodeAdmin(code: string, discountPercent: number): Promise<boolean> {
  const supabase = await getSupabase();
  try {
    const cleanCode = code.trim().toUpperCase();
    const { error } = await supabase
      .from('referral_codes')
      .insert({
        code: cleanCode,
        discount_percent: discountPercent,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error in createReferralCodeAdmin:', error);
    return false;
  }
}

// Admin action to delete referral codes
export async function deleteReferralCodeAdmin(code: string): Promise<boolean> {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from('referral_codes')
      .delete()
      .eq('code', code);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error in deleteReferralCodeAdmin:', error);
    return false;
  }
}

// Admin action to create backgrounds/music assets
export async function createMediaAssetAdmin(url: string, mediaType: 'image' | 'video' | 'music', filename: string): Promise<boolean> {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from('media_assets')
      .insert({
        url,
        media_type: mediaType,
        filename,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error in createMediaAssetAdmin:', error);
    return false;
  }
}

// Admin action to delete media assets
export async function deleteMediaAssetAdmin(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error in deleteMediaAssetAdmin:', error);
    return false;
  }
}

// Fetch media assets for editor popup selection
export async function getMediaAssets(type?: 'image' | 'video' | 'music'): Promise<MediaAsset[]> {
  const supabase = await getSupabase();
  try {
    let query = supabase.from('media_assets').select('*');
    if (type) {
      query = query.eq('media_type', type);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getMediaAssets:', error);
    return [];
  }
}

// User action to apply a referral code to profile settings
export async function applyReferralCode(userId: string, code: string | null): Promise<{ success: boolean; message: string; discountPercent?: number }> {
  const supabase = await getSupabase();
  try {
    if (!code) {
      const { error } = await supabase
        .from('users')
        .update({ applied_referral_code: null, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      return { success: true, message: 'Referral code removed.' };
    }

    const cleanCode = code.trim().toUpperCase();
    
    // Verify referral code exists
    const { data: refCode, error: refErr } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', cleanCode)
      .single();

    if (refErr || !refCode) {
      return { success: false, message: 'Invalid referral code.' };
    }

    // Update user profile
    const { error: userErr } = await supabase
      .from('users')
      .update({
        applied_referral_code: cleanCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userErr) throw userErr;

    return {
      success: true,
      message: `Code applied successfully! ${refCode.discount_percent}% discount is now active.`,
      discountPercent: refCode.discount_percent,
    };
  } catch (error) {
    console.error('Error in applyReferralCode:', error);
    return { success: false, message: 'Failed to apply referral code.' };
  }
}

// User action to fetch their active applied referral details
export async function getAppliedReferralCode(userId: string): Promise<{ code: string; discount_percent: number } | null> {
  const supabase = await getSupabase();
  try {
    const { data: userProfile, error: userErr } = await supabase
      .from('users')
      .select('applied_referral_code')
      .eq('id', userId)
      .single();

    if (userErr || !userProfile || !userProfile.applied_referral_code) {
      return null;
    }

    const { data: refCode, error: refErr } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', userProfile.applied_referral_code)
      .single();

    if (refErr || !refCode) {
      return null;
    }

    return {
      code: refCode.code,
      discount_percent: refCode.discount_percent,
    };
  } catch (error) {
    console.error('Error in getAppliedReferralCode:', error);
    return null;
  }
}
