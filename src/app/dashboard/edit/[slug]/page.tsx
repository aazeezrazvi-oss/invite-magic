'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import Sidebar from '@/components/Editor/Sidebar';
import Canvas from '@/components/Editor/Canvas';
import { Invitation } from '@/types';
import { getInvitationBySlug, saveInvitation } from '@/app/actions';
import { ArrowLeft, Check, AlertCircle, Heart } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const mockInvitation: Invitation = {
  id: 'mock-id-123',
  user_id: 'mock-user-123',
  slug: 'abdul-sana',
  groom_name: 'Abdul',
  groom_photo: '',
  groom_bio: 'A technology enthusiast who loves exploration, excited to build this beautiful life alongside Sana.',
  bride_name: 'Sana',
  bride_photo: '',
  bride_bio: 'A creative designer and writer who loves nature walks, hot tea, and family get-togethers.',
  parents_names: 'Mr. & Mrs. Rahman & Mr. & Mrs. Siddiqui',
  invitation_message: 'With hearts full of love, we cordially invite you to celebrate the union of our families.',
  is_published: true,
  styling: {
    invitation_id: 'mock-id-123',
    primary_color: '#d4af37',
    secondary_color: '#aa7c11',
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
  },
  events: [
    {
      event_name: 'Wedding Ceremony (Nikah)',
      event_date: '2026-10-24',
      event_time: '11:00:00',
      venue_name: 'The Royal Lawn & Banquet',
      venue_address: '10 Palace Road, Bangalore, India',
      google_maps_link: 'https://maps.google.com',
    },
    {
      event_name: 'Reception (Valima)',
      event_date: '2026-10-25',
      event_time: '19:00:00',
      venue_name: 'Emerald Garden Palace',
      venue_address: 'High Street, Palace Road, Bangalore, India',
      google_maps_link: 'https://maps.google.com',
    },
  ],
  gift_collection: {
    invitation_id: 'mock-id-123',
    upi_id: 'shadi@okaxis',
    receiver_name: 'Abdul & Sana',
    thank_you_message: 'Your blessings are our greatest gift. Thank you for your warm love!',
  },
};

export default function EditorPage({ params }: PageProps) {
  const { slug } = use(params);
  
  const [invitation, setInvitation] = useState<Partial<Invitation>>(mockInvitation);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSupabaseWorking, setIsSupabaseWorking] = useState(true);
  const [hasPaid, setHasPaid] = useState<boolean>(false);
  
  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePaymentSuccess = () => {
    setHasPaid(true);
    localStorage.setItem(`invite_${slug}_paid`, 'true');
  };

  const handleShareClick = () => {
    if (!hasPaid) {
      alert("⚠️ Upgrade Required: Please buy any upgrade plan in the editor sidebar to activate your live link and share it with guests!");
      return;
    }
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/invite/${slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    async function loadData() {
      // Check user session and bypass status
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || localStorage.getItem('mock_user_email') || '';
      
      const isBypassUser = userEmail === 'abdulazeezrazvi125@gmail.com' || userEmail === 'abdulazeezrazvi97@gmail.com';
      
      if (isBypassUser) {
        setHasPaid(true);
      } else {
        const paidStatus = localStorage.getItem(`invite_${slug}_paid`);
        setHasPaid(paidStatus === 'true');
      }

      const data = await getInvitationBySlug(slug);
      if (data) {
        setInvitation(data);
        setIsSupabaseWorking(true);
      } else {
        // Fallback to local storage or mock template
        setIsSupabaseWorking(false);
        const localData = localStorage.getItem(`invite_${slug}`);
        if (localData) {
          try {
            setInvitation(JSON.parse(localData));
          } catch (e) {
            console.error('Failed to parse local storage details:', e);
          }
        } else {
          setInvitation({ ...mockInvitation, slug });
        }
      }
    }
    loadData();
  }, [slug]);

  const handleUpdate = (updatedFields: Partial<Invitation>) => {
    setInvitation((prev) => {
      const nextVal = { ...prev, ...updatedFields };
      // Keep it in sync locally
      localStorage.setItem(`invite_${slug}`, JSON.stringify(nextVal));
      return nextVal;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    if (isSupabaseWorking) {
      const success = await saveInvitation(invitation);
      if (success) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
    } else {
      // Mock save to local storage
      setTimeout(() => {
        localStorage.setItem(`invite_${slug}`, JSON.stringify(invitation));
        setSaveStatus('success');
      }, 800);
    }
    setIsSaving(false);

    setTimeout(() => {
      setSaveStatus('idle');
    }, 3000);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0d0d11]">
      {/* Top Navbar */}
      <div className="bg-[#161622] border-b border-[#26263b] px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="p-1.5 rounded hover:bg-[#26263b] text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-[1px] bg-[#26263b]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">Editing Invite:</span>
              <span className="text-[#d4af37] font-mono text-xs">{slug}</span>
            </div>
            <span className="text-[10px] text-gray-400">Customizations update real-time in the preview canvas.</span>
          </div>
        </div>

        {/* Save/Sync Status Alert */}
        <div className="flex items-center gap-3 text-xs">
          {!isSupabaseWorking && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Offline/Local Mode</span>
            </div>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded bg-green-500/10 border border-green-500/20 text-green-500">
              <Check className="w-3.5 h-3.5" />
              <span>Saved Successfully</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Failed to Save</span>
            </div>
          )}
          <a
            href={`/invite/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded bg-[#26263b] hover:bg-[#34344d] text-white font-semibold transition-all"
          >
            Open Live Invitation
          </a>
          <button
            onClick={handleShareClick}
            className="px-3.5 py-1.5 rounded bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Share Invitation
          </button>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Sidebar */}
        <Sidebar 
          invitation={invitation} 
          onUpdate={handleUpdate} 
          onSave={handleSave} 
          isSaving={isSaving} 
          hasPaid={hasPaid}
          onPaymentSuccess={handlePaymentSuccess}
        />

        {/* Live Canvas Preview */}
        <Canvas invitation={invitation} />
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-[400px] bg-[#161622] border border-[#d4af37]/30 rounded-[20px] p-6 space-y-5 shadow-[0_4px_30px_rgba(212,175,55,0.15)] relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
            >
              &times;
            </button>
            <div className="text-center space-y-1">
              <Heart className="w-8 h-8 text-[#d4af37] fill-[#d4af37]/20 mx-auto" />
              <h3 className="text-lg font-light text-white font-cinzel tracking-wider">Share Invitation</h3>
              <p className="text-[10px] text-gray-400">Your live invitation link is active and ready to share!</p>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Invitation Link</label>
              <div className="flex bg-[#0d0d11] rounded border border-[#26263b] p-1.5 items-center justify-between gap-2 overflow-hidden">
                <span className="text-[11px] font-mono text-gray-300 truncate select-all px-1">
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${slug}`}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1 bg-[#26263b] hover:bg-[#34344d] rounded text-[10px] font-bold uppercase text-white transition-all shrink-0 cursor-pointer"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-[#26263b]" />

            <div className="grid grid-cols-1 gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=Hey! You are cordially invited to our wedding. Please view our wedding card here: ${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba56] text-[#0d0d11] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs text-center"
              >
                Share on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
