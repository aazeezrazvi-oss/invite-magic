'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, Users, Gift, Eye, Edit2, Plus, BarChart2, ShieldAlert, User, Lock, Tag
} from 'lucide-react';
import { RSVP, GiftTransaction } from '@/types';
import CheckoutButton from '@/components/CheckoutButton';
import { supabase } from '@/utils/supabase';
import { upgradeUserSubscription, applyReferralCode, getAppliedReferralCode } from '@/app/actions';

export default function Dashboard() {
  const router = useRouter();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'invitations' | 'profile'>('invitations');
  
  // Invitation states
  const [invitationId, setInvitationId] = useState<string>('');
  const [slug, setSlug] = useState('abdul-sana');
  const [groomName, setGroomName] = useState('Abdul');
  const [brideName, setBrideName] = useState('Sana');
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [gifts, setGifts] = useState<GiftTransaction[]>([]);
  const [views, setViews] = useState(0);
  
  // User states
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('loading...');
  const [fullName, setFullName] = useState<string>('');
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  
  // Profile form states
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Referral States
  const [appliedReferral, setAppliedReferral] = useState<{ code: string; discount_percent: number } | null>(null);
  const [referralInput, setReferralInput] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralMessage, setReferralMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [loadingInvite, setLoadingInvite] = useState(true);

  // Load user session and user profile
  async function loadUserAndData() {
    const { data: { session } } = await supabase.auth.getSession();
    
    let currentUserId = '';
    let currentEmail = '';
    let currentFullName = '';
    
    if (session?.user) {
      currentUserId = session.user.id;
      currentEmail = session.user.email || '';
      currentFullName = session.user.user_metadata?.full_name || '';
      setUserId(currentUserId);
      setUserEmail(currentEmail);
      setFullName(currentFullName);
      setProfileName(currentFullName);
    } else {
      const mockEmail = localStorage.getItem('mock_user_email');
      if (mockEmail) {
        currentEmail = mockEmail;
        setUserEmail(mockEmail);
      } else {
        router.push('/login');
        return;
      }
    }

    // Load subscription tier from database
    if (currentUserId) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();
        
      if (userProfile) {
        setSubscriptionTier(userProfile.subscription_tier);
        setIsAdmin(userProfile.role === 'admin' || currentEmail === 'abdulazeezrazvi125@gmail.com');
        setIsVip(userProfile.subscription_tier === 'vip' || currentEmail === 'abdulazeezrazvi125@gmail.com' || currentEmail === 'abdulazeezrazvi97@gmail.com');
        setIsPaid(userProfile.subscription_tier !== 'free');

        // Load active referral
        if (userProfile.applied_referral_code) {
          const { data: refCode } = await supabase
            .from('referral_codes')
            .select('*')
            .eq('code', userProfile.applied_referral_code)
            .maybeSingle();

          if (refCode) {
            setAppliedReferral({ code: refCode.code, discount_percent: refCode.discount_percent });
            setReferralInput(refCode.code);
          } else {
            setAppliedReferral(null);
            setReferralInput('');
          }
        } else {
          setAppliedReferral(null);
          setReferralInput('');
        }
      } else {
        // Auto create missing user profile row
        const isBypass = currentEmail === 'abdulazeezrazvi125@gmail.com' || currentEmail === 'abdulazeezrazvi97@gmail.com';
        try {
          await supabase
            .from('users')
            .insert({
              id: currentUserId,
              email: currentEmail,
              role: (currentEmail === 'abdulazeezrazvi125@gmail.com') ? 'admin' : 'user',
              subscription_tier: isBypass ? 'vip' : 'free',
            });
        } catch (err) {
          console.error("Failed to auto-create missing user profile:", err);
        }

        setSubscriptionTier(isBypass ? 'vip' : 'free');
        setIsAdmin(currentEmail === 'abdulazeezrazvi125@gmail.com');
        setIsVip(isBypass);
        setIsPaid(isBypass);
        setAppliedReferral(null);
        setReferralInput('');
      }
    }

    // Load or create user invitation
    if (currentUserId) {
      setLoadingInvite(true);
      try {
        let { data: userInvite } = await supabase
          .from('invitations')
          .select('*')
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (!userInvite) {
          // Auto-create default invitation
          const baseSlug = currentEmail ? currentEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : 'wedding';
          const newSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
          
          const { data: createdInvite } = await supabase
            .from('invitations')
            .insert({
              user_id: currentUserId,
              slug: newSlug,
              groom_name: 'Abdul',
              bride_name: 'Sana',
              is_published: false,
            })
            .select('*')
            .single();
            
          if (createdInvite) {
            userInvite = createdInvite;
            // Create default styling
            await supabase.from('styling_preferences').insert({
              invitation_id: createdInvite.id,
              primary_color: '#d4af37',
              secondary_color: '#aa7c11',
              background_color: '#0d0d11',
              text_color: '#f3f4f6',
              font_heading: 'cinzel',
              font_body: 'inter',
              section_order: ['hero', 'countdown', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
              animation_style: 'fade',
              button_style: 'gold-border',
              countdown_style: 'circles',
              gallery_layout: 'grid',
              background_type: 'gradient',
            });
            // Create default gift collection details
            await supabase.from('gift_collection_details').insert({
              invitation_id: createdInvite.id,
              upi_id: 'shadi@okaxis',
              receiver_name: 'Abdul & Sana',
            });
          }
        }

        if (userInvite) {
          setInvitationId(userInvite.id);
          setSlug(userInvite.slug);
          setGroomName(userInvite.groom_name || 'Abdul');
          setBrideName(userInvite.bride_name || 'Sana');

          // Fetch real RSVPs
          const { data: rsvpData } = await supabase
            .from('rsvp')
            .select('*')
            .eq('invitation_id', userInvite.id)
            .order('created_at', { ascending: false });
          if (rsvpData) setRsvps(rsvpData || []);

          // Fetch real Gifts
          const { data: giftData } = await supabase
            .from('gift_transactions')
            .select('*')
            .eq('invitation_id', userInvite.id)
            .order('created_at', { ascending: false });
          if (giftData) setGifts(giftData || []);

          // Fetch real Views count from analytics
          const { count } = await supabase
            .from('analytics')
            .select('*', { count: 'exact', head: true })
            .eq('invitation_id', userInvite.id)
            .eq('event_type', 'view');
          setViews(count || 0);
        }
      } catch (err) {
        console.error('Error loading invitation details:', err);
      } finally {
        setLoadingInvite(false);
      }
    }
  }

  useEffect(() => {
    loadUserAndData();
  }, [router]);

  // Handle successful upgrade checkout
  const handleUpgradeSuccess = async (purchasedTier: 'basic' | 'premium' | 'vip') => {
    if (userId) {
      const ok = await upgradeUserSubscription(userId, purchasedTier);
      if (ok) {
        alert(`Upgrade to ${purchasedTier.toUpperCase()} plan active!`);
        loadUserAndData();
      } else {
        alert('Payment completed, but database update failed. Please contact support.');
      }
    }
  };

  // Handle Profile Update (Fixed race condition by combining metadata and password calls)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const updateData: any = {};
      if (profileName.trim() && profileName !== fullName) {
        updateData.data = { full_name: profileName };
      }
      if (profilePassword.trim()) {
        if (profilePassword !== profileConfirmPassword) {
          setProfileMessage({ type: 'error', text: 'Passwords do not match.' });
          setProfileLoading(false);
          return;
        }
        updateData.password = profilePassword;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateErr } = await supabase.auth.updateUser(updateData);
        if (updateErr) throw updateErr;

        if (updateData.data) {
          setFullName(profileName);
        }
        if (updateData.password) {
          setProfilePassword('');
          setProfileConfirmPassword('');
        }
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setProfileMessage({ type: 'error', text: 'No changes detected.' });
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setProfileMessage({
        type: 'error',
        text: err.message || 'Failed to update profile settings.'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Apply Referral Code
  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralInput.trim()) return;
    setReferralLoading(true);
    setReferralMessage(null);
    try {
      const res = await applyReferralCode(userId, referralInput.trim());
      if (res.success) {
        setReferralMessage({ type: 'success', text: res.message });
        if (res.discountPercent !== undefined) {
          setAppliedReferral({ code: referralInput.trim().toUpperCase(), discount_percent: res.discountPercent });
        }
        // Refresh profile states
        loadUserAndData();
      } else {
        setReferralMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setReferralMessage({ type: 'error', text: err.message || 'Failed to apply referral code.' });
    } finally {
      setReferralLoading(false);
    }
  };

  // Handle Remove Referral Code
  const handleRemoveReferral = async () => {
    setReferralLoading(true);
    setReferralMessage(null);
    try {
      const res = await applyReferralCode(userId, null);
      if (res.success) {
        setReferralMessage({ type: 'success', text: 'Referral discount code removed.' });
        setAppliedReferral(null);
        setReferralInput('');
        loadUserAndData();
      } else {
        setReferralMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setReferralMessage({ type: 'error', text: err.message || 'Failed to remove referral code.' });
    } finally {
      setReferralLoading(false);
    }
  };

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

  const totalGiftsAmount = gifts.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-[#26263b] bg-[#161622]/50 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Heart className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
          <span className="text-base sm:text-lg font-bold tracking-wider font-cinzel text-[#d4af37]">InviteMagic</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs flex-wrap">
          {isAdmin && (
            <>
              <Link href="/admin" className="text-gray-400 hover:text-white uppercase tracking-widest font-semibold transition-all">
                Admin
              </Link>
              <div className="h-4 w-[1px] bg-[#26263b] hidden sm:block" />
            </>
          )}
          <span className="text-gray-300 font-mono flex items-center gap-1 max-w-[140px] sm:max-w-none truncate">
            {userEmail}
            {isVip && (
              <span className="px-1.5 py-0.5 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded text-[9px] text-[#d4af37] font-bold uppercase tracking-wider shrink-0">
                VIP
              </span>
            )}
          </span>
          <button 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Sub-navbar with Tabs */}
      <div className="bg-[#161622]/20 border-b border-[#26263b] px-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-3.5 text-xs font-semibold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
              activeTab === 'invitations'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            My Invitations
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 text-xs font-semibold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Profile Settings
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {activeTab === 'profile' ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#161622] border border-[#26263b] rounded-lg p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-cinzel flex items-center gap-2">
                  <User className="w-5 h-5 text-[#d4af37]" />
                  <span>Profile Settings</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">Manage your name, email, account details and change your password.</p>
              </div>

              {profileMessage && (
                <div className={`p-3.5 rounded-lg text-xs border ${
                  profileMessage.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={userEmail}
                    className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed outline-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Email address cannot be changed.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                  />
                </div>

                <div className="h-[1px] bg-[#26263b] my-6" />

                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Change Password</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">New Password</label>
                      <input
                        type="password"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                      <input
                        type="password"
                        value={profileConfirmPassword}
                        onChange={(e) => setProfileConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-lg transition-all text-xs outline-none focus:ring-2 focus:ring-[#d4af37]/50 disabled:opacity-50 cursor-pointer"
                >
                  {profileLoading ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </form>
            </div>

            {/* Referral / Promo Code Section */}
            <div className="bg-[#161622] border border-[#26263b] rounded-lg p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-cinzel flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#d4af37]" />
                  <span>Referral & Promo Code</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">Activate a referral code to apply a discount percentage on your subscription upgrades.</p>
              </div>

              {referralMessage && (
                <div className={`p-3.5 rounded-lg text-xs border ${
                  referralMessage.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {referralMessage.text}
                </div>
              )}

              {appliedReferral ? (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-semibold mb-1">Active Referral Code</span>
                    <span className="font-mono text-base font-bold text-white tracking-widest bg-black/40 px-2 py-0.5 rounded border border-[#26263b]">{appliedReferral.code}</span>
                    <span className="block text-xs text-green-400 font-semibold mt-2">{appliedReferral.discount_percent}% Discount is active on upgrades!</span>
                  </div>
                  <button
                    onClick={handleRemoveReferral}
                    disabled={referralLoading}
                    className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded text-xs transition-all cursor-pointer"
                  >
                    {referralLoading ? 'Removing...' : 'Remove Code'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyReferral} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    placeholder="Enter Referral Code (e.g. WED50)"
                    className="flex-grow bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all uppercase font-mono"
                  />
                  <button
                    type="submit"
                    disabled={referralLoading || !referralInput.trim()}
                    className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-lg transition-all text-xs outline-none focus:ring-2 focus:ring-[#d4af37]/50 disabled:opacity-50 cursor-pointer"
                  >
                    {referralLoading ? 'Activating...' : 'Apply Code'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <>
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

            {loadingInvite ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400 tracking-wider uppercase font-semibold">Loading invitation...</span>
              </div>
            ) : (
              /* Invitation Cards List */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#161622] border border-[#26263b] rounded-lg p-6 flex flex-col justify-between hover:border-[#d4af37]/30 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-white font-cinzel text-lg">{groomName} & {brideName}</h3>
                        <span className="text-[10px] text-[#d4af37] font-mono select-all">/invite/{slug}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold border ${
                        isPaid 
                          ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                          : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                      }`}>
                        {isPaid ? 'Active / Paid' : 'Draft / Unpaid'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-6">
                      Customize countdown, couple cards, photo gallery, RSVP responses, and UPI digital gift logs.
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
            )}

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
                  {rsvps.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-1">
                      <span>No guest responses yet.</span>
                      <span className="text-[10px] text-gray-600">Responses will appear here when guests submit their RSVP.</span>
                    </div>
                  ) : (
                    rsvps.map((r) => (
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
                    ))
                  )}
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
                  {gifts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-1">
                      <span>No gift records yet.</span>
                      <span className="text-[10px] text-gray-600">Digital blessings and gifts will log here.</span>
                    </div>
                  ) : (
                    gifts.map((g) => (
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
                    ))
                  )}
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
                {appliedReferral && (
                  <span className="inline-block text-[11px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    🎉 Promo Discount Active: {appliedReferral.discount_percent}% off applied at checkout!
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Basic Upgrade */}
                <div className="bg-[#0d0d11] p-4 rounded border border-[#26263b] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white block">Basic Upgrade</span>
                      {appliedReferral ? (
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 line-through block">₹299</span>
                          <span className="font-bold text-[#d4af37] text-sm">₹{Math.round(299 - (299 * appliedReferral.discount_percent / 100))}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-white">₹299</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 block">6 Months Access</span>
                    <p className="text-xs opacity-75 my-3">Allows 1 active invitation link, up to 20 photos, and basic UPI shagun collection.</p>
                  </div>
                  <CheckoutButton amount={appliedReferral ? Math.round(299 - (299 * appliedReferral.discount_percent / 100)) : 299} tier="basic" userId={userId} userEmail={userEmail} onSuccess={() => handleUpgradeSuccess('basic')} className="mt-4 w-full cursor-pointer" />
                </div>

                {/* Premium Upgrade */}
                <div className="bg-[#0d0d11] p-4 rounded border border-[#d4af37]/35 flex flex-col justify-between relative shadow-[0_0_15px_rgba(212,175,55,0.03)]">
                  <span className="absolute -top-2.5 right-4 bg-[#d4af37] text-[#0d0d11] text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">Popular</span>
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-[#d4af37] block">Premium Upgrade</span>
                      {appliedReferral ? (
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 line-through block">₹499</span>
                          <span className="font-bold text-[#d4af37] text-sm">₹{Math.round(499 - (499 * appliedReferral.discount_percent / 100))}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-[#d4af37]">₹499</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 block">1 Year Access</span>
                    <p className="text-xs opacity-75 my-3">Unlocks all templates, unlimited photos, and advanced gift logs dashboard.</p>
                  </div>
                  <CheckoutButton amount={appliedReferral ? Math.round(499 - (499 * appliedReferral.discount_percent / 100)) : 499} tier="premium" userId={userId} userEmail={userEmail} onSuccess={() => handleUpgradeSuccess('premium')} className="mt-4 w-full cursor-pointer" />
                </div>

                {/* VIP Lifetime */}
                <div className="bg-[#0d0d11] p-4 rounded border border-[#26263b] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white block">VIP Lifetime</span>
                      {appliedReferral ? (
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 line-through block">₹999</span>
                          <span className="font-bold text-[#d4af37] text-sm">₹{Math.round(999 - (999 * appliedReferral.discount_percent / 100))}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-white">₹999</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 block">Lifetime Access</span>
                    <p className="text-xs opacity-75 my-3">Adds custom domain mapping (Cloudflare), advanced analytics, and premium support.</p>
                  </div>
                  <CheckoutButton amount={appliedReferral ? Math.round(999 - (999 * appliedReferral.discount_percent / 100)) : 999} tier="vip" userId={userId} userEmail={userEmail} onSuccess={() => handleUpgradeSuccess('vip')} className="mt-4 w-full cursor-pointer" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
