'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, Sparkles, Image as ImageIcon, Phone, MessageCircle, 
  MapPin, Tag, ShieldCheck, CheckCircle2, 
  AlertCircle, ArrowLeft, Plus, Trash2, Eye, Star, Share2, Copy, Check, Upload, Lock, Mail, LogOut, User 
} from 'lucide-react';
import { VendorProfile, VendorCategory } from '@/types';
import { submitVendorProfile, getVendorByUserId } from '@/app/vendor-actions';
import Logo from '@/components/Logo';
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
    instagram_reel_urls: [],
    starting_price: '',
  });

  // Account creation states (Option A: for vendors not logged in yet)
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');

  // Existing vendor sign-in modal states
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'warning' | 'error'; message: string; pending?: boolean } | null>(null);
  const [existingVendor, setExistingVendor] = useState<VendorProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [uploadingDp, setUploadingDp] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  const handleUploadLocalDp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDp(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `vendor_dp_${userId || 'anon'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
        setFormData(prev => ({ ...prev, dp_url: publicUrl }));
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setFormData(prev => ({ ...prev, dp_url: reader.result as string }));
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('DP upload error:', err);
    } finally {
      setUploadingDp(false);
    }
  };

  const handleUploadLocalPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPortfolio(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `vendor_work_${userId || 'anon'}_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error } = await supabase.storage
          .from('photos')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        } else {
          const url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') resolve(reader.result);
            };
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(url);
        }
      }

      setFormData(prev => ({
        ...prev,
        portfolio_photos: [...(prev.portfolio_photos || []), ...uploadedUrls],
      }));
    } catch (err) {
      console.error('Portfolio upload error:', err);
    } finally {
      setUploadingPortfolio(false);
    }
  };

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

  async function loadVendorInfo() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
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
    } catch (e) {
      console.warn('Vendor load session error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendorInfo();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setUserEmail(null);
    setExistingVendor(null);
    setFormData({
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
      instagram_reel_urls: [],
      starting_price: '',
    });
    setStatusNotice(null);
  };

  const handleSignInExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) return;
    setSignInLoading(true);
    setSignInError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail.trim(),
        password: signInPassword,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email || signInEmail.trim());
        setIsSignInModalOpen(false);
        const existing = await getVendorByUserId(data.user.id);
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
              message: '✅ Status: Approved & Live! Welcome back to your vendor dashboard.',
            });
          }
        }
      }
    } catch (err: any) {
      setSignInError(err.message || 'Incorrect email or password.');
    } finally {
      setSignInLoading(false);
    }
  };

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
      let currentUserId = userId;

      // Option A: If not logged in, auto-create vendor account in this single click!
      if (!currentUserId) {
        if (!accountEmail.trim() || !accountPassword.trim()) {
          setStatusNotice({
            type: 'error',
            message: 'Please provide an account email and password below to secure your vendor listing.',
          });
          setSubmitting(false);
          return;
        }

        if (accountPassword.length < 6) {
          setStatusNotice({
            type: 'error',
            message: 'Password must be at least 6 characters long.',
          });
          setSubmitting(false);
          return;
        }

        if (accountConfirmPassword && accountPassword !== accountConfirmPassword) {
          setStatusNotice({
            type: 'error',
            message: 'Passwords do not match. Please verify your password.',
          });
          setSubmitting(false);
          return;
        }

        // 1. Sign up user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: accountEmail.trim(),
          password: accountPassword,
          options: {
            data: {
              full_name: formData.business_name || 'Vendor Partner',
              role: 'vendor',
            },
          },
        });

        if (signUpError) {
          // If already registered, try auto sign in
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: accountEmail.trim(),
            password: accountPassword,
          });

          if (signInErr || !signInData?.user) {
            setStatusNotice({
              type: 'error',
              message: signUpError.message || 'Account registration error. Please check your credentials.',
            });
            setSubmitting(false);
            return;
          }
          currentUserId = signInData.user.id;
          setUserId(signInData.user.id);
          setUserEmail(signInData.user.email || accountEmail);
        } else if (signUpData?.user) {
          currentUserId = signUpData.user.id;
          setUserId(signUpData.user.id);
          setUserEmail(signUpData.user.email || accountEmail);
        }
      }

      // 2. Submit Vendor Profile linked to the authenticated user
      const res = await submitVendorProfile({
        ...formData,
        user_id: currentUserId,
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
            message: '🎉 Account Created & Profile Registered! Status: Pending Approval. Your profile will be verified and published on the public directory shortly.',
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
      <header className="border-b border-[#26263b] bg-[#161622]/50 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between z-20">
        <Logo variant="compact" size="sm" href="/" />
        
        <div className="flex items-center gap-3 sm:gap-4">
          {userId ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[11px] text-gray-400 font-mono hidden md:inline">
                {userEmail}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded bg-[#26263b] hover:bg-[#34344d] text-gray-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3 h-3 text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSignInModalOpen(true)}
              className="px-3.5 py-1.5 rounded bg-[#26263b] hover:bg-[#34344d] text-[#d4af37] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-[#d4af37]/30"
            >
              <User className="w-3.5 h-3.5" />
              <span>Already Registered? Sign In</span>
            </button>
          )}

          <Link 
            href="/vendors" 
            className="text-[11px] sm:text-xs uppercase tracking-widest font-semibold flex items-center gap-1 hover:text-[#d4af37] transition-all text-gray-300 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Public Directory</span>
            <span className="inline sm:hidden">Directory</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-10 space-y-8 z-10">
        
        {/* Title Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#26263b] pb-6">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>100% Free Service Provider Registration</span>
            </span>
            <h1 className="text-2xl md:text-4xl font-light text-white font-cinzel">
              {existingVendor ? 'Vendor Management Dashboard' : 'Vendor Registration Portal'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {existingVendor 
                ? 'Update your business info, portfolio photos, starting packages, and contact links.' 
                : 'Enter your business details below to create your free profile and connect directly with wedding couples.'}
            </p>
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
                {statusNotice.pending ? 'Profile Verification Pending' : statusNotice.type === 'success' ? 'Profile Saved & Live' : 'Notice'}
              </span>
              <span>{statusNotice.message}</span>
            </div>
          </div>
        )}

        {/* Direct Share Profile Link Banner (When Vendor Profile Exists) */}
        {existingVendor?.id && (
          <div className="space-y-3">
            {/* Live Real-time Star Rating & Directory Rank Banner */}
            <div className="bg-[#161622] border border-[#26263b] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-mono font-bold text-lg shrink-0">
                  <Star className="w-6 h-6 fill-yellow-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">
                      {existingVendor.rating ? Number(existingVendor.rating).toFixed(1) : '5.0'} / 5.0 Star Rating
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] text-[10px] font-bold uppercase font-mono">
                      {existingVendor.review_count || 0} User Ratings
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    ⭐ Higher star ratings boost your profile to the top position in the vendor directory!
                  </p>
                </div>
              </div>

              <Link
                href={`/vendors/profile/${existingVendor.id}`}
                target="_blank"
                className="px-3.5 py-2 bg-[#26263b] hover:bg-[#34344d] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shrink-0"
              >
                <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>View Live Public Profile</span>
              </Link>
            </div>

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
          </div>
        )}

        {/* Form and Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Column */}
          <div className="lg:col-span-7 bg-[#161622]/40 border border-[#26263b] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white font-cinzel border-b border-[#26263b] pb-3">
              {existingVendor ? 'Edit Business Profile' : '1. Business Profile Details'}
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

              {/* Instagram Reel URLs */}
              <div className="space-y-2 bg-[#0d0d11] p-4 rounded-xl border border-[#26263b]">
                <label className="block text-gray-300 font-semibold uppercase tracking-wider text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                    Instagram Reel / Post URLs
                  </span>
                  <span className="text-gray-500 text-[9px] font-normal normal-case">Optional • Max 6 links</span>
                </label>
                <p className="text-gray-500 text-[10px] leading-relaxed">
                  Paste your Instagram Reel or Post links below (one per line). These will be embedded on your profile page. 
                  Open Instagram → Go to a reel → Tap Share → Copy Link → Paste here.
                </p>
                <textarea
                  value={(formData.instagram_reel_urls || []).join('\n')}
                  onChange={(e) => {
                    const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
                    setFormData(prev => ({ ...prev, instagram_reel_urls: urls.slice(0, 6) }));
                  }}
                  placeholder={`https://www.instagram.com/reel/ABC123/\nhttps://www.instagram.com/reel/XYZ789/\nhttps://www.instagram.com/p/DEF456/`}
                  rows={4}
                  className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-pink-500/50 text-[11px] resize-none placeholder:text-gray-600"
                />
                {(formData.instagram_reel_urls || []).length > 0 && (
                  <p className="text-pink-400 text-[10px]">
                    ✔ {(formData.instagram_reel_urls || []).length} reel{(formData.instagram_reel_urls || []).length > 1 ? 's' : ''} added
                  </p>
                )}
              </div>

              {/* DP Picture URL / Local File Upload */}
              <div className="space-y-2 bg-[#0d0d11] p-4 rounded-xl border border-[#26263b]">
                <label className="block text-gray-300 font-semibold uppercase tracking-wider text-xs flex items-center justify-between">
                  <span>Profile Picture / Business DP</span>
                  {formData.dp_url && <span className="text-green-400 text-[10px]">✔ Image Set</span>}
                </label>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  {/* File Upload Button */}
                  <div className="w-full sm:w-auto shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLocalDp}
                      id="vendor-dp-upload"
                      className="hidden"
                      disabled={uploadingDp}
                    />
                    <label
                      htmlFor="vendor-dp-upload"
                      className="w-full sm:w-auto px-4 py-2.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {uploadingDp ? (
                        <div className="w-4 h-4 border-2 border-t-transparent border-[#0d0d11] rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{uploadingDp ? 'Uploading DP...' : 'Upload Local DP Image'}</span>
                    </label>
                  </div>

                  {/* DP Thumbnail Preview */}
                  {formData.dp_url && (
                    <div className="w-10 h-10 rounded-full border-2 border-[#d4af37] overflow-hidden bg-black shrink-0">
                      <img src={formData.dp_url} alt="DP" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Or Paste Direct Image URL */}
                  <input
                    type="text"
                    name="dp_url"
                    value={formData.dp_url || ''}
                    onChange={handleChange}
                    placeholder="Or paste image URL (https://...)"
                    className="flex-grow w-full bg-[#161622] border border-[#26263b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#d4af37] font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Portfolio Photos File Upload & Gallery */}
              <div className="space-y-3 bg-[#0d0d11] p-4 rounded-xl border border-[#26263b]">
                <label className="block text-gray-300 font-semibold uppercase tracking-wider text-xs flex justify-between items-center">
                  <span>Portfolio Work Photos & Samples</span>
                  <span className="text-gray-400 text-[10px]">({(formData.portfolio_photos || []).length} Photos)</span>
                </label>

                {/* Local Multi-File Upload Button */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadLocalPortfolio}
                    id="vendor-portfolio-upload"
                    className="hidden"
                    disabled={uploadingPortfolio}
                  />
                  <label
                    htmlFor="vendor-portfolio-upload"
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-[#0d0d11] font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {uploadingPortfolio ? (
                      <div className="w-4 h-4 border-2 border-t-transparent border-[#0d0d11] rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{uploadingPortfolio ? 'Uploading Work Photos...' : 'Upload Work Photos (Multiple)'}</span>
                  </label>

                  {/* Or Paste Image URL */}
                  <div className="flex flex-grow gap-2">
                    <input
                      type="text"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="Or paste image URL..."
                      className="flex-grow bg-[#161622] border border-[#26263b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#d4af37] font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddPortfolioPhoto}
                      className="px-3 py-2 bg-[#26263b] hover:bg-[#34344d] text-white font-bold rounded-lg text-xs transition-all shrink-0 cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Added Photos Gallery Grid */}
                {(formData.portfolio_photos || []).length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {(formData.portfolio_photos || []).map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#26263b] group shrink-0 shadow-md bg-black">
                        <img src={url} alt={`Work sample ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePortfolioPhoto(idx)}
                          className="absolute inset-0 bg-red-950/80 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px]"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 mb-0.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

              {/* Option A: Account Creation Section (Only shown when not logged in) */}
              {!userId && (
                <div className="p-5 bg-[#0d0d11] rounded-2xl border border-[#d4af37]/30 space-y-4 pt-4 mt-6">
                  <div className="flex items-center gap-2 border-b border-[#26263b] pb-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                    <h3 className="font-bold text-white uppercase tracking-wider text-xs font-cinzel">
                      2. Create Your Account Login Details
                    </h3>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Set up your email and password so you can log in anytime to update your portfolio, check your ratings, and manage your vendor listing.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-400 font-semibold mb-1 uppercase text-[10px]">Account Email Address *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={accountEmail}
                          onChange={(e) => setAccountEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full bg-[#161622] border border-[#26263b] rounded-lg pl-9 pr-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-400 font-semibold mb-1 uppercase text-[10px]">Create Password *</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                          <input
                            type="password"
                            required
                            value={accountPassword}
                            onChange={(e) => setAccountPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#161622] border border-[#26263b] rounded-lg pl-9 pr-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-400 font-semibold mb-1 uppercase text-[10px]">Confirm Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                          <input
                            type="password"
                            value={accountConfirmPassword}
                            onChange={(e) => setAccountConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#161622] border border-[#26263b] rounded-lg pl-9 pr-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-xl transition-all uppercase tracking-widest cursor-pointer disabled:opacity-50 mt-4 shadow-[0_4px_20px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-[#0d0d11] rounded-full animate-spin" />
                    <span>{existingVendor ? 'Saving Changes...' : 'Creating Account & Submitting Profile...'}</span>
                  </>
                ) : (
                  <span>{existingVendor ? 'Save Profile Changes' : '✨ Register & Create Vendor Profile (Free)'}</span>
                )}
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
                    <span>Instagram</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Returning Vendor Sign-In Lightbox Modal */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 bg-[#0d0d11]/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#161622] border border-[#26263b] rounded-2xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-[#26263b] pb-3">
              <h3 className="font-bold text-white font-cinzel text-base flex items-center gap-2">
                <User className="w-4 h-4 text-[#d4af37]" />
                <span>Vendor Partner Sign In</span>
              </h3>
              <button
                onClick={() => setIsSignInModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {signInError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs">
                {signInError}
              </div>
            )}

            <form onSubmit={handleSignInExisting} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Email Address</label>
                <input
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  className="w-full bg-[#0d0d11] border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Password</label>
                <input
                  type="password"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0d0d11] border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-[#d4af37]"
                />
              </div>

              <button
                type="submit"
                disabled={signInLoading}
                className="w-full py-3 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {signInLoading ? 'Signing In...' : 'Sign In to Vendor Dashboard'}
              </button>
            </form>

            <p className="text-[11px] text-gray-400 text-center">
              New vendor? <button onClick={() => setIsSignInModalOpen(false)} className="text-[#d4af37] font-semibold hover:underline">Fill the registration form below</button>
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#26263b] py-8 px-6 text-center text-xs text-gray-500 z-10">
        <p>© 2026 InviteMagic Vendor Portal. 100% Free registration for wedding service professionals.</p>
      </footer>

    </div>
  );
}
