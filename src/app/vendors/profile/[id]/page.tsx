'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Heart, MapPin, Phone, MessageCircle, Star, 
  ShieldCheck, ArrowLeft, Share2, Copy, Check, Sparkles, AlertCircle 
} from 'lucide-react';
import { VendorProfile } from '@/types';
import { getVendorById } from '@/app/vendor-actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function DedicatedVendorProfilePage({ params }: PageProps) {
  const { id } = use(params);

  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    async function loadVendor() {
      setLoading(true);
      if (typeof window !== 'undefined') {
        setShareUrl(window.location.href);
      }
      const data = await getVendorById(id);
      setVendor(data);
      setLoading(false);
    }
    loadVendor();
  }, [id]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d11] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 font-semibold tracking-wider font-cinzel text-xs animate-pulse">Loading Vendor Profile...</span>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col justify-center items-center text-center p-6 font-sans">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white font-cinzel mb-2">Vendor Profile Not Found</h2>
        <p className="text-gray-400 max-w-sm mb-6 text-xs leading-relaxed">
          The service provider profile link you followed may have been updated or removed.
        </p>
        <Link 
          href="/vendors" 
          className="px-6 py-2.5 bg-[#d4af37] text-[#0d0d11] rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#b8962e] transition-all shadow-lg"
        >
          Browse All Vendors
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#d4af37]/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Header */}
      <header className="border-b border-[#26263b] bg-[#161622]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
            <span className="text-lg font-bold tracking-wider font-cinzel text-[#d4af37]">InviteMagic</span>
          </Link>
          <Link 
            href="/vendors" 
            className="text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 hover:text-[#d4af37] transition-all text-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Vendors</span>
          </Link>
        </div>
      </header>

      {/* Hero Cover Banner */}
      <div className="relative h-64 md:h-80 bg-[#161622] overflow-hidden">
        <img
          src={vendor.portfolio_photos?.[0] || vendor.dp_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop'}
          alt={vendor.business_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d11] via-[#0d0d11]/40 to-black/30" />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-6 -mt-20 z-10 pb-24 space-y-8">
        
        {/* Profile Card Header */}
        <div className="bg-[#161622] border border-[#26263b] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#d4af37] overflow-hidden bg-black shrink-0 shadow-xl">
                <img 
                  src={vendor.dp_url || vendor.portfolio_photos?.[0] || 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop'} 
                  alt={vendor.business_name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white font-cinzel">{vendor.business_name}</h1>
                  {vendor.is_verified && (
                    <span className="px-2.5 py-0.5 bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#d4af37] font-semibold uppercase tracking-wider capitalize">
                  {vendor.category} • {vendor.location}
                </p>
                {vendor.tagline && (
                  <p className="text-xs text-gray-300 italic pt-1">&ldquo;{vendor.tagline}&rdquo;</p>
                )}
              </div>
            </div>

            {/* Price Badge */}
            {vendor.starting_price && (
              <div className="bg-[#0d0d11] px-5 py-3 rounded-xl border border-[#26263b] text-right shrink-0">
                <span className="text-gray-500 uppercase tracking-widest text-[9px] block">Starting Package</span>
                <span className="text-xl font-bold text-[#d4af37]">{vendor.starting_price}</span>
              </div>
            )}
          </div>

          {/* Quick Contact Buttons (WhatsApp, Call, Instagram) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#26263b] pt-6">
            {vendor.whatsapp_number && (
              <a
                href={`https://wa.me/${vendor.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${vendor.business_name}, I saw your profile on InviteMagic and would like to inquire about your services for my wedding!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact via WhatsApp</span>
              </a>
            )}

            {vendor.phone_number && (
              <a
                href={`tel:${vendor.phone_number}`}
                className="py-3 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Phone className="w-4 h-4" />
                <span>Call Directly</span>
              </a>
            )}

            {vendor.instagram_handle && (
              <a
                href={`https://instagram.com/${vendor.instagram_handle.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>View Instagram</span>
              </a>
            )}
          </div>

          {/* Direct Share Profile Link Section */}
          <div className="bg-[#0d0d11] p-4 rounded-xl border border-[#26263b] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Share2 className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>Share Profile URL:</span>
              <span className="font-mono text-[#d4af37] font-semibold truncate max-w-[240px] sm:max-w-xs">{shareUrl}</span>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-[#26263b] hover:bg-[#34344d] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#d4af37]" />}
                <span>{copied ? 'Copied Link!' : 'Copy Profile Link'}</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${vendor.business_name} on InviteMagic: ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Share WA</span>
              </a>
            </div>
          </div>

        </div>

        {/* Rating & Reviews Section */}
        <div className="bg-[#161622] border border-[#26263b] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-white font-cinzel flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span>Rating & Verified Feedback</span>
          </h3>

          <div className="flex items-center gap-4 bg-[#0d0d11] p-4 rounded-xl border border-[#26263b]">
            <div className="text-3xl font-extrabold text-white">{vendor.rating || 4.9}</div>
            <div className="space-y-1">
              <div className="flex text-yellow-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400" />
                ))}
              </div>
              <span className="text-xs text-gray-400 block">Based on {vendor.review_count || 12} Google & Verified Couple Reviews</span>
            </div>
          </div>
        </div>

        {/* Bio & Services */}
        {vendor.description && (
          <div className="bg-[#161622] border border-[#26263b] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white font-cinzel">About & Service Packages</h3>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
              {vendor.description}
            </p>
          </div>
        )}

        {/* Portfolio Work Gallery */}
        <div className="bg-[#161622] border border-[#26263b] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-white font-cinzel">Work Gallery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(vendor.portfolio_photos && vendor.portfolio_photos.length > 0
              ? vendor.portfolio_photos
              : [vendor.dp_url]
            ).filter(Boolean).map((photoUrl, idx) => (
              <div key={idx} className="h-48 rounded-xl overflow-hidden border border-[#26263b] bg-black shadow-md">
                <img 
                  src={photoUrl} 
                  alt={`Work sample ${idx + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#26263b] py-8 px-6 text-center text-xs text-gray-500 z-10">
        <p>© 2026 InviteMagic Service Directory. Connecting couples with top wedding professionals.</p>
      </footer>

    </div>
  );
}
