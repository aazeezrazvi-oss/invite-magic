'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ExternalLink, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { VendorAd } from '@/types';
import { recordAdClick, recordAdImpression } from '@/app/vendor-actions';
import GoogleAdUnit from './GoogleAdUnit';

interface InFeedAdCardProps {
  ad: VendorAd;
}

export default function InFeedAdCard({ ad }: InFeedAdCardProps) {
  const recorded = useRef(false);

  useEffect(() => {
    if (!recorded.current) {
      recorded.current = true;
      recordAdImpression(ad.id);
    }
  }, [ad.id]);

  const handleCardClick = () => {
    recordAdClick(ad.id);
    if (ad.redirect_url) {
      window.open(ad.redirect_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Render Google Ads In-Feed Variant
  if (ad.ad_type === 'google_ads') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#161622] border border-[#26263b] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#d4af37]/40 transition-all shadow-xl p-5"
      >
        <div className="flex items-center justify-between pb-3 text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-b border-[#26263b]">
          <span className="flex items-center gap-1 text-[#d4af37]">
            <Sparkles className="w-3 h-3" />
            <span>Featured Partner</span>
          </span>
          <span>Sponsored</span>
        </div>

        <div className="py-4 flex-1 flex items-center justify-center">
          <GoogleAdUnit
            client={ad.google_ad_client}
            slot={ad.google_ad_slot}
            rawEmbed={ad.raw_embed_code}
            format="rectangle"
          />
        </div>

        {ad.title && (
          <div className="pt-2 text-center text-xs text-gray-400">
            {ad.title}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#161622] border border-[#d4af37]/30 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#d4af37]/60 transition-all group shadow-xl relative"
    >
      {/* Top Media Section */}
      <div 
        className="relative h-48 bg-[#0d0d11] overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {ad.ad_type === 'video' && ad.media_url ? (
          <video
            src={ad.media_url}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <img
            src={ad.media_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop'}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#161622] via-transparent to-black/40" />

        {/* Sponsored Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md text-[#d4af37] border border-[#d4af37]/40 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-md">
          <Sparkles className="w-3 h-3 text-[#d4af37]" />
          <span>Sponsored</span>
        </span>

        {/* Category or City badge */}
        {(ad.category && ad.category !== 'all') && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md text-gray-300 text-[10px] font-medium uppercase tracking-wider rounded-md border border-white/10">
            {ad.category}
          </span>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 space-y-3 cursor-pointer" onClick={handleCardClick}>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-[#d4af37] font-semibold uppercase tracking-wider">
            <span>Special Promotion</span>
          </div>
          <h3 className="text-lg font-bold text-white font-cinzel group-hover:text-[#d4af37] transition-colors leading-snug">
            {ad.title}
          </h3>
        </div>

        {ad.subtitle && (
          <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
            {ad.subtitle}
          </p>
        )}
      </div>

      {/* Action CTA Button */}
      <div className="px-5 pb-5 pt-2 border-t border-[#26263b]/50">
        <button
          onClick={handleCardClick}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8962e] hover:from-[#b8962e] hover:to-[#9c7e23] text-[#0d0d11] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[0_2px_15px_rgba(212,175,55,0.2)] cursor-pointer"
        >
          <span>{ad.cta_text || 'Learn More'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </motion.div>
  );
}
