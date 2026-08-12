'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, Sparkles, Image as ImageIcon, Phone, MessageCircle, 
  MapPin, Tag, ShieldCheck, CheckCircle2, 
  AlertCircle, ArrowLeft, Plus, Trash2, Eye, Star, Share2, Copy, Check 
} from 'lucide-react';
import { VendorProfile, VendorCategory } from '@/types';
import { submitVendorProfile, getVendorByUserId } from '@/app/vendor-actions';
import { supabase } from '@/utils/supabase';


const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);


const categoryOptions: { id: VendorCategory; label: string }[] = [
  { id: 'mehendi', label: 'Mehendi Artist' },
  { id: 'makeup', label: 'Makeup & Hair Styling' },
  { id: 'photography', label: 'Wedding Photography & Films' },
  { id: 'decor', label: 'Floral & Venue Decorator' },
  { id: 'catering', label: 'Catering & Food Service' },
  { id: 'dj_music', label: 'DJ & Music Band' },
  { id: 'planner', label: 'Wedding Planner' },
  { id: 'venue', label: 'Banquet & Venue' },
];

export default function VendorPortalPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<Partial<VendorProfile>>({
    business_name: '',
    category: 'mehendi',
    tagline: '',
    description: '',
    location: '',
    dp_url: '',
    portfolio_photos: [],
    whatsapp_number: '',
    phone_number: '',
    instagram_handle: '',
    starting_price: '',
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'warning' | 'error'; message: string; pending?: boolean } | null>(null);
  const [existingVendor, setExistingVendor] = useState<VendorProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const getProfileUrl = () => {
    if (typeof window !== 'undefined' && existingVendor?.id) {
      return `${window.location.origin}/vendors/profile/${existingVendor.id}`;
    }
    return '';
  };

  const handleCopyProfileUrl = () => {
    const url = getProfileUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  useEffect(() => {
    async function loadVendorInfo() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUserId(session.user.id);
        const existing = await getVendorByUserId(session.user.id);
        if (existing) {
          setExistingVendor(existing);
          setFormData(existing);
          if (!existing.is_approved) {
            setStatusNotice({
              type: 'warning',
              pending: true,
              message: '⏳ Status: Pending Admin Verification. Your profile is saved, and will become visible on the public directory once verified by admin.',
            });
          } else {
            setStatusNotice({
              type: 'success',
              pending: false,
              message: '✅ Status: Approved & Live! Your profile is active on the public directory.',
            });
          }
        }
      }
      setLoading(false);
    }
    loadVendorInfo();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPortfolioPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      portfolio_photos: [...(prev.portfolio_photos || []), newPhotoUrl.trim()],
    }));
    setNewPhotoUrl('');
  };

  const handleRemovePortfolioPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio_photos: (prev.portfolio_photos || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusNotice(null);

    try {
      const res = await submitVendorProfile({
        ...formData,
        user_id: userId,
      });

      if (res.success) {
        if (res.vendor) {
          setExistingVendor(res.vendor);
          setFormData(res.vendor);
        }
        if (res.pendingApproval) {
          setStatusNotice({
            type: 'warning',
            pending: true,
            message: '🎉 Profile Saved! Status: Pending Approval. Your profile will show on the public directory as soon as the admin approves it.',
          });
        } else {
          setStatusNotice({
            type: 'success',
            pending: false,
            message: '✅ Profile updated successfully! Your profile is live.',
          });
        }
      } else {
        setStatusNotice({
          type: 'error',
          pending: false,
          message: res.message || 'Failed to submit profile.',
        });
      }
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        pending: false,
        message: err.message || 'Server error submitting profile.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d11] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 font-semibold tracking-wider font-cinzel text-xs animate-pulse">Loading Vendor Portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-10 w-[400px] h-[400px] bg-[#d4af37]/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#10b981]/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="border-b border-[#26263b] bg-[#161622]/50 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
          <span className="text-lg font-bold tracking-wider font-cinzel text-[#d4af37]">InviteMagic</span>
        </Link>
        <Link 
          href="/vendors" 
          className="text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 hover:text-[#d4af37] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View Public Directory</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-12 space-y-8 z-10">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#26263b] pb-6">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>100% Free Service Provider Listing</span>
            </span>
            <h1 className="text-2xl md:text-4xl font-light text-white font-cinzel">
              Service Provider Registration & Portal
            </h1>
            <p className="text-xs text-gray-400 mt-1">Register your Mehendi, Makeup, Photography, or Decor business to connect with wedding couples.</p>
          </div>
          <Link
            href="/vendors"
            target="_blank"
            className="px-4 py-2 rounded bg-[#161622] hover:bg-[#26263b] border border-[#26263b] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-4 h-4 text-[#d4af37]" />
            <span>Open Public Directory</span>
          </Link>
        </div>

        {/* Status Notice Alert Banner */}
        {statusNotice && (
          <div className={`p-4 rounded-xl text-xs border leading-relaxed flex items-start gap-3 shadow-lg ${
            statusNotice.type === 'warning'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              : statusNotice.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {statusNotice.pending ? (
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5 animate-pulse" />
            ) : statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block text-sm mb-0.5">
                {statusNotice.pending ? 'Profile Verification Pending' : statusNotice.type === 'success' ? 'Profile Verified & Live' : 'Notice'}
              </span>
              <span>{statusNotice.message}</span>
            </div>
          </div>
        )}

        {/* Direct Share Profile Link Banner */}
        {existingVendor?.id && (
          <div className="bg-[#161622] border border-[#d4af37]/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-xs text-gray-300">
              <Share2 className="w-4 h-4 text-[#d4af37] shrink-0" />
              <div>
                <span className="font-bold text-white block text-xs">Your Direct Shareable Profile Link:</span>
                <span className="font-mono text-[#d4af37] font-semibold text-xs truncate max-w-[280px] sm:max-w-md block">
                  {getProfileUrl()}
                </span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyProfileUrl}
                className="px-4 py-2 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Direct Link'}</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my vendor profile on InviteMagic: ${getProfileUrl()}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share WA</span>
              </a>
            </div>
          </div>
        )}

        {/* Form and Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Column */}
          <div className="lg:col-span-7 bg-[#161622]/40 border border-[#26263b] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white font-cinzel border-b border-[#26263b] pb-3">
              {existingVendor ? 'Edit Business Profile' : 'Register New Vendor Profile'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Business Name */}
              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Business Name / Artist Title *</label>
                <input
                  type="text"
                  name="business_name"
                  required
                  value={formData.business_name || ''}
                  onChange={handleChange}
                  placeholder="e.g. Zara Bridal Mehendi Studio"
                  className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] transition-all"
                />
              </div>

              {/* Service Category & Starting Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Service Category *</label>
                  <select
                    name="category"
                    required
                    value={formData.category || 'mehendi'}
                    onChange={handleChange}
                    className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] transition-all appearance-none cursor-pointer"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#161622]">{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Starting Package Price</label>
                  <input
                    type="text"
                    name="starting_price"
                    value={formData.starting_price || ''}
                    onChange={handleChange}
                    placeholder="e.g. ₹5,000"
                    className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] transition-all"
                  />
                </div>
              </div>

              {/* Location & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">City / Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru, Karnataka"
                    className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Short Tagline</label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline || ''}
                    onChange={handleChange}
                    placeholder="e.g. Organic henna & Rajasthani designs"
                    className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] transition-all"
                  />
                </div>
              </div>

              {/* Contact Information (WhatsApp, Call, Instagram) */}
              <div className="p-4 bg-[#0d0d11] rounded-xl border border-[#26263b] space-y-3">
                <h3 className="font-bold text-[#d4af37] uppercase tracking-wider text-[11px] font-cinzel">Direct Contact Buttons Configuration</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 text-[10px] uppercase">WhatsApp Number</label>
                    <input
                      type="text"
                      name="whatsapp_number"
                      value={formData.whatsapp_number || ''}
                      onChange={handleChange}
                      placeholder="e.g. 919876543210"
                      className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 text-[10px] uppercase">Phone Number</label>
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number || ''}
                      onChange={handleChange}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 text-[10px] uppercase">Instagram Handle</label>
                    <input
                      type="text"
                      name="instagram_handle"
                      value={formData.instagram_handle || ''}
                      onChange={handleChange}
                      placeholder="e.g. studio_official"
                      className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* DP Picture URL */}
              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Profile Picture (DP URL)</label>
                <input
                  type="text"
                  name="dp_url"
                  value={formData.dp_url || ''}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] font-mono"
                />
              </div>

              {/* Portfolio Photos */}
              <div className="space-y-2">
                <label className="block text-gray-400 font-semibold uppercase tracking-wider">Portfolio Work Photos (URLs)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Paste image URL of your work sample..."
                    className="flex-grow bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2 text-white outline-none focus:border-[#d4af37] font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddPortfolioPhoto}
                    className="px-4 py-2 bg-[#26263b] hover:bg-[#34344d] text-white font-bold rounded-lg transition-all shrink-0 cursor-pointer"
                  >
                    Add Image
                  </button>
                </div>

                {/* Added Photos Grid */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {(formData.portfolio_photos || []).map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#26263b] group shrink-0">
                      <img src={url} alt={`Work ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioPhoto(idx)}
                        className="absolute inset-0 bg-red-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Detailed Bio & Services Description</label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Describe your services, package inclusions, experience, stain guarantee, or team details..."
                  className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-lg transition-all uppercase tracking-widest cursor-pointer disabled:opacity-50 mt-4 shadow-lg"
              >
                {submitting ? 'Saving Profile...' : existingVendor ? 'Update Profile' : 'Register Profile (Free)'}
              </button>

            </form>
          </div>

          {/* Live Preview Simulator Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#161622] border border-[#26263b] rounded-2xl p-6 space-y-4 sticky top-24">
              <div className="flex justify-between items-center border-b border-[#26263b] pb-3">
                <h3 className="font-bold text-white font-cinzel text-sm flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#d4af37]" />
                  <span>Live Marketplace Card Preview</span>
                </h3>
                <span className="text-[9px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded font-bold uppercase">
                  {existingVendor?.is_approved ? 'Live' : 'Preview'}
                </span>
              </div>

              {/* Simulated Vendor Card */}
              <div className="bg-[#0d0d11] border border-[#26263b] rounded-xl overflow-hidden shadow-2xl">
                <div className="relative h-40 bg-black">
                  <img
                    src={formData.portfolio_photos?.[0] || formData.dp_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop'}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d11] via-transparent to-black/30" />
                  
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-[#d4af37] border border-[#d4af37]/30 text-[9px] font-bold uppercase rounded">
                    {formData.category || 'Category'}
                  </span>

                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded flex items-center gap-1 text-[10px]">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-white">4.9</span>
                  </div>

                  <div className="absolute bottom-2 left-3 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full border border-[#d4af37] overflow-hidden bg-black shrink-0">
                      <img
                        src={formData.dp_url || 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop'}
                        alt="DP Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-white font-cinzel text-base">
                    {formData.business_name || 'Your Business Name'}
                  </h4>
                  {formData.location && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <MapPin className="w-3 h-3 text-[#d4af37]" />
                      <span>{formData.location}</span>
                    </div>
                  )}
                  {formData.tagline && (
                    <p className="text-gray-400 text-[11px] line-clamp-2">{formData.tagline}</p>
                  )}
                  {formData.starting_price && (
                    <div className="pt-2 flex justify-between items-center text-[11px] border-t border-[#26263b]">
                      <span className="text-gray-500">Starting Price</span>
                      <span className="text-[#d4af37] font-bold">{formData.starting_price}</span>
                    </div>
                  )}
                </div>

                {/* Simulated Contact Buttons */}
                <div className="p-3 bg-[#161622] border-t border-[#26263b] grid grid-cols-3 gap-1.5 text-[10px]">
                  <div className="py-1.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 font-bold flex items-center justify-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </div>
                  <div className="py-1.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </div>
                  <div className="py-1.5 rounded bg-pink-500/10 border border-pink-500/30 text-pink-400 font-bold flex items-center justify-center gap-1">
                    <InstagramIcon className="w-3 h-3" />
                    <span>Insta</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#26263b] py-8 px-6 text-center text-xs text-gray-500 z-10">
        <p>© 2026 InviteMagic Vendor Portal. 100% Free registration for wedding service professionals.</p>
      </footer>

    </div>
  );
}
