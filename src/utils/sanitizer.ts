import { z } from 'zod';
import { Invitation } from '@/types';

// --- HTML/XSS Sanitization Helpers ---

/**
 * Decodes HTML entities back into their natural, readable characters.
 * Handles nested or multiple encodings (e.g. &amp;amp; -> &).
 */
export function decodeHtmlEntities(str: string | null | undefined): string {
  if (!str) return '';
  let result = str;
  while (result.includes('&amp;')) {
    result = result.replace(/&amp;/g, '&');
  }
  return result
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#x2F;|&#47;/g, '/');
}

/**
 * Strips HTML tags to prevent HTML/XSS injection while preserving natural user characters.
 * Unescapes any HTML entities (like &amp; -> &) so clean human-readable characters
 * are stored and rendered natively by React without unwanted entity display.
 */
export function sanitizeText(val: string | null | undefined): string {
  if (!val) return '';
  // Remove HTML tags
  const noHtml = val.replace(/<[^>]*>/g, '');
  // Decode any HTML entities so text like "&amp;" returns to clean "&"
  return decodeHtmlEntities(noHtml).trim();
}

/**
 * Normalizes invitation text fields to decode any HTML entities (&amp;, &#x27;, etc.)
 * so the application always works with clean, human-readable strings.
 */
export function cleanInvitationData<T extends Partial<Invitation>>(inv: T): T {
  if (!inv) return inv;

  let groomParents = inv.groom_parents ? decodeHtmlEntities(inv.groom_parents) : '';
  let brideParents = inv.bride_parents ? decodeHtmlEntities(inv.bride_parents) : '';
  let rawParentsNames = inv.parents_names ? decodeHtmlEntities(inv.parents_names) : '';

  // Check if parents_names contains structured JSON with groom and bride parent details
  if (rawParentsNames && rawParentsNames.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawParentsNames);
      if (parsed.groom) groomParents = decodeHtmlEntities(parsed.groom);
      if (parsed.bride) brideParents = decodeHtmlEntities(parsed.bride);
      rawParentsNames = decodeHtmlEntities(parsed.blessings || (parsed.groom && parsed.bride ? `${parsed.groom} & ${parsed.bride}` : parsed.groom || parsed.bride || ''));
    } catch (e) {
      // Keep raw string if not JSON
    }
  } else if (!groomParents && rawParentsNames) {
    // Legacy fallback: if parents_names exists as plain text, associate with groom parents
    groomParents = rawParentsNames;
  }

  return {
    ...inv,
    groom_name: decodeHtmlEntities(inv.groom_name),
    bride_name: decodeHtmlEntities(inv.bride_name),
    parents_names: rawParentsNames,
    groom_parents: groomParents,
    bride_parents: brideParents,
    groom_bio: decodeHtmlEntities(inv.groom_bio),
    bride_bio: decodeHtmlEntities(inv.bride_bio),
    invitation_message: decodeHtmlEntities(inv.invitation_message),
    events: inv.events?.map((e: any) => ({
      ...e,
      event_name: decodeHtmlEntities(e.event_name),
      venue_name: decodeHtmlEntities(e.venue_name),
      venue_address: decodeHtmlEntities(e.venue_address),
    })),
    gift_collection: inv.gift_collection ? {
      ...inv.gift_collection,
      receiver_name: decodeHtmlEntities(inv.gift_collection.receiver_name),
      thank_you_message: decodeHtmlEntities(inv.gift_collection.thank_you_message),
    } : undefined,
  };
}

/**
 * Validates and cleans URL inputs. Returns empty string if the URL is invalid.
 */
export function sanitizeUrl(val: string | null | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  // Simple validation to ensure it looks like a valid URL or path
  if (/^(https?:\/\/|\/|data:image\/)/i.test(trimmed)) {
    // Strip HTML/scripts to prevent script tags inside URL parameters
    return trimmed.replace(/<[^>]*>/g, '').replace(/javascript:/i, '');
  }
  return '';
}

// --- Zod Validation Schemas ---

export const RsvpSchema = z.object({
  invitation_id: z.string().uuid(),
  guest_name: z.string().min(1, 'Name is required').max(100, 'Name is too long').transform(sanitizeText),
  guest_email: z.string().email('Invalid email address').optional().or(z.literal('')).transform(val => val ? val.trim().toLowerCase() : undefined),
  attending_status: z.enum(['going', 'not_going', 'pending']),
  guest_count: z.number().int().min(1).max(50).default(1),
  wishes: z.string().max(1000, 'Message is too long').optional().or(z.literal('')).transform(val => val ? sanitizeText(val) : undefined),
});

export const InvitationCoreSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Slug must be alphanumeric, dashes, or underscores'),
  groom_name: z.string().min(1).max(100).transform(sanitizeText),
  groom_photo: z.string().optional().nullable().or(z.literal('')).transform(val => val ? sanitizeUrl(val) : ''),
  groom_bio: z.string().max(500).optional().nullable().or(z.literal('')).transform(val => val ? sanitizeText(val) : ''),
  groom_parents: z.string().max(200).optional().nullable().or(z.literal('')).transform(val => val ? sanitizeText(val) : ''),
  bride_name: z.string().min(1).max(100).transform(sanitizeText),
  bride_photo: z.string().optional().nullable().or(z.literal('')).transform(val => val ? sanitizeUrl(val) : ''),
  bride_bio: z.string().max(500).optional().nullable().or(z.literal('')).transform(val => val ? sanitizeText(val) : ''),
  bride_parents: z.string().max(200).optional().nullable().or(z.literal('')).transform(val => val ? sanitizeText(val) : ''),
  parents_names: z.string().max(1000).optional().nullable().or(z.literal('')).transform(val => val ? sanitizeText(val) : ''),
  invitation_message: z.string().max(2000).optional().nullable().or(z.literal('')).transform(val => val ? sanitizeText(val) : ''),
  template_id: z.string().uuid().optional().nullable(),
  custom_domain: z.string().max(100).optional().nullable().transform(val => val ? sanitizeUrl(val) : null),
  is_published: z.boolean().default(false),
  gallery_photos: z.array(z.string().transform(sanitizeUrl)).optional().nullable().transform(val => val || []),
});

export const ReferralCodeSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric'),
  discount_percent: z.number().int().min(0).max(100),
});

export const MediaAssetSchema = z.object({
  url: z.string().url('Invalid asset URL').transform(sanitizeUrl),
  media_type: z.enum(['image', 'video', 'music']),
  filename: z.string().min(1).max(200).transform(sanitizeText),
});

export const BespokeRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').transform(sanitizeText),
  email: z.string().email('Invalid email address').transform(val => val.trim().toLowerCase()),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15, 'Phone is too long').transform(sanitizeText),
  wedding_date: z.string().optional().nullable().or(z.literal('')),
  estimated_budget: z.string().min(1, 'Budget selection is required').transform(sanitizeText),
  details: z.string().max(2000, 'Details must be under 2000 characters').optional().nullable().or(z.literal('')).transform(val => val ? sanitizeText(val) : ''),
});
