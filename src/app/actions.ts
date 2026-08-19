'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Redis from 'ioredis';

import { Invitation, RSVP, ReferralCode, MediaAsset } from '@/types';
import { rateLimitRequest } from '@/utils/rateLimiter';
import { checkSlugExists, addSlugToFilter } from '@/utils/bloomFilter';
import { coalesceFetch } from '@/utils/coalesce';
import { 
  RsvpSchema, 
  InvitationCoreSchema, 
  ReferralCodeSchema, 
  MediaAssetSchema, 
  BespokeRequestSchema,
  sanitizeText, 
  sanitizeUrl 
} from '@/utils/sanitizer';

// --- Redis Client Initialization ---
let redis: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });
  } catch (err) {
    console.error('Failed to initialize Redis in Server Actions:', err);
  }
}

const INVITATION_CACHE_KEY_PREFIX = 'cache:invitation:';
const CACHE_TTL_SECONDS = 300; // 5 minutes
const localCache = new Map<string, { value: any; expiresAt: number }>();

// --- IP Helper for Rate Limiting ---
async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const xForwardedFor = headerList.get('x-forwarded-for');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    return headerList.get('x-real-ip') || '127.0.0.1';
  } catch (e) {
    return '127.0.0.1';
  }
}

// --- Supabase Client Helpers ---

// Construct a dynamic, client-authenticated Supabase client using cookies (runs with user's permissions)
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

// Create a server-side client using the service role key to bypass RLS (used strictly for verified actions)
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceRoleKey) {
    console.warn('[getServiceSupabase] Warning: SUPABASE_SERVICE_ROLE_KEY is not set.');
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// Write to public.audit_logs (satisfies Indian IT Act log-retention compliance)
export async function logAuditEvent(action: string, payload: any, userId?: string): Promise<boolean> {
  const ipAddress = await getClientIp();
  let userAgent = '';
  try {
    const headerList = await headers();
    userAgent = headerList.get('user-agent') || '';
  } catch (e) {}

  const supabaseAdmin = getServiceSupabase();
  if (!supabaseAdmin) {
    console.error('[logAuditEvent] Missing service role key to log event');
    return false;
  }

  const { error } = await supabaseAdmin
    .from('audit_logs')
    .insert({
      user_id: userId || null,
      action,
      ip_address: ipAddress,
      user_agent: userAgent,
      payload,
    });

  if (error) {
    console.error('[logAuditEvent] Failed to write audit log:', error);
    return false;
  }
  return true;
}

// Server Action to submit a custom luxury bespoke invitation request
export async function submitBespokeRequest(formData: any): Promise<{ success: boolean; error?: string }> {
  // 1. Rate Limiting Check
  const ip = await getClientIp();
  const rateLimit = await rateLimitRequest(`rate_limit:bespoke_request:${ip}`, 3, 0.2); // 3 burst, 1 refill per 5 sec
  if (!rateLimit.success) {
    return { success: false, error: 'Too many requests. Please wait before submitting again.' };
  }

  // 2. Validate input schema
  const parsed = BespokeRequestSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: `Validation error: ${parsed.error.issues[0].message}` };
  }

  const supabaseAdmin = getServiceSupabase();
  if (!supabaseAdmin) {
    return { success: false, error: 'Database service is temporarily unavailable.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('bespoke_requests')
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        wedding_date: parsed.data.wedding_date || null,
        estimated_budget: parsed.data.estimated_budget,
        details: parsed.data.details || null,
      });

    if (error) {
      console.error('[submitBespokeRequest] Database error:', error);
      return { success: false, error: 'Failed to save request. Please try again later.' };
    }

    // Write to compliance audit log
    await logAuditEvent('bespoke_inquiry_submit', { email: parsed.data.email });

    return { success: true };
  } catch (err: any) {
    console.error('[submitBespokeRequest] Exception:', err);
    return { success: false, error: err.message || 'Server error submitting inquiry form' };
  }
}

// Helper to invalidate the cached invitation data
async function invalidateInvitationCache(slug: string): Promise<void> {
  const cacheKey = INVITATION_CACHE_KEY_PREFIX + slug.trim().toLowerCase();
  if (redis) {
    try {
      await redis.del(cacheKey);
    } catch (e) { /* ignore */ }
  } else {
    localCache.delete(cacheKey);
  }
}

// --- Authorization Helpers ---

// Verify if the current user session belongs to an administrator
async function checkAdmin(supabase: any): Promise<boolean> {
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
}

// --- Core Public / User Server Actions ---

// Fetch full invitation by slug (Protected by Bloom Filter, Cache, and Request Coalescing)
export async function getInvitationBySlug(slug: string): Promise<Partial<Invitation> | null> {
  const cleanSlug = slug.trim().toLowerCase();

  // 1. Bloom Filter Protection (reject non-existent slugs instantly without DB query)
  // We only enforce the Bloom Filter if the service role key is configured (meaning we could load draft/unpublished slugs)
  // and we are not in a multi-container environment without Redis (which would cause desync on dynamic inserts).
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isDev = process.env.NODE_ENV === 'development';
  const shouldEnforceBloomFilter = hasServiceKey && (redis || isDev);

  if (shouldEnforceBloomFilter) {
    const mightExist = await checkSlugExists(cleanSlug);
    if (!mightExist) {
      console.log(`[Bloom Filter Blocked] Slug "${cleanSlug}" does not exist.`);
      return null;
    }
  } else {
    console.log(`[Bloom Filter Bypassed] Skipping Bloom Filter check. (hasServiceKey=${hasServiceKey}, hasRedis=${!!redis}, isDev=${isDev})`);
  }

  const cacheKey = INVITATION_CACHE_KEY_PREFIX + cleanSlug;

  // 2. Caching layer (Redis/Memory)
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Redis cache get error:', err);
    }
  } else {
    const cached = localCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
  }

  // 3. Request Coalescing (Collapses concurrent requests into a single DB query)
  return coalesceFetch(cacheKey, async () => {
    console.log(`[Database Fetch] Querying invitation for slug: "${cleanSlug}"`);
    const supabase = await getSupabase();
    
    try {
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('slug', cleanSlug)
        .single();

      if (inviteError || !invitation) {
        return null;
      }

      // Fetch the owner's subscription tier using service role client if available
      const supabaseAdmin = getServiceSupabase();
      let owner = null;
      if (supabaseAdmin) {
        const { data: ownerData } = await supabaseAdmin
          .from('users')
          .select('subscription_tier')
          .eq('id', invitation.user_id)
          .single();
        owner = ownerData;
      } else {
        try {
          const { data: ownerData } = await supabase
            .from('users')
            .select('subscription_tier')
            .eq('id', invitation.user_id)
            .single();
          owner = ownerData;
        } catch (e) {
          console.warn('[getInvitationBySlug] Failed to fetch user subscription tier with client SDK:', e);
        }
      }

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

      const result = {
        ...invitation,
        owner_tier: owner?.subscription_tier || 'free',
        styling: styling || undefined,
        events: events || [],
        gift_collection: gift_collection || undefined,
      };

      // Write to cache
      if (redis) {
        try {
          await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS);
        } catch (e) { /* ignore */ }
      } else {
        localCache.set(cacheKey, {
          value: result,
          expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
        });
      }

      return result;
    } catch (error) {
      console.error('Error in getInvitationBySlug:', error);
      return null;
    }
  });
}

// Action to auto-create a default invitation securely on the server (adds slug to Bloom Filter)
export async function createDefaultInvitation(userId: string, email: string): Promise<any> {
  const ip = await getClientIp();
  const rateLimit = await rateLimitRequest(`rate_limit:create_invite:${ip}`, 5, 0.1);
  if (!rateLimit.success) {
    console.warn(`[createDefaultInvitation] Rate limit exceeded for IP: ${ip}`);
    return null;
  }

  const supabase = await getSupabase();
  const baseSlug = email ? email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : 'wedding';
  const newSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`.toLowerCase();

  try {
    const { data: createdInvite, error: inviteErr } = await supabase
      .from('invitations')
      .insert({
        user_id: userId,
        slug: newSlug,
        groom_name: 'Abdul',
        bride_name: 'Sana',
        is_published: false,
      })
      .select('*')
      .single();

    if (inviteErr || !createdInvite) {
      console.error('[createDefaultInvitation] Database error:', inviteErr);
      return null;
    }

    // Add to Bloom Filter
    await addSlugToFilter(newSlug);

    // Styling preferences are created by DB defaults or we can insert them here
    await supabase.from('styling_preferences').insert({
      invitation_id: createdInvite.id,
      primary_color: '#d4af37',
      secondary_color: '#aa7c11',
      background_color: '#0d0d11',
      text_color: '#f3f4f6',
      font_heading: 'cinzel',
      font_body: 'inter',
      section_order: ['hero', 'countdown', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
      animation_style: 'fade',
      button_style: 'gold-border',
      countdown_style: 'circles',
      gallery_layout: 'grid',
      background_type: 'gradient',
    });

    await supabase.from('gift_collection_details').insert({
      invitation_id: createdInvite.id,
      upi_id: 'shadi@okaxis',
      receiver_name: 'Abdul & Sana',
      thank_you_message: 'Your blessings are enough, but if you wish to bless us further, you may send a digital shagun.',
    });

    // Return the created invitation
    const fullyLoaded = await getInvitationBySlug(newSlug);
    return fullyLoaded;
  } catch (err) {
    console.error('[createDefaultInvitation] Exception:', err);
    return null;
  }
}

// Insecure direct upgrade action (Disabled in production for security, restricted to admin fallback)
export async function upgradeUserSubscription(userId: string, tier: 'basic' | 'premium' | 'vip'): Promise<boolean> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  // If Razorpay secret is set, direct upgrades are strictly disabled in production
  if (keySecret) {
    console.warn(`[upgradeUserSubscription] Rejected. Direct upgrades are disabled in live production mode.`);
    return false;
  }

  // Fallback for mock environment
  const res = await upgradeUserTierMockInternal(userId, tier);
  return res.success;
}

// Action to save/update full invitation data (Validated & Sanitized)
export async function saveInvitation(invitationData: Partial<Invitation>): Promise<{ success: boolean; error?: string }> {
  if (!invitationData.id) return { success: false, error: 'No invitation ID provided' };
  
  // 1. Rate Limiting check
  const ip = await getClientIp();
  const rateLimit = await rateLimitRequest(`rate_limit:save_invitation:${ip}`, 10, 0.5); // 10 burst, 1 refill per 2 sec
  if (!rateLimit.success) {
    return { success: false, error: 'Too many requests. Please wait before saving changes.' };
  }

  const supabase = await getSupabase();
  
  try {
    // 2. Validate Core invitation parameters
    const coreDetailsParsed = InvitationCoreSchema.safeParse({
      id: invitationData.id,
      slug: invitationData.slug,
      groom_name: invitationData.groom_name,
      groom_photo: invitationData.groom_photo,
      groom_bio: invitationData.groom_bio,
      bride_name: invitationData.bride_name,
      bride_photo: invitationData.bride_photo,
      bride_bio: invitationData.bride_bio,
      parents_names: invitationData.parents_names,
      invitation_message: invitationData.invitation_message,
      template_id: invitationData.template_id,
      custom_domain: invitationData.custom_domain,
      is_published: invitationData.is_published,
      gallery_photos: invitationData.gallery_photos,
    });

    if (!coreDetailsParsed.success) {
      return { success: false, error: `Validation error: ${coreDetailsParsed.error.issues[0].message}` };
    }

    const coreDetails = coreDetailsParsed.data;
    const { styling, events, gift_collection, slug } = invitationData;

    // 3. Update Core Invitation Table
    const { error: inviteError } = await supabase
      .from('invitations')
      .update({
        ...coreDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationData.id);

    if (inviteError) {
      return { success: false, error: inviteError.message };
    }

    // 4. Update Styling Preferences
    if (styling) {
      const { created_at: s_created, updated_at: s_updated, ...stylingProps } = styling as any;
      const { error: stylingError } = await supabase
        .from('styling_preferences')
        .upsert({
          ...stylingProps,
          invitation_id: invitationData.id,
          primary_color: sanitizeText(stylingProps.primary_color || '#d4af37'),
          secondary_color: sanitizeText(stylingProps.secondary_color || '#b8962e'),
          background_color: sanitizeText(stylingProps.background_color || '#0d0d11'),
          text_color: sanitizeText(stylingProps.text_color || '#f3f4f6'),
          font_heading: sanitizeText(stylingProps.font_heading || 'cinzel'),
          font_body: sanitizeText(stylingProps.font_body || 'inter'),
          music_url: sanitizeUrl(stylingProps.music_url),
          animation_style: sanitizeText(stylingProps.animation_style || 'fade'),
          button_style: sanitizeText(stylingProps.button_style || 'gold-border'),
          countdown_style: sanitizeText(stylingProps.countdown_style || 'circles'),
          gallery_layout: sanitizeText(stylingProps.gallery_layout || 'grid'),
          background_type: sanitizeText(stylingProps.background_type || 'gradient'),
          background_url: sanitizeUrl(stylingProps.background_url),
          updated_at: new Date().toISOString(),
        });
      if (stylingError) {
        return { success: false, error: stylingError.message };
      }
    }

    // 5. Update Events Table (delete and insert new events securely)
    if (events) {
      const { error: deleteEventsError } = await supabase
        .from('events')
        .delete()
        .eq('invitation_id', invitationData.id);

      if (deleteEventsError) {
        return { success: false, error: deleteEventsError.message };
      }

      if (events.length > 0) {
        const eventsToInsert = (events as any[]).map((e: any) => ({
          invitation_id: invitationData.id,
          event_name: sanitizeText(e.event_name),
          event_date: e.event_date, // native date
          event_time: e.event_time, // native time
          venue_name: sanitizeText(e.venue_name),
          venue_address: sanitizeText(e.venue_address),
          google_maps_link: sanitizeUrl(e.google_maps_link),
        }));

        const { error: insertEventsError } = await supabase
          .from('events')
          .insert(eventsToInsert);

        if (insertEventsError) {
          return { success: false, error: insertEventsError.message };
        }
      }
    }

    // 6. Update Gift Details
    if (gift_collection) {
      const { created_at: g_created, updated_at: g_updated, ...giftProps } = gift_collection as any;
      const { error: giftError } = await supabase
        .from('gift_collection_details')
        .upsert({
          ...giftProps,
          invitation_id: invitationData.id,
          upi_id: sanitizeText(giftProps.upi_id),
          receiver_name: sanitizeText(giftProps.receiver_name),
          thank_you_message: sanitizeText(giftProps.thank_you_message || 'Thank you for your blessings!'),
          updated_at: new Date().toISOString(),
        });

      if (giftError) {
        return { success: false, error: giftError.message };
      }
    }

    // Invalidate Cache and Register slug in Bloom Filter
    if (slug) {
      await invalidateInvitationCache(slug);
      await addSlugToFilter(slug);
      revalidatePath(`/invite/${slug}`);
      revalidatePath(`/dashboard/edit/${slug}`);
    }

    // Write compliance audit log
    let currentUserId = undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) currentUserId = user.id;
    } catch (e) {}
    await logAuditEvent('invitation_save', { invitation_id: invitationData.id, slug: slug }, currentUserId);

    return { success: true };
  } catch (error: any) {
    console.error('Error in saveInvitation action:', error);
    return { success: false, error: error?.message || 'Server Action execution error' };
  }
}

// Action to submit RSVP (Protected by Rate Limiter, Validated & Sanitized)
export async function submitRsvp(rsvp: Omit<RSVP, 'id' | 'created_at'>): Promise<boolean> {
  // 1. Rate Limiting Check
  const ip = await getClientIp();
  const rateLimit = await rateLimitRequest(`rate_limit:rsvp:${ip}`, 3, 0.2); // 3 burst, 1 refill per 5 sec
  if (!rateLimit.success) {
    console.warn(`[RSVP Blocked] Too many RSVPs from IP: ${ip}`);
    return false;
  }

  // 2. Validate input schema
  const parsed = RsvpSchema.safeParse(rsvp);
  if (!parsed.success) {
    console.error('RSVP Validation Failed:', parsed.error.issues);
    return false;
  }

  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from('rsvp')
      .insert(parsed.data);

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

// Action to trigger a mock gift transaction click (Protected by Rate Limiter & Sanitized)
export async function registerGiftClick(invitationId: string, senderName: string, amount: number, message: string): Promise<boolean> {
  const ip = await getClientIp();
  const rateLimit = await rateLimitRequest(`rate_limit:gift:${ip}`, 5, 0.2); // 5 burst, 1 refill per 5 sec
  if (!rateLimit.success) {
    return false;
  }

  const supabase = await getSupabase();
  try {
    const { error } = await supabase
      .from('gift_transactions')
      .insert({
        invitation_id: invitationId,
        sender_name: sanitizeText(senderName),
        amount: Math.max(1, amount),
        message: sanitizeText(message),
        status: 'completed'
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

// --- Secure Server-Side Promo Codes ---

// User action to apply a referral code to profile settings (Protected by Rate Limiter & Validated)
export async function applyReferralCode(userId: string, code: string | null): Promise<{ success: boolean; message: string; discountPercent?: number }> {
  // 1. Rate Limiting Check
  const ip = await getClientIp();
  const rateLimit = await rateLimitRequest(`rate_limit:apply_referral:${ip}`, 5, 0.1); // 5 burst, 1 refill per 10 sec (prevents brute forcing)
  if (!rateLimit.success) {
    return { success: false, message: 'Too many attempts. Please try again later.' };
  }

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
    
    // Verify referral code exists in database
    const { data: refCode, error: refErr } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', cleanCode)
      .single();

    if (refErr || !refCode) {
      return { success: false, message: 'Invalid referral code.' };
    }

    // Update user profile using client connection (which verifies ownership via RLS update policy)
    const { error: userErr } = await supabase
      .from('users')
      .update({
        applied_referral_code: cleanCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userErr) throw userErr;

    await logAuditEvent('referral_code_apply', { code: cleanCode }, userId);

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

// Securely apply a VIP promo code during signup
export async function applySignupPromoCode(userId: string, promoCode: string): Promise<{ success: boolean; message: string }> {
  const code = promoCode.trim().toUpperCase();
  if (code === 'LIFETIMEFREE' || code === 'FREEVIP') {
    const supabaseAdmin = getServiceSupabase();
    if (!supabaseAdmin) {
      return { success: false, message: 'Configuration error: Service role key is missing.' };
    }
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          subscription_tier: 'vip',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return { success: false, message: error.message };
      }

      await logAuditEvent('promo_signup_apply', { code: code }, userId);

      return { success: true, message: 'VIP access granted successfully!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Server error applying promo code' };
    }
  }
  return { success: false, message: 'Invalid promo code.' };
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

// ==============================================================================
// --- Manual UPI Payment & Verification Actions ---
// ==============================================================================

/**
 * Submit manual UPI payment proof (screenshot + 12-digit UTR) for admin verification.
 */
export async function submitManualPaymentProof(params: {
  userId: string;
  userEmail?: string;
  tier: 'basic' | 'premium' | 'vip';
  amount: number;
  utrNumber: string;
  screenshotUrl: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  const ip = await getClientIp();
  const rateLimit = await rateLimitRequest(`rate_limit:submit_payment:${ip}`, 5, 0.2); // 5 burst, 1 refill per 5 sec
  if (!rateLimit.success) {
    return { success: false, error: 'Too many submissions. Please wait a moment before trying again.' };
  }

  const { userId, tier, amount, utrNumber, screenshotUrl, notes } = params;
  if (!userId || !tier || !amount || !utrNumber) {
    return { success: false, error: 'Missing required payment submission fields.' };
  }

  const supabaseAdmin = getServiceSupabase();
  const supabase = await getSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const orderId = `UPI_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const paymentId = `UTR_${utrNumber.trim()}`;

    // Attempt insert with extended fields
    const { data, error } = await client
      .from('payments')
      .insert({
        user_id: userId,
        order_id: orderId,
        payment_id: paymentId,
        amount: Number(amount),
        currency: 'INR',
        status: 'pending_verification',
        tier,
        utr_number: utrNumber.trim(),
        screenshot_url: screenshotUrl,
        admin_notes: notes || 'Pending admin manual verification',
        payment_method: 'upi_manual',
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[submitManualPaymentProof] Standard insert notice, attempting schema fallback:', error.message);
      // Fallback: If extra columns are not yet applied to database schema, insert baseline columns
      const fallbackRes = await client
        .from('payments')
        .insert({
          user_id: userId,
          order_id: orderId,
          payment_id: paymentId,
          amount: Number(amount),
          currency: 'INR',
          status: 'pending_verification',
          tier,
        })
        .select('id')
        .single();

      if (fallbackRes.error) {
        console.error('[submitManualPaymentProof] Fallback insert failed:', fallbackRes.error);
        return { success: false, error: fallbackRes.error.message || 'Failed to record payment proof.' };
      }

      await logAuditEvent('payment_manual_submitted', { order_id: orderId, utr: utrNumber, tier, amount }, userId);
      return { success: true, paymentId: fallbackRes.data?.id };
    }

    await logAuditEvent('payment_manual_submitted', { order_id: orderId, utr: utrNumber, tier, amount }, userId);
    return { success: true, paymentId: data?.id };
  } catch (err: any) {
    console.error('Exception submitting manual payment:', err);
    return { success: false, error: err.message || 'Server error during payment submission' };
  }
}

/**
 * Admin action to approve a pending manual payment, update status to captured, and unlock the user's plan.
 */
export async function approveManualPayment(
  paymentId: string, 
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabase();
  const authorized = await checkAdmin(supabase);
  if (!authorized) {
    return { success: false, error: 'Unauthorized: Only administrators can approve payments.' };
  }

  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    // 1. Fetch the target payment
    const { data: payment, error: fetchErr } = await client
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchErr || !payment) {
      return { success: false, error: 'Payment record not found.' };
    }

    // 2. Update payment status to captured/approved
    const { error: updatePayErr } = await client
      .from('payments')
      .update({
        status: 'captured',
        admin_notes: adminNotes || 'Approved by Admin',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (updatePayErr) {
      console.warn('[approveManualPayment] Notice updating payment status:', updatePayErr.message);
    }

    // 3. Upgrade user tier and calculate expiry
    const upgradeSuccess = await updateUserTierAdmin(payment.user_id, payment.tier);
    if (!upgradeSuccess) {
      return { success: false, error: 'Failed to update user subscription tier.' };
    }

    await logAuditEvent(
      'payment_manual_approved', 
      { payment_id: paymentId, tier: payment.tier, amount: payment.amount, user_id: payment.user_id }, 
      payment.user_id
    );

    return { success: true };
  } catch (err: any) {
    console.error('Exception approving payment:', err);
    return { success: false, error: err.message || 'Server error during approval' };
  }
}

/**
 * Admin action to reject a pending manual payment proof with a reason.
 */
export async function rejectManualPayment(
  paymentId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabase();
  const authorized = await checkAdmin(supabase);
  if (!authorized) {
    return { success: false, error: 'Unauthorized: Only administrators can reject payments.' };
  }

  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { data: payment, error: fetchErr } = await client
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchErr || !payment) {
      return { success: false, error: 'Payment record not found.' };
    }

    const { error: updateErr } = await client
      .from('payments')
      .update({
        status: 'rejected',
        admin_notes: reason || 'Rejected by Admin',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    await logAuditEvent('payment_manual_rejected', { payment_id: paymentId, reason }, payment.user_id);
    return { success: true };
  } catch (err: any) {
    console.error('Exception rejecting payment:', err);
    return { success: false, error: err.message || 'Server error during rejection' };
  }
}

/**
 * Fetch the latest payment verification status for a user.
 */
export async function getUserLatestPayment(userId: string): Promise<any | null> {
  if (!userId) return null;
  const supabase = await getSupabase();
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch (e) {
    return null;
  }
}

// ==============================================================================
// --- Razorpay Payment Actions (Temporarily Paused for Business Verification) ---
// ==============================================================================
/*
export async function createRazorpayOrder(tier: 'basic' | 'premium' | 'vip', amount: number, userId: string) {
  const ip = await getClientIp();
  const rateLimit = await rateLimitRequest(`rate_limit:create_order:${ip}`, 5, 0.2); // 5 burst, 1 refill per 5 sec
  if (!rateLimit.success) {
    return { success: false, error: 'Too many requests. Please slow down.' };
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('[createRazorpayOrder] Razorpay credentials missing. Falling back to mock order.');
    return {
      success: true,
      isMock: true,
      orderId: `order_mock_${Math.random().toString(36).substring(2, 9)}`,
      keyId: 'rzp_test_placeholder_key',
    };
  }

  try {
    const razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100), // in paisa
      currency: 'INR',
      receipt: `receipt_${tier}_${userId.substring(0, 8)}_${Date.now()}`,
      notes: {
        user_id: userId,
        tier: tier,
      },
    });

    return {
      success: true,
      isMock: false,
      orderId: order.id,
      keyId,
    };
  } catch (error: any) {
    console.error('[createRazorpayOrder] Failed to create Razorpay order:', error);
    return {
      success: false,
      error: error.message || 'Failed to initialize payment order',
    };
  }
}

// Securely verify client-side Razorpay payment signatures and upgrade user tier on server
export async function verifyRazorpayPayment(
  paymentId: string,
  orderId: string,
  signature: string,
  tier: 'basic' | 'premium' | 'vip',
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return { success: false, error: 'Payment gateway configuration is missing.' };
  }

  // 1. Verify Payment Signature securely using HMAC SHA256
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (generatedSignature !== signature) {
    console.error(`[Security Warning] Invalid payment signature attempt. user=${userId}`);
    return { success: false, error: 'Invalid payment signature. Upgrade denied.' };
  }

  // 2. Perform Database Upgrades using Server-side Service client (bypasses RLS triggers)
  const supabaseAdmin = getServiceSupabase();
  if (!supabaseAdmin) {
    return { success: false, error: 'Database configuration missing (SUPABASE_SERVICE_ROLE_KEY).' };
  }
  try {
    const amount = tier === 'vip' ? 999 : tier === 'premium' ? 499 : 299; // baseline pricing config

    // Log the payment
    const { error: payErr } = await supabaseAdmin
      .from('payments')
      .upsert({
        order_id: orderId,
        payment_id: paymentId,
        amount,
        status: 'captured',
        tier,
        user_id: userId,
      });

    if (payErr) {
      console.error('Database Error: Failed to log verified payment:', payErr);
    }

    // Upgrade the user subscription tier
    let expiryDate: string | null = null;
    const now = new Date();
    if (tier === 'basic') {
      now.setMonth(now.getMonth() + 6);
      expiryDate = now.toISOString();
    } else if (tier === 'premium') {
      now.setFullYear(now.getFullYear() + 1);
      expiryDate = now.toISOString();
    }

    const { error: userErr } = await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiryDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userErr) {
      return { success: false, error: userErr.message };
    }

    await logAuditEvent('payment_verify_success', { order_id: orderId, payment_id: paymentId, tier, amount }, userId);

    return { success: true };
  } catch (err: any) {
    console.error('Exception verifying payment:', err);
    return { success: false, error: err.message || 'Server error during payment verification' };
  }
}
*/

// Server Action to upgrade user tier for mock/demo checkouts (Only allowed in development/mock modes)
export async function upgradeUserTierMock(userId: string, tier: 'basic' | 'premium' | 'vip') {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keySecret) {
    console.warn(`[upgradeUserTierMock] Denied. Mock upgrades are disabled in live production mode.`);
    return { success: false, error: 'Mock checkout is disabled in production.' };
  }

  return upgradeUserTierMockInternal(userId, tier);
}

// Internal mock upgrade helper using the service client
async function upgradeUserTierMockInternal(userId: string, tier: 'basic' | 'premium' | 'vip') {
  const supabaseAdmin = getServiceSupabase();
  if (!supabaseAdmin) {
    // If service role is missing, try updating using the normal supabase client.
    // It might be blocked by database trigger/RLS for non-admin users, but in local mock dev it is a helpful fallback.
    const supabase = await getSupabase();
    try {
      let expiryDate: string | null = null;
      const now = new Date();
      if (tier === 'basic') {
        now.setMonth(now.getMonth() + 6);
        expiryDate = now.toISOString();
      } else if (tier === 'premium') {
        now.setFullYear(now.getFullYear() + 1);
        expiryDate = now.toISOString();
      }

      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          subscription_expires_at: expiryDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      await logAuditEvent('payment_mock_success_client', { tier }, userId);
      return { success: true };
    } catch (e: any) {
      console.warn('[upgradeUserTierMockInternal] Failed to upgrade user tier using client SDK:', e);
      return { success: false, error: e.message || 'Failed to update user tier without service role key.' };
    }
  }
  try {
    let expiryDate: string | null = null;
    const now = new Date();
    if (tier === 'basic') {
      now.setMonth(now.getMonth() + 6);
      expiryDate = now.toISOString();
    } else if (tier === 'premium') {
      now.setFullYear(now.getFullYear() + 1);
      expiryDate = now.toISOString();
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiryDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }
    await logAuditEvent('payment_mock_success_admin', { tier }, userId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- Admin-Only Server Actions (Protected by Server-Side checkAdmin Auth checks) ---

// Fetch all database tables for admin view
export async function getAdminDashboardData(): Promise<{
  users: any[];
  invitations: any[];
  payments: any[];
  referrals: ReferralCode[];
  mediaAssets: MediaAsset[];
} | null> {
  const supabase = await getSupabase();
  
  // 1. Authorize Admin caller
  const authorized = await checkAdmin(supabase);
  if (!authorized) {
    console.error('[Security Violation] Unauthorized admin access attempt to getAdminDashboardData');
    return null;
  }

  try {
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersErr) throw usersErr;

    const { data: invitations, error: invErr } = await supabase
      .from('invitations')
      .select('*, users(email)')
      .order('created_at', { ascending: false });

    if (invErr) throw invErr;

    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('*, users(email)')
      .order('created_at', { ascending: false });

    if (payErr) throw payErr;

    const { data: referrals, error: refErr } = await supabase
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (refErr) throw refErr;

    const { data: mediaAssets, error: mediaErr } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (mediaErr) throw mediaErr;

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
      user_id: pay.user_id,
      email: pay.users?.email || 'Unknown User',
      orderId: pay.order_id,
      paymentId: pay.payment_id,
      amount: pay.amount,
      status: pay.status,
      tier: pay.tier,
      utrNumber: pay.utr_number || (pay.payment_id?.startsWith('UTR_') ? pay.payment_id.replace('UTR_', '') : pay.payment_id),
      screenshotUrl: pay.screenshot_url,
      adminNotes: pay.admin_notes,
      paymentMethod: pay.payment_method || 'upi_manual',
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
  
  const authorized = await checkAdmin(supabase);
  if (!authorized) return false;

  // Use service role client to bypass RLS and database triggers
  const supabaseAdmin = getServiceSupabase();
  const client = supabaseAdmin || supabase;

  try {
    const { error } = await client
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_expires_at: tier === 'free' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Invalidate Redis/local cache for all invitations owned by this user
    // so the editor picks up the new owner_tier immediately
    try {
      const { data: userInvitations } = await client
        .from('invitations')
        .select('slug')
        .eq('user_id', userId);

      if (userInvitations && userInvitations.length > 0) {
        await Promise.all(
          userInvitations.map((inv: { slug: string }) => invalidateInvitationCache(inv.slug))
        );
      }
    } catch (cacheErr) {
      console.warn('[updateUserTierAdmin] Cache invalidation failed (non-fatal):', cacheErr);
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserTierAdmin:', error);
    return false;
  }
}

// Admin action to toggle suspended status of invitation link
export async function toggleInvitationSuspensionAdmin(invitationId: string, isSuspended: boolean): Promise<boolean> {
  const supabase = await getSupabase();
  
  const authorized = await checkAdmin(supabase);
  if (!authorized) return false;

  try {
    // Get the invitation slug first to invalidate cache
    const { data: inv } = await supabase
      .from('invitations')
      .select('slug')
      .eq('id', invitationId)
      .single();

    const { error } = await supabase
      .from('invitations')
      .update({
        is_suspended: isSuspended,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (error) throw error;

    if (inv?.slug) {
      await invalidateInvitationCache(inv.slug);
    }
    return true;
  } catch (error) {
    console.error('Error in toggleInvitationSuspensionAdmin:', error);
    return false;
  }
}

// Admin action to create new referral codes (Validated & Sanitized)
export async function createReferralCodeAdmin(code: string, discountPercent: number): Promise<boolean> {
  const supabase = await getSupabase();
  
  const authorized = await checkAdmin(supabase);
  if (!authorized) return false;

  try {
    const cleanCode = code.trim().toUpperCase();
    const parsed = ReferralCodeSchema.safeParse({ code: cleanCode, discount_percent: discountPercent });
    if (!parsed.success) return false;

    const { error } = await supabase
      .from('referral_codes')
      .insert(parsed.data);

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
  
  const authorized = await checkAdmin(supabase);
  if (!authorized) return false;

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

// Admin action to create backgrounds/music assets (Validated & Sanitized)
export async function createMediaAssetAdmin(url: string, mediaType: 'image' | 'video' | 'music', filename: string): Promise<boolean> {
  const supabase = await getSupabase();
  
  const authorized = await checkAdmin(supabase);
  if (!authorized) return false;

  try {
    const parsed = MediaAssetSchema.safeParse({ url, media_type: mediaType, filename });
    if (!parsed.success) return false;

    const { error } = await supabase
      .from('media_assets')
      .upsert(parsed.data, { onConflict: 'url' });

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
  
  const authorized = await checkAdmin(supabase);
  if (!authorized) return false;

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

// Fetch media assets for editor selection
export async function getMediaAssets(type?: 'image' | 'video' | 'music'): Promise<MediaAsset[]> {
  const supabase = await getSupabase();
  try {
    let query = supabase.from('media_assets').select('*');
    if (type) {
      query = query.eq('media_type', type);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    // Deduplicate by URL as a safety net
    const seen = new Set<string>();
    const unique = (data || []).filter((asset: MediaAsset) => {
      if (seen.has(asset.url)) return false;
      seen.add(asset.url);
      return true;
    });
    return unique;
  } catch (error) {
    console.error('Error in getMediaAssets:', error);
    return [];
  }
}

// Server Action to update the invitation slug securely
export async function updateInvitationSlug(invitationId: string, newSlug: string, userId: string): Promise<{ success: boolean; error?: string }> {
  // 1. Rate Limiting Check
  const ip = await getClientIp();
  const rateLimit = await rateLimitRequest(`rate_limit:update_slug:${ip}`, 5, 0.2);
  if (!rateLimit.success) {
    return { success: false, error: 'Too many requests. Please wait.' };
  }

  // 2. Validate new slug format
  const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (cleanSlug.length < 3 || cleanSlug.length > 50) {
    return { success: false, error: 'Slug must be between 3 and 50 characters.' };
  }

  const supabase = await getSupabase();
  try {
    // 3. Check if slug is already taken (excluding current invitation)
    const { data: existing, error: checkError } = await supabase
      .from('invitations')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (existing && existing.id !== invitationId) {
      return { success: false, error: 'This invitation link (slug) is already taken. Please try another one.' };
    }

    // 4. Update the slug in database
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        slug: cleanSlug,
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .eq('user_id', userId);

    if (updateError) {
      if (updateError.code === '23505') {
        return { success: false, error: 'This invitation link (slug) is already taken. Please try another one.' };
      }
      return { success: false, error: updateError.message };
    }

    // 5. Invalidate old caches and add new slug to Bloom Filter
    await invalidateInvitationCache(cleanSlug);
    await addSlugToFilter(cleanSlug);
    
    // Revalidate paths for dynamic slugs
    revalidatePath(`/invite/${cleanSlug}`);
    revalidatePath(`/dashboard/edit/${cleanSlug}`);

    return { success: true };
  } catch (err: any) {
    console.error('[updateInvitationSlug] Exception:', err);
    return { success: false, error: err.message || 'Server error updating invitation link' };
  }
}

