'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Sparkles, Search, MapPin, Phone, 
  MessageCircle, Star, CheckCircle2, 
  X, ExternalLink, Tag, ShieldCheck, ArrowRight, PlusCircle, Share2, Copy, Check 
} from 'lucide-react';
import { VendorProfile, VendorCategory } from '@/types';
import { getPublicVendors, rateVendor } from '@/app/vendor-actions';
import Logo from '@/components/Logo';

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);


const categories: { id: VendorCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Services', icon: '✨' },
  { id: 'mehendi', label: 'Mehendi Artists', icon: '🌿' },
  { id: 'makeup', label: 'Makeup & Hair', icon: '💄' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'decor', label: 'Decor & Floral', icon: '🌸' },
  { id: 'catering', label: 'Catering & Food', icon: '🍲' },
  { id: 'dj_music', label: 'DJ & Music', icon: '🎧' },
  { id: 'planner', label: 'Planners', icon: '📋' },
  { id: 'venue', label: 'Venues', icon: '🏰' },
];

export default function PublicVendorsPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VendorCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [copiedVendorId, setCopiedVendorId] = useState<string | null>(null);
  
  // Modal rating state
  const [modalHoveredStar, setModalHoveredStar] = useState<number | null>(null);
  const [modalUserRating, setModalUserRating] = useState<number | null>(null);
  const [modalRatingMsg, setModalRatingMsg] = useState('');
  const [isModalRating, setIsModalRating] = useState(false);

  useEffect(() => {
    if (selectedVendor && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`rated_vendor_${selectedVendor.id}`);
      setModalUserRating(saved ? parseInt(saved, 10) : null);
      setModalRatingMsg('');
    }
  }, [selectedVendor]);

  const handleRateFromModal = async (stars: number) => {
    if (!selectedVendor || isModalRating) return;

    setIsModalRating(true);
    setModalUserRating(stars);
    localStorage.setItem(`rated_vendor_${selectedVendor.id}`, stars.toString());

    const prevRating = typeof selectedVendor.rating === 'number' && !isNaN(selectedVendor.rating) ? selectedVendor.rating : 5.0;
    const prevCount = typeof selectedVendor.review_count === 'number' && !isNaN(selectedVendor.review_count) ? selectedVendor.review_count : 0;
    const optimisticCount = prevCount + 1;
    const optimisticRating = Math.round(((prevRating * prevCount + stars) / optimisticCount) * 10) / 10;

    const updatedVendor = { ...selectedVendor, rating: optimisticRating, review_count: optimisticCount };
    setSelectedVendor(updatedVendor);

    // Update vendors array and re-sort so highest stars move to top
    setVendors((prev) => {
      const updatedList = prev.map((v) => (v.id === selectedVendor.id ? updatedVendor : v));
      return [...updatedList].sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.review_count || 0) - (a.review_count || 0));
    });

    setModalRatingMsg(`⭐ Rated ${stars} Stars!`);

    try {
      const res = await rateVendor(selectedVendor.id, stars);
      if (res.success) {
        const finalVendor = { ...selectedVendor, rating: res.newRating, review_count: res.newReviewCount };
        setSelectedVendor(finalVendor);
        setVendors((prev) => {
          const updatedList = prev.map((v) => (v.id === selectedVendor.id ? finalVendor : v));
          return [...updatedList].sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.review_count || 0) - (a.review_count || 0));
        });
      }
    } catch (e) {
      console.warn('Modal rating error:', e);
    } finally {
      setIsModalRating(false);
      setTimeout(() => setModalRatingMsg(''), 4000);
    }
  };

  const handleShareVendor = (e: React.MouseEvent, vendorId: string) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/vendors/profile/${vendorId}`;
      navigator.clipboard.writeText(url);
      setCopiedVendorId(vendorId);
      setTimeout(() => setCopiedVendorId(null), 2500);
    }
  };

  useEffect(() => {
    async function loadVendors() {
      setLoading(true);
      const data = await getPublicVendors(selectedCategory, searchQuery);
      setVendors(data);
      setLoading(false);
    }

    // Debounce search query
    const timer = setTimeout(() => {
      loadVendors();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#d4af37]/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-1/3 right-10 w-[400px] h-[400px] bg-[#10b981]/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="border-b border-[#26263b] bg-[#161622]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Logo variant="compact" size="sm" href="/" />

          <div className="flex items-center gap-3">
            <Link 
              href="/vendors/portal" 
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_2px_15px_rgba(212,175,55,0.2)] whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Join as Vendor (Free)</span>
              <span className="inline sm:hidden">Join Free</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 px-6 text-center z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Free Service Directory</span>
          </span>

          <h1 className="text-3xl md:text-5xl font-light text-white font-cinzel leading-tight">
            Discover Top <span className="text-[#d4af37] font-semibold">Wedding Service</span> Providers
          </h1>

          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Browse verified Mehendi artists, makeup artists, photographers, decorators, and venues. View portfolio work galleries, check reviews, and contact artists directly via WhatsApp or Phone.
          </p>

          {/* Search Bar */}
          <div className="pt-6 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor name, city (e.g. Bengaluru), or specialty..."
                className="w-full bg-[#161622] border border-[#26263b] rounded-full pl-12 pr-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all shadow-lg"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="px-6 max-w-7xl mx-auto w-full mb-10 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#d4af37] text-[#0d0d11] font-bold shadow-[0_2px_15px_rgba(212,175,55,0.25)]'
                  : 'bg-[#161622] text-gray-400 hover:text-white border border-[#26263b] hover:border-gray-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Vendors Grid */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 pb-24 z-10">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 font-semibold tracking-wider font-cinzel text-xs animate-pulse">Loading Verified Vendors...</span>
          </div>
        ) : vendors.length === 0 ? (
          <div className="bg-[#161622]/40 border border-[#26263b] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-[#26263b] rounded-full flex items-center justify-center mx-auto text-2xl">
              🔍
            </div>
            <h3 className="text-lg font-bold text-white font-cinzel">No Vendors Found</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              No approved profiles match your current search or category filter. Are you a service provider? Register your profile for free!
            </p>
            <Link
              href="/vendors/portal"
              className="inline-block px-6 py-2.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold text-xs uppercase tracking-wider rounded transition-all"
            >
              Register Profile Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#161622] border border-[#26263b] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#d4af37]/40 transition-all group shadow-xl"
              >
                {/* Card Banner / Portfolio Cover */}
                <div 
                  className="relative h-48 bg-[#0d0d11] overflow-hidden cursor-pointer"
                  onClick={() => setSelectedVendor(vendor)}
                >
                  <img
                    src={vendor.portfolio_photos?.[0] || vendor.dp_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop'}
                    alt={vendor.business_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161622] via-transparent to-black/30" />
                  
                  {/* Category Badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-[#d4af37] border border-[#d4af37]/30 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {vendor.category}
                  </span>

                  {/* Rating & Share Badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleShareVendor(e, vendor.id)}
                      className="bg-black/70 hover:bg-black/90 backdrop-blur-md p-1.5 rounded-md border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                      title="Copy Shareable Profile Link"
                    >
                      {copiedVendorId === vendor.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5 text-[#d4af37]" />}
                    </button>
                    <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold text-white">{vendor.rating || 4.9}</span>
                      <span className="text-[10px] text-gray-400">({vendor.review_count || 12})</span>
                    </div>
                  </div>

                  {/* DP Avatar Overlay */}
                  <div className="absolute bottom-3 left-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-[#d4af37] overflow-hidden bg-[#161622] shrink-0 shadow-lg">
                      <img
                        src={vendor.dp_url || vendor.portfolio_photos?.[0] || 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop'}
                        alt={vendor.business_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {vendor.is_verified && (
                      <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 text-green-400 text-[9px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-green-400" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex-1 space-y-3 cursor-pointer" onClick={() => setSelectedVendor(vendor)}>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white font-cinzel group-hover:text-[#d4af37] transition-colors">
                      {vendor.business_name}
                    </h3>
                    {vendor.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{vendor.location}</span>
                      </div>
                    )}
                  </div>

                  {vendor.tagline && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {vendor.tagline}
                    </p>
                  )}

                  {vendor.starting_price && (
                    <div className="pt-2 flex items-center justify-between text-xs border-t border-[#26263b]">
                      <span className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold">Starting Price</span>
                      <span className="text-[#d4af37] font-bold">{vendor.starting_price}</span>
                    </div>
                  )}
                </div>

                {/* Contact Action Buttons Bar (WhatsApp, Call, Instagram) */}
                <div className="px-5 pb-5 pt-2 border-t border-[#26263b]/50 grid grid-cols-3 gap-2">
                  {/* WhatsApp Button */}
                  {vendor.whatsapp_number ? (
                    <a
                      href={`https://wa.me/${vendor.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${vendor.business_name}, I found your profile on InviteMagic and would like to inquire about your services for my wedding!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      title="Contact on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-green-400/20" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <button disabled className="py-2 px-2 rounded-lg bg-gray-800 text-gray-500 text-xs font-semibold cursor-not-allowed">
                      WhatsApp
                    </button>
                  )}

                  {/* Call Button */}
                  {vendor.phone_number ? (
                    <a
                      href={`tel:${vendor.phone_number}`}
                      className="py-2 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      title="Call Directly"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  ) : (
                    <button disabled className="py-2 px-2 rounded-lg bg-gray-800 text-gray-500 text-xs font-semibold cursor-not-allowed">
                      Call
                    </button>
                  )}

                  {/* Instagram Button */}
                  {vendor.instagram_handle ? (
                    <a
                      href={`https://instagram.com/${vendor.instagram_handle.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      title="View Instagram Profile"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                      <span>Insta</span>
                    </a>
                  ) : (
                    <button disabled className="py-2 px-2 rounded-lg bg-gray-800 text-gray-500 text-xs font-semibold cursor-not-allowed">
                      Insta
                    </button>
                  )}
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#26263b] py-8 px-6 text-center text-xs text-gray-500 z-10">
        <p>© 2026 InviteMagic Service Directory. Connecting couples with India&apos;s best wedding professionals for free.</p>
      </footer>

      {/* Vendor Profile & Portfolio Lightbox Modal */}
      <AnimatePresence>
        {selectedVendor && (
          <div className="fixed inset-0 bg-[#0d0d11]/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161622] border border-[#26263b] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="bg-[#161622] border-b border-[#26263b] px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-[#d4af37] overflow-hidden bg-black shrink-0">
                    <img 
                      src={selectedVendor.dp_url || selectedVendor.portfolio_photos?.[0] || 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop'} 
                      alt={selectedVendor.business_name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white font-cinzel">{selectedVendor.business_name}</h3>
                    <p className="text-xs text-[#d4af37] capitalize">{selectedVendor.category} • {selectedVendor.location}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVendor(null)}
                  className="p-2 rounded-full hover:bg-[#26263b] text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                
                {/* Rating & Star Voting Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d11] p-4 rounded-xl border border-[#26263b]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-yellow-400 font-mono font-bold text-base">
                        <Star className="w-4 h-4 fill-yellow-400" />
                        <span className="text-white">{selectedVendor.rating ? Number(selectedVendor.rating).toFixed(1) : '5.0'}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        (<strong className="text-white font-mono">{selectedVendor.review_count || 0}</strong> Ratings) • Top Ranked
                      </span>
                    </div>
                    {modalRatingMsg && (
                      <span className="text-[11px] text-green-400 font-semibold block animate-pulse">{modalRatingMsg}</span>
                    )}
                  </div>

                  {/* Interactive Star Buttons */}
                  <div className="flex items-center gap-1 bg-[#161622] px-3 py-1.5 rounded-lg border border-[#26263b]">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mr-1">
                      {modalUserRating ? 'Rated:' : 'Rate:'}
                    </span>
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isFilled = modalHoveredStar !== null 
                        ? modalHoveredStar >= starVal 
                        : (modalUserRating || 0) >= starVal;

                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setModalHoveredStar(starVal)}
                          onMouseLeave={() => setModalHoveredStar(null)}
                          onClick={() => handleRateFromModal(starVal)}
                          disabled={isModalRating}
                          className="p-0.5 rounded hover:scale-125 transition-all text-yellow-400 cursor-pointer disabled:cursor-not-allowed"
                          title={`Give ${starVal} Star${starVal > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-4 h-4 transition-all ${
                              isFilled ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]' : 'text-gray-600 hover:text-yellow-400'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {selectedVendor.starting_price && (
                    <div className="text-right sm:border-l sm:border-[#26263b] sm:pl-4">
                      <span className="text-gray-500 uppercase tracking-widest text-[10px] block">Starting Package</span>
                      <span className="text-base font-bold text-[#d4af37]">{selectedVendor.starting_price}</span>
                    </div>
                  )}
                </div>

                {/* About & Bio */}
                {selectedVendor.description && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-cinzel">About & Services</h4>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line text-xs">
                      {selectedVendor.description}
                    </p>
                  </div>
                )}

                {/* Portfolio Work Gallery */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-cinzel">Portfolio Work Gallery</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(selectedVendor.portfolio_photos && selectedVendor.portfolio_photos.length > 0
                      ? selectedVendor.portfolio_photos
                      : [selectedVendor.dp_url]
                    ).filter(Boolean).map((photoUrl, idx) => (
                      <div key={idx} className="h-40 rounded-xl overflow-hidden border border-[#26263b] bg-black">
                        <img 
                          src={photoUrl} 
                          alt={`Work sample ${idx + 1}`} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Options Banner */}
                <div className="bg-[#0d0d11] p-5 rounded-xl border border-[#26263b] space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-cinzel">Contact Service Provider</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedVendor.whatsapp_number && (
                      <a
                        href={`https://wa.me/${selectedVendor.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedVendor.business_name}, I saw your profile on InviteMagic and would like to inquire about your availability!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3 px-4 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    )}
                    {selectedVendor.phone_number && (
                      <a
                        href={`tel:${selectedVendor.phone_number}`}
                        className="py-3 px-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call Phone</span>
                      </a>
                    )}
                    {selectedVendor.instagram_handle && (
                      <a
                        href={`https://instagram.com/${selectedVendor.instagram_handle.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3 px-4 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                      >
                        <InstagramIcon className="w-4 h-4" />
                        <span>Instagram Profile</span>
                      </a>
                    )}
                  </div>

                  {/* Share Profile Banner in Modal */}
                  <div className="pt-2 border-t border-[#26263b] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Direct Share Link:</span>
                      <span className="font-mono text-[#d4af37] text-[11px]">
                        {typeof window !== 'undefined' ? `${window.location.origin}/vendors/profile/${selectedVendor.id}` : ''}
                      </span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={(e) => handleShareVendor(e, selectedVendor.id)}
                        className="flex-1 sm:flex-initial py-2 px-3 bg-[#26263b] hover:bg-[#34344d] text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedVendorId === selectedVendor.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#d4af37]" />}
                        <span>{copiedVendorId === selectedVendor.id ? 'Copied Link!' : 'Copy Link'}</span>
                      </button>
                      <Link
                        href={`/vendors/profile/${selectedVendor.id}`}
                        target="_blank"
                        className="flex-1 sm:flex-initial py-2 px-3 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold text-xs rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Full Profile</span>
                      </Link>
                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
