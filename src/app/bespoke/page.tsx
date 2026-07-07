'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Heart, Sparkles, Phone, Mail, Calendar, 
  MessageSquare, ArrowLeft, CheckCircle2, IndianRupee 
} from 'lucide-react';
import { submitBespokeRequest } from '@/app/actions';

export default function BespokeInquiryPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    wedding_date: '',
    estimated_budget: '',
    details: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const budgets = [
    '₹10,000 - ₹25,000 (Premium Bespoke Design)',
    '₹25,000 - ₹50,000 (Elite Animated Layout & Music)',
    '₹50,000+ (Ultra-Luxury Full-Custom Experience)',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await submitBespokeRequest(formData);
      if (res.success) {
        setMessage({
          type: 'success',
          text: '🎉 Thank you! Your bespoke design inquiry has been submitted. Our design team will contact you via Email/WhatsApp within 24 hours.',
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          wedding_date: '',
          estimated_budget: '',
          details: '',
        });
      } else {
        setMessage({
          type: 'error',
          text: res.error || 'Failed to submit inquiry. Please check your inputs.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Server error occurred. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col font-sans relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#d4af37]/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#7c3aed]/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="border-b border-[#26263b] bg-[#161622]/40 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
          <span className="text-base sm:text-lg font-bold tracking-wider font-cinzel text-[#d4af37]">InviteMagic</span>
        </Link>
        <Link 
          href="/" 
          className="text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 hover:text-[#d4af37] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main content grid */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Column: Visual branding and info */}
        <div className="lg:col-span-5 space-y-6">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>InviteMagic Bespoke</span>
          </span>
          <h1 className="text-3xl md:text-5xl font-light leading-tight font-cinzel text-white">
            Luxury Custom <span className="text-[#d4af37] font-semibold">Wedding</span> Websites
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Need something beyond standard presets? Our elite designers craft fully customized, responsive wedding invitation portals tailored to your specific aesthetic theme, animations, and musical scores.
          </p>
          
          <div className="space-y-4 pt-4 border-t border-[#26263b] text-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Handcrafted Custom Layouts</span>
                <span className="text-gray-400 mt-0.5 block">Unique designs styled according to your wedding invites/card designs.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Dedicated Designer Settled Settlements</span>
                <span className="text-gray-400 mt-0.5 block">Personal layout designer, WhatsApp integration, and unlimited modifications.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Ultra-Premium Interactive Elements</span>
                <span className="text-gray-400 mt-0.5 block">Custom particle effects, 3D gallery slideshows, video maps, and guest dashboards.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inquiry Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-[#161622]/40 border border-[#26263b] rounded-[24px] p-6 sm:p-10 shadow-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white font-cinzel">Bespoke Design Inquiry</h2>
              <p className="text-xs text-gray-400 mt-1">Submit your requirements to initiate custom design settlement.</p>
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-xs border leading-relaxed ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            {message?.type === 'success' ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
                <p className="text-sm font-semibold text-white">Inquiry Submitted Successfully!</p>
                <Link 
                  href="/" 
                  className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-lg transition-all text-xs uppercase tracking-wider"
                >
                  Return to Home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                {/* Row 1: Name and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white placeholder-gray-600 outline-none focus:border-[#d4af37] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@company.com"
                        className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white placeholder-gray-600 outline-none focus:border-[#d4af37] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Phone and Wedding Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Phone / WhatsApp Number</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-gray-500 flex items-center gap-0.5"><Phone className="w-3.5 h-3.5" /></span>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg pl-9 pr-3.5 py-2.5 text-white placeholder-gray-600 outline-none focus:border-[#d4af37] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Expected Wedding Date</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-gray-500"><Calendar className="w-3.5 h-3.5" /></span>
                      <input
                        type="date"
                        name="wedding_date"
                        value={formData.wedding_date}
                        onChange={handleChange}
                        className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg pl-9 pr-3.5 py-2.5 text-white placeholder-gray-600 outline-none focus:border-[#d4af37] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Expected Budget */}
                <div>
                  <label className="block text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Expected Design Budget</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-gray-500"><IndianRupee className="w-3.5 h-3.5" /></span>
                    <select
                      name="estimated_budget"
                      required
                      value={formData.estimated_budget}
                      onChange={handleChange}
                      className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg pl-9 pr-3.5 py-2.5 text-white outline-none focus:border-[#d4af37] transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-gray-600">Select budget estimate range</option>
                      {budgets.map((b) => (
                        <option key={b} value={b} className="bg-[#161622]">{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Requirements details */}
                <div>
                  <label className="block text-gray-400 font-semibold mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Requirements & Design Ideas</span>
                  </label>
                  <textarea
                    name="details"
                    rows={4}
                    value={formData.details}
                    onChange={handleChange}
                    placeholder="Briefly describe your design preferences (colors, features, pages needed, or links to reference sites)..."
                    className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-white placeholder-gray-600 outline-none focus:border-[#d4af37] transition-all resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-lg flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#d4af37]/50 disabled:opacity-50 cursor-pointer mt-4"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-t-transparent border-[#0d0d11] rounded-full animate-spin" />
                  ) : (
                    <span>Submit Inquiry Request</span>
                  )}
                </button>

              </form>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#26263b] py-8 px-6 text-center text-xs text-gray-500 z-10">
        <p>© 2026 InviteMagic Bespoke. All rights reserved. Crafting luxury digital wedding cards.</p>
      </footer>

    </div>
  );
}
