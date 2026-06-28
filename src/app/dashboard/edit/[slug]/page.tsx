'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import Sidebar from '@/components/Editor/Sidebar';
import Canvas from '@/components/Editor/Canvas';
import { Invitation } from '@/types';
import { getInvitationBySlug, saveInvitation } from '@/app/actions';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
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

  const handlePaymentSuccess = () => {
    setHasPaid(true);
    localStorage.setItem(`invite_${slug}_paid`, 'true');
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
    </div>
  );
}
