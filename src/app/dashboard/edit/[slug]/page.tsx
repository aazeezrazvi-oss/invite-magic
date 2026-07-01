'use client';

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { use } from 'react';
import Sidebar from '@/components/Editor/Sidebar';
import Canvas from '@/components/Editor/Canvas';
import { Invitation } from '@/types';
import { getInvitationBySlug, saveInvitation } from '@/app/actions';
import { ArrowLeft, Check, AlertCircle, Heart, Palette, Calendar, Gift, Save, Undo2, Redo2, ZoomIn, ZoomOut, Globe } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const mockInvitation: Partial<Invitation> = {
  groom_name: 'Abdul',
  bride_name: 'Sana',
  groom_photo: '',
  groom_bio: '',
  bride_photo: '',
  bride_bio: '',
  parents_names: '',
  invitation_message: 'With hearts full of love, we cordially invite you to celebrate the union of our families.',
  is_published: false,
  styling: {
    invitation_id: '',
    primary_color: '#d4af37',
    secondary_color: '#6b0c1b',
    background_color: '#0d0d11',
    text_color: '#fcf8f2',
    font_heading: 'playfair',
    font_body: 'inter',
    music_url: '',
    section_order: ['hero', 'countdown', 'story', 'events', 'gallery', 'rsvp', 'gifts'],
    animation_style: 'fade',
    button_style: 'rounded',
    countdown_style: 'flip',
    gallery_layout: 'grid',
    background_type: 'video',
    background_url: '/videos/bg-golden-particles.mp4',
  },
  events: [
    {
      event_name: 'Nikah Ceremony',
      event_date: '2025-09-14',
      event_time: '11:00',
      venue_name: 'Jamia Masjid, Tolichowki',
      venue_address: 'Tolichowki, Hyderabad, India',
      google_maps_link: '',
    },
    {
      event_name: 'Walima Reception',
      event_date: '2025-09-15',
      event_time: '19:00',
      venue_name: 'Royal Palace Banquet Hall',
      venue_address: 'Plot 42, MG Road, Hyderabad, India',
      google_maps_link: '',
    },
  ],
  gift_collection: {
    invitation_id: '',
    upi_id: 'wedding@upi',
    receiver_name: 'Abdul & Sana',
    thank_you_message: 'Your blessings are enough, but if you wish to bless us further, you may send a digital shagun.',
  },
};

interface HistoryState<T> {
  history: T[];
  pointer: number;
}

type HistoryAction<T> =
  | { type: 'PUSH'; state: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; state: T };

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case 'PUSH': {
      const nextHistory = state.history.slice(0, state.pointer + 1);
      nextHistory.push(action.state);
      if (nextHistory.length > 50) {
        nextHistory.shift();
      }
      return {
        history: nextHistory,
        pointer: nextHistory.length - 1,
      };
    }
    case 'UNDO': {
      return {
        ...state,
        pointer: Math.max(0, state.pointer - 1),
      };
    }
    case 'REDO': {
      return {
        ...state,
        pointer: Math.min(state.history.length - 1, state.pointer + 1),
      };
    }
    case 'RESET': {
      return {
        history: [action.state],
        pointer: 0,
      };
    }
    default:
      return state;
  }
}

// Atomic useReducer-based undo/redo manager
function useHistory<T>(initialState: T) {
  const [state, dispatch] = useReducer(historyReducer, {
    history: [initialState],
    pointer: 0,
  });

  const current = state.history[state.pointer] as T;

  const push = useCallback((newState: T) => {
    dispatch({ type: 'PUSH', state: newState });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const reset = useCallback((newState: T) => {
    dispatch({ type: 'RESET', state: newState });
  }, []);

  const canUndo = state.pointer > 0;
  const canRedo = state.pointer < state.history.length - 1;

  return { current, push, undo, redo, reset, canUndo, canRedo };
}

export default function EditorPage({ params }: PageProps) {
  const { slug } = use(params);
  
  // Local active draft state for high-frequency user updates
  const [invitation, setInvitation] = useState<Partial<Invitation>>(mockInvitation);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // History state for low-frequency undo/redo operations
  const { current: historyState, push: pushHistory, undo, redo, reset: resetHistory, canUndo, canRedo } = useHistory<Partial<Invitation>>(mockInvitation);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSupabaseWorking, setIsSupabaseWorking] = useState(true);
  const [hasPaid, setHasPaid] = useState<boolean>(false);
  
  // Canva-style mobile bottom sheet state
  const [activeMobileTab, setActiveMobileTab] = useState<'details' | 'design' | 'events' | 'gifts' | null>(null);
  
  // Canvas zoom
  const [zoom, setZoom] = useState(100);

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Debounce timer ref for history push
  const updateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync draft state with history changes
  useEffect(() => {
    if (historyState) {
      setInvitation(historyState);
    }
  }, [historyState]);

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
      setIsLoading(true);
      setLoadError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email || localStorage.getItem('mock_user_email') || '';
        
        const isBypassUser = userEmail === 'abdulazeezrazvi125@gmail.com' || userEmail === 'abdulazeezrazvi97@gmail.com';
        
        if (isBypassUser) {
          setHasPaid(true);
        } else {
          const paidStatus = localStorage.getItem(`invite_${slug}_paid`);
          setHasPaid(paidStatus === 'true');
        }

        if (isSupabaseWorking) {
          const data = await getInvitationBySlug(slug);
          if (data) {
            setInvitation(data);
            resetHistory(data);
            
            // Sync subscription status from database owner_tier
            if (data.owner_tier && data.owner_tier !== 'free') {
              setHasPaid(true);
            }
          } else {
            console.error(`[loadData] Invitation not found or access denied for slug: ${slug}`);
            setLoadError(`Couldn't load this invitation — it may not exist, or you don't have access to it.`);
          }
        }
      } catch (e: any) {
        console.error("Failed to load live invite data:", e);
        setLoadError(`Failed to load invitation: ${e?.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleUpdate = (updatedFields: Partial<Invitation>) => {
    const nextVal = { ...invitation, ...updatedFields };
    setInvitation(nextVal);
    localStorage.setItem(`invite_${slug}`, JSON.stringify(nextVal));

    // Debounce history push to avoid flooding undo stack on every keystroke
    if (updateTimer.current) clearTimeout(updateTimer.current);
    updateTimer.current = setTimeout(() => {
      pushHistory(nextVal);
    }, 600);
  };

  const handleSave = async () => {
    if (!invitation?.id) {
      alert("❌ Save Failed: No valid invitation ID found. This invitation may not exist or has not finished loading.");
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    if (isSupabaseWorking) {
      const result = await saveInvitation(invitation);
      if (result.success) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
        alert(`❌ Database Save Failed: ${result.error || 'Unknown database error'}`);
      }
    } else {
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

  const togglePublish = async () => {
    if (!hasPaid) {
      alert("⚠️ Upgrade Required: Please buy any upgrade plan in the editor sidebar to unlock publishing and share your live link with guests!");
      return;
    }
    const newPublished = !invitation.is_published;
    const nextVal = { ...invitation, is_published: newPublished };
    
    // Update local state and history immediately for responsive UI
    setInvitation(nextVal);
    pushHistory(nextVal);
    localStorage.setItem(`invite_${slug}`, JSON.stringify(nextVal));

    setIsSaving(true);
    setSaveStatus('idle');

    if (isSupabaseWorking) {
      const result = await saveInvitation(nextVal);
      if (result.success) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
        alert(`❌ Failed to toggle publish: ${result.error || 'Unknown database error'}`);
        // Revert local state
        const reverted = { ...invitation, is_published: !newPublished };
        setInvitation(reverted);
        localStorage.setItem(`invite_${slug}`, JSON.stringify(reverted));
      }
    } else {
      setSaveStatus('success');
    }
    setIsSaving(false);
    setTimeout(() => {
      setSaveStatus('idle');
    }, 3000);
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) { redo(); } else { undo(); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0d0d11] text-white">
        <div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium animate-pulse text-sm">Loading invitation editor...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0d0d11] text-white px-4 text-center">
        <div className="bg-[#161622] border border-[#26263b] p-8 rounded-xl shadow-xl max-w-md w-full flex flex-col items-center">
          <AlertCircle className="w-16 h-16 text-[#ef4444] mb-4 animate-bounce" />
          <h2 className="text-xl font-bold mb-2 text-white">Error Loading Editor</h2>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">{loadError}</p>
          <div className="flex gap-4 w-full">
            <Link 
              href="/dashboard"
              className="flex-1 py-2.5 px-4 bg-[#26263b] hover:bg-[#32324e] text-white rounded-lg font-medium transition-all text-sm block"
            >
              Go to Dashboard
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 px-4 bg-[#d4af37] hover:bg-[#bfa232] text-black rounded-lg font-semibold transition-all text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#0d0d11]">
      {/* ─── Top Navbar ─── */}
      <header className="bg-[#161622] border-b border-[#26263b] px-3 md:px-5 py-2.5 flex items-center justify-between z-20 shrink-0 gap-2">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <Link 
            href="/dashboard" 
            className="p-1.5 rounded hover:bg-[#26263b] text-gray-400 hover:text-white transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-px bg-[#26263b] shrink-0 hidden sm:block" />
          <div className="min-w-0 hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-semibold text-xs">Editing:</span>
              <span className="text-[#d4af37] font-mono text-[10px] truncate max-w-[140px]">{slug}</span>
            </div>
          </div>
        </div>

        {/* Center: Undo / Redo */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-[#26263b] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-[#26263b] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-[#26263b] mx-1 hidden sm:block" />
          {/* Save status badges */}
          {!isSupabaseWorking && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[9px] font-semibold">
              <AlertCircle className="w-3 h-3" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-[9px]">
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[9px]">
              <AlertCircle className="w-3 h-3" />
              <span className="hidden sm:inline">Error</span>
            </div>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {hasPaid ? (
            <button
              onClick={togglePublish}
              className={`flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-1.5 rounded text-[10px] font-semibold transition-all ${
                invitation.is_published
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
              }`}
              title={invitation.is_published ? 'Click to unpublish invitation' : 'Click to publish invitation'}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{invitation.is_published ? 'Published' : 'Draft'}</span>
            </button>
          ) : (
            <button
              onClick={() => alert("⚠️ Upgrade Required: Please buy any upgrade plan in the editor sidebar to unlock publishing and share your live link with guests!")}
              className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-1.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] font-semibold hover:bg-gray-500/20 transition-all"
              title="Publishing locked (Upgrade required)"
            >
              <Globe className="w-3.5 h-3.5 opacity-50" />
              <span className="hidden sm:inline">Draft (Locked)</span>
            </button>
          )}
          <a
            href={`/invite/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded bg-[#26263b] hover:bg-[#34344d] text-white text-[10px] font-semibold transition-all"
          >
            Open Live
          </a>
          <button
            onClick={handleShareClick}
            className="px-3 py-1.5 rounded bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold transition-all text-[10px] cursor-pointer"
          >
            Share
          </button>
        </div>
      </header>

      {/* ─── Main Workspace ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <aside className="hidden md:block w-96 h-full shrink-0 border-r border-[#26263b] overflow-hidden">
          <Sidebar 
            invitation={invitation} 
            onUpdate={handleUpdate} 
            onSave={handleSave} 
            isSaving={isSaving} 
            hasPaid={hasPaid}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </aside>

        {/* Canvas Area */}
        <div className="flex-1 h-full overflow-hidden flex flex-col pb-14 md:pb-0">
          <Canvas invitation={invitation} zoom={zoom} />
        </div>
      </div>

      {/* ─── Desktop Bottom Toolbar (zoom controls) ─── */}
      <div className="hidden md:flex items-center justify-center gap-3 bg-[#161622] border-t border-[#26263b] py-1.5 px-4 shrink-0 text-xs">
        <button
          onClick={() => setZoom(z => Math.max(25, z - 25))}
          className="p-1 rounded hover:bg-[#26263b] text-gray-400 hover:text-white transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-gray-400 font-mono text-[10px] w-10 text-center select-none">{zoom}%</span>
        <button
          onClick={() => setZoom(z => Math.min(200, z + 25))}
          className="p-1 rounded hover:bg-[#26263b] text-gray-400 hover:text-white transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(100)}
          className="px-2 py-0.5 rounded text-[9px] text-gray-500 hover:text-white hover:bg-[#26263b] transition-all font-semibold uppercase tracking-wider"
        >
          Reset
        </button>
      </div>

      {/* ─── Mobile Bottom Navigation Bar ─── */}
      <nav className="flex border-t border-[#26263b] bg-[#161622] md:hidden text-[9px] uppercase font-bold tracking-wider shrink-0 z-30 justify-around py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.4)]">
        {([
          { key: 'details' as const, icon: Heart, label: 'Details' },
          { key: 'design' as const, icon: Palette, label: 'Design' },
          { key: 'events' as const, icon: Calendar, label: 'Events' },
          { key: 'gifts' as const, icon: Gift, label: 'Gifts' },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveMobileTab(activeMobileTab === key ? null : key)}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-all ${
              activeMobileTab === key 
                ? 'text-[#d4af37] bg-[#d4af37]/10' 
                : 'text-gray-500 active:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ─── Mobile Sliding Bottom Sheet ─── */}
      {activeMobileTab && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setActiveMobileTab(null)}>
          {/* Dimmed backdrop */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}
      <div 
        className={`fixed inset-x-0 bottom-0 bg-[#161622] border-t border-[#d4af37]/20 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.6)] z-50 transition-transform duration-300 ease-out md:hidden ${
          activeMobileTab ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '60dvh' }}
      >
        <div className="flex flex-col h-full">
          {/* Sheet drag handle */}
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-10 h-1 bg-gray-600 rounded-full" />
          </div>

          {/* Sheet Title bar */}
          <div className="px-4 py-2 border-b border-[#26263b] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              {activeMobileTab === 'details' && <Heart className="w-4 h-4 text-[#d4af37]" />}
              {activeMobileTab === 'design' && <Palette className="w-4 h-4 text-[#d4af37]" />}
              {activeMobileTab === 'events' && <Calendar className="w-4 h-4 text-[#d4af37]" />}
              {activeMobileTab === 'gifts' && <Gift className="w-4 h-4 text-[#d4af37]" />}
              <span className="font-semibold text-white font-cinzel capitalize text-xs tracking-wider">
                {activeMobileTab || ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-1.5 rounded hover:bg-[#26263b] text-gray-400 disabled:opacity-30 transition-all"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-1.5 rounded hover:bg-[#26263b] text-gray-400 disabled:opacity-30 transition-all"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-2.5 py-1 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded flex items-center gap-1 transition-all text-[9px] uppercase tracking-widest disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-3 h-3 border-2 border-t-transparent border-[#0d0d11] rounded-full animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                <span>Save</span>
              </button>
              <button 
                onClick={() => setActiveMobileTab(null)}
                className="text-gray-400 hover:text-white text-lg font-bold px-1 cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {activeMobileTab && (
              <Sidebar 
                invitation={invitation} 
                onUpdate={handleUpdate} 
                onSave={handleSave} 
                isSaving={isSaving} 
                hasPaid={hasPaid}
                onPaymentSuccess={handlePaymentSuccess}
                activeTab={activeMobileTab}
                onTabChange={setActiveMobileTab}
                isMobileSheet={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── Share Modal ─── */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
