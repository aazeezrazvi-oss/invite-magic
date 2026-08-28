'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  Heart, Settings, Calendar, 
  ChevronUp, ChevronDown, ChevronRight, Plus, Trash2, Gift, Save, Lock, Image, Film, Music, Volume2, Play, Pause, Sparkles, CheckCircle2, AlertCircle, Palette, Type, Sliders, Layers
} from 'lucide-react';
import { Invitation, StylingPreferences, WeddingEvent, GiftCollectionDetails, MediaAsset } from '@/types';
import { TEMPLATE_PRESETS, MUSIC_PRESETS, FONT_PRESETS } from '@/utils/presets';
import CheckoutButton from '@/components/CheckoutButton';
import { BrandIcon } from '@/components/Logo';
import { supabase } from '@/utils/supabase';
import { getMediaAssets } from '@/app/actions';

interface SidebarProps {
  invitation: Partial<Invitation>;
  onUpdate: (updated: Partial<Invitation>) => void;
  onSave?: () => void;
  isSaving?: boolean;
  hasPaid?: boolean;
  onPaymentSuccess?: () => void;
  activeTab?: 'details' | 'design' | 'events' | 'gifts';
  onTabChange?: (tab: 'details' | 'design' | 'events' | 'gifts') => void;
  isMobileSheet?: boolean;
}

const CURATED_PALETTES = [
  {
    name: 'Royal Gold & Crimson',
    primary: '#d4af37',
    secondary: '#6b0c1b',
    background: '#0d0d11',
    text: '#fcf8f2',
  },
  {
    name: 'Midnight Navy & Rose Gold',
    primary: '#e0a899',
    secondary: '#1a2b4c',
    background: '#0a1128',
    text: '#f0f4f8',
  },
  {
    name: 'Emerald Garden & Cream',
    primary: '#10b981',
    secondary: '#064e3b',
    background: '#091b15',
    text: '#f5fdf9',
  },
  {
    name: 'Blush Romance & Wine',
    primary: '#f472b6',
    secondary: '#831843',
    background: '#180a14',
    text: '#fff1f2',
  },
  {
    name: 'Classic Ivory & Gold',
    primary: '#c5a059',
    secondary: '#3f3b33',
    background: '#12110f',
    text: '#faf8f5',
  },
  {
    name: 'Bohemian Terracotta',
    primary: '#e07a5f',
    secondary: '#813d28',
    background: '#1c1412',
    text: '#fdfaf6',
  },
];

const COVER_HEADING_PRESETS = [
  { label: '﷽ (Bismillah - In the Name of Allah)', value: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم' },
  { label: 'ॐ श्री गणेशाय नमः (Om Shri Ganeshaya Namah)', value: 'ॐ श्री गणेशाय नमः' },
  { label: "With God's Grace & Blessings", value: "With God's Grace & Blessings" },
  { label: 'Together with Our Families', value: 'Together with Our Families' },
  { label: 'Two Souls, One Beautiful Journey', value: 'Two Souls, One Beautiful Journey' },
  { label: 'Shubh Vivah (शुभ विवाह)', value: 'शुभ विवाह' },
  { label: 'Save The Date', value: 'Save The Date' },
  { label: 'Royal Wedding Celebration', value: 'Royal Wedding Celebration' },
  { label: 'Other / Custom Heading...', value: '__custom__' },
];

const COVER_SUBTITLE_PRESETS = [
  { label: 'In The Name of God, The Most Gracious, The Most Merciful', value: 'In The Name of God, The Most Gracious, The Most Merciful' },
  { label: 'Cordially invite you to celebrate the wedding union of', value: 'Cordially invite you to celebrate the wedding union of' },
  { label: 'Request the honor of your presence and warm blessings at the wedding of', value: 'Request the honor of your presence and warm blessings at the wedding of' },
  { label: 'Invite you to share in our joy as we begin our new chapter', value: 'Invite you to share in our joy as we begin our new chapter' },
  { label: 'Together with their families request the pleasure of your company', value: 'Together with their families request the pleasure of your company' },
  { label: 'Other / Custom Subtitle...', value: '__custom__' },
];

export default function Sidebar({ 
  invitation, 
  onUpdate, 
  onSave, 
  isSaving = false,
  hasPaid = false,
  onPaymentSuccess,
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
  isMobileSheet = false
}: SidebarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'details' | 'design' | 'events' | 'gifts'>('details');
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = externalOnTabChange || setInternalActiveTab;

  const [uploadingGroom, setUploadingGroom] = useState(false);
  const [uploadingBride, setUploadingBride] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Accordion open/collapse states
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    couple: true,
    family: false,
    gallery: false,
    presets: true,
    cover: false,
    colors: false,
    typography: false,
    background: false,
    order: false,
    aesthetic: false,
    music: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Inline audio preview state
  const [inlineAudio, setInlineAudio] = useState<HTMLAudioElement | null>(null);
  const [playingTrackUrl, setPlayingTrackUrl] = useState<string | null>(null);

  const toggleInlineAudio = (url: string) => {
    if (!url) return;
    if (playingTrackUrl === url) {
      inlineAudio?.pause();
      setPlayingTrackUrl(null);
    } else {
      if (inlineAudio) {
        inlineAudio.pause();
      }
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setPlayingTrackUrl(null);
      setInlineAudio(audio);
      setPlayingTrackUrl(url);
    }
  };

  useEffect(() => {
    return () => {
      if (inlineAudio) {
        inlineAudio.pause();
      }
    };
  }, [inlineAudio]);

  // Media Modal states
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [modalMediaType, setModalMediaType] = useState<'image' | 'video' | 'music'>('image');
  const [libraryAssets, setLibraryAssets] = useState<MediaAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);

  const openMediaModal = async (type: 'image' | 'video' | 'music') => {
    setModalMediaType(type);
    setShowMediaModal(true);
    setLoadingAssets(true);
    try {
      const assets = await getMediaAssets(type);
      setLibraryAssets(assets);
    } catch (e) {
      console.error('Failed to load media assets:', e);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleSelectAsset = (url: string) => {
    if (modalMediaType === 'music') {
      handleStylingChange('music_url', url);
    } else {
      handleStylingChange('background_url', url);
    }
    closeMediaModal();
  };

  const handleToggleAudioPreview = (assetId: string, url: string) => {
    if (playingAudioId === assetId) {
      audioPreview?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPreview) {
        audioPreview.pause();
      }
      const newAudio = new Audio(url);
      newAudio.play();
      newAudio.onended = () => setPlayingAudioId(null);
      setAudioPreview(newAudio);
      setPlayingAudioId(assetId);
    }
  };

  const closeMediaModal = () => {
    if (audioPreview) {
      audioPreview.pause();
    }
    setPlayingAudioId(null);
    setShowMediaModal(false);
  };

  // Completeness Calculation
  const calculateCompleteness = () => {
    let score = 0;
    const total = 7;
    if (invitation.groom_name && invitation.groom_name.trim()) score += 1;
    if (invitation.bride_name && invitation.bride_name.trim()) score += 1;
    if (invitation.groom_photo || invitation.bride_photo) score += 1;
    if (invitation.events && invitation.events.length > 0) score += 1;
    if (invitation.invitation_message && invitation.invitation_message.trim()) score += 1;
    if (invitation.gallery_photos && invitation.gallery_photos.length > 0) score += 1;
    if (invitation.gift_collection?.upi_id) score += 1;
    return Math.round((score / total) * 100);
  };

  const completeness = calculateCompleteness();

  const handleGalleryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingGallery(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${invitation.id || 'temp'}_gallery_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      let finalUrl = '';
      if (error) {
        console.warn('Storage upload failed, falling back to FileReader preview:', error);
        const urlPromise = new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
          };
          reader.readAsDataURL(file);
        });
        finalUrl = await urlPromise;
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);
        finalUrl = publicUrl;
      }

      const currentGallery = invitation.gallery_photos || [];
      handleDetailChange('gallery_photos', [...currentGallery, finalUrl]);
    } catch (err) {
      console.error('Error uploading gallery image:', err);
    } finally {
      setUploadingGallery(false);
    }
  };

  const deleteGalleryPhoto = (indexToDelete: number) => {
    const currentGallery = invitation.gallery_photos || [];
    const updatedGallery = currentGallery.filter((_, i) => i !== indexToDelete);
    handleDetailChange('gallery_photos', updatedGallery);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'groom_photo' | 'bride_photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'groom_photo') setUploadingGroom(true);
    else setUploadingBride(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${invitation.id || 'temp'}_${field}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Storage upload failed, falling back to FileReader preview:', error);
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            handleDetailChange(field, reader.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);
        handleDetailChange(field, publicUrl);
      }
    } catch (err) {
      console.error('Error uploading image file:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleDetailChange(field, reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      if (field === 'groom_photo') setUploadingGroom(false);
      else setUploadingBride(false);
    }
  };

  const styling = (invitation.styling || {
    primary_color: '#d4af37',
    secondary_color: '#b8962e',
    background_color: '#0d0d11',
    text_color: '#f3f4f6',
    font_heading: 'cinzel',
    font_body: 'inter',
    music_url: '',
    section_order: ['hero', 'countdown', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
    animation_style: 'fade',
    button_style: 'gold-border',
    countdown_style: 'circles',
    gallery_layout: 'grid',
    background_type: 'gradient',
    background_url: 'linear-gradient(135deg, #0d0d11 0%, #1a1a24 100%)',
  }) as StylingPreferences;

  const giftDetails = invitation.gift_collection || {
    upi_id: '',
    receiver_name: '',
    thank_you_message: 'Thank you for your warm blessings and digital gifts!',
  };

  const events = invitation.events || [];

  // Handlers
  const handleDetailChange = (field: keyof Invitation, value: any) => {
    onUpdate({ [field]: value });
  };

  const handleStylingChange = (field: keyof StylingPreferences, value: any) => {
    onUpdate({
      styling: {
        ...styling,
        [field]: value,
      } as StylingPreferences,
    });
  };

  const applyPreset = (presetSlug: string) => {
    const preset = TEMPLATE_PRESETS.find(p => p.slug === presetSlug);
    if (preset) {
      onUpdate({
        styling: {
          ...styling,
          ...preset.styling,
        } as StylingPreferences,
      });
    }
  };

  const applyColorPalette = (palette: typeof CURATED_PALETTES[0]) => {
    onUpdate({
      styling: {
        ...styling,
        primary_color: palette.primary,
        secondary_color: palette.secondary,
        background_color: palette.background,
        text_color: palette.text,
      } as StylingPreferences,
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...styling.section_order];
    if (direction === 'up' && index > 0) {
      const temp = sections[index];
      sections[index] = sections[index - 1];
      sections[index - 1] = temp;
    } else if (direction === 'down' && index < sections.length - 1) {
      const temp = sections[index];
      sections[index] = sections[index + 1];
      sections[index + 1] = temp;
    }
    handleStylingChange('section_order', sections);
  };

  const addEvent = () => {
    const newEvent: WeddingEvent = {
      event_name: 'Wedding Event',
      event_date: new Date().toISOString().split('T')[0],
      event_time: '18:00:00',
      venue_name: 'Grand Ballroom',
      venue_address: 'Address Details',
      google_maps_link: '',
    };
    onUpdate({ events: [...events, newEvent] });
  };

  const updateEvent = (index: number, field: keyof WeddingEvent, value: any) => {
    const updatedEvents = [...events];
    updatedEvents[index] = { ...updatedEvents[index], [field]: value };
    onUpdate({ events: updatedEvents });
  };

  const deleteEvent = (index: number) => {
    const updatedEvents = events.filter((_, i) => i !== index);
    onUpdate({ events: updatedEvents });
  };

  const handleGiftChange = (field: keyof GiftCollectionDetails, value: any) => {
    onUpdate({
      gift_collection: {
        ...giftDetails,
        [field]: value,
      } as GiftCollectionDetails,
    });
  };

  if (!hasPaid) {
    return (
      <div className="w-full md:w-96 bg-[#161622] border-r border-[#26263b] h-full flex flex-col overflow-hidden text-sm animate-in fade-in duration-300">
        <div className="p-4 border-b border-[#26263b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandIcon size={24} />
            <div className="flex items-center font-bold tracking-wider font-cinzel text-sm">
              <span className="text-white">Invite</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fae084] via-[#d4af37] to-[#aa7c11] ml-0.5">
                Magic
              </span>
              <span className="text-gray-400 font-sans font-medium text-[11px] ml-1.5 uppercase tracking-wider">
                Editor
              </span>
            </div>
          </div>
          <div className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 animate-pulse" />
            <span>Locked</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-center text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-cinzel">Template Gated Preview</h3>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
              You are currently viewing a live interactive preview of this template. Upgrade to unlock all editing options, custom styling presets, and RSVP tracker dashboard.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#26263b]">
            <div className="p-4 rounded-lg bg-[#0d0d11] border border-[#26263b] hover:border-[#d4af37]/30 transition-all text-left space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white font-cinzel text-xs uppercase tracking-wider">Basic Plan</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">6 Months Active Link + RSVP form.</p>
                </div>
                <span className="text-sm font-bold text-[#d4af37]">₹299</span>
              </div>
              <CheckoutButton
                amount={299}
                tier="basic"
                userId={invitation.user_id}
                onSuccess={onPaymentSuccess}
                className="w-full py-2 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-lg bg-[#0d0d11] border-2 border-[#d4af37]/65 hover:border-[#d4af37] transition-all text-left space-y-3 relative shadow-[0_0_15px_rgba(212,175,55,0.05)]">
              <span className="absolute -top-2.5 right-4 bg-[#d4af37] text-[#0d0d11] text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">
                Best Value
              </span>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-[#d4af37] font-cinzel text-xs uppercase tracking-wider">Premium Access</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Unlock all presets, fonts & unlimited photos.</p>
                </div>
                <span className="text-sm font-bold text-white">₹499</span>
              </div>
              <CheckoutButton
                amount={499}
                tier="premium"
                userId={invitation.user_id}
                onSuccess={onPaymentSuccess}
                className="w-full py-2 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-lg bg-[#0d0d11] border border-[#26263b] hover:border-[#d4af37]/30 transition-all text-left space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white font-cinzel text-xs uppercase tracking-wider">VIP Membership</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Lifetime + custom domain + VIP support.</p>
                </div>
                <span className="text-sm font-bold text-[#d4af37]">₹999</span>
              </div>
              <CheckoutButton
                amount={999}
                tier="vip"
                userId={invitation.user_id}
                onSuccess={onPaymentSuccess}
                className="w-full py-2 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#161622] h-full flex flex-col overflow-hidden text-sm">
      {/* Sidebar Header */}
      {!isMobileSheet && (
        <div className="p-4 border-b border-[#26263b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandIcon size={24} />
            <div className="flex items-center font-bold tracking-wider font-cinzel text-sm">
              <span className="text-white">Invite</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fae084] via-[#d4af37] to-[#aa7c11] ml-0.5">
                Magic
              </span>
              <span className="text-gray-400 font-sans font-medium text-[11px] ml-1.5 uppercase tracking-wider">
                Editor
              </span>
            </div>
          </div>
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-semibold rounded flex items-center gap-1.5 disabled:opacity-50 transition-all text-xs"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-t-transparent border-[#0d0d11] rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save</span>
            </button>
          )}
        </div>
      )}

      {/* Progress & Completeness Bar */}
      <div className="px-4 py-3 bg-[#0d0d11]/70 border-b border-[#26263b]">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-gray-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Invitation Progress</span>
          </span>
          <span className="font-mono text-[#d4af37] font-bold text-[11px]">{completeness}% Complete</span>
        </div>
        <div className="w-full h-1.5 bg-[#161622] rounded-full overflow-hidden border border-[#26263b]">
          <div 
            className="h-full bg-gradient-to-r from-[#b8962e] to-[#d4af37] transition-all duration-500 rounded-full"
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      {/* Tabs Menu */}
      {!isMobileSheet && (
        <div className="flex bg-[#0f0f18] border-b border-[#26263b] text-xs shrink-0">
          {(['details', 'design', 'events', 'gifts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center font-semibold border-b-2 capitalize transition-all ${
                activeTab === tab 
                  ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/5' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="space-y-3">
            {/* Accordion 1: Couple Details */}
            <div className="bg-[#0d0d11] rounded-xl border border-[#26263b] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('couple')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161622]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-white text-xs font-cinzel">Couple Information & Photos</span>
                </div>
                {openAccordions.couple ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {openAccordions.couple && (
                <div className="p-4 border-t border-[#26263b] space-y-4">
                  {/* Groom Details */}
                  <div className="space-y-3 p-3 rounded-lg bg-[#161622]/50 border border-[#26263b]">
                    <span className="font-semibold text-[#d4af37] text-xs block">Groom</span>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Groom Name</label>
                      <input
                        type="text"
                        value={invitation.groom_name || ''}
                        onChange={(e) => handleDetailChange('groom_name', e.target.value)}
                        placeholder="Enter Groom Name"
                        className="w-full bg-[#0d0d11] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Groom Bio</label>
                      <textarea
                        rows={2}
                        value={invitation.groom_bio || ''}
                        onChange={(e) => handleDetailChange('groom_bio', e.target.value)}
                        placeholder="Introduce the Groom..."
                        className="w-full bg-[#0d0d11] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] resize-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Groom Photo</label>
                      <div className="flex items-center gap-3">
                        {invitation.groom_photo ? (
                          <div className="relative w-11 h-11 rounded-full border-2 border-[#d4af37] overflow-hidden bg-black shrink-0">
                            <img src={invitation.groom_photo} alt="Groom" className="w-full h-full object-cover" />
                          </div>
                        ) : null}
                        
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, 'groom_photo')}
                          className="hidden"
                          id="groom-photo-upload"
                          disabled={uploadingGroom}
                        />
                        <label
                          htmlFor="groom-photo-upload"
                          className="px-3 py-1.5 bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          {uploadingGroom ? (
                            <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#d4af37] rounded-full animate-spin" />
                          ) : null}
                          <span>{invitation.groom_photo ? 'Change Photo' : 'Upload Photo'}</span>
                        </label>

                        {invitation.groom_photo && (
                          <button
                            type="button"
                            onClick={() => handleDetailChange('groom_photo', '')}
                            className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                            title="Remove Groom Photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bride Details */}
                  <div className="space-y-3 p-3 rounded-lg bg-[#161622]/50 border border-[#26263b]">
                    <span className="font-semibold text-[#d4af37] text-xs block">Bride</span>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Bride Name</label>
                      <input
                        type="text"
                        value={invitation.bride_name || ''}
                        onChange={(e) => handleDetailChange('bride_name', e.target.value)}
                        placeholder="Enter Bride Name"
                        className="w-full bg-[#0d0d11] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Bride Bio</label>
                      <textarea
                        rows={2}
                        value={invitation.bride_bio || ''}
                        onChange={(e) => handleDetailChange('bride_bio', e.target.value)}
                        placeholder="Introduce the Bride..."
                        className="w-full bg-[#0d0d11] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] resize-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Bride Photo</label>
                      <div className="flex items-center gap-3">
                        {invitation.bride_photo ? (
                          <div className="relative w-11 h-11 rounded-full border-2 border-[#d4af37] overflow-hidden bg-black shrink-0">
                            <img src={invitation.bride_photo} alt="Bride" className="w-full h-full object-cover" />
                          </div>
                        ) : null}
                        
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, 'bride_photo')}
                          className="hidden"
                          id="bride-photo-upload"
                          disabled={uploadingBride}
                        />
                        <label
                          htmlFor="bride-photo-upload"
                          className="px-3 py-1.5 bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          {uploadingBride ? (
                            <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#d4af37] rounded-full animate-spin" />
                          ) : null}
                          <span>{invitation.bride_photo ? 'Change Photo' : 'Upload Photo'}</span>
                        </label>

                        {invitation.bride_photo && (
                          <button
                            type="button"
                            onClick={() => handleDetailChange('bride_photo', '')}
                            className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                            title="Remove Bride Photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Family & Welcome Message */}
            <div className="bg-[#0d0d11] rounded-xl border border-[#26263b] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('family')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161622]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-white text-xs font-cinzel">Family & Welcome Message</span>
                </div>
                {openAccordions.family ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {openAccordions.family && (
                <div className="p-4 border-t border-[#26263b] space-y-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Parents / Host Names</label>
                    <input
                      type="text"
                      value={invitation.parents_names || ''}
                      onChange={(e) => handleDetailChange('parents_names', e.target.value)}
                      placeholder="e.g. Mr. & Mrs. Siddiqui & Mr. & Mrs. Khan"
                      className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Invitation Welcome Message</label>
                    <textarea
                      rows={3}
                      value={invitation.invitation_message || ''}
                      onChange={(e) => handleDetailChange('invitation_message', e.target.value)}
                      placeholder="With hearts full of love, we cordially invite you..."
                      className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] resize-none text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: Photo Gallery */}
            <div className="bg-[#0d0d11] rounded-xl border border-[#26263b] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('gallery')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161622]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-white text-xs font-cinzel">Wedding Gallery ({(invitation.gallery_photos || []).length} Photos)</span>
                </div>
                {openAccordions.gallery ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {openAccordions.gallery && (
                <div className="p-4 border-t border-[#26263b] space-y-3">
                  {(invitation.gallery_photos || []).length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {(invitation.gallery_photos || []).map((imgUrl, idx) => (
                        <div key={idx} className="relative group rounded-lg border border-[#26263b] overflow-hidden aspect-square bg-slate-900 shadow-md">
                          <img src={imgUrl} className="w-full h-full object-cover" alt="Gallery item" />
                          <button
                            onClick={() => deleteGalleryPhoto(idx)}
                            className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryPhotoUpload}
                    className="hidden"
                    id="gallery-photo-upload"
                    disabled={uploadingGallery}
                  />
                  <label
                    htmlFor="gallery-photo-upload"
                    className="w-full py-2.5 bg-[#26263b] hover:bg-[#34344d] rounded-lg text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 border border-dashed border-[#d4af37]/40"
                  >
                    {uploadingGallery ? (
                      <div className="w-4 h-4 border-2 border-t-transparent border-[#d4af37] rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[#d4af37]" />
                        <span>Add Gallery Photo</span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DESIGN TAB */}
        {activeTab === 'design' && (
          <div className="space-y-3">
            {/* Accordion: Visual Theme Presets */}
            <div className="bg-[#0d0d11] rounded-xl border border-[#26263b] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('presets')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161622]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-white text-xs font-cinzel">Theme Presets & Styles</span>
                </div>
                {openAccordions.presets ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {openAccordions.presets && (
                <div className="p-4 border-t border-[#26263b] space-y-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    {TEMPLATE_PRESETS.map((p) => {
                      const isSelected = styling.primary_color === p.styling.primary_color && styling.secondary_color === p.styling.secondary_color;
                      return (
                        <button
                          key={p.slug}
                          onClick={() => applyPreset(p.slug)}
                          className={`p-2.5 text-left rounded-xl bg-[#161622] border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected 
                              ? 'border-[#d4af37] ring-1 ring-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.2)]' 
                              : 'border-[#26263b] hover:border-gray-500'
                          }`}
                        >
                          <div>
                            <span className="font-bold block text-white text-xs truncate">{p.name}</span>
                            <span className="text-[10px] text-gray-400 capitalize">{p.styling.font_heading}</span>
                          </div>
                          
                          {/* Mini Color Swatch Strip */}
                          <div className="flex h-2.5 w-full rounded-full overflow-hidden border border-black/50">
                            <div className="flex-1" style={{ backgroundColor: p.styling.background_color }} />
                            <div className="flex-1" style={{ backgroundColor: p.styling.primary_color }} />
                            <div className="flex-1" style={{ backgroundColor: p.styling.secondary_color }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Accordion: Cover Page & Wax Seal */}
            <div className="bg-[#0d0d11] rounded-xl border border-[#26263b] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('cover')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161622]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-white text-xs font-cinzel">Envelope Cover & Wax Seal</span>
                </div>
                {openAccordions.cover ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {openAccordions.cover && (
                <div className="p-4 border-t border-[#26263b] space-y-3 text-xs">
                  {/* Cover Heading Dropdown */}
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px] font-semibold">Cover Heading</label>
                    <select
                      value={COVER_HEADING_PRESETS.some(p => p.value === (styling.cover_title || '')) ? (styling.cover_title || '') : '__custom__'}
                      onChange={(e) => {
                        if (e.target.value !== '__custom__') {
                          handleStylingChange('cover_title', e.target.value);
                        } else if (COVER_HEADING_PRESETS.some(p => p.value === (styling.cover_title || ''))) {
                          handleStylingChange('cover_title', '');
                        }
                      }}
                      className="w-full p-2 rounded bg-[#161622] border border-[#26263b] text-white focus:border-[#d4af37] outline-none text-xs"
                    >
                      <option value="">Select Heading...</option>
                      {COVER_HEADING_PRESETS.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>

                    {(!COVER_HEADING_PRESETS.some(p => p.value === (styling.cover_title || '')) || (styling.cover_title && !COVER_HEADING_PRESETS.filter(p => p.value !== '__custom__').map(p => p.value).includes(styling.cover_title))) && (
                      <input
                        type="text"
                        value={styling.cover_title || ''}
                        onChange={(e) => handleStylingChange('cover_title', e.target.value)}
                        placeholder="Type custom cover heading..."
                        className="w-full mt-2 p-2 rounded bg-[#161622] border border-[#26263b] text-white focus:border-[#d4af37] outline-none text-xs"
                      />
                    )}
                  </div>

                  {/* Cover Subtitle Dropdown */}
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px] font-semibold">Cover Subtitle</label>
                    <select
                      value={COVER_SUBTITLE_PRESETS.some(p => p.value === (styling.cover_subtitle || '')) ? (styling.cover_subtitle || '') : '__custom__'}
                      onChange={(e) => {
                        if (e.target.value !== '__custom__') {
                          handleStylingChange('cover_subtitle', e.target.value);
                        } else if (COVER_SUBTITLE_PRESETS.some(p => p.value === (styling.cover_subtitle || ''))) {
                          handleStylingChange('cover_subtitle', '');
                        }
                      }}
                      className="w-full p-2 rounded bg-[#161622] border border-[#26263b] text-white focus:border-[#d4af37] outline-none text-xs"
                    >
                      <option value="">Select Subtitle...</option>
                      {COVER_SUBTITLE_PRESETS.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>

                    {(!COVER_SUBTITLE_PRESETS.some(p => p.value === (styling.cover_subtitle || '')) || (styling.cover_subtitle && !COVER_SUBTITLE_PRESETS.filter(p => p.value !== '__custom__').map(p => p.value).includes(styling.cover_subtitle))) && (
                      <input
                        type="text"
                        value={styling.cover_subtitle || ''}
                        onChange={(e) => handleStylingChange('cover_subtitle', e.target.value)}
                        placeholder="Type custom cover subtitle..."
                        className="w-full mt-2 p-2 rounded bg-[#161622] border border-[#26263b] text-white focus:border-[#d4af37] outline-none text-xs"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">Wax Seal Stamp Text</label>
                    <select
                      value={['NIKAH', 'WEDDING', 'VIVAH', 'SHUBH VIVAH', 'MARRIAGE', '﷽'].includes(styling.wax_seal_text || '') ? (styling.wax_seal_text || '') : '__custom__'}
                      onChange={(e) => {
                        if (e.target.value !== '__custom__') {
                          handleStylingChange('wax_seal_text', e.target.value);
                        }
                      }}
                      className="w-full p-2 rounded bg-[#161622] border border-[#26263b] text-white focus:border-[#d4af37] outline-none"
                    >
                      <option value="">Default (Theme-based)</option>
                      <option value="NIKAH">NIKAH</option>
                      <option value="WEDDING">WEDDING</option>
                      <option value="VIVAH">VIVAH</option>
                      <option value="SHUBH VIVAH">SHUBH VIVAH</option>
                      <option value="MARRIAGE">MARRIAGE</option>
                      <option value="﷽">﷽ (Bismillah)</option>
                      <option value="__custom__">Custom Text...</option>
                    </select>
                  </div>

                  {!['NIKAH', 'WEDDING', 'VIVAH', 'SHUBH VIVAH', 'MARRIAGE', '﷽', ''].includes(styling.wax_seal_text || '') && (
                    <input
                      type="text"
                      value={styling.wax_seal_text || ''}
                      onChange={(e) => handleStylingChange('wax_seal_text', e.target.value)}
                      placeholder="Enter custom seal text"
                      maxLength={12}
                      className="w-full mt-2 p-2 rounded bg-[#161622] border border-[#26263b] text-white focus:border-[#d4af37] outline-none"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Accordion: Color Palette & Curated Bundles */}
            <div className="bg-[#0d0d11] rounded-xl border border-[#26263b] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('colors')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161622]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-white text-xs font-cinzel">Color Palette & Bundles</span>
                </div>
                {openAccordions.colors ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {openAccordions.colors && (
                <div className="p-4 border-t border-[#26263b] space-y-4">
                  {/* Curated 1-Click Bundles */}
                  <div>
                    <label className="block text-[11px] text-gray-400 font-semibold mb-2">1-Click Curated Color Bundles</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CURATED_PALETTES.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => applyColorPalette(p)}
                          className="p-2 rounded-lg bg-[#161622] border border-[#26263b] hover:border-[#d4af37] text-left transition-all"
                        >
                          <span className="text-[10px] font-bold text-white truncate block">{p.name}</span>
                          <div className="flex h-2 w-full rounded-full overflow-hidden mt-1.5 border border-black/40">
                            <div className="flex-1" style={{ backgroundColor: p.background }} />
                            <div className="flex-1" style={{ backgroundColor: p.primary }} />
                            <div className="flex-1" style={{ backgroundColor: p.secondary }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Pickers */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[#26263b]">
                    <div>
                      <label className="block text-gray-400 mb-1 text-[11px]">Primary Color</label>
                      <div className="flex gap-2 items-center bg-[#161622] p-1.5 rounded border border-[#26263b]">
                        <input
                          type="color"
                          value={styling.primary_color}
                          onChange={(e) => handleStylingChange('primary_color', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                        />
                        <span className="font-mono text-[10px]">{styling.primary_color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 text-[11px]">Secondary Color</label>
                      <div className="flex gap-2 items-center bg-[#161622] p-1.5 rounded border border-[#26263b]">
                        <input
                          type="color"
                          value={styling.secondary_color}
                          onChange={(e) => handleStylingChange('secondary_color', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                        />
                        <span className="font-mono text-[10px]">{styling.secondary_color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 text-[11px]">Background</label>
                      <div className="flex gap-2 items-center bg-[#161622] p-1.5 rounded border border-[#26263b]">
                        <input
                          type="color"
                          value={styling.background_color}
                          onChange={(e) => handleStylingChange('background_color', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                        />
                        <span className="font-mono text-[10px]">{styling.background_color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 text-[11px]">Text Color</label>
                      <div className="flex gap-2 items-center bg-[#161622] p-1.5 rounded border border-[#26263b]">
                        <input
                          type="color"
                          value={styling.text_color}
                          onChange={(e) => handleStylingChange('text_color', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                        />
                        <span className="font-mono text-[10px]">{styling.text_color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion: Typography with Typeface Previews */}
            <div className="bg-[#0d0d11] rounded-xl border border-[#26263b] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('typography')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161622]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-white text-xs font-cinzel">Typography & Fonts</span>
                </div>
                {openAccordions.typography ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {openAccordions.typography && (
                <div className="p-4 border-t border-[#26263b] space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Heading Font Style</label>
                    <select
                      value={styling.font_heading}
                      onChange={(e) => handleStylingChange('font_heading', e.target.value)}
                      className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] text-xs font-cinzel"
                    >
                      {FONT_PRESETS.map((f) => (
                        <option key={f.value} value={f.value}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Body Text Font</label>
                    <select
                      value={styling.font_body}
                      onChange={(e) => handleStylingChange('font_body', e.target.value)}
                      className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] text-xs"
                    >
                      {FONT_PRESETS.map((f) => (
                        <option key={f.value} value={f.value}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion: Background Video / Image Media */}
            <div className="bg-[#0d0d11] rounded-xl border border-[#26263b] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('background')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161622]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-white text-xs font-cinzel">Background Effects & Media</span>
                </div>
                {openAccordions.background ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {openAccordions.background && (
                <div className="p-4 border-t border-[#26263b] space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {(['gradient', 'image', 'video'] as const).map((bgType) => (
                      <button
                        key={bgType}
                        onClick={() => handleStylingChange('background_type', bgType)}
                        className={`py-1.5 rounded font-semibold capitalize border transition-all ${
                          styling.background_type === bgType 
                            ? 'border-[#d4af37] bg-[#d4af37] text-[#0d0d11]' 
                            : 'border-[#26263b] text-gray-400 hover:text-white'
                        }`}
                      >
                        {bgType}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Background Media URL</label>
                    <input
                      type="text"
                      value={styling.background_url || ''}
                      onChange={(e) => handleStylingChange('background_url', e.target.value)}
                      placeholder={styling.background_type === 'gradient' ? 'linear-gradient(...)' : 'https://...'}
                      className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[#d4af37] font-mono mb-2"
                    />
                    {(styling.background_type === 'image' || styling.background_type === 'video') && (
                      <button
                        type="button"
                        onClick={() => openMediaModal(styling.background_type === 'image' ? 'image' : 'video')}
                        className="w-full py-1.5 bg-[#26263b] hover:bg-[#34344d] border border-[#d4af37]/35 rounded text-xs text-[#d4af37] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {styling.background_type === 'image' ? <Image className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                        <span>Choose {styling.background_type === 'image' ? 'Image' : 'Video'} from Media Library</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Accordion: Background Music with Inline Audio Player */}
            <div className="bg-[#0d0d11] rounded-xl border border-[#26263b] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('music')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161622]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-white text-xs font-cinzel">Background Song & Music</span>
                </div>
                {openAccordions.music ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {openAccordions.music && (
                <div className="p-4 border-t border-[#26263b] space-y-3">
                  <div className="space-y-2">
                    <label className="block text-[11px] text-gray-400 font-semibold">Select Wedding Song Track</label>
                    <div className="flex gap-2 items-center">
                      <select
                        value={styling.music_url}
                        onChange={(e) => handleStylingChange('music_url', e.target.value)}
                        className="flex-grow bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-xs text-white outline-none focus:border-[#d4af37]"
                      >
                        <option value="">No Music (Muted)</option>
                        {MUSIC_PRESETS.map((m) => (
                          <option key={m.url} value={m.url}>{m.name}</option>
                        ))}
                      </select>

                      {styling.music_url && (
                        <button
                          type="button"
                          onClick={() => toggleInlineAudio(styling.music_url)}
                          className="px-3 py-2 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] rounded font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Listen Preview"
                        >
                          {playingTrackUrl === styling.music_url ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{playingTrackUrl === styling.music_url ? 'Pause' : 'Play'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Choose from Music Library */}
                  <button
                    type="button"
                    onClick={() => openMediaModal('music')}
                    className="w-full py-2 bg-[#1b1b28] hover:bg-[#252538] border border-[#d4af37]/40 rounded text-xs text-[#d4af37] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Music className="w-4 h-4 text-[#d4af37]" />
                    <span>Choose from Uploaded Music Library</span>
                  </button>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Or Paste Custom MP3 Music Link</label>
                    <input
                      type="text"
                      value={styling.music_url || ''}
                      onChange={(e) => handleStylingChange('music_url', e.target.value)}
                      placeholder="https://example.com/audio.mp3 or /music/song.mp3"
                      className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[#d4af37] font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Accordion: Section Ordering */}
            <div className="bg-[#0d0d11] rounded-xl border border-[#26263b] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('order')}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161622]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-white text-xs font-cinzel">Section Ordering & Layout</span>
                </div>
                {openAccordions.order ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {openAccordions.order && (
                <div className="p-4 border-t border-[#26263b] space-y-1.5">
                  {styling.section_order.map((sec, idx) => (
                    <div key={sec} className="flex items-center justify-between bg-[#161622] border border-[#26263b] rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-gray-500 font-mono text-[10px]">{idx + 1}.</span>
                        <span className="capitalize font-semibold text-white">{sec}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-[#0d0d11] hover:bg-[#26263b] disabled:opacity-30"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === styling.section_order.length - 1}
                          className="p-1 rounded bg-[#0d0d11] hover:bg-[#26263b] disabled:opacity-30"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-[#0d0d11] p-3 rounded-xl border border-[#26263b]">
              <div>
                <h3 className="font-bold text-white text-xs font-cinzel">Wedding Schedule & Venues</h3>
                <p className="text-[10px] text-gray-400">Add wedding ceremonies, receptions, and Google Maps directions.</p>
              </div>
              <button
                onClick={addEvent}
                className="px-3 py-1.5 rounded bg-[#d4af37] text-[#0d0d11] hover:bg-[#b8962e] transition-all flex items-center gap-1 text-xs font-bold shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-[#0d0d11] rounded-xl border border-[#26263b] text-xs">
                No events added yet. Click &quot;Add Event&quot; above to setup your wedding schedule.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, idx) => (
                  <div key={idx} className="bg-[#0d0d11] p-4 rounded-xl border border-[#26263b] space-y-2.5 relative">
                    <div className="flex justify-between items-center border-b border-[#26263b] pb-1.5">
                      <span className="font-semibold text-[#d4af37] text-xs">Event #{idx + 1}</span>
                      <button
                        onClick={() => deleteEvent(idx)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Event Name</label>
                      <input
                        type="text"
                        value={event.event_name}
                        onChange={(e) => updateEvent(idx, 'event_name', e.target.value)}
                        placeholder="e.g. Wedding Ceremony (Nikah / Vivah)"
                        className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37] text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Date</label>
                        <input
                          type="date"
                          value={event.event_date}
                          onChange={(e) => updateEvent(idx, 'event_date', e.target.value)}
                          className="w-full bg-[#161622] border border-[#26263b] rounded px-2.5 py-1.5 text-white outline-none focus:border-[#d4af37] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Time</label>
                        <input
                          type="time"
                          value={event.event_time}
                          onChange={(e) => updateEvent(idx, 'event_time', e.target.value)}
                          className="w-full bg-[#161622] border border-[#26263b] rounded px-2.5 py-1.5 text-white outline-none focus:border-[#d4af37] text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Venue Name</label>
                      <input
                        type="text"
                        value={event.venue_name}
                        onChange={(e) => updateEvent(idx, 'venue_name', e.target.value)}
                        placeholder="e.g. The Palace Banquet Hall"
                        className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Venue Address</label>
                      <input
                        type="text"
                        value={event.venue_address}
                        onChange={(e) => updateEvent(idx, 'venue_address', e.target.value)}
                        placeholder="Full Street Address"
                        className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Google Maps Direction Link</label>
                      <input
                        type="text"
                        value={event.google_maps_link}
                        onChange={(e) => updateEvent(idx, 'google_maps_link', e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37] text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GIFTS TAB */}
        {activeTab === 'gifts' && (
          <div className="space-y-3">
            <div className="bg-[#0d0d11] p-4 rounded-xl border border-[#26263b] space-y-3">
              <div className="flex items-center gap-2 border-b border-[#26263b] pb-2">
                <Gift className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-bold text-white text-xs font-cinzel">Direct Digital Shagun & UPI Registry</h3>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Your UPI ID (100% Direct to Your Bank, 0% Fee)</label>
                <input
                  type="text"
                  value={giftDetails.upi_id}
                  onChange={(e) => handleGiftChange('upi_id', e.target.value)}
                  placeholder="e.g. couple@okaxis / 9876543210@paytm"
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Receiver Account Name</label>
                <input
                  type="text"
                  value={giftDetails.receiver_name}
                  onChange={(e) => handleGiftChange('receiver_name', e.target.value)}
                  placeholder="e.g. John & Lilly"
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Thank You Note</label>
                <textarea
                  rows={3}
                  value={giftDetails.thank_you_message}
                  onChange={(e) => handleGiftChange('thank_you_message', e.target.value)}
                  placeholder="Your blessings and presence are our greatest gift..."
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] resize-none text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-[460px] bg-[#161622] border border-[#d4af37]/30 rounded-[20px] p-6 space-y-5 shadow-[0_4px_30px_rgba(212,175,55,0.15)] relative max-h-[80vh] flex flex-col">
            <button
              onClick={closeMediaModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold cursor-pointer"
            >
              &times;
            </button>
            <div className="text-center space-y-1">
              <span className="text-lg font-light text-white font-cinzel tracking-wider capitalize flex items-center justify-center gap-1.5">
                {modalMediaType === 'image' && <Image className="w-5 h-5 text-[#d4af37]" />}
                {modalMediaType === 'video' && <Film className="w-5 h-5 text-[#d4af37]" />}
                {modalMediaType === 'music' && <Music className="w-5 h-5 text-[#d4af37]" />}
                <span>Select {modalMediaType} Asset</span>
              </span>
              <p className="text-[10px] text-gray-400">Choose from the database media library to apply to your invitation background.</p>
            </div>

            <div className="flex-grow overflow-y-auto pr-1">
              {loadingAssets ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-t-transparent border-[#d4af37] rounded-full animate-spin" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">Fetching library...</span>
                </div>
              ) : libraryAssets.length === 0 ? (
                <div className="py-20 text-center text-gray-500 italic text-xs">
                  No {modalMediaType} assets registered in the database library yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {libraryAssets.map((asset) => (
                    <div 
                      key={asset.id}
                      className="bg-[#0d0d11] border border-[#26263b] rounded-lg p-3 flex flex-col justify-between gap-3 hover:border-[#d4af37] transition-all cursor-pointer group"
                    >
                      <div className="relative aspect-video rounded overflow-hidden bg-slate-900 flex items-center justify-center border border-[#26263b]">
                        {asset.media_type === 'image' && (
                          <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover" />
                        )}
                        {asset.media_type === 'video' && (
                          <div className="w-full h-full relative">
                            <video src={asset.url} muted className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                              <Film className="w-5 h-5 text-purple-400" />
                            </div>
                          </div>
                        )}
                        {asset.media_type === 'music' && (
                          <div className="flex flex-col items-center justify-center p-2 text-center space-y-2 w-full">
                            <Music className="w-6 h-6 text-green-400 animate-pulse" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAudioPreview(asset.id, asset.url);
                              }}
                              className="px-2 py-0.5 bg-[#26263b] hover:bg-[#34344d] rounded text-[9px] font-bold text-white transition-all uppercase"
                            >
                              {playingAudioId === asset.id ? 'Stop' : 'Listen'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span className="font-semibold text-white truncate text-[11px]" title={asset.filename}>
                          {asset.filename}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectAsset(asset.url)}
                          className="mt-2 w-full py-1 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold text-[10px] rounded transition-all tracking-wider uppercase"
                        >
                          Select Asset
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
