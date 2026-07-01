'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import InvitationPreview from '@/components/InvitationPreview';
import { Invitation, RSVP } from '@/types';
import { getInvitationBySlug, submitRsvp } from '@/app/actions';
import { AlertCircle, Heart } from 'lucide-react';
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

export default function GuestInvitePage({ params }: PageProps) {
  const { slug } = use(params);
  
  const [invitation, setInvitation] = useState<Partial<Invitation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Check if current viewer is an admin
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile?.role === 'admin' || session.user.email === 'abdulazeezrazvi125@gmail.com') {
            setIsAdmin(true);
          }
        }
      } catch (e) {
        // Viewer is a guest, ignore
      }

      try {
        const data = await getInvitationBySlug(slug);
        if (data) {
          if (data.is_suspended) {
            setIsSuspended(true);
          }
          setInvitation(data);
        } else {
          // Fallback to local storage or mock template
          const localData = localStorage.getItem(`invite_${slug}`);
          if (localData) {
            try {
              setInvitation(JSON.parse(localData));
            } catch (e) {
              console.error('Failed to parse local storage details:', e);
              setInvitation({ ...mockInvitation, slug });
            }
          } else {
            // Fallback to default mock invitation
            setInvitation({ ...mockInvitation, slug });
          }
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError(true);
      }
      setLoading(false);
    }
    loadData();
  }, [slug]);

  const handleRsvpSubmit = async (rsvpData: Omit<RSVP, 'id' | 'created_at'>) => {
    // If we've got standard mock model, show mock success
    if (invitation?.id === 'mock-id-123') {
      return true;
    }
    return await submitRsvp(rsvpData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d11] flex flex-col justify-center items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 font-semibold tracking-wider font-cinzel animate-pulse">Loading Invitation...</span>
      </div>
    );
  }

  if (isSuspended && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col justify-center items-center text-center p-8 relative font-sans">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-[480px] bg-[#161622]/40 backdrop-blur-md border border-red-500/20 rounded-[24px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.37)] z-10 space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-[20px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-light text-white tracking-wider font-cinzel text-red-500">Link Suspended</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            This wedding invitation link has been <strong>suspended</strong> by the system administrator.
          </p>
          
          <div className="h-[1px] bg-[#26263b] w-full my-4" />
          
          <p className="text-xs text-gray-500">
            Please contact the wedding hosts or support if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#0d0d11] flex flex-col justify-center items-center text-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Invitation Not Found</h2>
        <p className="text-gray-400 max-w-sm mb-6">The wedding invitation link you followed may have expired, or is currently unpublished.</p>
        <Link href="/" className="px-6 py-2 bg-[#d4af37] text-[#0d0d11] rounded font-bold hover:bg-[#b8962e] transition-all">
          Create Your Invitation
        </Link>
      </div>
    );
  }

  if (!isAdmin && (!invitation.owner_tier || invitation.owner_tier === 'free')) {
    return (
      <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col justify-center items-center text-center p-8 relative font-sans">
        {/* Background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-[480px] bg-[#161622]/40 backdrop-blur-md border border-[#26263b] rounded-[24px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.37)] z-10 space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-[20px] bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center animate-pulse">
              <Heart className="w-8 h-8 text-[#d4af37]" />
            </div>
          </div>
          
          <h2 className="text-2xl font-light text-white tracking-wider font-cinzel">Activation Pending</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            This wedding invitation link is currently in <strong>Draft Mode</strong>. The host needs to activate or upgrade their subscription plan to publish this invitation live.
          </p>
          
          <div className="h-[1px] bg-[#26263b] w-full my-4" />
          
          <p className="text-xs text-gray-500">
            Are you the owner of this invitation? Log in to your dashboard and complete activation.
          </p>
          
          <Link href="/login" className="inline-block px-6 py-2.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] text-xs font-bold uppercase tracking-wider rounded transition-all shadow-[0_2px_15px_rgba(212,175,55,0.15)] cursor-pointer">
            Log in to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <InvitationPreview 
        invitation={invitation} 
        onRsvpSubmit={handleRsvpSubmit} 
        isPreviewMode={false} 
      />
    </div>
  );
}
