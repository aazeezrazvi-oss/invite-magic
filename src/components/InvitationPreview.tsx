'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, Calendar, Clock, MapPin, Gift, 
  Volume2, VolumeX, Send, Play, ExternalLink
} from 'lucide-react';
import { Invitation, RSVP as RSVPType } from '@/types';
import { QRCodeSVG } from 'qrcode.react';

interface InvitationPreviewProps {
  invitation: Partial<Invitation>;
  onRsvpSubmit?: (rsvp: Omit<RSVPType, 'id' | 'created_at'>) => Promise<boolean>;
  isPreviewMode?: boolean;
}

export default function InvitationPreview({ 
  invitation, 
  onRsvpSubmit,
  isPreviewMode = false 
}: InvitationPreviewProps) {
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
    background_type: 'gradient' as const,
    background_url: 'linear-gradient(135deg, #0d0d11 0%, #1a1a24 100%)',
  };

  const giftDetails = invitation.gift_collection || {
    upi_id: 'example@upi',
    receiver_name: 'Groom & Bride',
    thank_you_message: 'Your blessings are the greatest gift. Thank you for your kindness!'
  };

  const events = invitation.events || [
    {
      event_name: 'Wedding Ceremony',
      event_date: '2026-10-24',
      event_time: '18:00:00',
      venue_name: 'Grand Royal Palace',
      venue_address: '123 Royal Boulevard, Bangalore',
      google_maps_link: 'https://maps.google.com'
    }
  ];

  // Music playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  
  // Envelope interactive cover states
  const [isOpen, setIsOpen] = useState(isPreviewMode ? true : false);
  const [isOpening, setIsOpening] = useState(false);
  const [isCardOut, setIsCardOut] = useState(false);
  const [isCoverFading, setIsCoverFading] = useState(false);
  
  const isBurgundyTheme = styling.secondary_color === '#580b14' || styling.secondary_color === '#6b0c1b' || styling.secondary_color === '#5a1846';
  const isKalyanam = styling.secondary_color === '#5c0c1b' || styling.font_heading === 'kannada';
  const isRoyalWreath = styling.secondary_color === '#2e0854';
  const isHexagonFrame = styling.secondary_color === '#5a1846';

  // 35 Floating flower petals and gold blossoms for the inner page background (increased density)
  const innerPetals = [
    { left: '5%', top: '3%', delay: 0, scale: 0.8, rotate: 10, speed: 12 },
    { left: '88%', top: '5%', delay: 1.5, scale: 1.0, rotate: 35, speed: 15 },
    { left: '78%', top: '12%', delay: 3.2, scale: 0.7, rotate: -40, speed: 10 },
    { left: '12%', top: '15%', delay: 0.8, scale: 0.9, rotate: 45, speed: 14 },
    { left: '92%', top: '22%', delay: 2.5, scale: 1.1, rotate: -20, speed: 18 },
    { left: '8%', top: '26%', delay: 1.1, scale: 0.8, rotate: 60, speed: 11 },
    { left: '85%', top: '30%', delay: 4.0, scale: 0.7, rotate: 15, speed: 13 },
    { left: '20%', top: '35%', delay: 2.2, scale: 1.0, rotate: -15, speed: 16 },
    { left: '72%', top: '38%', delay: 0.5, scale: 0.9, rotate: 90, speed: 12 },
    { left: '48%', top: '42%', delay: 2.8, scale: 0.6, rotate: -70, speed: 14 },
    { left: '3%', top: '45%', delay: 3.5, scale: 0.7, rotate: 25, speed: 15 },
    { left: '30%', top: '48%', delay: 1.9, scale: 0.8, rotate: -30, speed: 17 },
    { left: '95%', top: '52%', delay: 0.2, scale: 0.9, rotate: 12, speed: 13 },
    { left: '60%', top: '55%', delay: 1.0, scale: 0.8, rotate: -45, speed: 15 },
    { left: '15%', top: '58%', delay: 2.7, scale: 0.7, rotate: 35, speed: 11 },
    { left: '82%', top: '62%', delay: 3.8, scale: 1.0, rotate: -80, speed: 16 },
    { left: '4%', top: '65%', delay: 0.5, scale: 0.9, rotate: 18, speed: 14 },
    { left: '90%', top: '68%', delay: 1.7, scale: 0.7, rotate: -28, speed: 12 },
    { left: '22%', top: '72%', delay: 2.1, scale: 1.1, rotate: 55, speed: 19 },
    { left: '76%', top: '75%', delay: 3.4, scale: 0.8, rotate: -10, speed: 13 },
    { left: '50%', top: '78%', delay: 0.9, scale: 0.6, rotate: 42, speed: 15 },
    { left: '10%', top: '81%', delay: 2.6, scale: 1.0, rotate: -65, speed: 17 },
    { left: '87%', top: '84%', delay: 1.2, scale: 0.8, rotate: 22, speed: 11 },
    { left: '32%', top: '87%', delay: 4.2, scale: 0.7, rotate: -38, speed: 14 },
    { left: '68%', top: '89%', delay: 0.3, scale: 0.9, rotate: 75, speed: 16 },
    { left: '18%', top: '92%', delay: 2.9, scale: 0.8, rotate: -12, speed: 13 },
    { left: '94%', top: '94%', delay: 1.6, scale: 1.0, rotate: 48, speed: 15 },
    { left: '55%', top: '96%', delay: 3.1, scale: 0.7, rotate: -50, speed: 12 },
    { left: '42%', top: '98%', delay: 0.7, scale: 0.8, rotate: 30, speed: 14 },
    { left: '2%', top: '32%', delay: 2.3, scale: 0.8, rotate: -15, speed: 16 },
    { left: '96%', top: '18%', delay: 1.4, scale: 0.9, rotate: 40, speed: 13 },
    { left: '80%', top: '48%', delay: 3.0, scale: 0.7, rotate: -25, speed: 11 },
    { left: '15%', top: '75%', delay: 0.6, scale: 1.0, rotate: 60, speed: 18 },
    { left: '85%', top: '91%', delay: 2.4, scale: 0.8, rotate: -35, speed: 15 },
    { left: '45%', top: '25%', delay: 3.7, scale: 0.9, rotate: 15, speed: 14 }
  ];

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (styling.music_url) {
      audioRef.current = new Audio(styling.music_url);
      audioRef.current.loop = true;
      if (!isPreviewMode && isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [styling.music_url, isPreviewMode, isPlaying]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  // Countdown timer logic
  const mainEvent = events[0] || { event_date: '2026-12-31', event_time: '10:00' };
  const targetDateStr = `${mainEvent.event_date}T${mainEvent.event_time}`;
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const difference = +new Date(targetDateStr) - +new Date();
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDateStr) - +new Date();
      let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return timeLeft;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDateStr]);

  // RSVP Form States
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpEmail, setRsvpEmail] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'going' | 'not_going' | 'pending'>('going');
  const [rsvpGuests, setRsvpGuests] = useState(1);
  const [rsvpWishes, setRsvpWishes] = useState('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setRsvpLoading(true);

    const rsvpData = {
      invitation_id: invitation.id || '',
      guest_name: rsvpName,
      guest_email: rsvpEmail,
      attending_status: rsvpStatus,
      guest_count: rsvpGuests,
      wishes: rsvpWishes,
    };

    if (onRsvpSubmit) {
      const success = await onRsvpSubmit(rsvpData);
      if (success) {
        setRsvpSubmitted(true);
        if (styling.animation_style === 'confetti') {
          import('canvas-confetti').then((confetti) => confetti.default());
        }
      }
    } else {
      // Offline fallback
      setTimeout(() => {
        setRsvpSubmitted(true);
        import('canvas-confetti').then((confetti) => confetti.default());
      }, 800);
    }
    setRsvpLoading(false);
  };

  // Font class mapping
  const getHeadingFontClass = () => {
    switch (styling.font_heading) {
      case 'cinzel': return 'font-cinzel tracking-wider';
      case 'playfair': return 'font-playfair';
      case 'alex': return 'font-alex tracking-normal text-5xl';
      case 'urdu': return 'font-urdu dir-rtl';
      case 'hindi': return 'font-hindi';
      case 'kannada': return 'font-kannada';
      default: return 'font-sans';
    }
  };

  const getBodyFontClass = () => {
    switch (styling.font_body) {
      case 'urdu': return 'font-urdu dir-rtl';
      case 'hindi': return 'font-hindi';
      case 'kannada': return 'font-kannada';
      default: return 'font-sans';
    }
  };

  // Button Style Class Mapping
  const getButtonStyleClass = () => {
    switch (styling.button_style) {
      case 'gold-border':
        return 'border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-[var(--bg-color)] transition-all duration-300';
      case 'classic-pill':
        return 'rounded-full bg-[var(--primary-color)] text-white hover:bg-[var(--secondary-color)] shadow-md transition-all duration-300';
      case 'glowing-shadow':
        return 'bg-[var(--primary-color)] text-[var(--bg-color)] shadow-[0_0_15px_rgba(212,175,55,0.5)] hover:shadow-[0_0_25px_rgba(212,175,55,0.8)] font-semibold transition-all duration-300';
      case 'modern-flat':
      default:
        return 'bg-[var(--primary-color)] text-white hover:bg-[var(--secondary-color)] transition-all duration-300';
    }
  };

  // Theme styling variables
  const containerStyle = {
    '--primary-color': styling.primary_color,
    '--secondary-color': styling.secondary_color,
    '--bg-color': styling.background_color,
    '--text-color': styling.text_color,
    fontFamily: getBodyFontClass()
  } as React.CSSProperties;

  const renderEnvelopeCover = () => {
    const envelopeColor = styling.secondary_color || '#580b14';
    const accentColor = styling.primary_color || '#d4af37';
    const isPurpleOrBurgundy = envelopeColor === '#5a1846' || envelopeColor === '#580b14' || envelopeColor === '#6b0c1b';
    
    // Increased cover floating elements (20 items: mix of 3D rose petals and gold blossoms)
    const petals = [
      { left: '6%', top: '12%', delay: 0, scale: 0.9, rotate: 15, isGold: false },
      { left: '84%', top: '8%', delay: 1.5, scale: 1.1, rotate: 45, isGold: true },
      { left: '22%', top: '75%', delay: 0.8, scale: 0.8, rotate: -25, isGold: false },
      { left: '76%', top: '82%', delay: 2.2, scale: 1.0, rotate: 80, isGold: true },
      { left: '4%', top: '52%', delay: 1.1, scale: 0.7, rotate: 30, isGold: true },
      { left: '92%', top: '58%', delay: 1.8, scale: 1.2, rotate: -60, isGold: false },
      { left: '40%', top: '6%', delay: 0.4, scale: 0.8, rotate: -15, isGold: false },
      { left: '58%', top: '10%', delay: 2.0, scale: 0.9, rotate: 65, isGold: true },
      { left: '12%', top: '88%', delay: 3.1, scale: 1.1, rotate: 20, isGold: false },
      { left: '88%', top: '86%', delay: 0.9, scale: 0.8, rotate: -35, isGold: true },
      { left: '48%', top: '92%', delay: 2.7, scale: 0.9, rotate: 10, isGold: false },
      { left: '52%', top: '94%', delay: 3.5, scale: 1.0, rotate: -10, isGold: true },
      { left: '18%', top: '32%', delay: 1.3, scale: 0.8, rotate: 50, isGold: true },
      { left: '78%', top: '38%', delay: 2.5, scale: 0.9, rotate: -15, isGold: false },
      { left: '30%', top: '62%', delay: 0.6, scale: 1.0, rotate: 75, isGold: false },
      { left: '68%', top: '64%', delay: 3.2, scale: 0.7, rotate: -40, isGold: true },
      { left: '15%', top: '48%', delay: 2.8, scale: 0.9, rotate: 110, isGold: false },
      { left: '85%', top: '22%', delay: 0.5, scale: 0.8, rotate: 25, isGold: false },
      { left: '96%', top: '72%', delay: 2.1, scale: 1.0, rotate: -55, isGold: true },
      { left: '2%', top: '94%', delay: 1.7, scale: 0.7, rotate: 40, isGold: true }
    ];

    const handleOpen = () => {
      setIsOpening(true);
      
      // Auto play audio on user click interaction
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => console.warn('Audio autoplay blocked:', err));
      }

      setTimeout(() => {
        setIsCardOut(true);
      }, 600);

      setTimeout(() => {
        setIsCoverFading(true);
      }, 1500);

      setTimeout(() => {
        setIsOpen(true);
      }, 2100);
    };

    return (
      <div 
        className={`w-full min-h-screen bg-[radial-gradient(circle_at_center,#3b0409_0%,#180104_65%,#050001_100%)] text-[#fcf8f2] flex flex-col justify-center items-center p-6 relative overflow-hidden z-50 transition-all duration-700 ease-in-out ${
          isCoverFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
        }`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {/* Soft Vignette overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]" />

        {/* Floating Rose Petals and Gold Blossoms */}
        {petals.map((p, idx) => (
          <motion.div 
            key={idx}
            className={`absolute pointer-events-none shadow-[1px_2px_4px_rgba(0,0,0,0.15)] ${
              p.isGold 
                ? 'w-5 h-5 text-[#d4af37]/45' 
                : 'w-5 h-5 bg-gradient-to-br from-[#8a1223] via-[#5c0612] to-[#3a0208] rounded-br-2xl rounded-tl-2xl opacity-75'
            }`}
            style={{
              left: p.left,
              top: p.top,
            }}
            animate={{
              y: [0, -25, 25, 0],
              x: [0, 15, -15, 0],
              rotate: [p.rotate, p.rotate + 25, p.rotate - 25, p.rotate]
            }}
            transition={{
              duration: 7 + idx,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay
            }}
          >
            {p.isGold && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0-6a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 12a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-6-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12 0a3 3 0 1 1 6 0 3 3 0 0 1-6 0z" />
              </svg>
            )}
          </motion.div>
        ))}

        {/* Elegant top Bismillah calligraphy header (Gold on dark burgundy) */}
        <div className="text-center mb-8 z-10 select-none animate-fade-in">
          <div className="text-xl md:text-2xl font-serif text-[#d4af37] tracking-wider mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#fcf8f2]/60 font-semibold mt-1">
            In The Name of Allah, The Most Gracious, The Most Merciful
          </p>
        </div>

        {/* Envelope Container */}
        <div className="relative w-80 h-52 md:w-96 md:h-56 flex items-center justify-center my-6 z-20 select-none shadow-[0_25px_60px_rgba(0,0,0,0.75)] rounded-2xl">
          
          {/* Inner Invitation Card */}
          <div 
            className={`absolute w-[94%] h-[92%] left-[3%] top-[4%] bg-[#fcf8f2] rounded-lg shadow-inner z-10 transition-transform duration-[1200ms] ease-in-out flex flex-col justify-center items-center p-4 border border-[#eab308]/20 ${
              isCardOut ? '-translate-y-[105%] rotate-[-2.5deg] scale-105 shadow-2xl' : 'translate-y-0 scale-100'
            }`}
          >
            <Heart className="w-5 h-5 text-[#aa7c11] fill-[#aa7c11]/10 mb-2" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#aa7c11] mb-1 font-semibold">Wedding Invitation</span>
            <div className="text-base font-cinzel text-[#6b0c1b] tracking-widest font-semibold mt-1 uppercase text-center leading-tight">
              {invitation.groom_name?.slice(0,1)} & {invitation.bride_name?.slice(0,1)}
            </div>
            <div className="w-8 h-[1px] bg-[#aa7c11] my-1 opacity-50" />
            <span className="text-[8px] italic text-gray-500">Save the Date</span>
          </div>

          {/* Envelope Back Folds */}
          <div 
            className="absolute inset-0 rounded-b-2xl z-20 overflow-hidden border border-[#520912]/30"
            style={{ backgroundColor: envelopeColor }}
          >
            {/* Left triangle fold with subtle shadow overlay */}
            <div 
              className="absolute inset-0 border-t border-white/5 opacity-90 z-20"
              style={{
                clipPath: 'polygon(0 0, 0 100%, 50% 50%)',
                backgroundColor: 'rgba(0,0,0,0.15)',
                boxShadow: 'inset -10px 0 20px rgba(0,0,0,0.2)'
              }}
            />
            {/* Right triangle fold with subtle shadow overlay */}
            <div 
              className="absolute inset-0 border-t border-white/5 opacity-90 z-20"
              style={{
                clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)',
                backgroundColor: 'rgba(0,0,0,0.15)',
                boxShadow: 'inset 10px 0 20px rgba(0,0,0,0.2)'
              }}
            />
            {/* Bottom triangle fold */}
            <div 
              className="absolute inset-0 border-t border-white/5 z-20 shadow-inner"
              style={{
                clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)',
                backgroundColor: 'rgba(0,0,0,0.22)'
              }}
            />
          </div>

          {/* Horizontal and Vertical Gold Twines or Geometric Patterns depending on theme */}
          {isPurpleOrBurgundy ? (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-22" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Gold trim along the bottom fold edges */}
              <line x1="0" y1="100" x2="50" y2="50" stroke="#d4af37" strokeWidth="1.5" />
              <line x1="100" y1="100" x2="50" y2="50" stroke="#d4af37" strokeWidth="1.5" />
              <line x1="5" y1="100" x2="50" y2="55" stroke="#d4af37" strokeWidth="0.8" opacity="0.7" />
              <line x1="95" y1="100" x2="50" y2="55" stroke="#d4af37" strokeWidth="0.8" opacity="0.7" />

              {/* Gold trim along the side fold edges */}
              <line x1="0" y1="0" x2="50" y2="50" stroke="#d4af37" strokeWidth="1.2" opacity="0.8" />
              <line x1="100" y1="0" x2="50" y2="50" stroke="#d4af37" strokeWidth="1.2" opacity="0.8" />

              {/* Criss-cross geometric lines inside bottom and sides to match mockup */}
              <line x1="0" y1="80" x2="50" y2="30" stroke="#d4af37" strokeWidth="0.5" opacity="0.5" />
              <line x1="100" y1="80" x2="50" y2="30" stroke="#d4af37" strokeWidth="0.5" opacity="0.5" />
              <line x1="0" y1="60" x2="50" y2="10" stroke="#d4af37" strokeWidth="0.5" opacity="0.3" />
              <line x1="100" y1="60" x2="50" y2="10" stroke="#d4af37" strokeWidth="0.5" opacity="0.3" />
            </svg>
          ) : (
            <>
              {/* Horizontal Gold Twines (4 detailed strands wrapping envelope) */}
              <div className="absolute top-[50%] -translate-y-[50%] left-0 w-full h-[12px] flex flex-col justify-between pointer-events-none z-25 opacity-95">
                <div className="w-full h-[1.2px] bg-gradient-to-r from-[#aa7c11] via-[#f5d682] to-[#aa7c11] shadow-[0_1px_1px_rgba(0,0,0,0.35)]" />
                <div className="w-full h-[1.2px] bg-gradient-to-r from-[#8a5d07] via-[#e6bc55] to-[#8a5d07] shadow-[0_1px_1px_rgba(0,0,0,0.35)]" />
                <div className="w-full h-[1.2px] bg-gradient-to-r from-[#aa7c11] via-[#f5d682] to-[#aa7c11] shadow-[0_1px_1px_rgba(0,0,0,0.35)]" />
                <div className="w-full h-[1.2px] bg-gradient-to-r from-[#8a5d07] via-[#e6bc55] to-[#8a5d07] shadow-[0_1px_1px_rgba(0,0,0,0.35)]" />
              </div>

              {/* Vertical Gold Twines (4 detailed strands wrapping envelope) */}
              <div className="absolute left-[50%] -translate-x-[50%] top-0 h-full w-[12px] flex justify-between pointer-events-none z-25 opacity-95">
                <div className="h-full w-[1.2px] bg-gradient-to-b from-[#aa7c11] via-[#f5d682] to-[#aa7c11] shadow-[1px_0_1px_rgba(0,0,0,0.35)]" />
                <div className="h-full w-[1.2px] bg-gradient-to-b from-[#8a5d07] via-[#e6bc55] to-[#8a5d07] shadow-[1px_0_1px_rgba(0,0,0,0.35)]" />
                <div className="h-full w-[1.2px] bg-gradient-to-b from-[#aa7c11] via-[#f5d682] to-[#aa7c11] shadow-[1px_0_1px_rgba(0,0,0,0.35)]" />
                <div className="h-full w-[1.2px] bg-gradient-to-b from-[#8a5d07] via-[#e6bc55] to-[#8a5d07] shadow-[1px_0_1px_rgba(0,0,0,0.35)]" />
              </div>
            </>
          )}

          {/* Radiating frayed thread ends underneath the wax seal */}
          <div className={`absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-36 h-36 pointer-events-none z-35 overflow-visible transition-all duration-[600ms] ${
            isOpening ? 'opacity-0 scale-75' : 'opacity-90 scale-100'
          }`}>
            {[
              { angle: -140, length: 35, opacity: 0.8 },
              { angle: -115, length: 42, opacity: 0.9 },
              { angle: -95, length: 50, opacity: 0.75 },
              { angle: -70, length: 45, opacity: 0.85 },
              { angle: -50, length: 55, opacity: 0.7 },
              { angle: 35, length: 40, opacity: 0.8 },
              { angle: 55, length: 48, opacity: 0.9 },
              { angle: 75, length: 42, opacity: 0.75 },
              { angle: 95, length: 52, opacity: 0.85 },
              { angle: 115, length: 46, opacity: 0.8 },
              { angle: 135, length: 38, opacity: 0.7 },
              { angle: 155, length: 32, opacity: 0.65 },
            ].map((strand, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 h-[0.8px] bg-gradient-to-r from-[#d4af37] via-[#aa7c11] to-transparent origin-left"
                style={{
                  width: `${strand.length}px`,
                  transform: `rotate(${strand.angle}deg)`,
                  opacity: strand.opacity,
                  boxShadow: '0 0.5px 1px rgba(0,0,0,0.3)',
                }}
              />
            ))}
          </div>

          {/* Golden Wheat Branch tucked under wax seal (3 detailed overlapping stems) */}
          <div className={`absolute top-[14%] left-[43%] z-35 transition-all duration-[600ms] origin-bottom-left ${
            isOpening ? 'opacity-0 scale-75 translate-x-4 -translate-y-4' : 'opacity-100 scale-100'
          }`}>
            <svg className="w-32 h-32 text-[#d4af37] rotate-[40deg] filter drop-shadow-[2px_3px_4px_rgba(0,0,0,0.55)]" viewBox="0 0 120 120" fill="none" stroke="currentColor">
              {/* Main Stem */}
              <path d="M20,100 Q45,70 75,35" strokeWidth="1.8" strokeLinecap="round" />
              
              {/* Left Stem */}
              <path d="M25,95 Q52,75 80,50" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
              
              {/* Right Stem */}
              <path d="M15,102 Q35,78 62,55" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
              
              {/* Wheat grains on Main Stem */}
              <path d="M75,35 C73,30 68,27 68,27 C68,27 72,29 75,35 Z" fill="currentColor" />
              <path d="M75,35 C77,30 82,27 82,27 C82,27 78,29 75,35 Z" fill="currentColor" />
              
              <path d="M70,41 C67,37 62,35 62,35 C62,35 66,37 70,41 Z" fill="currentColor" />
              <path d="M70,41 C73,37 78,35 78,35 C78,35 74,37 70,41 Z" fill="currentColor" />
              
              <path d="M65,47 C62,43 57,41 57,41 C57,41 61,43 65,47 Z" fill="currentColor" />
              <path d="M65,47 C68,43 73,41 73,41 C73,41 69,43 65,47 Z" fill="currentColor" />
              
              <path d="M60,53 C57,49 52,47 52,47 C52,47 56,49 60,53 Z" fill="currentColor" />
              <path d="M60,53 C63,49 68,47 68,47 C68,47 64,49 60,53 Z" fill="currentColor" />

              <path d="M55,59 C52,55 47,53 47,53 C47,53 51,55 55,59 Z" fill="currentColor" />
              <path d="M55,59 C58,55 63,53 63,53 C63,53 59,55 55,59 Z" fill="currentColor" />

              <path d="M50,65 C47,61 42,59 42,59 C42,59 46,61 50,65 Z" fill="currentColor" />
              <path d="M50,65 C53,61 58,59 58,59 C58,59 54,61 50,65 Z" fill="currentColor" />

              {/* Grains on Left Stem */}
              <path d="M80,50 C78,45 73,43 73,43 C73,43 77,45 80,50 Z" fill="currentColor" />
              <path d="M80,50 C82,45 87,43 87,43 C87,43 83,45 80,50 Z" fill="currentColor" />
              
              <path d="M75,56 C73,51 68,49 68,49 C68,49 72,51 75,56 Z" fill="currentColor" />
              <path d="M75,56 C77,51 82,49 82,49 C82,49 78,51 75,56 Z" fill="currentColor" />

              <path d="M70,62 C68,57 63,55 63,55 C63,55 67,57 70,62 Z" fill="currentColor" />
              <path d="M70,62 C72,57 77,55 77,55 C77,55 73,57 70,62 Z" fill="currentColor" />

              {/* Grains on Right Stem */}
              <path d="M62,55 C60,50 55,48 55,48 C55,48 59,50 62,55 Z" fill="currentColor" />
              <path d="M62,55 C64,50 69,48 69,48 C69,48 65,50 62,55 Z" fill="currentColor" />
              
              <path d="M57,61 C55,56 50,54 50,54 C50,54 54,56 57,61 Z" fill="currentColor" />
              <path d="M57,61 C59,56 64,54 64,54 C64,54 60,56 57,61 Z" fill="currentColor" />

              {/* Delicate little whiskers/beards extending from grains */}
              <path d="M68,27 L63,18" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
              <path d="M82,27 L87,18" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
              <path d="M62,35 L55,27" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
              <path d="M78,35 L85,27" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
              <path d="M57,41 L50,34" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
              <path d="M73,41 L80,34" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
            </svg>
          </div>

          {/* Envelope Top Flap (Triangular flap that folds down with drop shadow along edge) */}
          <div 
            className={`absolute top-0 left-0 w-full h-[55%] origin-top transition-all duration-700 ease-in-out filter drop-shadow-[0_4px_5px_rgba(0,0,0,0.65)] ${
              isOpening ? 'scale-y-[-1] z-0 pointer-events-none' : 'scale-y-100 z-30'
            }`}
          >
            <div 
              className="w-full h-full relative"
              style={{ 
                backgroundColor: envelopeColor,
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)'
              }}
            >
              {isPurpleOrBurgundy && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Double gold trim on left edge */}
                  <line x1="0" y1="0" x2="50" y2="100" stroke="#d4af37" strokeWidth="1.5" />
                  <line x1="5" y1="0" x2="50" y2="90" stroke="#d4af37" strokeWidth="0.8" opacity="0.7" />
                  {/* Double gold trim on right edge */}
                  <line x1="100" y1="0" x2="50" y2="100" stroke="#d4af37" strokeWidth="1.5" />
                  <line x1="95" y1="0" x2="50" y2="90" stroke="#d4af37" strokeWidth="0.8" opacity="0.7" />
                  
                  {/* Criss-cross gold lines inside the flap to match the geometric design in 2nd pic */}
                  <line x1="15" y1="0" x2="50" y2="70" stroke="#d4af37" strokeWidth="0.5" opacity="0.5" />
                  <line x1="85" y1="0" x2="50" y2="70" stroke="#d4af37" strokeWidth="0.5" opacity="0.5" />
                  <line x1="30" y1="0" x2="50" y2="40" stroke="#d4af37" strokeWidth="0.5" opacity="0.3" />
                  <line x1="70" y1="0" x2="50" y2="40" stroke="#d4af37" strokeWidth="0.5" opacity="0.3" />
                </svg>
              )}
            </div>
          </div>

          {/* Organic Wax Seal with concentric gold NIKAH stamp */}
          <div 
            onClick={handleOpen}
            className={`absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-16 h-16 bg-gradient-to-br from-[#8a1420] via-[#5c0b14] to-[#2b0307] border border-[#a21c2c]/40 shadow-[0_6px_16px_rgba(0,0,0,0.65),inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center cursor-pointer transition-all duration-[600ms] hover:scale-105 z-40 ${
              isOpening ? 'opacity-0 scale-75 translate-y-6 pointer-events-none' : 'opacity-100 scale-100'
            }`}
            style={{
              borderRadius: '45% 55% 52% 48% / 50% 48% 52% 50%' // Hand-poured organic look
            }}
          >
            {/* Concentric Stamped Inner Circle */}
            <div 
              className="w-12 h-12 rounded-full border border-[#d4af37]/35 bg-gradient-to-br from-[#6b0c18] to-[#3d040a] flex items-center justify-center shadow-[inset_0_3px_6px_rgba(0,0,0,0.6)]"
              style={{
                borderRadius: '48% 52% 50% 50% / 50% 50% 50% 50%'
              }}
            >
              {/* Detailed Gold Monogram */}
              <svg className="w-9 h-9 text-[#d4af37] opacity-90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="50" cy="50" r="42" strokeDasharray="3 3" strokeWidth="1" />
                <circle cx="50" cy="50" r="38" strokeWidth="1" />
                <path d="M50,18 L50,82 M18,50 L82,50" strokeWidth="0.8" opacity="0.25" />
                <circle cx="50" cy="50" r="12" strokeWidth="1.2" />
                {isPurpleOrBurgundy ? (
                  <text x="50" y="58" textAnchor="middle" fill="#d4af37" fontSize="26" fontFamily="Georgia, serif">
                    ﷽
                  </text>
                ) : (
                  <text x="50" y="54" textAnchor="middle" fill="#d4af37" fontSize="13" fontFamily="Cinzel, Georgia, serif" fontWeight="bold" letterSpacing="1.5">
                    NIKAH
                  </text>
                )}
                <path d="M35,32 Q50,22 65,32" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M35,68 Q50,78 65,68" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="50" cy="23" r="1.2" fill="#d4af37" />
                <circle cx="50" cy="77" r="1.2" fill="#d4af37" />
              </svg>
            </div>
          </div>

        </div>

        {/* Button Controls */}
        <div className="mt-12 z-10 text-center space-y-4">
          <button 
            onClick={handleOpen}
            disabled={isOpening}
            className={`px-8 py-3 rounded tracking-widest font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all duration-300 transform active:scale-95 disabled:opacity-50 cursor-pointer animate-pulse ${
              isPurpleOrBurgundy 
                ? 'bg-[#4c0519] hover:bg-[#5c061e] text-[#eab308] hover:text-[#fffbeb] border-4 border-double border-[#eab308] font-serif text-sm px-10 py-3.5 font-bold'
                : 'bg-[#580b14] hover:bg-[#42050d] text-[#d4af37] hover:text-[#fffbeb] border border-[#d4af37] font-cinzel text-xs'
            }`}
          >
            {isOpening ? 'OPENING...' : 'OPEN INVITATION'}
          </button>
          
          <p className="text-[10px] italic text-[#d4af37] tracking-wider select-none animate-pulse">
            * Tap the wax seal or button to open the invitation
          </p>
        </div>

      </div>
    );
  };

  // Render individual sections
  const renderSection = (sectionName: string) => {
    const animationVariants = {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
    } as const;

    switch (sectionName) {
      case 'hero':
        if (isKalyanam) {
          return (
            <motion.section 
              key="hero"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={animationVariants}
              className="min-h-screen flex flex-col justify-center items-center text-center p-6 relative overflow-hidden bg-gradient-to-br from-[#4c0519] via-[#2b030d] to-[#120005]"
            >
              {/* Ornate Gold Gopuram (Temple Tower) Backdrop Image */}
              <div className="absolute right-0 bottom-0 top-0 w-full md:w-[50%] opacity-35 md:opacity-50 pointer-events-none select-none z-0">
                <img 
                  src="/gopuram.png" 
                  alt="South Indian Temple Gopuram" 
                  className="w-full h-full object-contain object-bottom md:object-right-bottom filter brightness-110 sepia-[20%] drop-shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                />
              </div>

              {/* Ornate Gold Mandala Art at top left */}
              <div className="absolute -top-16 -left-16 w-56 h-56 border-8 border-double border-[#d4af37]/30 rounded-full opacity-35 pointer-events-none select-none z-0" />
              <div className="absolute -top-8 -left-8 w-40 h-40 border border-dashed border-[#d4af37]/20 rounded-full opacity-25 pointer-events-none select-none z-0" />

              {/* Lotus decorations on the left */}
              <div className="absolute left-6 top-1/4 flex flex-col gap-6 opacity-30 pointer-events-none select-none z-0">
                <svg className="w-12 h-12 text-[#d4af37]" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M50,10 C45,35 15,45 15,65 C15,80 35,90 50,90 C65,90 85,80 85,65 C85,45 55,35 50,10 Z" />
                  <ellipse cx="50" cy="70" rx="30" ry="10" fill="#2b030d" />
                </svg>
                <svg className="w-16 h-16 text-[#d4af37] opacity-80" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M50,10 C45,35 15,45 15,65 C15,80 35,90 50,90 C65,90 85,80 85,65 C85,45 55,35 50,10 Z" />
                  <ellipse cx="50" cy="70" rx="30" ry="10" fill="#2b030d" />
                </svg>
                <svg className="w-10 h-10 text-[#d4af37]" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M50,10 C45,35 15,45 15,65 C15,80 35,90 50,90 C65,90 85,80 85,65 C85,45 55,35 50,10 Z" />
                  <ellipse cx="50" cy="70" rx="30" ry="10" fill="#2b030d" />
                </svg>
              </div>

              <div className="max-w-2xl z-10 px-4">
                <span className="text-[var(--primary-color)] uppercase tracking-[0.3em] text-sm font-semibold block mb-4 select-none font-serif">
                  Kalyanam
                </span>
                <h1 className={`${getHeadingFontClass()} text-5xl @lg:text-7xl text-[var(--primary-color)] my-6 text-center leading-tight drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)]`}>
                  <span className="block my-1">{invitation.groom_name || 'Groom'}</span>
                  <span className="text-2xl font-serif block my-2 opacity-80">&</span>
                  <span className="block my-1">{invitation.bride_name || 'Bride'}</span>
                </h1>
                
                <p className="text-lg italic opacity-90 my-6 max-w-md mx-auto leading-relaxed text-[#fef08a]">
                  {invitation.invitation_message || 'Please join us as we celebrate our love and begin our new journey together.'}
                </p>

                {events[0] && (
                  <div className="mt-8 flex flex-col items-center gap-2 opacity-95 py-4 max-w-sm mx-auto">
                    <span className="font-semibold text-xl text-[var(--primary-color)]">
                      {new Date(events[0].event_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-sm tracking-wider opacity-90 text-[#fef08a]">
                      At {events[0].event_time.slice(0, 5)}
                    </span>
                    <div className="w-24 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--primary-color)] to-transparent mt-4" />
                  </div>
                )}
              </div>
            </motion.section>
          );
        }

        if (isRoyalWreath) {
          return (
            <motion.section 
              key="hero"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={animationVariants}
              className="min-h-screen flex flex-col justify-center items-center text-center p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" 
                   style={{ backgroundImage: `url('/images/pattern-gold.png')`, backgroundSize: 'cover' }} />
              
              <div className="max-w-2xl z-10 px-4">
                <span className="text-[var(--primary-color)] uppercase tracking-[0.25em] text-xs font-semibold block mb-8 select-none">
                  Are Cordially Invited To Attend The Wedding Of
                </span>

                <h1 className={`${getHeadingFontClass()} text-5xl md:text-7xl font-light text-[var(--primary-color)] my-8 leading-tight drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)]`}>
                  <span className="block md:inline-block">{invitation.groom_name || 'Groom'}</span>
                  <span className="text-2xl font-serif block md:inline-block md:mx-4 opacity-75 my-2 md:my-0">&</span>
                  <span className="block md:inline-block">{invitation.bride_name || 'Bride'}</span>
                </h1>

                <p className="text-md opacity-90 my-4 max-w-md mx-auto leading-relaxed">
                  {invitation.invitation_message || 'Please join us as we celebrate our love and begin our new journey together.'}
                </p>

                {events[0] && (
                  <div className="mt-6 flex flex-col items-center gap-1.5 opacity-95">
                    <span className="font-semibold text-lg text-[var(--primary-color)]">
                      {new Date(events[0].event_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-sm tracking-wider opacity-80">
                      At {events[0].event_time.slice(0, 5)}
                    </span>
                  </div>
                )}
              </div>
            </motion.section>
          );
        }

        if (isHexagonFrame) {
          return (
            <motion.section 
              key="hero"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={animationVariants}
              className="min-h-screen flex flex-col justify-center items-center text-center p-6 relative overflow-hidden bg-gradient-to-b from-[#0f021f] via-[#1a0033] to-[#0c0018]"
            >
              <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-screen" 
                   style={{ backgroundImage: `url('/images/pattern-gold.png')`, backgroundSize: 'cover' }} />
              
              <div className="max-w-2xl z-10 px-4">
                <span className="text-[#d4af37] uppercase tracking-[0.25em] text-xs font-semibold block mb-8 select-none font-sans opacity-95">
                  Are Cordially Invited To Attend The Wedding Of
                </span>
                
                <h1 className={`${getHeadingFontClass()} text-5xl @lg:text-7xl text-white font-medium my-6 text-center leading-normal drop-shadow-[0_0_15px_rgba(147,51,234,0.85)]`}>
                  <span className="inline-block">{invitation.groom_name || 'Groom'}</span>
                  <span className="inline-flex items-center justify-center mx-4 text-purple-400 animate-pulse align-middle drop-shadow-[0_0_12px_rgba(168,85,247,0.7)] text-3xl">💜</span>
                  <span className="inline-block">{invitation.bride_name || 'Bride'}</span>
                </h1>
                
                <p className="text-lg italic opacity-95 my-6 leading-relaxed text-[#fcf8f2] max-w-lg mx-auto font-serif">
                  {invitation.invitation_message || 'Please join us as we celebrate our love and begin our new journey together.'}
                </p>
                
                {events[0] && (
                  <div className="mt-8 flex items-center justify-center gap-2.5 bg-yellow-950/20 border border-[#d4af37]/20 rounded-full px-6 py-2.5 max-w-sm mx-auto shadow-md">
                    <Calendar className="w-4.5 h-4.5 text-[#d4af37]" />
                    <span className="text-sm font-semibold tracking-wide text-[#d4af37]">
                      {new Date(events[0].event_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, At {events[0].event_time.slice(0, 5)}
                    </span>
                  </div>
                )}
              </div>
            </motion.section>
          );
        }

        return (
          <motion.section 
            key="hero"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={animationVariants}
            className="min-h-screen flex flex-col justify-center items-center text-center p-6 relative overflow-hidden"
          >
            {/* Floral Backdrop overlays can go here */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" 
                 style={{ backgroundImage: `url('/images/pattern-gold.png')`, backgroundSize: 'cover' }} />
            
            <div className="max-w-2xl z-10 px-4">
              <span className="text-[var(--primary-color)] uppercase tracking-[0.2em] text-xs font-semibold block mb-4 select-none">
                Are Cordially Invited To Attend The Wedding Of
              </span>
              <h1 className={`${getHeadingFontClass()} text-4xl @lg:text-6xl font-light text-[var(--primary-color)] my-6 text-center leading-normal`}>
                <span className="inline-block">{invitation.groom_name || 'Groom'}</span>
                {styling.font_heading === 'alex' ? (
                  <span className="inline-block mx-3 text-2xl font-serif opacity-75">&</span>
                ) : (
                  <Heart className="w-6 h-6 text-[var(--primary-color)] fill-[var(--primary-color)] animate-pulse inline-block mx-3 align-middle" />
                )}
                <span className="inline-block">{invitation.bride_name || 'Bride'}</span>
              </h1>
              <p className="text-lg italic opacity-85 my-4 leading-relaxed">
                {invitation.invitation_message || 'Please join us as we celebrate our love and begin our new journey together.'}
              </p>
              
              {events[0] && (
                <div className="mt-8 flex flex-col items-center gap-1.5 opacity-95 py-4 max-w-sm mx-auto">
                  {styling.font_heading === 'alex' ? (
                    <>
                      <span className="font-semibold text-lg text-[var(--primary-color)]">
                        {new Date(events[0].event_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <span className="text-sm tracking-wider opacity-90">
                        At {events[0].event_time.slice(0, 5)}
                      </span>
                      {/* Elegant gold divider ornament */}
                      <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary-color)] to-transparent mt-4" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[var(--primary-color)]" />
                        <span className="font-semibold text-lg">
                          {new Date(events[0].event_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--primary-color)]" />
                        <span>At {events[0].event_time.slice(0, 5)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.section>
        );

      case 'countdown':
        return (
          <motion.section 
            key="countdown"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={animationVariants}
            className="py-16 text-center z-10 relative bg-[rgba(255,255,255,0.02)] border-y border-[rgba(255,255,255,0.05)]"
          >
            <div className="max-w-4xl mx-auto px-6">
              <h3 className={`${getHeadingFontClass()} text-2xl text-[var(--primary-color)] mb-8`}>
                Counting Down to the Big Day
              </h3>
              
              {isKalyanam ? (
                <div className="flex justify-center gap-4 @lg:gap-10 flex-wrap mt-8">
                  {Object.entries(timeLeft).map(([unit, value]) => (
                    <div key={unit} className="flex flex-col items-center">
                      <div className="relative w-24 h-24 flex flex-col justify-center items-center">
                        {/* Diya Flame */}
                        <div className="absolute top-2 w-4 h-6 bg-gradient-to-t from-orange-600 via-yellow-400 to-transparent rounded-full animate-pulse shadow-[0_-4px_12px_rgba(251,146,60,0.85)]" style={{ transformOrigin: 'bottom center' }} />
                        {/* Diya Bowl */}
                        <svg className="w-20 h-14 text-[#d4af37] drop-shadow-[0_5px_10px_rgba(0,0,0,0.55)]" viewBox="0 0 100 60" fill="currentColor">
                          <path d="M10,20 Q50,60 90,20 Q50,30 10,20 Z" />
                          <path d="M46,20 L54,20 L50,15 Z" />
                        </svg>
                        {/* Value */}
                        <span className="absolute bottom-2 text-2xl font-bold text-white font-mono">{value}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-semibold mt-2">{unit}</span>
                    </div>
                  ))}
                </div>
              ) : isRoyalWreath ? (
                <div className="flex flex-col items-center max-w-md mx-auto">
                  <div className="flex justify-center gap-6 md:gap-10 mb-6">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                      <div key={unit} className="flex flex-col items-center">
                        <span className="text-3xl md:text-5xl font-light text-[var(--primary-color)] font-mono">{value}</span>
                        <span className="text-[9px] md:text-xs uppercase tracking-widest opacity-60 mt-1">{unit}</span>
                      </div>
                    ))}
                  </div>
                  {/* Linear gradient progress bar matching Image 1 */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                    <div className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 w-3/4 rounded-full animate-pulse" />
                  </div>
                </div>
              ) : styling.countdown_style === 'circles' ? (
                isHexagonFrame ? (
                  <div className="flex justify-center gap-4 @lg:gap-10 flex-wrap mt-8">
                    {Object.entries(timeLeft).map(([unit, value]) => {
                      const max = unit === 'days' ? 365 : unit === 'hours' ? 24 : 60;
                      const pct = Math.min(1, Math.max(0, value / max));
                      
                      const outerCirc = 263.89;
                      const outerOffset = outerCirc - (outerCirc * pct);
                      
                      const innerCirc = 226.19;
                      const innerOffset = innerCirc - (innerCirc * (1 - pct));
                      
                      return (
                        <div key={unit} className="relative w-24 h-24 @lg:w-28 @lg:h-28 flex flex-col justify-center items-center">
                          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" stroke="rgba(212, 175, 55, 0.12)" strokeWidth="2.5" fill="none" />
                            <circle 
                              cx="50" cy="50" r="42" 
                              stroke="#d4af37" strokeWidth="2.5" fill="none"
                              strokeDasharray={outerCirc}
                              strokeDashoffset={outerOffset}
                              strokeLinecap="round"
                              className="drop-shadow-[0_0_5px_rgba(212,175,55,0.7)] transition-all duration-1000" 
                            />
                            
                            <circle cx="50" cy="50" r="36" stroke="rgba(147, 51, 234, 0.12)" strokeWidth="2" fill="none" />
                            <circle 
                              cx="50" cy="50" r="36" 
                              stroke="#9333ea" strokeWidth="2.5" fill="none"
                              strokeDasharray={innerCirc}
                              strokeDashoffset={innerOffset}
                              strokeLinecap="round"
                              className="drop-shadow-[0_0_5px_rgba(147,51,234,0.7)] transition-all duration-1000" 
                            />
                          </svg>
                          <span className="text-2xl @lg:text-3xl font-bold text-white font-mono z-10">{value}</span>
                          <span className="text-[9px] @lg:text-[10px] uppercase tracking-widest text-[#d4af37] font-semibold mt-1.5 z-10">{unit}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex justify-center gap-4 @lg:gap-8 flex-wrap">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                      <div key={unit} className="w-20 h-20 @lg:w-28 @lg:h-28 rounded-full border border-[rgba(212,175,55,0.3)] flex flex-col justify-center items-center bg-[rgba(0,0,0,0.4)]">
                        <span className="text-2xl @lg:text-4xl font-light text-[var(--primary-color)] font-mono">{value}</span>
                        <span className="text-[10px] @lg:text-xs uppercase tracking-widest opacity-60 mt-1">{unit}</span>
                      </div>
                    ))}
                  </div>
                )
              ) : styling.countdown_style === 'boxed-numbers' ? (
                <div className="flex justify-center gap-2 @lg:gap-4">
                  {Object.entries(timeLeft).map(([unit, value]) => (
                    <div key={unit} className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] px-4 py-3 rounded min-w-[70px] @lg:min-w-[100px]">
                      <span className="text-3xl @lg:text-5xl font-semibold text-[var(--primary-color)] block font-mono">{value}</span>
                      <span className="text-[9px] @lg:text-xs uppercase tracking-wider opacity-50 mt-1 block">{unit}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-3xl @lg:text-5xl font-light text-[var(--primary-color)] flex justify-center gap-4 font-mono">
                  <span>{timeLeft.days}d</span>
                  <span>:</span>
                  <span>{timeLeft.hours}h</span>
                  <span>:</span>
                  <span>{timeLeft.minutes}m</span>
                  <span>:</span>
                  <span>{timeLeft.seconds}s</span>
                </div>
              )}
            </div>
          </motion.section>
        );

      case 'story':
        return (
          <motion.section 
            key="story"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={animationVariants}
            className="py-24 px-6 relative max-w-5xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className={`${getHeadingFontClass()} text-3xl @lg:text-5xl text-[var(--primary-color)] mb-2`}>
                The Couple
              </h2>
              <div className="w-24 h-[1px] bg-[var(--primary-color)] mx-auto opacity-50" />
            </div>

            <div className="grid grid-cols-1 @lg:grid-cols-2 gap-12 items-center">
              {/* Groom */}
              {isKalyanam ? (
                <div className="flex flex-col items-center text-center p-6 bg-[rgba(22,22,34,0.3)] border border-[#d4af37]/20 rounded-2xl shadow-xl">
                  <div className="relative p-2.5 bg-gradient-to-br from-[#d4af37] via-[#b8962e] to-[#e6bc55] rounded-lg shadow-lg mb-6 hover:scale-105 transition-all duration-300">
                    <div className="w-48 h-48 border-4 border-double border-[#5c0c1b] rounded overflow-hidden bg-slate-800 flex items-center justify-center">
                      {invitation.groom_photo ? (
                        <img src={invitation.groom_photo} alt={invitation.groom_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[#5c0c1b] text-xl font-serif">Groom Photo</div>
                      )}
                    </div>
                    <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#5c0c1b]" />
                    <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#5c0c1b]" />
                    <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#5c0c1b]" />
                    <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#5c0c1b]" />
                  </div>
                  <h3 className={`${getHeadingFontClass()} text-2xl text-[var(--primary-color)] mb-2`}>
                    {invitation.groom_name || 'Groom Name'}
                  </h3>
                  <p className="text-sm italic opacity-85 mb-4 text-[#fef08a]">Son of the Parents</p>
                  <p className="opacity-90 max-w-sm text-sm leading-relaxed text-[#fcf8f2]">
                    {invitation.groom_bio || 'A short biography introducing the groom, his passions, and his perspective on the wedding day.'}
                  </p>
                </div>
              ) : isRoyalWreath ? (
                <div className="flex flex-col items-center text-center p-6 bg-[rgba(22,22,34,0.35)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md rounded-2xl shadow-xl">
                  <div className="relative p-2 bg-[#2e0854]/45 border border-[#d4af37]/40 rounded-xl mb-6 shadow-md overflow-hidden">
                    <div className="w-48 h-48 rounded-lg overflow-hidden border border-[#d4af37]/25 bg-slate-800 flex items-center justify-center">
                      {invitation.groom_photo ? (
                        <img src={invitation.groom_photo} alt={invitation.groom_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[var(--primary-color)] text-xl font-cinzel">Groom Photo</div>
                      )}
                    </div>
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#d4af37]" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#d4af37]" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#d4af37]" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#d4af37]" />
                  </div>
                  <h3 className={`${getHeadingFontClass()} text-2xl text-[var(--primary-color)] mb-2`}>
                    {invitation.groom_name || 'Groom Name'}
                  </h3>
                  <p className="text-sm italic opacity-70 mb-4">Son of the Parents</p>
                  <p className="opacity-80 max-w-sm text-sm leading-relaxed">
                    {invitation.groom_bio || 'A short biography introducing the groom, his passions, and his perspective on the wedding day.'}
                  </p>
                </div>
              ) : isHexagonFrame ? (
                <div className="flex flex-col items-center text-center p-6 bg-[rgba(22,22,34,0.3)] border border-[#d4af37]/20 rounded-2xl shadow-xl hover:border-[#9333ea]/40 transition-all duration-300">
                  <div className="relative p-1 bg-gradient-to-b from-[#d4af37] via-[#aa7c11] to-[#9333ea] shadow-[0_0_20px_rgba(147,51,234,0.45)] transition-all hover:scale-105 duration-300 mb-6"
                       style={{
                         clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                         width: '192px',
                         height: '216px'
                       }}>
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center overflow-hidden"
                         style={{
                           clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                         }}>
                      {invitation.groom_photo ? (
                        <img src={invitation.groom_photo} alt={invitation.groom_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[var(--primary-color)] text-xl font-cinzel">Groom Photo</div>
                      )}
                    </div>
                  </div>
                  <h3 className={`${getHeadingFontClass()} text-2xl text-[var(--primary-color)] mb-2`}>
                    {invitation.groom_name || 'Groom Name'}
                  </h3>
                  <p className="text-sm italic opacity-70 mb-4">Son of the Parents</p>
                  <p className="opacity-80 max-w-sm text-sm leading-relaxed">
                    {invitation.groom_bio || 'A short biography introducing the groom, his passions, and his perspective on the wedding day.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-6 bg-[rgba(22,22,34,0.35)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md rounded-2xl shadow-xl hover:border-[var(--primary-color)]/30 transition-all duration-300">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-double border-[var(--primary-color)] mb-6 bg-slate-800 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all hover:scale-105 duration-300">
                    {invitation.groom_photo ? (
                      <img src={invitation.groom_photo} alt={invitation.groom_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[var(--primary-color)] text-xl font-cinzel">Groom Photo</div>
                    )}
                  </div>
                  <h3 className={`${getHeadingFontClass()} text-2xl text-[var(--primary-color)] mb-2`}>
                    {invitation.groom_name || 'Groom Name'}
                  </h3>
                  <p className="text-sm italic opacity-70 mb-4">Son of the Parents</p>
                  <p className="opacity-80 max-w-sm text-sm leading-relaxed">
                    {invitation.groom_bio || 'A short biography introducing the groom, his passions, and his perspective on the wedding day.'}
                  </p>
                </div>
              )}

              {/* Bride */}
              {isKalyanam ? (
                <div className="flex flex-col items-center text-center p-6 bg-[rgba(22,22,34,0.3)] border border-[#d4af37]/20 rounded-2xl shadow-xl">
                  <div className="relative p-2.5 bg-gradient-to-br from-[#d4af37] via-[#b8962e] to-[#e6bc55] rounded-lg shadow-lg mb-6 hover:scale-105 transition-all duration-300">
                    <div className="w-48 h-48 border-4 border-double border-[#5c0c1b] rounded overflow-hidden bg-slate-800 flex items-center justify-center">
                      {invitation.bride_photo ? (
                        <img src={invitation.bride_photo} alt={invitation.bride_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[#5c0c1b] text-xl font-serif">Bride Photo</div>
                      )}
                    </div>
                    <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#5c0c1b]" />
                    <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#5c0c1b]" />
                    <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#5c0c1b]" />
                    <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#5c0c1b]" />
                  </div>
                  <h3 className={`${getHeadingFontClass()} text-2xl text-[var(--primary-color)] mb-2`}>
                    {invitation.bride_name || 'Bride Name'}
                  </h3>
                  <p className="text-sm italic opacity-85 mb-4 text-[#fef08a]">Daughter of the Parents</p>
                  <p className="opacity-90 max-w-sm text-sm leading-relaxed text-[#fcf8f2]">
                    {invitation.bride_bio || 'A short biography introducing the bride, her passions, and her perspective on the wedding day.'}
                  </p>
                </div>
              ) : isRoyalWreath ? (
                <div className="flex flex-col items-center text-center p-6 bg-[rgba(22,22,34,0.35)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md rounded-2xl shadow-xl">
                  <div className="relative p-2 bg-[#2e0854]/45 border border-[#d4af37]/40 rounded-xl mb-6 shadow-md overflow-hidden">
                    <div className="w-48 h-48 rounded-lg overflow-hidden border border-[#d4af37]/25 bg-slate-800 flex items-center justify-center">
                      {invitation.bride_photo ? (
                        <img src={invitation.bride_photo} alt={invitation.bride_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[var(--primary-color)] text-xl font-cinzel">Bride Photo</div>
                      )}
                    </div>
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#d4af37]" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#d4af37]" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#d4af37]" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#d4af37]" />
                  </div>
                  <h3 className={`${getHeadingFontClass()} text-2xl text-[var(--primary-color)] mb-2`}>
                    {invitation.bride_name || 'Bride Name'}
                  </h3>
                  <p className="text-sm italic opacity-70 mb-4">Daughter of the Parents</p>
                  <p className="opacity-80 max-w-sm text-sm leading-relaxed">
                    {invitation.bride_bio || 'A short biography introducing the bride, her passions, and her perspective on the wedding day.'}
                  </p>
                </div>
              ) : isHexagonFrame ? (
                <div className="flex flex-col items-center text-center p-6 bg-[rgba(22,22,34,0.3)] border border-[#d4af37]/20 rounded-2xl shadow-xl hover:border-[#9333ea]/40 transition-all duration-300">
                  <div className="relative p-1 bg-gradient-to-b from-[#d4af37] via-[#aa7c11] to-[#9333ea] shadow-[0_0_20px_rgba(147,51,234,0.45)] transition-all hover:scale-105 duration-300 mb-6"
                       style={{
                         clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                         width: '192px',
                         height: '216px'
                       }}>
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center overflow-hidden"
                         style={{
                           clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                         }}>
                      {invitation.bride_photo ? (
                        <img src={invitation.bride_photo} alt={invitation.bride_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[var(--primary-color)] text-xl font-cinzel">Bride Photo</div>
                      )}
                    </div>
                  </div>
                  <h3 className={`${getHeadingFontClass()} text-2xl text-[var(--primary-color)] mb-2`}>
                    {invitation.bride_name || 'Bride Name'}
                  </h3>
                  <p className="text-sm italic opacity-70 mb-4">Daughter of the Parents</p>
                  <p className="opacity-80 max-w-sm text-sm leading-relaxed">
                    {invitation.bride_bio || 'A short biography introducing the bride, her passions, and her perspective on the wedding day.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-6 bg-[rgba(22,22,34,0.35)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md rounded-2xl shadow-xl hover:border-[var(--primary-color)]/30 transition-all duration-300">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-double border-[var(--primary-color)] mb-6 bg-slate-800 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all hover:scale-105 duration-300">
                    {invitation.bride_photo ? (
                      <img src={invitation.bride_photo} alt={invitation.bride_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[var(--primary-color)] text-xl font-cinzel">Bride Photo</div>
                    )}
                  </div>
                  <h3 className={`${getHeadingFontClass()} text-2xl text-[var(--primary-color)] mb-2`}>
                    {invitation.bride_name || 'Bride Name'}
                  </h3>
                  <p className="text-sm italic opacity-70 mb-4">Daughter of the Parents</p>
                  <p className="opacity-80 max-w-sm text-sm leading-relaxed">
                    {invitation.bride_bio || 'A short biography introducing the bride, her passions, and her perspective on the wedding day.'}
                  </p>
                </div>
              )}
            </div>

            {invitation.parents_names && (
              <div className="text-center mt-12">
                <p className="text-base opacity-75 font-semibold">With the blessings of parents:</p>
                <p className={`${getHeadingFontClass()} text-xl text-[var(--primary-color)] mt-2`}>
                  {invitation.parents_names}
                </p>
              </div>
            )}
          </motion.section>
        );

      case 'events':
        return (
          <motion.section 
            key="events"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={animationVariants}
            className="py-24 px-6 bg-[rgba(255,255,255,0.01)] border-y border-[rgba(255,255,255,0.02)]"
          >
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className={`${getHeadingFontClass()} text-3xl @lg:text-5xl text-[var(--primary-color)] mb-2`}>
                  Wedding Events
                </h2>
                <div className="w-24 h-[1px] bg-[var(--primary-color)] mx-auto opacity-50" />
              </div>

              {isHexagonFrame ? (
                <div className="relative max-w-sm mx-auto h-[380px] flex items-center justify-center mt-12">
                  {events.map((event, idx) => {
                    const isActive = idx === activeEventIndex;
                    const isPrev = idx === (activeEventIndex - 1 + events.length) % events.length;
                    const isNext = idx === (activeEventIndex + 1) % events.length;
                    
                    let transform = 'scale(0.8) translate(0px, 0px) rotate(0deg)';
                    let zIndex = 0;
                    let opacity = 0;
                    
                    if (isActive) {
                      transform = 'scale(1) translate(0px, 0px) rotate(0deg)';
                      zIndex = 30;
                      opacity = 1;
                    } else if (isPrev) {
                      transform = 'scale(0.9) translate(-70px, 0px) rotate(-8deg)';
                      zIndex = 20;
                      opacity = 0.6;
                    } else if (isNext) {
                      transform = 'scale(0.9) translate(70px, 0px) rotate(8deg)';
                      zIndex = 20;
                      opacity = 0.6;
                    }
                    
                    return (
                      <div
                        key={idx}
                        className="absolute w-72 h-[330px] bg-gradient-to-b from-[#2e0854]/95 to-[#1a0033]/95 border border-[#d4af37]/40 rounded-2xl p-6 shadow-2xl flex flex-col justify-between transition-all duration-500 ease-in-out cursor-pointer"
                        style={{
                          transform,
                          zIndex,
                          opacity,
                          pointerEvents: isActive ? 'auto' : 'none'
                        }}
                        onClick={() => setActiveEventIndex(idx)}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12)_0%,transparent_70%)] pointer-events-none rounded-2xl" />
                        )}
                        
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className={`${getHeadingFontClass()} text-xl text-[#d4af37] font-medium`}>
                              {event.event_name}
                            </h4>
                            <span className="p-2 rounded bg-purple-900/30 text-[#d4af37]">
                              <Heart className="w-4 h-4 fill-[#d4af37]" />
                            </span>
                          </div>
                          
                          <div className="space-y-4 my-6 text-sm opacity-90 text-[#fcf8f2] font-sans">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-[#d4af37] shrink-0" />
                              <span>{new Date(event.event_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
                              <span>{event.event_time.slice(0, 5)}</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold block text-white">{event.venue_name}</span>
                                <span className="text-xs opacity-75">{event.venue_address}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {event.google_maps_link && (
                          <a 
                            href={event.google_maps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 w-full py-2.5 rounded bg-gradient-to-r from-[#d4af37] to-[#aa7c11] hover:from-[#aa7c11] hover:to-[#8a5d07] text-[#1a0033] font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>VIEW ON MAP</span>
                          </a>
                        )}
                      </div>
                    );
                  })}

                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveEventIndex((prev) => (prev - 1 + events.length) % events.length); }}
                    className="absolute left-[-45px] z-40 bg-purple-950/80 border border-[#d4af37]/35 hover:border-[#d4af37] text-[#d4af37] p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveEventIndex((prev) => (prev + 1) % events.length); }}
                    className="absolute right-[-45px] z-40 bg-purple-950/80 border border-[#d4af37]/35 hover:border-[#d4af37] text-[#d4af37] p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-8">
                  {events.map((event, index) => {
                    if (isKalyanam) {
                      return (
                        <div key={index} className="bg-[#fcf7ec] border-2 border-[#d4af37] rounded-2xl p-6 pl-8 pr-8 flex flex-col justify-between hover:border-[#b8962e] transition-all duration-300 shadow-2xl text-[#5c0c1b] relative overflow-hidden">
                          <div className="absolute left-1.5 top-3 bottom-3 flex flex-col justify-between items-center opacity-75 pointer-events-none w-2">
                            {[...Array(9)].map((_, i) => (
                              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-orange-500' : 'bg-yellow-400'} shadow-sm`} />
                            ))}
                          </div>
                          <div className="absolute right-1.5 top-3 bottom-3 flex flex-col justify-between items-center opacity-75 pointer-events-none w-2">
                            {[...Array(9)].map((_, i) => (
                              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-orange-500' : 'bg-yellow-400'} shadow-sm`} />
                            ))}
                          </div>
                          
                          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#b91c1c] to-transparent opacity-50" />
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <h4 className={`${getHeadingFontClass()} text-2xl text-[#5c0c1b] font-medium`}>
                                {event.event_name}
                              </h4>
                              <span className="p-2 rounded bg-[#b91c1c]/10 text-[#b91c1c]">
                                <Heart className="w-4 h-4 fill-[#b91c1c]" />
                              </span>
                            </div>
                            
                            <div className="space-y-3 my-6 text-sm opacity-90">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-[#b91c1c] shrink-0" />
                                <span className="font-semibold">{new Date(event.event_date + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-[#b91c1c] shrink-0" />
                                <span className="font-semibold">{event.event_time.slice(0, 5)}</span>
                              </div>
                              <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold block text-[#5c0c1b]">{event.venue_name}</span>
                                  <span className="text-xs opacity-80 block mt-0.5">{event.venue_address}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {event.google_maps_link && (
                            <a 
                              href={event.google_maps_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-6 w-full py-2.5 rounded bg-[#b91c1c] hover:bg-[#961212] text-[#fffbeb] font-serif text-xs font-semibold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>VIEW ON MAP</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      );
                    }
                    
                    return (
                      <div key={index} className="bg-[rgba(22,22,34,0.35)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--primary-color)] transition-all duration-300 shadow-xl">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h4 className={`${getHeadingFontClass()} text-xl text-[var(--primary-color)] font-medium`}>
                              {event.event_name}
                            </h4>
                            <span className="p-2 rounded bg-[rgba(212,175,55,0.1)] text-[var(--primary-color)]">
                              <Heart className="w-4 h-4 fill-[var(--primary-color)]" />
                            </span>
                          </div>
                          
                          <div className="space-y-3 my-6 text-sm opacity-85">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-[var(--primary-color)] shrink-0" />
                              <span>{new Date(event.event_date + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-[var(--primary-color)] shrink-0" />
                              <span>{event.event_time.slice(0, 5)}</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-[var(--primary-color)] shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold block text-white">{event.venue_name}</span>
                                <span className="text-xs opacity-75">{event.venue_address}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {event.google_maps_link && (
                          <a 
                            href={event.google_maps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full py-2.5 px-4 text-center rounded flex items-center justify-center gap-2 ${getButtonStyleClass()} mt-4 text-xs font-semibold`}
                          >
                            <MapPin className="w-4 h-4" />
                            <span>Navigate in Maps</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.section>
        );

      case 'gallery':
        const galleryPhotos = invitation.gallery_photos && invitation.gallery_photos.length > 0
          ? invitation.gallery_photos
          : [
              'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1519225495810-7517c296517d?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop'
            ];

        return (
          <motion.section 
            key="gallery"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={animationVariants}
            className="py-24 px-6 max-w-5xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className={`${getHeadingFontClass()} text-3xl @lg:text-5xl text-[var(--primary-color)] mb-2`}>
                Photo Gallery
              </h2>
              <div className="w-24 h-[1px] bg-[var(--primary-color)] mx-auto opacity-50" />
            </div>

            {styling.gallery_layout === 'carousel' ? (
              <div className="relative h-96 w-full max-w-2xl mx-auto overflow-hidden rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center group shadow-lg">
                <img 
                  src={galleryPhotos[carouselIndex % galleryPhotos.length]} 
                  alt="Gallery slide" 
                  className="w-full h-full object-cover transition-all duration-500"
                />
                
                {/* Carousel Controls */}
                <button
                  onClick={() => setCarouselIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)}
                  className="absolute left-4 p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 hover:scale-105 transition-all cursor-pointer z-10"
                >
                  &larr;
                </button>
                <button
                  onClick={() => setCarouselIndex((prev) => (prev + 1) % galleryPhotos.length)}
                  className="absolute right-4 p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 hover:scale-105 transition-all cursor-pointer z-10"
                >
                  &rarr;
                </button>

                {/* Bullet Indicators */}
                <div className="absolute bottom-4 flex gap-1.5 justify-center z-10">
                  {galleryPhotos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                        (carouselIndex % galleryPhotos.length) === i 
                          ? 'bg-[var(--primary-color)] w-4' 
                          : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : styling.gallery_layout === 'masonry' ? (
              <div className="columns-1 @sm:columns-2 @md:columns-3 gap-4 space-y-4">
                {galleryPhotos.map((url, idx) => (
                  <div key={idx} className="break-inside-avoid rounded-lg overflow-hidden border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--primary-color)]/30 transition-all duration-300">
                    <img src={url} className="w-full h-auto object-cover" alt={`Gallery item ${idx}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 @md:grid-cols-3 gap-4">
                {galleryPhotos.map((url, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] aspect-square hover:border-[var(--primary-color)]/30 transition-all duration-300">
                    <img src={url} className="w-full h-full object-cover" alt={`Gallery item ${idx}`} />
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        );

      case 'livestream':
        return (
          <motion.section 
            key="livestream"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={animationVariants}
            className="py-20 px-6 text-center bg-[rgba(212,175,55,0.02)] border-y border-[rgba(212,175,55,0.05)]"
          >
            <div className="max-w-3xl mx-auto">
              <h3 className={`${getHeadingFontClass()} text-2xl text-[var(--primary-color)] mb-4`}>
                Wedding Live Stream
              </h3>
              <p className="opacity-80 text-sm max-w-md mx-auto mb-8">
                Can&apos;t attend in person? Join us virtually to share our joy live on our auspicious day!
              </p>
              
              <div className="aspect-video w-full max-w-xl mx-auto rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.5)] flex flex-col justify-center items-center p-4">
                <Play className="w-12 h-12 text-[var(--primary-color)] mb-3 animate-pulse" />
                <span className="text-sm font-semibold opacity-70">YouTube / Zoom Live Video Embed</span>
                <span className="text-xs opacity-50 mt-1">Available on the wedding day</span>
              </div>
            </div>
          </motion.section>
        );

      case 'rsvp':
        return (
          <motion.section 
            key="rsvp"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={animationVariants}
            className="py-24 px-6 max-w-2xl mx-auto relative z-10"
          >
            <div className={`rounded-2xl p-8 shadow-xl ${
              isKalyanam 
                ? 'bg-[#fcf7ec] border-2 border-[#d4af37] text-[#5c0c1b]' 
                : 'bg-[rgba(22,22,34,0.35)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md text-white'
            }`}>
              <div className="text-center mb-8">
                {isKalyanam && (
                  <svg className="w-12 h-12 text-[#b91c1c] mx-auto mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M50,15 C45,25 45,35 50,45 C55,35 55,25 50,15 Z" />
                    <path d="M25,50 C25,40 75,40 75,50 C75,70 65,85 50,85 C35,85 25,70 25,50 Z" />
                    <ellipse cx="50" cy="48" rx="20" ry="5" fill="#d4af37" />
                    <circle cx="50" cy="12" r="3" fill="#d4af37" />
                  </svg>
                )}
                <h2 className={`${getHeadingFontClass()} text-3xl mb-2 ${isKalyanam ? 'text-[#5c0c1b]' : 'text-[var(--primary-color)]'}`}>
                  Will You Attend?
                </h2>
                <p className="opacity-75 text-xs">Kindly respond before October 15, 2026</p>
              </div>

              {rsvpSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <Heart className={`w-16 h-16 mx-auto mb-4 ${isKalyanam ? 'text-[#b91c1c] fill-[#b91c1c]' : 'text-[var(--primary-color)] fill-[var(--primary-color)]'}`} />
                  <h4 className={`text-xl font-bold ${isKalyanam ? 'text-[#5c0c1b]' : 'text-[var(--primary-color)]'}`}>Thank You!</h4>
                  <p className="opacity-80 mt-2 text-sm">Your RSVP response has been successfully sent to the couple.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleRsvpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-85">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      placeholder="Enter your name"
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                        isKalyanam 
                          ? 'bg-[#fffbeb] border border-[#d4af37]/50 focus:border-[#b91c1c] text-[#5c0c1b]'
                          : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] focus:border-[var(--primary-color)] text-white'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-85">Email Address (Optional)</label>
                      <input 
                        type="email" 
                        value={rsvpEmail}
                        onChange={(e) => setRsvpEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                          isKalyanam 
                            ? 'bg-[#fffbeb] border border-[#d4af37]/50 focus:border-[#b91c1c] text-[#5c0c1b]'
                            : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] focus:border-[var(--primary-color)] text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-85">Number of Guests</label>
                      <select 
                        value={rsvpGuests}
                        onChange={(e) => setRsvpGuests(parseInt(e.target.value))}
                        className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                          isKalyanam 
                            ? 'bg-[#fffbeb] border border-[#d4af37]/50 focus:border-[#b91c1c] text-[#5c0c1b]'
                            : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] focus:border-[var(--primary-color)] text-white'
                        }`}
                      >
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n} className={isKalyanam ? 'bg-[#fffbeb] text-[#5c0c1b]' : 'bg-[#161622] text-white'}>
                            {n} {n === 1 ? 'Guest' : 'Guests'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-85">Attendance Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['going', 'not_going', 'pending'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setRsvpStatus(status)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg capitalize transition-all border ${
                            rsvpStatus === status 
                              ? isKalyanam 
                                ? 'bg-[#b91c1c] text-[#fffbeb] border-[#b91c1c] shadow-md' 
                                : 'bg-[var(--primary-color)] text-[var(--bg-color)] border-[var(--primary-color)]' 
                              : isKalyanam 
                                ? 'bg-[#fffbeb] border-[#d4af37]/45 text-[#5c0c1b] hover:border-[#b91c1c]'
                                : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)] text-white hover:border-[var(--primary-color)]'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-85">Wishes / Message</label>
                    <textarea 
                      rows={3}
                      value={rsvpWishes}
                      onChange={(e) => setRsvpWishes(e.target.value)}
                      placeholder="Leave a message for the couple..."
                      className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all resize-none ${
                        isKalyanam 
                          ? 'bg-[#fffbeb] border border-[#d4af37]/50 focus:border-[#b91c1c] text-[#5c0c1b]'
                          : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] focus:border-[var(--primary-color)] text-white'
                      }`}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={rsvpLoading}
                    className={`w-full py-3 font-semibold rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                      isKalyanam 
                        ? 'bg-[#b91c1c] hover:bg-[#961212] text-[#fffbeb]' 
                        : getButtonStyleClass()
                    }`}
                  >
                    {rsvpLoading ? (
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Response</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.section>
        );

      case 'gifts':
        const upiPaymentUrl = `upi://pay?pa=${encodeURIComponent(giftDetails.upi_id)}&pn=${encodeURIComponent(giftDetails.receiver_name)}&cu=INR`;
        
        return (
          <motion.section 
            key="gifts"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={animationVariants}
            className="py-24 px-6 text-center max-w-2xl mx-auto relative z-10"
          >
            <div className={`rounded-2xl p-8 shadow-xl ${
              isKalyanam 
                ? 'bg-[#fcf7ec] border-2 border-[#d4af37] text-[#5c0c1b]' 
                : 'bg-[rgba(22,22,34,0.35)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md text-white'
            }`}>
              <Gift className={`w-12 h-12 mx-auto mb-4 ${isKalyanam ? 'text-[#b91c1c]' : 'text-[var(--primary-color)]'}`} />
              <h2 className={`${getHeadingFontClass()} text-3xl mb-2 ${isKalyanam ? 'text-[#5c0c1b]' : 'text-[var(--primary-color)]'}`}>
                Wedding Gift / Shagun
              </h2>
              <p className="opacity-80 text-sm max-w-md mx-auto mb-6">
                Your love and blessings are the greatest gifts. However, if you wish to honor us with a token of love, you can send digital gifts directly via UPI.
              </p>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-xl inline-block shadow-lg mb-6 border border-slate-200">
                {giftDetails.upi_id ? (
                  <QRCodeSVG 
                    value={upiPaymentUrl} 
                    size={160}
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-mono">
                    UPI QR Code Placeholder
                  </div>
                )}
              </div>

              <div className="space-y-1 mb-6 text-sm">
                <p className={`font-semibold ${isKalyanam ? 'text-[#5c0c1b]' : 'text-white'}`}>Receiver: {giftDetails.receiver_name || 'Groom & Bride'}</p>
                <p className={`font-mono text-xs select-all ${isKalyanam ? 'text-[#b91c1c]' : 'text-[var(--primary-color)]'}`}>{giftDetails.upi_id || 'example@upi'}</p>
              </div>

              <p className={`text-xs italic pt-4 max-w-xs mx-auto border-t ${isKalyanam ? 'border-[#d4af37]/30 text-[#5c0c1b]/80' : 'border-[rgba(255,255,255,0.05)] opacity-75'}`}>
                {giftDetails.thank_you_message}
              </p>

              {/* UPI Logo Badges from mockups */}
              <div className="mt-8 flex flex-wrap justify-center items-center gap-3.5 select-none opacity-95">
                <div className="px-2.5 py-1 bg-white border border-slate-200 rounded shadow-sm text-[9px] font-bold text-slate-800 tracking-wider">
                  GPay
                </div>
                <div className="px-2.5 py-1 bg-white border border-slate-200 rounded shadow-sm text-[9px] font-bold text-[#5f259f] tracking-wider">
                  PhonePe
                </div>
                <div className="px-2.5 py-1 bg-white border border-slate-200 rounded shadow-sm text-[9px] font-bold text-[#00baf2] tracking-wider">
                  Paytm
                </div>
                <div className="px-2.5 py-1 bg-white border border-slate-200 rounded shadow-sm text-[9px] font-bold text-slate-600 tracking-wider">
                  BHIM UPI
                </div>
              </div>
            </div>
          </motion.section>
        );

      default:
        return null;
    }
  };

  if (!isOpen) {
    return renderEnvelopeCover();
  }

  return (
    <div 
      style={containerStyle} 
      className="min-h-screen text-[var(--text-color)] relative flex flex-col overflow-hidden @container"
    >
      {/* Background Layer */}
      {isRoyalWreath ? (
        <>
          <div 
            className="fixed inset-0 bg-cover bg-center z-0 pointer-events-none opacity-45"
            style={{ backgroundImage: `url('/wreath_mountain.png')` }}
          />
          {styling.background_type === 'video' && (
            <video 
              key={styling.background_url}
              autoPlay 
              loop 
              muted 
              playsInline 
              className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-20 mix-blend-screen"
            >
              <source src={styling.background_url} type="video/mp4" />
            </video>
          )}
        </>
      ) : isKalyanam ? (
        <>
          <div 
            className="fixed right-0 bottom-0 w-[55%] h-[80%] bg-contain bg-no-repeat bg-bottom z-0 pointer-events-none opacity-[0.12] filter sepia-[40%]"
            style={{ backgroundImage: `url('/gopuram.png')` }}
          />
          <div 
            className="fixed inset-0 z-0 pointer-events-none opacity-100"
            style={{ background: styling.background_url }}
          />
        </>
      ) : styling.background_type === 'video' ? (
        <video 
          key={styling.background_url}
          autoPlay 
          loop 
          muted 
          playsInline 
          className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-20"
        >
          <source src={styling.background_url} type="video/mp4" />
        </video>
      ) : styling.background_type === 'image' ? (
        <div 
          className="fixed inset-0 bg-cover bg-center z-0 pointer-events-none opacity-10"
          style={{ backgroundImage: `url(${styling.background_url})` }}
        />
      ) : (
        <div 
          className="fixed inset-0 z-0 pointer-events-none opacity-100"
          style={{ background: styling.background_url }}
        />
      )}

      {/* Floating Audio Toggle Controls */}
      {styling.music_url && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-[var(--primary-color)] text-[var(--bg-color)] shadow-lg hover:scale-105 transition-all z-50 flex items-center justify-center"
        >
          {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      )}

      {/* Editor Reset Button (Only visible in Preview Mode) */}
      {isPreviewMode && (
        <button
          onClick={() => {
            setIsOpen(false);
            setIsOpening(false);
            setIsCardOut(false);
            setIsCoverFading(false);
          }}
          className="fixed top-20 right-6 px-3 py-1.5 bg-black/75 hover:bg-black border border-[#d4af37]/35 rounded text-[10px] text-[#d4af37] font-semibold transition-all hover:scale-105 z-50 shadow-lg cursor-pointer"
        >
          Preview Envelope Cover
        </button>
      )}

      {/* Dynamic Floating Flower Petals and Gold Blossoms in Background (35 elements) */}
      {isBurgundyTheme && innerPetals.map((p, idx) => {
        const isGold = idx % 2 === 0;
        return (
          <motion.div 
            key={idx}
            className={`absolute pointer-events-none z-0 ${
              isGold 
                ? 'w-5 h-5 text-[#d4af37]/45' 
                : 'w-6 h-6 bg-gradient-to-br from-[#8a1223] via-[#5c0612] to-[#3a0208] rounded-br-3xl rounded-tl-3xl opacity-75 shadow-[1px_2px_4px_rgba(0,0,0,0.15)]'
            }`}
            style={{
              left: p.left,
              top: p.top,
            }}
            animate={{
              y: [0, -35, 35, 0],
              x: [0, 20, -20, 0],
              rotate: [p.rotate, p.rotate + 35, p.rotate - 35, p.rotate]
            }}
            transition={{
              duration: p.speed,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay
            }}
          >
            {isGold && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                {/* 5-lobed traditional blossom */}
                <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0-6a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 12a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-6-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12 0a3 3 0 1 1 6 0 3 3 0 0 1-6 0z" />
              </svg>
            )}
          </motion.div>
        );
      })}

      {/* Dynamic Section Ordering */}
      <div className="z-10 flex flex-col flex-grow">
        {(styling.section_order && styling.section_order.length > 0
          ? styling.section_order
          : ['hero', 'countdown', 'story', 'events', 'gallery', 'rsvp', 'gifts']
        ).map((section) => renderSection(section))}
      </div>
    </div>
  );
}
