'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, Users, Layers, CreditCard, Power, Eye, CheckCircle2 
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  tier: 'free' | 'basic' | 'premium' | 'vip';
  expires: string;
}

interface AdminInvitation {
  id: string;
  slug: string;
  owner: string;
  status: 'active' | 'suspended';
  views: number;
}

interface AdminPayment {
  id: string;
  email: string;
  orderId: string;
  amount: number;
  tier: string;
  status: string;
}

const mockUsers: AdminUser[] = [
  { id: 'u1', email: 'abdul@example.com', role: 'user', tier: 'premium', expires: '2027-06-19' },
  { id: 'u2', email: 'sana@example.com', role: 'user', tier: 'vip', expires: 'Lifetime' },
  { id: 'u3', email: 'razvi@example.com', role: 'user', tier: 'basic', expires: '2026-12-19' },
  { id: 'u4', email: 'guest@example.com', role: 'user', tier: 'free', expires: '-' },
];

const mockInvitations: AdminInvitation[] = [
  { id: 'i1', slug: 'abdul-sana', owner: 'abdul@example.com', status: 'active', views: 148 },
  { id: 'i2', slug: 'razvi-family', owner: 'razvi@example.com', status: 'active', views: 82 },
  { id: 'i3', slug: 'test-invitation', owner: 'guest@example.com', status: 'suspended', views: 5 },
];

const mockPayments: AdminPayment[] = [
  { id: 'p1', email: 'abdul@example.com', orderId: 'order_abc123', amount: 499, tier: 'Premium', status: 'verified' },
  { id: 'p2', email: 'sana@example.com', orderId: 'order_xyz789', amount: 999, tier: 'VIP', status: 'verified' },
  { id: 'p3', email: 'razvi@example.com', orderId: 'order_qwe456', amount: 299, tier: 'Basic', status: 'verified' },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [invitations, setInvitations] = useState<AdminInvitation[]>(mockInvitations);
  const [payments, setPayments] = useState<AdminPayment[]>(mockPayments);
  const [activeTab, setActiveTab] = useState<'users' | 'invites' | 'payments'>('users');

  const toggleInviteStatus = (id: string) => {
    setInvitations(prev => prev.map(inv => {
      if (inv.id === id) {
        return { ...inv, status: inv.status === 'active' ? 'suspended' : 'active' };
      }
      return inv;
    }));
  };

  const updateUserTier = (id: string, tier: 'free' | 'basic' | 'premium' | 'vip') => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, tier };
      }
      return u;
    }));
  };

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
        <div>
          <h1 className="text-3xl font-light text-white font-cinzel">Admin Control Panel</h1>
          <p className="text-xs text-gray-400 mt-1">Monitor payments, adjust subscription tiers, toggle active templates, and manage customers.</p>
        </div>

        {/* Global Statistics metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
            <span className="text-xs text-gray-400 block mb-1">Total Users</span>
            <span className="text-2xl font-bold text-white">{users.length}</span>
          </div>
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
            <span className="text-xs text-gray-400 block mb-1">Active Invitations</span>
            <span className="text-2xl font-bold text-green-500">
              {invitations.filter(i => i.status === 'active').length}
            </span>
          </div>
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
            <span className="text-xs text-gray-400 block mb-1">Suspended Invitations</span>
            <span className="text-2xl font-bold text-red-500">
              {invitations.filter(i => i.status === 'suspended').length}
            </span>
          </div>
          <div className="bg-[#161622] border border-[#26263b] rounded-lg p-5">
            <span className="text-xs text-gray-400 block mb-1">Gross Revenue</span>
            <span className="text-2xl font-bold text-[#d4af37]">₹{payments.reduce((acc, curr) => acc + curr.amount, 0)}</span>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-[#26263b] text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-6 font-semibold border-b-2 capitalize transition-all flex items-center gap-1.5 ${
              activeTab === 'users' 
                ? 'border-[#d4af37] text-[#d4af37]' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Accounts ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`py-3 px-6 font-semibold border-b-2 capitalize transition-all flex items-center gap-1.5 ${
              activeTab === 'invites' 
                ? 'border-[#d4af37] text-[#d4af37]' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Active Invitations ({invitations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-6 font-semibold border-b-2 capitalize transition-all flex items-center gap-1.5 ${
              activeTab === 'payments' 
                ? 'border-[#d4af37] text-[#d4af37]' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Razorpay Payments ({payments.length})</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="bg-[#161622] border border-[#26263b] rounded-lg overflow-hidden text-xs">
          
          {activeTab === 'users' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f0f18] text-gray-400 border-b border-[#26263b]">
                  <th className="p-4">Customer Email</th>
                  <th className="p-4">Account Type</th>
                  <th className="p-4">Active Tier</th>
                  <th className="p-4">Expiration</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26263b]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#1c1c2b] transition-all">
                    <td className="p-4 font-semibold text-white">{u.email}</td>
                    <td className="p-4 capitalize">{u.role}</td>
                    <td className="p-4 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.tier === 'vip' ? 'bg-purple-500/10 text-purple-400' :
                        u.tier === 'premium' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                        u.tier === 'basic' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {u.tier}
                      </span>
                    </td>
                    <td className="p-4">{u.expires}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <select
                        value={u.tier}
                        onChange={(e) => updateUserTier(u.id, e.target.value as 'free' | 'basic' | 'premium' | 'vip')}
                        className="bg-[#0d0d11] border border-[#26263b] text-white rounded p-1 text-[11px] outline-none"
                      >
                        {['free', 'basic', 'premium', 'vip'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'invites' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f0f18] text-gray-400 border-b border-[#26263b]">
                  <th className="p-4">Invitation Link slug</th>
                  <th className="p-4">Owner Email</th>
                  <th className="p-4">Views</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26263b]">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#1c1c2b] transition-all">
                    <td className="p-4 font-mono text-[#d4af37] font-semibold">/invite/{inv.slug}</td>
                    <td className="p-4">{inv.owner}</td>
                    <td className="p-4 font-mono">{inv.views}</td>
                    <td className="p-4 uppercase">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-3">
                      <a
                        href={`/invite/${inv.slug}`}
                        target="_blank"
                        className="p-1 rounded hover:bg-[#26263b] text-gray-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => toggleInviteStatus(inv.id)}
                        className={`p-1 rounded hover:bg-[#26263b] ${
                          inv.status === 'active' ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'payments' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f0f18] text-gray-400 border-b border-[#26263b]">
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Customer Email</th>
                  <th className="p-4">Razorpay Order ID</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Tier Purchased</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26263b]">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#1c1c2b] transition-all">
                    <td className="p-4 font-mono font-semibold text-white">{p.id}</td>
                    <td className="p-4">{p.email}</td>
                    <td className="p-4 font-mono text-gray-400">{p.orderId}</td>
                    <td className="p-4 font-mono text-white">₹{p.amount}</td>
                    <td className="p-4">{p.tier}</td>
                    <td className="p-4 capitalize">
                      <span className="flex items-center gap-1 text-green-500 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{p.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </div>
  );
}
