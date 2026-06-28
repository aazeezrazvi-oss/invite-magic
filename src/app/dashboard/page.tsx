'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, Users, Gift, Eye, Edit2, Plus, BarChart2, ShieldAlert
} from 'lucide-react';
import { RSVP, GiftTransaction } from '@/types';
import CheckoutButton from '@/components/CheckoutButton';
import { supabase } from '@/utils/supabase';

// Mock values for dashboard statistics when DB has not loaded
const mockRsvps: RSVP[] = [
  { id: '1', invitation_id: 'mock-123', guest_name: 'Zeeshan Ahmed', attending_status: 'going', guest_count: 2, wishes: 'Congratulations to the beautiful couple!' },
  { id: '2', invitation_id: 'mock-123', guest_name: 'Maria Khan', attending_status: 'going', guest_count: 1, wishes: 'So happy for you both, Sana! Can\'t wait.' },
  { id: '3', invitation_id: 'mock-123', guest_name: 'Faizan Razvi', attending_status: 'pending', guest_count: 3 },
  { id: '4', invitation_id: 'mock-123', guest_name: 'Imran Qureshi', attending_status: 'not_going', guest_count: 0, wishes: 'Warmest wishes from Chicago. Sorry I cannot make it!' },
];

const mockGifts: GiftTransaction[] = [
  { id: 'g1', invitation_id: 'mock-123', sender_name: 'Zeeshan Ahmed', amount: 2000, message: 'Shagun from family', status: 'completed' },
  { id: 'g2', invitation_id: 'mock-123', sender_name: 'Dr. Siddiqui', amount: 5001, message: 'Blessings and love', status: 'completed' },
  { id: 'g3', invitation_id: 'mock-123', sender_name: 'Samina F.', amount: 1000, status: 'completed' },
];

export default function Dashboard() {
  const router = useRouter();
  const [slug, setSlug] = useState('abdul-sana');
  const [rsvps, setRsvps] = useState<RSVP[]>(mockRsvps);
  const [gifts, setGifts] = useState<GiftTransaction[]>(mockGifts);
  const [views, setViews] = useState(148);
  const [userEmail, setUserEmail] = useState<string>('loading...');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isVip, setIsVip] = useState<boolean>(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      let email = '';
      let isUserAdmin = false;
      let isUserVip = false;

      if (session?.user) {
        email = session.user.email || '';
        isUserAdmin = email === 'abdulazeezrazvi125@gmail.com';
        isUserVip = email === 'abdulazeezrazvi125@gmail.com' || email === 'abdulazeezrazvi97@gmail.com';
      } else {
        const mockEmail = localStorage.getItem('mock_user_email');
        if (mockEmail) {
          email = mockEmail;
          isUserAdmin = email === 'abdulazeezrazvi125@gmail.com';
          isUserVip = email === 'abdulazeezrazvi125@gmail.com' || email === 'abdulazeezrazvi97@gmail.com';
        } else {
          router.push('/login');
          return;
        }
      }

      setUserEmail(email);
      setIsAdmin(isUserAdmin);
      setIsVip(isUserVip);
    }
    loadUser();
  }, [router]);

  useEffect(() => {
    // Read local data override if any
    const localData = localStorage.getItem(`invite_${slug}`);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
      } catch (e) {
        console.error(e);
      }
    }
  }, [slug]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mock_user_email');
    localStorage.removeItem('mock_user_role');
    router.push('/login');
    router.refresh();
  };

  // Compute stats
  const totalAttending = rsvps
    .filter(r => r.attending_status === 'going')
    .reduce((acc, curr) => acc + curr.guest_count, 0);

  const totalNotAttending = rsvps
    .filter(r => r.attending_status === 'not_going')
    .length;

  const totalPending = rsvps
    .filter(r => r.attending_status === 'pending')
    .length;

  const totalGiftsAmount = gifts.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-[#26263b] bg-[#161622]/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
          <span className="text-lg font-bold tracking-wider font-cinzel text-[#d4af37]">InviteMagic</span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          {isAdmin && (
            <>
              <Link href="/admin" className="text-gray-400 hover:text-white uppercase tracking-widest font-semibold transition-all">
                Admin Panel
              </Link>
              <div className="h-4 w-[1px] bg-[#26263b]" />
            </>
          )}
          <span className="text-gray-300 font-mono flex items-center gap-1.5">
            {userEmail}
            {isVip && (
              <span className="px-1.5 py-0.5 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded text-[9px] text-[#d4af37] font-bold uppercase tracking-wider">
                VIP
              </span>
            )}
          </span>
          <div className="h-4 w-[1px] bg-[#26263b]" />
          <button 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* Upper Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#26263b] pb-6">
          <div>
            <h1 className="text-3xl font-light text-white font-cinzel">Your Invitations</h1>
            <p className="text-xs text-gray-400 mt-1">Manage themes, edit event timing schedules, and monitor gift records.</p>
          </div>
          <Link
            href={`/dashboard/edit/${slug}`}
            className="px-4 py-2.5 rounded bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_2px_15px_rgba(212,175,55,0.15)]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invitation</span>
          </Link>
        </div>

        {/* Invitation Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-6 flex flex-col justify-between hover:border-[#d4af37]/30 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white font-cinzel text-lg">Abdul & Sana</h3>
                  <span className="text-[10px] text-[#d4af37] font-mono select-all">/invite/abdul-sana</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] bg-green-500/10 border border-green-500/20 text-green-500 uppercase tracking-wider font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Template: Royal Gold. Features enabled: Countdown, couple bio cards, photo gallery, RSVP card, and UPI QR shagun collection.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Link
                href={`/dashboard/edit/${slug}`}
                className="flex-1 py-2 px-3 text-center bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Customize Code</span>
              </Link>
              <Link
                href={`/invite/${slug}`}
                target="_blank"
                className="py-2 px-3 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/20 rounded text-[#d4af37] text-xs font-semibold flex items-center justify-center transition-all"
              >
                <Eye className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Statistics Panel */}
        <div>
          <h2 className="text-xl font-bold text-white font-cinzel mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#d4af37]" />
            <span>Invitation Performance Analytics</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
              <span className="text-xs text-gray-400 block mb-1">Total Page Visits</span>
              <span className="text-2xl font-bold text-white">{views}</span>
            </div>
            <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
              <span className="text-xs text-gray-400 block mb-1">RSVPs: Attending</span>
              <span className="text-2xl font-bold text-green-500">{totalAttending} <span className="text-xs font-normal text-gray-400">guests</span></span>
            </div>
            <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
              <span className="text-xs text-gray-400 block mb-1">RSVPs: Pending / Decline</span>
              <span className="text-2xl font-bold text-yellow-500">{totalPending} <span className="text-xs font-normal text-gray-400">/ {totalNotAttending}</span></span>
            </div>
            <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
              <span className="text-xs text-gray-400 block mb-1">Total Digital Shagun</span>
              <span className="text-2xl font-bold text-[#d4af37]">₹{totalGiftsAmount}</span>
            </div>
          </div>
        </div>

        {/* RSVP and Gifts Lists Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Guest RSVPs List */}
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-6 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4 border-b border-[#26263b] pb-3">
              <h3 className="font-bold text-white font-cinzel flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#d4af37]" />
                <span>Guest RSVP Responses</span>
              </h3>
              <span className="text-[10px] bg-[#0d0d11] px-2 py-0.5 rounded border border-[#26263b] text-gray-400 font-semibold">
                {rsvps.length} Responses
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {rsvps.map((r) => (
                <div key={r.id} className="bg-[#0d0d11] p-3 rounded border border-[#26263b] flex justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white block">{r.guest_name}</span>
                    {r.wishes && <p className="italic text-gray-400 text-[11px] leading-relaxed">&ldquo;{r.wishes}&rdquo;</p>}
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    {r.attending_status === 'going' ? (
                      <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 font-bold uppercase tracking-wider text-[9px]">
                        Going ({r.guest_count})
                      </span>
                    ) : r.attending_status === 'not_going' ? (
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold uppercase tracking-wider text-[9px]">
                        Declined
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 font-bold uppercase tracking-wider text-[9px]">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Shagun Logs */}
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-6 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4 border-b border-[#26263b] pb-3">
              <h3 className="font-bold text-white font-cinzel flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[#d4af37]" />
                <span>UPI Gift Logs</span>
              </h3>
              <span className="text-[10px] bg-[#0d0d11] px-2 py-0.5 rounded border border-[#26263b] text-gray-400 font-semibold">
                ₹{totalGiftsAmount} Recieved
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {gifts.map((g) => (
                <div key={g.id} className="bg-[#0d0d11] p-3 rounded border border-[#26263b] flex justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white block">{g.sender_name || 'Anonymous Guest'}</span>
                    {g.message && <p className="italic text-gray-400 text-[11px] leading-relaxed">&ldquo;{g.message}&rdquo;</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-[#d4af37] block text-sm">₹{g.amount}</span>
                    <span className="text-[9px] text-green-500 mt-1 block uppercase tracking-wider font-semibold">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Upgrade Subscription Section */}
        <div className="bg-[#161622] border border-[#26263b] rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white font-cinzel flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#d4af37]" />
              <span>Upgrade Your Subscription Tier</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Unlock premium features, unlimited photos, and advanced gift analytics.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0d0d11] p-4 rounded border border-[#26263b] flex flex-col justify-between">
              <div>
                <span className="font-bold text-white block">Basic Upgrade</span>
                <span className="text-xs text-gray-400">6 Months Access</span>
                <p className="text-xs opacity-75 my-3">Allows 1 active invitation link, up to 20 photos, and basic UPI shagun collection.</p>
              </div>
              <CheckoutButton amount={299} tier="basic" className="mt-4 w-full" />
            </div>
            <div className="bg-[#0d0d11] p-4 rounded border border-[#d4af37]/30 flex flex-col justify-between relative">
              <span className="absolute -top-2.5 right-4 bg-[#d4af37] text-[#0d0d11] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">Popular</span>
              <div>
                <span className="font-bold text-[#d4af37] block">Premium Upgrade</span>
                <span className="text-xs text-gray-400">1 Year Access</span>
                <p className="text-xs opacity-75 my-3">Unlocks all templates, unlimited photos, and advanced gift logs dashboard.</p>
              </div>
              <CheckoutButton amount={499} tier="premium" className="mt-4 w-full" />
            </div>
            <div className="bg-[#0d0d11] p-4 rounded border border-[#26263b] flex flex-col justify-between">
              <div>
                <span className="font-bold text-white block">VIP Lifetime</span>
                <span className="text-xs text-gray-400">Lifetime Access</span>
                <p className="text-xs opacity-75 my-3">Adds custom domain mapping (Cloudflare), advanced analytics, and premium support.</p>
              </div>
              <CheckoutButton amount={999} tier="vip" className="mt-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
