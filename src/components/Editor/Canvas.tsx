'use client';

import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { Invitation } from '@/types';
import InvitationPreview from '../InvitationPreview';

interface CanvasProps {
  invitation: Partial<Invitation>;
  zoom?: number;
  onEditSection?: (sectionKey: 'details' | 'design' | 'events' | 'gifts') => void;
}

export default function Canvas({ invitation, zoom = 100, onEditSection }: CanvasProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const scale = zoom / 100;

  return (
    <div className="flex-1 bg-[#0a0a0f] flex flex-col h-full overflow-hidden">
      {/* Device Toolbar Controls (Desktop Only) */}
      <div className="hidden md:flex bg-[#161622] border-b border-[#26263b] px-4 py-2 justify-between items-center text-xs shrink-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-semibold text-xs font-cinzel tracking-wider">Live Preview</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-[10px] border border-[#d4af37]/20 font-medium">
            <span>✨ Tap any section to edit</span>
          </span>
        </div>
        <div className="flex bg-[#0d0d11] rounded-lg p-0.5 gap-1 border border-[#26263b]">
          <button
            onClick={() => setDevice('mobile')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all font-semibold text-xs cursor-pointer ${
              device === 'mobile'
                ? 'bg-[#d4af37] text-[#0d0d11] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile View</span>
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all font-semibold text-xs cursor-pointer ${
              device === 'desktop'
                ? 'bg-[#d4af37] text-[#0d0d11] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop View</span>
          </button>
        </div>
        <div className="w-24" />
      </div>

      {/* ─── Seamless Borderless Canvas ─── */}
      <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center relative bg-[#0a0a0f]">
        <div 
          style={{ 
            transform: scale !== 1 ? `scale(${scale})` : undefined, 
            transformOrigin: 'top center',
            width: '100%',
            height: '100%'
          }} 
          className="flex-1 w-full h-full overflow-y-auto overscroll-contain transition-transform duration-150 flex justify-center"
        >
          {device === 'mobile' ? (
            /* Mobile View: Borderless Phone Column centered cleanly */
            <div className="w-full max-w-[440px] min-h-full h-full flex flex-col bg-transparent shadow-[0_0_60px_rgba(0,0,0,0.85)] relative">
              <div className="flex-1 w-full h-full overflow-y-auto">
                <InvitationPreview 
                  invitation={invitation} 
                  isPreviewMode={true} 
                  isEditorMode={true} 
                  onEditSection={onEditSection} 
                />
              </div>
            </div>
          ) : (
            /* Desktop View: Full Width Borderless Experience */
            <div className="w-full min-h-full h-full flex flex-col bg-transparent">
              <div className="flex-1 w-full h-full overflow-y-auto">
                <InvitationPreview 
                  invitation={invitation} 
                  isPreviewMode={true} 
                  isEditorMode={true} 
                  onEditSection={onEditSection} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
