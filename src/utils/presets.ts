import { StylingPreferences } from '@/types';

export interface TemplatePreset {
  id: string;
  name: string;
  slug: string;
  styling: Omit<StylingPreferences, 'invitation_id'>;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'tpl-royal-gold',
    name: 'Royal Gold',
    slug: 'royal-gold',
    styling: {
      primary_color: '#d4af37', // Gold
      secondary_color: '#aa7c11', // Darker Gold
      background_color: '#0d0d11', // Deep Black
      text_color: '#f3f4f6', // Light gray
      font_heading: 'cinzel',
      font_body: 'inter',
      music_url: '/music/instrumental-shehnai.mp3',
      section_order: ['hero', 'countdown', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
      animation_style: 'fade',
      button_style: 'gold-border',
      countdown_style: 'circles',
      gallery_layout: 'grid',
      background_type: 'gradient',
      background_url: 'linear-gradient(135deg, #0d0d11 0%, #1a1a24 100%)',
    },
  },
  {
    id: 'tpl-muslim-nikah',
    name: 'Muslim Nikah (Royal Burgundy)',
    slug: 'muslim-nikah',
    styling: {
      primary_color: '#d4af37', // Gold
      secondary_color: '#580b14', // Burgundy
      background_color: '#fbf6ef', // Cream
      text_color: '#2e050c', // Dark burgundy-black
      font_heading: 'playfair',
      font_body: 'inter',
      music_url: '/music/islamic-nasheed.mp3',
      section_order: ['hero', 'countdown', 'story', 'events', 'gallery', 'livestream', 'rsvp', 'gifts'],
      animation_style: 'slide',
      button_style: 'gold-border',
      countdown_style: 'boxed-numbers',
      gallery_layout: 'masonry',
      background_type: 'gradient',
      background_url: 'linear-gradient(135deg, #fbf6ef 0%, #f3eae1 100%)',
    },
  },
  {
    id: 'tpl-floral-theme',
    name: 'Floral Theme',
    slug: 'floral-theme',
    styling: {
      primary_color: '#ec4899', // Floral Pink
      secondary_color: '#db2777', // Rose
      background_color: '#fff5f5', // Light blush background
      text_color: '#1f2937', // Charcoal text
      font_heading: 'alex',
      font_body: 'inter',
      music_url: '/music/romantic-piano.mp3',
      section_order: ['hero', 'story', 'countdown', 'events', 'gallery', 'rsvp', 'gifts'],
      animation_style: 'zoom',
      button_style: 'classic-pill',
      countdown_style: 'circles',
      gallery_layout: 'carousel',
      background_type: 'gradient',
      background_url: 'linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%)',
    },
  },
  {
    id: 'tpl-modern-luxury',
    name: 'Modern Luxury',
    slug: 'modern-luxury',
    styling: {
      primary_color: '#c5a880', // Champagne Gold
      secondary_color: '#222222', // Slate Black
      background_color: '#111111', // Matte Black
      text_color: '#ffffff',
      font_heading: 'playfair',
      font_body: 'inter',
      music_url: '/music/romantic-violin.mp3',
      section_order: ['hero', 'story', 'events', 'countdown', 'gallery', 'livestream', 'rsvp', 'gifts'],
      animation_style: 'parallax',
      button_style: 'glowing-shadow',
      countdown_style: 'simple-text',
      gallery_layout: 'masonry',
      background_type: 'gradient',
      background_url: 'linear-gradient(135deg, #111 0%, #222 100%)',
    },
  },
  {
    id: 'tpl-south-indian',
    name: 'South Indian Traditional',
    slug: 'south-indian-traditional',
    styling: {
      primary_color: '#eab308', // Traditional Yellow
      secondary_color: '#b91c1c', // Kumkum Red
      background_color: '#7f1d1d', // Deep maroon
      text_color: '#fef08a', // Pale yellow text
      font_heading: 'kannada',
      font_body: 'inter',
      music_url: '/music/traditional-nadaswaram.mp3',
      section_order: ['hero', 'countdown', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
      animation_style: 'slide',
      button_style: 'modern-flat',
      countdown_style: 'boxed-numbers',
      gallery_layout: 'grid',
      background_type: 'gradient',
      background_url: 'linear-gradient(135deg, #4c0519 0%, #7f1d1d 100%)',
    },
  },
  {
    id: 'tpl-minimal-white',
    name: 'Minimal White',
    slug: 'minimal-white',
    styling: {
      primary_color: '#1f2937', // Dark gray
      secondary_color: '#6b7280', // Medium gray
      background_color: '#ffffff', // Pure white
      text_color: '#111827', // Black
      font_heading: 'playfair',
      font_body: 'inter',
      music_url: '/music/instrumental-guitar.mp3',
      section_order: ['hero', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
      animation_style: 'fade',
      button_style: 'modern-flat',
      countdown_style: 'simple-text',
      gallery_layout: 'grid',
      background_type: 'gradient',
      background_url: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
    },
  },
  {
    id: 'tpl-dark-elegant',
    name: 'Dark Elegant',
    slug: 'dark-elegant',
    styling: {
      primary_color: '#9f1239', // Velvet Crimson
      secondary_color: '#4c0519', // Deep Wine
      background_color: '#090507', // Midnight Purple/Red
      text_color: '#fda4af', // Rose gold/pink text
      font_heading: 'cinzel',
      font_body: 'inter',
      music_url: '/music/romantic-violin.mp3',
      section_order: ['hero', 'countdown', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
      animation_style: 'fade',
      button_style: 'glowing-shadow',
      countdown_style: 'circles',
      gallery_layout: 'masonry',
      background_type: 'gradient',
      background_url: 'linear-gradient(135deg, #090507 0%, #1c0b11 100%)',
    },
  },
  {
    id: 'tpl-video-invitation',
    name: 'Video Invitation Theme',
    slug: 'video-invitation-theme',
    styling: {
      primary_color: '#3b82f6',
      secondary_color: '#1d4ed8',
      background_color: '#030712',
      text_color: '#f9fafb',
      font_heading: 'playfair',
      font_body: 'inter',
      music_url: '',
      section_order: ['hero', 'countdown', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
      animation_style: 'zoom',
      button_style: 'modern-flat',
      countdown_style: 'circles',
      gallery_layout: 'carousel',
      background_type: 'video',
      background_url: 'https://assets.mixkit.co/videos/preview/mixkit-background-of-a-golden-particle-rain-31627-large.mp4',
    },
  },
  {
    id: 'tpl-urdu-theme',
    name: 'Urdu Theme',
    slug: 'urdu-theme',
    styling: {
      primary_color: '#d4af37',
      secondary_color: '#b8962e',
      background_color: '#0c0a09', // Warm dark stone
      text_color: '#f5f5f4', // Warm gray
      font_heading: 'urdu',
      font_body: 'urdu',
      music_url: '/music/urdu-ghazal-instrumental.mp3',
      section_order: ['hero', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
      animation_style: 'fade',
      button_style: 'gold-border',
      countdown_style: 'boxed-numbers',
      gallery_layout: 'grid',
      background_type: 'gradient',
      background_url: 'linear-gradient(135deg, #0c0a0 stone-950 0%, #1c1917 100%)',
    },
  },
  {
    id: 'tpl-premium-animation',
    name: 'Premium Animation Theme',
    slug: 'premium-animation-theme',
    styling: {
      primary_color: '#8b5cf6', // Lavender Purple
      secondary_color: '#6d28d9', // Deep Violet
      background_color: '#0f0b1e', // Dark violet
      text_color: '#ddd6fe', // Light violet text
      font_heading: 'alex',
      font_body: 'inter',
      music_url: '/music/romantic-piano.mp3',
      section_order: ['hero', 'countdown', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
      animation_style: 'confetti',
      button_style: 'glowing-shadow',
      countdown_style: 'circles',
      gallery_layout: 'carousel',
      background_type: 'gradient',
      background_url: 'linear-gradient(135deg, #0a0614 0%, #1e133d 100%)',
    },
  },
];

export const MUSIC_PRESETS = [
  { name: 'Traditional Shehnai', url: '/music/instrumental-shehnai.mp3' },
  { name: 'Romantic Piano', url: '/music/romantic-piano.mp3' },
  { name: 'Romantic Violin', url: '/music/romantic-violin.mp3' },
  { name: 'Islamic Nasheed', url: '/music/islamic-nasheed.mp3' },
  { name: 'Traditional Nadaswaram', url: '/music/traditional-nadaswaram.mp3' },
  { name: 'Classical Sitar', url: '/music/classical-sitar.mp3' },
];

export const FONT_PRESETS = [
  { name: 'Classic Serif (Cinzel)', value: 'cinzel', className: 'font-cinzel' },
  { name: 'Elegant Serif (Playfair Display)', value: 'playfair', className: 'font-playfair' },
  { name: 'Calligraphy (Alex Brush)', value: 'alex', className: 'font-alex' },
  { name: 'Modern Clean (Inter)', value: 'inter', className: 'font-sans' },
  { name: 'Urdu Nastaliq', value: 'urdu', className: 'font-urdu' },
  { name: 'Devanagari/Hindi', value: 'hindi', className: 'font-hindi' },
  { name: 'Kannada font', value: 'kannada', className: 'font-kannada' },
];
