'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { 
  Heart, Settings, Calendar, 
  ChevronUp, ChevronDown, Plus, Trash2, Gift, Save, Lock
} from 'lucide-react';
import { Invitation, StylingPreferences, WeddingEvent, GiftCollectionDetails } from '@/types';
import { TEMPLATE_PRESETS, MUSIC_PRESETS, FONT_PRESETS } from '@/utils/presets';
import CheckoutButton from '@/components/CheckoutButton';
import { supabase } from '@/utils/supabase';

interface SidebarProps {
  invitation: Partial<Invitation>;
  onUpdate: (updated: Partial<Invitation>) => void;
  onSave: () => void;
  isSaving: boolean;
  hasPaid?: boolean;
  onPaymentSuccess?: () => void;
}

export default function Sidebar({ 
  invitation, 
  onUpdate, 
  onSave, 
  isSaving,
  hasPaid = false,
  onPaymentSuccess
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'design' | 'events' | 'gifts'>('details');
  const [uploadingGroom, setUploadingGroom] = useState(false);
  const [uploadingBride, setUploadingBride] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

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

  const styling = invitation.styling || {
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
  };

  const giftDetails = invitation.gift_collection || {
    upi_id: '',
    receiver_name: '',
    thank_you_message: 'Thank you for your warm blessings and digital gifts!',
  };

  const events = invitation.events || [];

  // Handlers for Details
  const handleDetailChange = (field: keyof Invitation, value: any) => {
    onUpdate({ [field]: value });
  };

  // Handlers for Styling
  const handleStylingChange = (field: keyof StylingPreferences, value: any) => {
    onUpdate({
      styling: {
        ...styling,
        [field]: value,
      } as StylingPreferences,
    });
  };

  // Handler to apply Template Preset
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

  // Handlers for Section Order (Up/Down)
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

  // Handlers for Events
  const addEvent = () => {
    const newEvent: WeddingEvent = {
      event_name: 'New Event Name',
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

  // Handlers for Gifts
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
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#26263b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
            <span className="font-semibold text-white tracking-wider font-cinzel">InviteMagic Editor</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 animate-pulse" />
            <span>Locked</span>
          </div>
        </div>

        {/* Paywall Screen */}
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
            {/* Basic Tier Card */}
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

            {/* Premium Tier Card */}
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

            {/* VIP Tier Card */}
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
    <div className="w-full md:w-96 bg-[#161622] border-r border-[#26263b] h-full flex flex-col overflow-hidden text-sm">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#26263b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
          <span className="font-semibold text-white tracking-wider font-cinzel">InviteMagic Editor</span>
        </div>
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
          <span>Save Changes</span>
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-[#0f0f18] border-b border-[#26263b] text-xs">
        {(['details', 'design', 'events', 'gifts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center font-semibold border-b-2 capitalize transition-all ${
              activeTab === tab 
                ? 'border-[#d4af37] text-[#d4af37]' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'details' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white border-b border-[#26263b] pb-1.5 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-[#d4af37]" />
              <span>Couple Information</span>
            </h3>

            {/* Groom Details */}
            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <span className="font-semibold text-[#d4af37] block">Groom</span>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Groom Name</label>
                <input
                  type="text"
                  value={invitation.groom_name || ''}
                  onChange={(e) => handleDetailChange('groom_name', e.target.value)}
                  placeholder="Enter Groom Name"
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bio</label>
                <textarea
                  rows={2}
                  value={invitation.groom_bio || ''}
                  onChange={(e) => handleDetailChange('groom_bio', e.target.value)}
                  placeholder="Introduce the Groom..."
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Groom Photo</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'groom_photo')}
                    className="hidden"
                    id="groom-photo-upload"
                  />
                  <label
                    htmlFor="groom-photo-upload"
                    className="px-3 py-1.5 bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <span>Choose Photo</span>
                  </label>
                  {uploadingGroom ? (
                    <div className="w-4 h-4 border-2 border-t-transparent border-[#d4af37] rounded-full animate-spin" />
                  ) : invitation.groom_photo ? (
                    <span className="text-[10px] text-green-400 truncate max-w-[150px]">Photo Uploaded</span>
                  ) : (
                    <span className="text-[10px] text-gray-500">No photo selected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bride Details */}
            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <span className="font-semibold text-[#d4af37] block">Bride</span>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bride Name</label>
                <input
                  type="text"
                  value={invitation.bride_name || ''}
                  onChange={(e) => handleDetailChange('bride_name', e.target.value)}
                  placeholder="Enter Bride Name"
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bio</label>
                <textarea
                  rows={2}
                  value={invitation.bride_bio || ''}
                  onChange={(e) => handleDetailChange('bride_bio', e.target.value)}
                  placeholder="Introduce the Bride..."
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bride Photo</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'bride_photo')}
                    className="hidden"
                    id="bride-photo-upload"
                  />
                  <label
                    htmlFor="bride-photo-upload"
                    className="px-3 py-1.5 bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <span>Choose Photo</span>
                  </label>
                  {uploadingBride ? (
                    <div className="w-4 h-4 border-2 border-t-transparent border-[#d4af37] rounded-full animate-spin" />
                  ) : invitation.bride_photo ? (
                    <span className="text-[10px] text-green-400 truncate max-w-[150px]">Photo Uploaded</span>
                  ) : (
                    <span className="text-[10px] text-gray-500">No photo selected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Family & Invitation Msg */}
            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <span className="font-semibold text-[#d4af37] block">Invitation & Family</span>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Parents Names</label>
                <input
                  type="text"
                  value={invitation.parents_names || ''}
                  onChange={(e) => handleDetailChange('parents_names', e.target.value)}
                  placeholder="e.g. Mr. & Mrs. Siddiqui"
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Invitation Message</label>
                <textarea
                  rows={3}
                  value={invitation.invitation_message || ''}
                  onChange={(e) => handleDetailChange('invitation_message', e.target.value)}
                  placeholder="Write the invitation welcome card message..."
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37] resize-none"
                />
              </div>
            </div>

            {/* Gallery Photos Uploader */}
            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <span className="font-semibold text-[#d4af37] block flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#d4af37]" />
                <span>Gallery Photos</span>
              </span>
              <p className="text-[10px] text-gray-400 leading-normal">Upload beautiful wedding event photos to display in the invitation gallery.</p>
              
              {/* Grid of existing gallery photos */}
              {(invitation.gallery_photos || []).length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(invitation.gallery_photos || []).map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded border border-[#26263b] overflow-hidden aspect-square bg-slate-900">
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

              {/* Upload New Image Button */}
              <div className="pt-1">
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
                  className="w-full py-2 bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 border border-dashed border-[#d4af37]/30"
                >
                  {uploadingGallery ? (
                    <div className="w-4 h-4 border-2 border-t-transparent border-[#d4af37] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-[#d4af37]" />
                      <span>Add Gallery Image</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white border-b border-[#26263b] pb-1.5 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-[#d4af37]" />
              <span>Theme & Style Settings</span>
            </h3>

            {/* Theme Presets */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Select a Theme Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_PRESETS.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => applyPreset(p.slug)}
                    className="p-2 text-left rounded bg-[#0d0d11] border border-[#26263b] hover:border-[#d4af37] transition-all text-xs"
                  >
                    <span className="font-semibold block text-white">{p.name}</span>
                    <span className="text-[10px] text-gray-400">{p.styling.font_heading} / {p.styling.animation_style}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors Config */}
            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <span className="font-semibold text-[#d4af37] block">Color Palette</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Primary Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={styling.primary_color}
                      onChange={(e) => handleStylingChange('primary_color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                    />
                    <span className="font-mono">{styling.primary_color}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Secondary Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={styling.secondary_color}
                      onChange={(e) => handleStylingChange('secondary_color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                    />
                    <span className="font-mono">{styling.secondary_color}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Background</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={styling.background_color}
                      onChange={(e) => handleStylingChange('background_color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                    />
                    <span className="font-mono">{styling.background_color}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Text Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={styling.text_color}
                      onChange={(e) => handleStylingChange('text_color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                    />
                    <span className="font-mono">{styling.text_color}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <span className="font-semibold text-[#d4af37] block">Typography</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Heading Font</label>
                  <select
                    value={styling.font_heading}
                    onChange={(e) => handleStylingChange('font_heading', e.target.value)}
                    className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37]"
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
                    className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37]"
                  >
                    {FONT_PRESETS.map((f) => (
                      <option key={f.value} value={f.value}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Background Presets */}
            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <span className="font-semibold text-[#d4af37] block">Background Type</span>
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
                <label className="block text-xs text-gray-400 mb-1">Background URL / Color Style</label>
                <input
                  type="text"
                  value={styling.background_url || ''}
                  onChange={(e) => handleStylingChange('background_url', e.target.value)}
                  placeholder={styling.background_type === 'gradient' ? 'linear-gradient(...)' : 'https://example.com/asset.mp4'}
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[#d4af37] font-mono"
                />
              </div>
            </div>

            {/* Layout Order Section */}
            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <span className="font-semibold text-[#d4af37] block">Section Ordering</span>
              <div className="space-y-1">
                {styling.section_order.map((sec, idx) => (
                  <div key={sec} className="flex items-center justify-between bg-[#161622] border border-[#26263b] rounded p-2 text-xs">
                    <span className="capitalize">{sec}</span>
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
            </div>

            {/* Sub-presets widgets */}
            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <span className="font-semibold text-[#d4af37] block">Aesthetic Options</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Animation Style</label>
                  <select
                    value={styling.animation_style}
                    onChange={(e) => handleStylingChange('animation_style', e.target.value)}
                    className="w-full bg-[#161622] border border-[#26263b] rounded p-1.5 text-white outline-none focus:border-[#d4af37]"
                  >
                    {['fade', 'slide', 'zoom', 'parallax', 'confetti'].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Button Style</label>
                  <select
                    value={styling.button_style}
                    onChange={(e) => handleStylingChange('button_style', e.target.value)}
                    className="w-full bg-[#161622] border border-[#26263b] rounded p-1.5 text-white outline-none focus:border-[#d4af37]"
                  >
                    {['gold-border', 'classic-pill', 'modern-flat', 'glowing-shadow'].map(b => (
                      <option key={b} value={b}>{b.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Countdown</label>
                  <select
                    value={styling.countdown_style}
                    onChange={(e) => handleStylingChange('countdown_style', e.target.value)}
                    className="w-full bg-[#161622] border border-[#26263b] rounded p-1.5 text-white outline-none focus:border-[#d4af37]"
                  >
                    {['circles', 'simple-text', 'boxed-numbers'].map(c => (
                      <option key={c} value={c}>{c.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Gallery Layout</label>
                  <select
                    value={styling.gallery_layout}
                    onChange={(e) => handleStylingChange('gallery_layout', e.target.value)}
                    className="w-full bg-[#161622] border border-[#26263b] rounded p-1.5 text-white outline-none focus:border-[#d4af37]"
                  >
                    {['grid', 'carousel', 'masonry'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Music presets */}
            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <span className="font-semibold text-[#d4af37] block">Background Music</span>
              <select
                value={styling.music_url}
                onChange={(e) => handleStylingChange('music_url', e.target.value)}
                className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37]"
              >
                <option value="">No Music</option>
                {MUSIC_PRESETS.map((m) => (
                  <option key={m.url} value={m.url}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#26263b] pb-1.5">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#d4af37]" />
                <span>Wedding Schedule</span>
              </h3>
              <button
                onClick={addEvent}
                className="p-1 rounded bg-[#d4af37] text-[#0d0d11] hover:bg-[#b8962e] transition-all flex items-center gap-0.5 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No events added. Click &quot;Add Event&quot; to setup schedule.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event, idx) => (
                  <div key={idx} className="bg-[#0d0d11] p-3 rounded border border-[#26263b] space-y-2 relative">
                    <button
                      onClick={() => deleteEvent(idx)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-[#d4af37] text-xs">Event #{idx + 1}</span>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Event Name</label>
                      <input
                        type="text"
                        value={event.event_name}
                        onChange={(e) => updateEvent(idx, 'event_name', e.target.value)}
                        className="w-full bg-[#161622] border border-[#26263b] rounded px-2.5 py-1 text-white outline-none focus:border-[#d4af37] text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Date</label>
                        <input
                          type="date"
                          value={event.event_date}
                          onChange={(e) => updateEvent(idx, 'event_date', e.target.value)}
                          className="w-full bg-[#161622] border border-[#26263b] rounded px-2.5 py-1 text-white outline-none focus:border-[#d4af37] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Time</label>
                        <input
                          type="time"
                          value={event.event_time}
                          onChange={(e) => updateEvent(idx, 'event_time', e.target.value)}
                          className="w-full bg-[#161622] border border-[#26263b] rounded px-2.5 py-1 text-white outline-none focus:border-[#d4af37] text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Venue Name</label>
                      <input
                        type="text"
                        value={event.venue_name}
                        onChange={(e) => updateEvent(idx, 'venue_name', e.target.value)}
                        className="w-full bg-[#161622] border border-[#26263b] rounded px-2.5 py-1 text-white outline-none focus:border-[#d4af37] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Address</label>
                      <input
                        type="text"
                        value={event.venue_address}
                        onChange={(e) => updateEvent(idx, 'venue_address', e.target.value)}
                        className="w-full bg-[#161622] border border-[#26263b] rounded px-2.5 py-1 text-white outline-none focus:border-[#d4af37] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Google Maps Link</label>
                      <input
                        type="text"
                        value={event.google_maps_link}
                        onChange={(e) => updateEvent(idx, 'google_maps_link', e.target.value)}
                        className="w-full bg-[#161622] border border-[#26263b] rounded px-2.5 py-1 text-white outline-none focus:border-[#d4af37] text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'gifts' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white border-b border-[#26263b] pb-1.5 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#d4af37]" />
              <span>Digital Gift / Shagun Settings</span>
            </h3>

            <div className="space-y-3 bg-[#0d0d11] p-3 rounded border border-[#26263b]">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Your UPI ID (For Direct Payments)</label>
                <input
                  type="text"
                  value={giftDetails.upi_id}
                  onChange={(e) => handleGiftChange('upi_id', e.target.value)}
                  placeholder="e.g. shadi@okaxis"
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Receiver Name</label>
                <input
                  type="text"
                  value={giftDetails.receiver_name}
                  onChange={(e) => handleGiftChange('receiver_name', e.target.value)}
                  placeholder="Groom/Bride's Legal Bank Name"
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Thank You Message</label>
                <textarea
                  rows={3}
                  value={giftDetails.thank_you_message}
                  onChange={(e) => handleGiftChange('thank_you_message', e.target.value)}
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-1.5 text-white outline-none focus:border-[#d4af37] resize-none text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
