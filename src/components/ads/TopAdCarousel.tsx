'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, ExternalLink, Sparkles, 
  Volume2, VolumeX, X, Eye, ArrowRight 
} from 'lucide-react';
import { VendorAd } from '@/types';
import { recordAdClick, recordAdImpression } from '@/app/vendor-actions';
import GoogleAdUnit from './GoogleAdUnit';

function decodeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

interface TopAdCarouselProps {
  ads: VendorAd[];
  className?: string;
}

export default function TopAdCarousel({ ads, className = '' }: TopAdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recordedImpressions = useRef<Set<string>>(new Set());

  // Filter only active ads
  const validAds = ads.filter(ad => ad.is_active);

  // Record impression for current visible ad
  useEffect(() => {
    if (validAds.length > 0) {
      const currentAd = validAds[currentIndex];
      if (currentAd && !recordedImpressions.current.has(currentAd.id)) {
        recordedImpressions.current.add(currentAd.id);
        recordAdImpression(currentAd.id);
      }
    }
  }, [currentIndex, validAds]);

  // Auto-advance timer (cycles every 6 seconds if multiple ads exist and not hovered)
  useEffect(() => {
    if (validAds.length <= 1 || isPaused || isDismissed) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validAds.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [validAds.length, isPaused, isDismissed]);

  if (validAds.length === 0 || isDismissed) {
    return null;
  }

  const currentAd = validAds[currentIndex % validAds.length] || validAds[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validAds.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validAds.length) % validAds.length);
  };

  const handleAdClick = (ad: VendorAd) => {
    recordAdClick(ad.id);
    if (ad.redirect_url) {
      window.open(ad.redirect_url, '_blank', 'noopener,noreferrer');
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div 
      className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 mb-8 z-20 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative rounded-2xl overflow-hidden bg-[#161622]/90 border border-[#d4af37]/30 shadow-[0_4px_25px_rgba(0,0,0,0.5)] backdrop-blur-md">
        
        {/* Subtle Top Accent Ribbon */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-70" />

        {/* Carousel Content Container */}
        <div className="relative min-h-[140px] sm:min-h-[160px] md:min-h-[180px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAd.id + currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              {/* GOOGLE ADS / EMBED TYPE */}
              {currentAd.ad_type === 'google_ads' ? (
                <div className="p-4 sm:p-6 w-full flex flex-col items-center justify-center">
                  <div className="w-full flex items-center justify-between pb-2 text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-b border-[#26263b] mb-2">
                    <span className="flex items-center gap-1 text-[#d4af37]">
                      <Sparkles className="w-3 h-3" />
                      <span>Partner Sponsor</span>
                    </span>
                    <span>Advertisement</span>
                  </div>
                  <GoogleAdUnit
                    client={currentAd.google_ad_client}
                    slot={currentAd.google_ad_slot}
                    rawEmbed={currentAd.raw_embed_code}
                    className="max-h-[130px]"
                  />
                </div>
              ) : currentAd.ad_type === 'video' ? (
                /* VIDEO AD BANNER */
                <div 
                  onClick={() => handleAdClick(currentAd)}
                  className={`relative w-full h-full min-h-[160px] md:min-h-[190px] overflow-hidden flex flex-col md:flex-row items-center justify-between p-5 md:p-8 ${currentAd.redirect_url ? 'cursor-pointer' : ''}`}
                >
                  {/* Background Video */}
                  {currentAd.media_url && (
                    <video
                      ref={videoRef}
                      src={currentAd.media_url}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-35"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#161622] via-[#161622]/80 to-transparent" />

                  {/* Left Content */}
                  <div className="relative z-10 space-y-1.5 max-w-xl text-left">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Featured Video Spotlight</span>
                      </span>
                      {currentAd.category && currentAd.category !== 'all' && (
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                          • {currentAd.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-xl font-bold text-white font-cinzel leading-snug">
                      {decodeHtml(currentAd.title)}
                    </h3>

                    {currentAd.subtitle && (
                      <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
                        {decodeHtml(currentAd.subtitle)}
                      </p>
                    )}
                  </div>

                  {/* Right Actions (CTA & Sound) */}
                  <div className="relative z-10 flex items-center gap-3 mt-3 md:mt-0 shrink-0">
                    {currentAd.media_url && (
                      <button
                        onClick={toggleSound}
                        className="p-2 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-gray-300 hover:text-white transition-all"
                        title={isMuted ? 'Unmute Video' : 'Mute Video'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
                      </button>
                    )}

                    {currentAd.redirect_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdClick(currentAd);
                        }}
                        className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_2px_15px_rgba(212,175,55,0.3)] cursor-pointer"
                      >
                        <span>{decodeHtml(currentAd.cta_text) || 'Explore Now'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* IMAGE BANNER AD */
                <div 
                  onClick={() => handleAdClick(currentAd)}
                  className={`relative w-full h-full min-h-[140px] md:min-h-[170px] overflow-hidden flex flex-col md:flex-row items-center justify-between p-5 md:p-8 ${currentAd.redirect_url ? 'cursor-pointer' : ''}`}
                >
                  {/* Background Image with Gradient Overlay */}
                  {currentAd.media_url && (
                    <img
                      src={currentAd.media_url}
                      alt={decodeHtml(currentAd.title)}
                      className="absolute inset-0 w-full h-full object-cover opacity-25 md:opacity-30"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#161622] via-[#161622]/90 to-transparent" />

                  {/* Left Content */}
                  <div className="relative z-10 space-y-1.5 max-w-2xl text-left">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Special Announcement</span>
                      </span>
                      {currentAd.city && currentAd.city !== 'All Cities' && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          📍 {currentAd.city}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-xl font-bold text-white font-cinzel leading-tight">
                      {decodeHtml(currentAd.title)}
                    </h3>

                    {currentAd.subtitle && (
                      <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
                        {decodeHtml(currentAd.subtitle)}
                      </p>
                    )}
                  </div>

                  {/* Right CTA Button */}
                  {currentAd.redirect_url && (
                    <div className="relative z-10 mt-3 md:mt-0 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdClick(currentAd);
                        }}
                        className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_2px_15px_rgba(212,175,55,0.3)] cursor-pointer"
                      >
                        <span>{decodeHtml(currentAd.cta_text) || 'View Offer'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Navigation Controls (Shown only if multiple ads exist) */}
        {validAds.length > 1 && (
          <div className="absolute bottom-2.5 right-4 z-20 flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-1 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-gray-300 hover:text-white transition-all"
              title="Previous Ad"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1">
              {validAds.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex 
                      ? 'w-5 bg-[#d4af37]' 
                      : 'w-1.5 bg-gray-600 hover:bg-gray-400'
                  }`}
                  title={`Slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="p-1 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-gray-300 hover:text-white transition-all"
              title="Next Ad"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Subtle Close/Minimize Button in top right */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2.5 right-2.5 z-20 p-1 rounded-full bg-black/40 hover:bg-black/80 text-gray-500 hover:text-gray-200 transition-all"
          title="Dismiss ad banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
}
