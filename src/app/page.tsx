'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Heart, Sparkles, Smartphone, Gift, 
  CheckCircle, ArrowRight, Layers, X, Monitor 
} from 'lucide-react';
import { TEMPLATE_PRESETS, TemplatePreset } from '@/utils/presets';
import { supabase } from '@/utils/supabase';
import InvitationPreview from '@/components/InvitationPreview';
import { Invitation } from '@/types';

export default function LandingPage() {
  const [previewPreset, setPreviewPreset] = useState<TemplatePreset | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');
      } else {
        const mockEmail = localStorage.getItem('mock_user_email');
        if (mockEmail) {
          setIsAuthenticated(true);
          setUserEmail(mockEmail);
        }
      }
    }
    checkAuth();
  }, []);

  const createPreviewInvitation = (preset: TemplatePreset): Partial<Invitation> => {
    return {
      groom_name: 'Aditya',
      bride_name: 'Anjali',
      groom_bio: 'A technology lover who enjoys hiking, building software, and planning travels.',
      bride_bio: 'A designer and flower artist who enjoys painting, green tea, and styling beautiful events.',
      parents_names: 'Mr. & Mrs. Devendra Sharma & Mr. & Mrs. Ramesh Verma',
      invitation_message: 'With hearts full of love, we cordially invite you to celebrate the union of our families.',
      styling: {
        invitation_id: 'preview-id',
        ...preset.styling,
      },
      events: [
        {
          event_name: 'Wedding Ceremony (Shaadi)',
          event_date: '2026-10-24',
          event_time: '18:30:00',
          venue_name: 'The Palace Banquet & Gardens',
          venue_address: '12 Palace Cross Road, Vasanth Nagar, Bengaluru, India',
          google_maps_link: 'https://maps.google.com',
        },
        {
          event_name: 'Reception Dinner',
          event_date: '2026-10-25',
          event_time: '19:30:00',
          venue_name: 'Lotus Grand Palace',
          venue_address: 'Royal High Street, Bengaluru, India',
          google_maps_link: 'https://maps.google.com',
        },
      ],
      gift_collection: {
        invitation_id: 'preview-id',
        upi_id: 'couple@okaxis',
        receiver_name: 'Aditya & Anjali',
        thank_you_message: 'Your blessings are our greatest gift. Thank you for your love and warm wishes!',
      },
    };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6]">
      {/* Premium Header */}
      <header className="border-b border-[#26263b] bg-[#161622]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#d4af37] fill-[#d4af37]" />
            <span className="text-xl font-bold tracking-wider font-cinzel text-[#d4af37]">InviteMagic</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest text-gray-300">
            <a href="#features" className="hover:text-white transition-all">Features</a>
            <a href="#templates" className="hover:text-white transition-all">Templates</a>
            <a href="#pricing" className="hover:text-white transition-all">Pricing</a>
            <a href="#faqs" className="hover:text-white transition-all">FAQs</a>
          </nav>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-xs text-gray-400 font-mono hidden sm:inline">{userEmail}</span>
                <Link href="/dashboard" className="text-xs uppercase tracking-widest font-semibold hover:text-[#d4af37] transition-all">
                  Dashboard
                </Link>
              </>
            ) : (
              <Link href="/login" className="text-xs uppercase tracking-widest font-semibold hover:text-[#d4af37] transition-all">
                Login
              </Link>
            )}
            <Link 
              href="/dashboard/edit/abdul-sana" 
              className="px-4 py-2 rounded bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] text-xs font-bold uppercase tracking-wider transition-all"
            >
              Try Editor
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden flex flex-col justify-center items-center text-center">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d4af37]/5 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-10 left-1/4 w-[300px] h-[300px] bg-[#8b5cf6]/5 rounded-full blur-[100px] pointer-events-none z-0" />

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl z-10 px-4"
        >
          <motion.span 
            variants={itemVariants} 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-xs font-bold uppercase tracking-wider mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>No-Code Invitation Builder</span>
          </motion.span>

          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-7xl font-light text-white mb-6 leading-tight font-cinzel"
          >
            Create Beautiful <span className="text-[#d4af37] font-semibold">Animated</span> Wedding Invitation Websites
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Design premium digital wedding cards in minutes. Customize colors, fonts, music, and layout orders, track guest RSVPs, and collect wedding gifts directly via UPI.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center gap-4 text-sm"
          >
            <Link 
              href="/dashboard/edit/abdul-sana" 
              className="px-8 py-3.5 rounded bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition-all"
            >
              <span>Design Your Card Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="#templates" 
              className="px-8 py-3.5 rounded border border-[#26263b] bg-[#161622] hover:bg-[#202030] text-white font-semibold transition-all"
            >
              View Templates
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-[#161622]/40 border-y border-[#26263b] relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#d4af37] uppercase tracking-widest text-xs font-bold">Why Choose InviteMagic</span>
            <h2 className="text-3xl md:text-5xl font-light text-white mt-2 font-cinzel">Crafted to Perfection</h2>
            <div className="w-16 h-[1px] bg-[#d4af37] mx-auto mt-4 opacity-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#161622] border border-[#26263b] p-8 rounded-lg hover:border-[#d4af37]/35 transition-all">
              <Layers className="w-10 h-10 text-[#d4af37] mb-6" />
              <h3 className="text-xl font-bold text-white mb-3 font-cinzel">Template Editor Mode</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Customize colors, select elegant fonts, upload music, choose entrance animations, and drag/drop sections to re-order components with our live simulator editor.
              </p>
            </div>

            <div className="bg-[#161622] border border-[#26263b] p-8 rounded-lg hover:border-[#d4af37]/35 transition-all">
              <Gift className="w-10 h-10 text-[#d4af37] mb-6" />
              <h3 className="text-xl font-bold text-white mb-3 font-cinzel">Digital Gift Collection</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Allow guests to send shagun directly using auto-generated UPI QR codes. Payments are settled instantly into your personal bank account with zero fees.
              </p>
            </div>

            <div className="bg-[#161622] border border-[#26263b] p-8 rounded-lg hover:border-[#d4af37]/35 transition-all">
              <Smartphone className="w-10 h-10 text-[#d4af37] mb-6" />
              <h3 className="text-xl font-bold text-white mb-3 font-cinzel">RSVP & Guest Tracker</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Access a personal dashboard to view real-time RSVPs. Know exactly who is attending, track total guest counts, and read heartfelt well-wishes from friends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Showcase */}
      <section id="templates" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#d4af37] uppercase tracking-widest text-xs font-bold">Stunning Themes</span>
          <h2 className="text-3xl md:text-5xl font-light text-white mt-2 font-cinzel">Find Your Perfect Vibe</h2>
          <div className="w-16 h-[1px] bg-[#d4af37] mx-auto mt-4 opacity-50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TEMPLATE_PRESETS.slice(0, 6).map((preset) => (
            <div key={preset.slug} className="group bg-[#161622] border border-[#26263b] rounded-lg overflow-hidden flex flex-col justify-between hover:border-[#d4af37]/30 transition-all">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-white text-lg font-cinzel">{preset.name}</h4>
                  <span className="text-[10px] uppercase bg-[#26263b] text-gray-300 px-2 py-0.5 rounded tracking-widest">
                    {preset.styling.font_heading}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  Featured colors: {preset.styling.primary_color} (Primary) and {preset.styling.background_color} (Background). Default style order contains {preset.styling.section_order.length} sections.
                </p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setPreviewPreset(preset)}
                  className="flex-grow py-2 px-3 rounded text-center text-xs font-bold uppercase tracking-wider border border-[#26263b] hover:border-[#d4af37] text-white hover:text-[#d4af37] transition-all cursor-pointer"
                >
                  Live Preview
                </button>
                <Link
                  href={`/dashboard/edit/${preset.slug}`}
                  className="flex-grow py-2 px-3 rounded text-center text-xs font-bold uppercase tracking-wider bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] transition-all font-semibold"
                >
                  Customize
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-[#161622]/40 border-t border-[#26263b]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#d4af37] uppercase tracking-widest text-xs font-bold">Simple Plans</span>
            <h2 className="text-3xl md:text-5xl font-light text-white mt-2 font-cinzel">Affordable Subscriptions</h2>
            <div className="w-16 h-[1px] bg-[#d4af37] mx-auto mt-4 opacity-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-[#161622] border border-[#26263b] rounded-lg p-8 flex flex-col justify-between hover:border-[#d4af37]/20 transition-all">
              <div>
                <h4 className="text-lg font-bold text-white uppercase tracking-wider font-cinzel">Basic</h4>
                <div className="my-6">
                  <span className="text-4xl font-bold text-white">₹299</span>
                  <span className="text-xs text-gray-400">/ 6 Months</span>
                </div>
                <ul className="space-y-3.5 text-xs text-gray-300 border-t border-[#26263b] pt-6 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>6 Months Active Link</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>1 Invitation Template</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>Up to 20 Photos Gallery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>Direct UPI Gift Collection</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/dashboard/edit/abdul-sana" 
                className="w-full py-3 text-center bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                Choose Basic
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-[#161622] border-2 border-[#d4af37] rounded-lg p-8 flex flex-col justify-between shadow-[0_0_30px_rgba(212,175,55,0.1)] relative transition-all">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d4af37] text-[#0d0d11] text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                Most Popular
              </span>
              <div>
                <h4 className="text-lg font-bold text-[#d4af37] uppercase tracking-wider font-cinzel">Premium</h4>
                <div className="my-6">
                  <span className="text-4xl font-bold text-white">₹499</span>
                  <span className="text-xs text-gray-400">/ 1 Year</span>
                </div>
                <ul className="space-y-3.5 text-xs text-gray-300 border-t border-[#26263b] pt-6 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>1 Year Active Link</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>Unlock All Templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>Unlimited Photo Uploads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>Advanced Gift Dashboard</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/dashboard/edit/abdul-sana" 
                className="w-full py-3 text-center bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] rounded text-xs font-bold uppercase tracking-widest transition-all"
              >
                Choose Premium
              </Link>
            </div>

            {/* VIP Plan */}
            <div className="bg-[#161622] border border-[#26263b] rounded-lg p-8 flex flex-col justify-between hover:border-[#d4af37]/20 transition-all">
              <div>
                <h4 className="text-lg font-bold text-white uppercase tracking-wider font-cinzel">VIP</h4>
                <div className="my-6">
                  <span className="text-4xl font-bold text-white">₹999</span>
                  <span className="text-xs text-gray-400">/ Lifetime</span>
                </div>
                <ul className="space-y-3.5 text-xs text-gray-300 border-t border-[#26263b] pt-6 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>Lifetime Active Link</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>Custom Domain Integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>Advanced Gift Analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#d4af37]" />
                    <span>Priority Support Response</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/dashboard/edit/abdul-sana" 
                className="w-full py-3 text-center bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                Choose VIP
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#d4af37] uppercase tracking-widest text-xs font-bold">Frequently Asked</span>
          <h2 className="text-3xl md:text-5xl font-light text-white mt-2 font-cinzel">Got Questions?</h2>
          <div className="w-16 h-[1px] bg-[#d4af37] mx-auto mt-4 opacity-50" />
        </div>

        <div className="space-y-6">
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-6">
            <h4 className="font-bold text-white mb-2 text-sm font-cinzel">How does the digital gift/UPI collection work?</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              When creating your card, you enter your personal UPI ID. Our system automatically renders a secure NPCI-compliant UPI QR code on the invitation card. When guests scan or click the code, their payment app (Google Pay, PhonePe, Paytm) triggers a transfer directly to your account with absolutely 0% processing fees.
            </p>
          </div>
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-6">
            <h4 className="font-bold text-white mb-2 text-sm font-cinzel">Can I integrate my own custom domain?</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Yes, our VIP plan supports custom domains (e.g. abdulwedsfatima.com). We integrate with Cloudflare DNS settings to securely configure domain mappings and automatically provision SSL certificates.
            </p>
          </div>
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-6">
            <h4 className="font-bold text-white mb-2 text-sm font-cinzel">Do templates support multilingual fonts?</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Yes, we have integrated special multilingual font families from Google Fonts, including Noto Nastaliq Urdu (Urdu), Noto Sans Devanagari (Hindi), Noto Sans Kannada (Kannada), and Cinzel/Playfair Display (English) to match regional requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#26263b] py-12 px-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
            <span className="font-bold font-cinzel text-white">InviteMagic</span>
          </div>
          <p>© 2026 InviteMagic. All rights reserved. Made for love and weddings.</p>
        </div>
      </footer>

      {/* Fullscreen Interactive Template Preview Modal */}
      {previewPreset && (
        <div className="fixed inset-0 bg-[#0d0d11]/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#161622] border border-[#26263b] rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative animate-in fade-in duration-300">
            
            {/* Modal Header */}
            <div className="bg-[#161622] border-b border-[#26263b] px-6 py-4 flex items-center justify-between z-20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-base md:text-lg font-cinzel">Previewing Theme:</span>
                  <span className="text-[#d4af37] font-bold text-base md:text-lg font-cinzel">{previewPreset.name}</span>
                </div>
                <p className="text-xs text-gray-400">Experience the responsive animated wedding template layout.</p>
              </div>

              {/* Device Selector Controls */}
              <div className="flex bg-[#0d0d11] rounded p-1 gap-1 border border-[#26263b] mx-4">
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all text-xs font-semibold ${
                    previewDevice === 'mobile'
                      ? 'bg-[#d4af37] text-[#0d0d11]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile View</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all text-xs font-semibold ${
                    previewDevice === 'desktop'
                      ? 'bg-[#d4af37] text-[#0d0d11]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop View</span>
                </button>
              </div>

              <button
                onClick={() => setPreviewPreset(null)}
                className="p-2 rounded-full hover:bg-[#26263b] text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Preview Canvas */}
            <div className="flex-1 bg-[#0d0d11] flex items-center justify-center p-6 overflow-hidden">
              {previewDevice === 'mobile' ? (
                <div className="relative w-[340px] h-full max-h-[640px] rounded-[36px] border-[10px] border-[#1e1e2d] shadow-2xl bg-[#0d0d11] overflow-hidden flex flex-col">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-[#1e1e2d] rounded-b-xl z-50 flex items-center justify-center">
                    <div className="w-10 h-1 bg-gray-700 rounded-full mb-0.5" />
                  </div>
                  {/* Scrollable Area */}
                  <div className="flex-1 overflow-y-auto w-full h-full scroll-smooth pt-3">
                    <InvitationPreview invitation={createPreviewInvitation(previewPreset)} isPreviewMode={true} />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full border border-[#26263b] bg-[#0d0d11] rounded-xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto scroll-smooth">
                    <InvitationPreview invitation={createPreviewInvitation(previewPreset)} isPreviewMode={true} />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#26263b] bg-[#161622] px-6 py-4 flex justify-between items-center z-20">
              <span className="text-xs text-gray-400 hidden sm:inline">Like this theme? Customize and share it with your guests!</span>
              <Link
                href={`/dashboard/edit/${previewPreset.slug}`}
                className="px-6 py-2 rounded bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] text-xs font-bold uppercase tracking-wider transition-all w-full sm:w-auto text-center"
              >
                Customize Theme
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
