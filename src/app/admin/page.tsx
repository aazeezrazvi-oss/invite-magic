'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, Users, Layers, CreditCard, Power, Eye, CheckCircle2,
  Tag, Film, Image, Music, Plus, Trash2, ShieldAlert
} from 'lucide-react';
import { 
  getAdminDashboardData, 
  updateUserTierAdmin, 
  toggleInvitationSuspensionAdmin, 
  createReferralCodeAdmin, 
  deleteReferralCodeAdmin, 
  createMediaAssetAdmin, 
  deleteMediaAssetAdmin 
} from '@/app/actions';
import { supabase } from '@/utils/supabase';
import { ReferralCode, MediaAsset } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();
  
  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<ReferralCode[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  
  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'invites' | 'payments' | 'referrals' | 'media'>('users');
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Form States - Referral Code
  const [newRefCode, setNewRefCode] = useState('');
  const [newRefDiscount, setNewRefDiscount] = useState<number>(20);
  const [addingReferral, setAddingReferral] = useState(false);

  // Form States - Media Asset URL
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaName, setNewMediaName] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video' | 'music'>('image');
  const [addingMedia, setAddingMedia] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Verify Admin Access
  useEffect(() => {
    async function verifyAdmin() {
      setVerifying(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const email = session?.user?.email || localStorage.getItem('mock_user_email') || '';
      
      if (session?.user) {
        let { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const isBypassAdmin = email === 'abdulazeezrazvi125@gmail.com' || email === 'abdulazeezrazvi97@gmail.com';

        // Auto create missing admin profile row
        if (!userProfile && isBypassAdmin) {
          try {
            await supabase.from('users').insert({
              id: session.user.id,
              email: email,
              role: 'admin',
              subscription_tier: 'vip',
            });
            userProfile = { role: 'admin' };
          } catch (err) {
            console.error("Failed to auto-create admin profile row:", err);
          }
        }

        if (userProfile?.role === 'admin' || isBypassAdmin) {
          setIsAdmin(true);
          loadAllData();
        } else {
          router.push('/dashboard');
        }
      } else if (email === 'abdulazeezrazvi125@gmail.com' || email === 'abdulazeezrazvi97@gmail.com') {
        setIsAdmin(true);
        loadAllData();
      } else {
        router.push('/login');
      }
      setVerifying(false);
    }
    verifyAdmin();
  }, [router]);

  // Load Real Data (Uses client-side authenticated queries to satisfy RLS policies)
  async function loadAllData() {
    setLoading(true);
    try {
      // 1. Fetch Users
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersErr) throw usersErr;

      // Build a user lookup map (id -> email)
      const userMap: Record<string, string> = {};
      (usersData || []).forEach((u: any) => { userMap[u.id] = u.email; });

      // 2. Fetch Invitations (no join — use userMap for owner email)
      const { data: invData, error: invErr } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (invErr) throw invErr;

      // 3. Fetch Payments (no join — use userMap for customer email)
      const { data: payData, error: payErr } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (payErr) throw payErr;

      // 4. Fetch Referral Codes
      const { data: refData, error: refErr } = await supabase
        .from('referral_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (refErr) throw refErr;

      // 5. Fetch Media Assets
      const { data: mediaData, error: mediaErr } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (mediaErr) throw mediaErr;

      // Format data using userMap lookup
      const formattedInvitations = (invData || []).map((inv: any) => ({
        id: inv.id,
        slug: inv.slug,
        user_id: inv.user_id,
        is_published: inv.is_published,
        is_suspended: inv.is_suspended || false,
        owner: userMap[inv.user_id] || 'Unknown User',
      }));

      const formattedPayments = (payData || []).map((pay: any) => ({
        id: pay.id,
        email: userMap[pay.user_id] || 'Unknown User',
        orderId: pay.order_id,
        paymentId: pay.payment_id,
        amount: pay.amount,
        status: pay.status,
        tier: pay.tier,
        created_at: pay.created_at,
      }));

      setUsers(usersData || []);
      setInvitations(formattedInvitations);
      setPayments(formattedPayments);
      setReferrals(refData || []);
      setMediaAssets(mediaData || []);
    } catch (err: any) {
      console.error("Error loading admin dashboard data:", err);
      alert("Error loading dashboard data: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle User Subscription Tier Change
  const handleUpdateUserTier = async (userId: string, tier: 'free' | 'basic' | 'premium' | 'vip') => {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_expires_at: tier === 'free' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_tier: tier } : u));
      alert('Customer tier updated successfully!');
    } else {
      alert('Failed to update customer subscription tier: ' + error.message);
    }
  };

  // Handle Suspend/Activate Invitation link
  const handleToggleSuspension = async (invitationId: string, currentSuspended: boolean) => {
    const nextStatus = !currentSuspended;
    const { error } = await supabase
      .from('invitations')
      .update({
        is_suspended: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (!error) {
      setInvitations(prev => prev.map(inv => inv.id === invitationId ? { ...inv, is_suspended: nextStatus } : inv));
      alert(`Invitation link ${nextStatus ? 'suspended' : 'activated'} successfully!`);
    } else {
      alert('Failed to update suspension status: ' + error.message);
    }
  };

  // Add Referral Code
  const handleAddReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefCode.trim()) return;
    setAddingReferral(true);
    
    const cleanCode = newRefCode.trim().toUpperCase();
    const { error } = await supabase
      .from('referral_codes')
      .insert({
        code: cleanCode,
        discount_percent: newRefDiscount,
      });

    if (!error) {
      setNewRefCode('');
      setNewRefDiscount(20);
      loadAllData();
      alert('Referral discount code created!');
    } else {
      console.error("Error creating referral code:", error);
      alert('Failed to create code: ' + error.message);
    }
    setAddingReferral(false);
  };

  // Delete Referral Code
  const handleDeleteReferral = async (code: string) => {
    if (!confirm(`Are you sure you want to delete referral code "${code}"?`)) return;
    const { error } = await supabase
      .from('referral_codes')
      .delete()
      .eq('code', code);

    if (!error) {
      setReferrals(prev => prev.filter(ref => ref.code !== code));
      alert('Referral code deleted.');
    } else {
      alert('Failed to delete referral code: ' + error.message);
    }
  };

  // Add Media Asset via URL
  const handleAddMediaUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl.trim() || !newMediaName.trim()) return;
    setAddingMedia(true);

    const { error } = await supabase
      .from('media_assets')
      .insert({
        url: newMediaUrl.trim(),
        media_type: newMediaType,
        filename: newMediaName.trim(),
      });

    if (!error) {
      setNewMediaUrl('');
      setNewMediaName('');
      loadAllData();
      alert('Media asset registered successfully!');
    } else {
      alert('Failed to register media asset: ' + error.message);
    }
    setAddingMedia(false);
  };

  // Upload Media Asset File
  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'music') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `media_${type}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      const { error: dbErr } = await supabase
        .from('media_assets')
        .insert({
          url: publicUrl,
          media_type: type,
          filename: file.name.split('.')[0],
        });

      if (!dbErr) {
        loadAllData();
        alert('Media asset uploaded and registered!');
      } else {
        alert('File uploaded, but database registration failed: ' + dbErr.message);
      }
    } catch (err: any) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  // Delete Media Asset
  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to remove this media asset?')) return;
    const { error } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', id);

    if (!error) {
      setMediaAssets(prev => prev.filter(media => media.id !== id));
      alert('Media asset deleted.');
    } else {
      alert('Failed to delete media asset: ' + error.message);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#0d0d11] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 font-semibold tracking-wider font-cinzel">Verifying Admin Access...</span>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-[#26263b] bg-[#161622]/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
            <span className="text-lg font-bold tracking-wider font-cinzel text-[#d4af37]">InviteMagic</span>
          </Link>
          <div className="h-4 w-[1px] bg-[#26263b]" />
          <span className="text-[10px] bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded uppercase font-bold tracking-widest">
            Admin Console
          </span>
        </div>
        <Link href="/dashboard" className="text-xs uppercase tracking-widest font-semibold hover:text-white transition-all">
          Exit Admin
        </Link>
      </nav>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        
        {/* Upper Title */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-light text-white font-cinzel">Admin Control Panel</h1>
            <p className="text-xs text-gray-400 mt-1">Manage real customer profiles, suspension limits, discounts, and template media assets.</p>
          </div>
          <button 
            onClick={loadAllData} 
            className="px-3 py-1.5 bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-semibold"
          >
            Refresh Database
          </button>
        </div>

        {/* Global Statistics metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
            <span className="text-xs text-gray-400 block mb-1">Real Users</span>
            <span className="text-2xl font-bold text-white">{users.length}</span>
          </div>
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
            <span className="text-xs text-gray-400 block mb-1">Active Invitations</span>
            <span className="text-2xl font-bold text-green-500">
              {invitations.filter(i => !i.is_suspended).length}
            </span>
          </div>
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
            <span className="text-xs text-gray-400 block mb-1">Suspended Links</span>
            <span className="text-2xl font-bold text-red-500">
              {invitations.filter(i => i.is_suspended).length}
            </span>
          </div>
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
            <span className="text-xs text-gray-400 block mb-1">Gross Revenue</span>
            <span className="text-2xl font-bold text-[#d4af37]">₹{payments.reduce((acc, curr) => acc + curr.amount, 0)}</span>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-[#26263b] text-xs overflow-x-auto whitespace-nowrap scrollbar-thin">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-5 font-semibold border-b-2 capitalize transition-all flex items-center gap-1.5 ${
              activeTab === 'users' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`py-3 px-5 font-semibold border-b-2 capitalize transition-all flex items-center gap-1.5 ${
              activeTab === 'invites' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Invitations ({invitations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-5 font-semibold border-b-2 capitalize transition-all flex items-center gap-1.5 ${
              activeTab === 'payments' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments ({payments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-3 px-5 font-semibold border-b-2 capitalize transition-all flex items-center gap-1.5 ${
              activeTab === 'referrals' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Referrals Editor ({referrals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`py-3 px-5 font-semibold border-b-2 capitalize transition-all flex items-center gap-1.5 ${
              activeTab === 'media' ? 'border-[#d4af37] text-[#d4af37]' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Media Library ({mediaAssets.length})</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="bg-[#161622] border border-[#26263b] rounded-lg overflow-hidden text-xs">
          
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-400 font-semibold tracking-widest uppercase">Loading Database...</span>
            </div>
          ) : (
            <>
              {activeTab === 'users' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-[#0f0f18] text-gray-400 border-b border-[#26263b]">
                        <th className="p-4">Customer Email</th>
                        <th className="p-4">Account Type</th>
                        <th className="p-4">Active Tier</th>
                        <th className="p-4">Referral Code</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26263b]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#1c1c2b] transition-all">
                          <td className="p-4 font-semibold text-white">{u.email}</td>
                          <td className="p-4 capitalize">{u.role}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                              u.subscription_tier === 'vip' ? 'bg-purple-500/10 text-purple-400' :
                              u.subscription_tier === 'premium' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                              u.subscription_tier === 'basic' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                            }`}>
                              {u.subscription_tier}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-gray-400">
                            {u.applied_referral_code ? (
                              <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-[10px]">
                                {u.applied_referral_code}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <select
                              value={u.subscription_tier}
                              onChange={(e) => handleUpdateUserTier(u.id, e.target.value as any)}
                              className="bg-[#0d0d11] border border-[#26263b] text-white rounded p-1 text-[11px] outline-none"
                            >
                              {['free', 'basic', 'premium', 'vip'].map(t => (
                                <option key={t} value={t}>{t.toUpperCase()}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'invites' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#0f0f18] text-gray-400 border-b border-[#26263b]">
                        <th className="p-4">Invitation Link</th>
                        <th className="p-4">Owner Email</th>
                        <th className="p-4">Publish Mode</th>
                        <th className="p-4">Suspended</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26263b]">
                      {invitations.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#1c1c2b] transition-all">
                          <td className="p-4 font-mono text-[#d4af37] font-semibold">/invite/{inv.slug}</td>
                          <td className="p-4">{inv.owner}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.is_published ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {inv.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="p-4 uppercase">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.is_suspended ? 'bg-red-500/15 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500'
                            }`}>
                              {inv.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <a
                                href={`/invite/${inv.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 rounded text-[#d4af37] text-[10px] font-bold uppercase tracking-wider transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Open Live
                              </a>
                              <button
                                onClick={() => handleToggleSuspension(inv.id, inv.is_suspended)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                  inv.is_suspended 
                                    ? 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-500' 
                                    : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-500'
                                }`}
                                title={inv.is_suspended ? 'Unsuspend Link' : 'Suspend Link'}
                              >
                                <Power className="w-3.5 h-3.5" />
                                {inv.is_suspended ? 'Activate' : 'Suspend'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#0f0f18] text-gray-400 border-b border-[#26263b]">
                        <th className="p-4">Razorpay Payment ID</th>
                        <th className="p-4">Customer Email</th>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Tier</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26263b]">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-[#1c1c2b] transition-all">
                          <td className="p-4 font-mono font-semibold text-white">{p.paymentId || p.id}</td>
                          <td className="p-4">{p.email}</td>
                          <td className="p-4 font-mono text-gray-400">{p.orderId}</td>
                          <td className="p-4 font-mono text-white">₹{p.amount}</td>
                          <td className="p-4 uppercase">{p.tier}</td>
                          <td className="p-4 capitalize">
                            <span className="flex items-center gap-1 text-green-500 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{p.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">No payment logs found in database.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'referrals' && (
                <div className="p-6 space-y-6">
                  {/* Create Referral Form */}
                  <form onSubmit={handleAddReferral} className="bg-[#0d0d11]/80 border border-[#26263b] rounded-xl p-5 space-y-4 max-w-xl">
                    <h3 className="font-bold text-white uppercase tracking-wider font-cinzel text-xs flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-[#d4af37]" />
                      <span>Create Referral / Discount Code</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold">Code Name</label>
                        <input
                          type="text"
                          required
                          value={newRefCode}
                          onChange={(e) => setNewRefCode(e.target.value)}
                          placeholder="e.g. DISCOUNT50"
                          className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] uppercase font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold">Discount Percentage (%)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          max={100}
                          value={newRefDiscount}
                          onChange={(e) => setNewRefDiscount(Number(e.target.value))}
                          className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={addingReferral}
                      className="px-4 py-2 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded flex items-center gap-1 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{addingReferral ? 'Creating...' : 'Add Code'}</span>
                    </button>
                  </form>

                  {/* Referral Codes List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Active Referral Codes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {referrals.map((ref) => (
                        <div key={ref.code} className="bg-[#0d0d11] border border-[#26263b] p-4 rounded-lg flex justify-between items-center hover:border-[#d4af37]/30 transition-all">
                          <div className="space-y-1">
                            <span className="font-mono text-base font-bold text-white tracking-wider">{ref.code}</span>
                            <span className="block text-xs text-green-400 font-semibold">{ref.discount_percent}% Discount Active</span>
                          </div>
                          <button
                            onClick={() => handleDeleteReferral(ref.code)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      ))}
                      {referrals.length === 0 && (
                        <p className="text-gray-500 italic">No referral codes created yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="p-6 space-y-8">
                  
                  {/* Media uploads controls grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Add Media via Direct URL */}
                    <form onSubmit={handleAddMediaUrl} className="bg-[#0d0d11]/80 border border-[#26263b] rounded-xl p-5 space-y-4">
                      <h3 className="font-bold text-white uppercase tracking-wider font-cinzel text-xs flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-[#d4af37]" />
                        <span>Link Media Asset via URL</span>
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold">Asset Name / Title</label>
                          <input
                            type="text"
                            required
                            value={newMediaName}
                            onChange={(e) => setNewMediaName(e.target.value)}
                            placeholder="e.g. Royal Gold Background"
                            className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold">Asset URL</label>
                          <input
                            type="text"
                            required
                            value={newMediaUrl}
                            onChange={(e) => setNewMediaUrl(e.target.value)}
                            placeholder="e.g. https://example.com/asset.mp4"
                            className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 text-[10px] uppercase font-bold">Media Type</label>
                          <select
                            value={newMediaType}
                            onChange={(e) => setNewMediaType(e.target.value as any)}
                            className="w-full bg-[#161622] border border-[#26263b] rounded px-3 py-2 text-white outline-none focus:border-[#d4af37]"
                          >
                            <option value="image">Background Image</option>
                            <option value="video">Background Video</option>
                            <option value="music">Background Music (MP3)</option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={addingMedia}
                        className="px-4 py-2 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded flex items-center gap-1 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{addingMedia ? 'Adding...' : 'Link Asset'}</span>
                      </button>
                    </form>

                    {/* Direct file uploads */}
                    <div className="bg-[#0d0d11]/80 border border-[#26263b] rounded-xl p-5 space-y-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-white uppercase tracking-wider font-cinzel text-xs flex items-center gap-1.5 mb-2">
                          <Film className="w-4 h-4 text-[#d4af37]" />
                          <span>Direct File Upload Controls</span>
                        </h3>
                        <p className="text-[11px] text-gray-400 mb-4 leading-normal">
                          Directly upload high-quality images, background loops (mp4), and audio tracks (mp3) to your Supabase storage library.
                        </p>
                        
                        <div className="space-y-3">
                          {/* Image upload */}
                          <div className="flex justify-between items-center p-2.5 bg-[#161622] rounded border border-[#26263b]">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <Image className="w-4 h-4 text-blue-400" />
                              <span>Background Image</span>
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              id="admin-image-upload"
                              className="hidden"
                              onChange={(e) => handleMediaFileUpload(e, 'image')}
                            />
                            <label
                              htmlFor="admin-image-upload"
                              className="px-3 py-1 bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-semibold cursor-pointer transition-all"
                            >
                              Upload Image
                            </label>
                          </div>

                          {/* Video upload */}
                          <div className="flex justify-between items-center p-2.5 bg-[#161622] rounded border border-[#26263b]">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <Film className="w-4 h-4 text-purple-400" />
                              <span>Background Video (MP4)</span>
                            </span>
                            <input
                              type="file"
                              accept="video/mp4"
                              id="admin-video-upload"
                              className="hidden"
                              onChange={(e) => handleMediaFileUpload(e, 'video')}
                            />
                            <label
                              htmlFor="admin-video-upload"
                              className="px-3 py-1 bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-semibold cursor-pointer transition-all"
                            >
                              Upload Video
                            </label>
                          </div>

                          {/* Music upload */}
                          <div className="flex justify-between items-center p-2.5 bg-[#161622] rounded border border-[#26263b]">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <Music className="w-4 h-4 text-green-400" />
                              <span>Background Music (MP3)</span>
                            </span>
                            <input
                              type="file"
                              accept="audio/mp3,audio/mpeg"
                              id="admin-music-upload"
                              className="hidden"
                              onChange={(e) => handleMediaFileUpload(e, 'music')}
                            />
                            <label
                              htmlFor="admin-music-upload"
                              className="px-3 py-1 bg-[#26263b] hover:bg-[#34344d] rounded text-white text-xs font-semibold cursor-pointer transition-all"
                            >
                              Upload Music
                            </label>
                          </div>
                        </div>
                      </div>

                      {uploadingMedia && (
                        <div className="flex items-center gap-2 pt-4 justify-center text-[#d4af37] font-semibold text-xs">
                          <div className="w-4 h-4 border-2 border-t-transparent border-[#d4af37] rounded-full animate-spin" />
                          <span>Uploading file to Storage...</span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* List of library assets */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Registered Assets Library</h4>
                    
                    {/* Media Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mediaAssets.map((asset) => (
                        <div key={asset.id} className="bg-[#0d0d11] border border-[#26263b] p-4 rounded-lg flex flex-col justify-between gap-3 hover:border-[#d4af37]/30 transition-all">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-semibold text-white text-sm truncate max-w-[170px]" title={asset.filename}>
                                {asset.filename}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${
                                asset.media_type === 'image' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                asset.media_type === 'video' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                'bg-green-500/10 text-green-400 border border-green-500/20'
                              }`}>
                                {asset.media_type}
                              </span>
                            </div>
                            <span className="block text-[10px] text-gray-500 font-mono truncate select-all mt-1.5">{asset.url}</span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-[#26263b]">
                            {/* Preview asset */}
                            {asset.media_type === 'image' && (
                              <img src={asset.url} alt="Preview" className="w-10 h-10 object-cover rounded border border-[#26263b]" />
                            )}
                            {asset.media_type === 'video' && (
                              <video src={asset.url} muted className="w-14 h-10 object-cover rounded border border-[#26263b]" />
                            )}
                            {asset.media_type === 'music' && (
                              <audio src={asset.url} controls className="h-6 w-32 outline-none scale-90" />
                            )}
                            <button
                              onClick={() => handleDeleteMedia(asset.id)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-all cursor-pointer flex items-center justify-center self-end"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {mediaAssets.length === 0 && (
                        <p className="text-gray-500 italic">No media assets in the library yet. Link or upload some above!</p>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
