import { z } from 'zod';

// --- HTML/XSS Sanitization Helpers ---

/**
 * Strips HTML tags and escapes special characters to prevent HTML/XSS injection.
 * Suitable for general user text inputs (names, messages, wishes).
 */
export function sanitizeText(val: string | null | undefined): string {
  if (!val) return '';
  // Remove HTML tags
  const noHtml = val.replace(/<[^>]*>/g, '');
  // Escape HTML characters
  return noHtml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
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
  bride_name: z.string().min(1).max(100).transform(sanitizeText),
  bride_photo: z.string().optional().nullable().or(z.literal('')).transform(val => val ? sanitizeUrl(val) : ''),
  bride_bio: z.string().max(500).optional().nullable().or(z.literal('')).transform(val => val ? sanitizeText(val) : ''),
  parents_names: z.string().max(200).optional().nullable().or(z.literal('')).transform(val => val ? sanitizeText(val) : ''),
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
