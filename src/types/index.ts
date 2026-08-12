export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'vip';
export type AttendingStatus = 'going' | 'not_going' | 'pending';
export type BackgroundType = 'gradient' | 'image' | 'video';

export interface StylingPreferences {
  invitation_id: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_heading: string;
  font_body: string;
  music_url: string;
  section_order: string[];
  animation_style: string;
  button_style: string;
  countdown_style: string;
  gallery_layout: string;
  background_type: BackgroundType;
  background_url: string;
  // Cover page customization
  cover_title?: string;
  cover_subtitle?: string;
  cover_custom_text?: string;
  wax_seal_text?: string;
}

export interface WeddingEvent {
  id?: string;
  invitation_id?: string;
  event_name: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  google_maps_link: string;
}

export interface Invitation {
  id: string;
  user_id: string;
  slug: string;
  groom_name: string;
  groom_photo: string;
  groom_bio: string;
  bride_name: string;
  bride_photo: string;
  bride_bio: string;
  parents_names: string;
  invitation_message: string;
  template_id?: string;
  custom_domain?: string;
  is_published: boolean;
  gallery_photos?: string[];
  created_at?: string;
  updated_at?: string;
  owner_tier?: string;
  is_suspended?: boolean;
  
  // Relational details
  styling?: StylingPreferences;
  events?: WeddingEvent[];
  gift_collection?: GiftCollectionDetails;
}

export interface GiftCollectionDetails {
  invitation_id: string;
  upi_id: string;
  receiver_name: string;
  thank_you_message: string;
}

export interface RSVP {
  id: string;
  invitation_id: string;
  guest_name: string;
  guest_email?: string;
  attending_status: AttendingStatus;
  guest_count: number;
  wishes?: string;
  created_at?: string;
}

export interface GiftTransaction {
  id: string;
  invitation_id: string;
  sender_name?: string;
  amount: number;
  message?: string;
  status: string;
  created_at?: string;
}

export interface PaymentLog {
  id: string;
  user_id: string;
  order_id: string;
  payment_id?: string;
  amount: number;
  currency: string;
  status: string;
  tier: SubscriptionTier;
  created_at?: string;
}

export interface ReferralCode {
  code: string;
  discount_percent: number;
  created_at?: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  media_type: 'image' | 'video' | 'music';
  filename: string;
  created_at?: string;
}

export type VendorCategory = 
  | 'all'
  | 'mehendi' 
  | 'makeup' 
  | 'photography' 
  | 'decor' 
  | 'catering' 
  | 'dj_music' 
  | 'planner' 
  | 'venue';

export interface VendorProfile {
  id: string;
  user_id?: string | null;
  business_name: string;
  category: VendorCategory;
  tagline?: string;
  description?: string;
  location?: string;
  dp_url?: string;
  portfolio_photos?: string[];
  whatsapp_number?: string;
  phone_number?: string;
  instagram_handle?: string;
  starting_price?: string;
  rating?: number;
  review_count?: number;
  is_approved?: boolean;
  is_verified?: boolean;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
}


