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

export default function Canvas({ invitation, zoom = 75, onEditSection }: CanvasProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const scale = zoom / 100;

  return (
    <div className="flex-1 bg-[#0d0d11] flex flex-col h-full overflow-hidden">
      {/* Device Toolbar Controls (Desktop Only) */}
      <div className="hidden md:flex bg-[#161622] border-b border-[#26263b] p-2.5 justify-between items-center text-xs shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-semibold text-xs">Live Interactive Canvas</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-[10px] border border-[#d4af37]/20 font-medium">
            <span>✨ Tap any section to edit</span>
          </span>
        </div>
        <div className="flex bg-[#0d0d11] rounded p-0.5 gap-1 border border-[#26263b]">
          <button
            onClick={() => setDevice('mobile')}
            className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all font-semibold text-xs cursor-pointer ${
              device === 'mobile'
                ? 'bg-[#d4af37] text-[#0d0d11] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all font-semibold text-xs cursor-pointer ${
              device === 'desktop'
                ? 'bg-[#d4af37] text-[#0d0d11] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>
        <div className="w-20" />
      </div>

      {/* ─── Mobile Native Canvas (< md) ─── */}
      <div className="flex md:hidden flex-1 w-full h-full overflow-y-auto overscroll-contain bg-[#0d0d11]">
        <div className="w-full min-h-full">
          <InvitationPreview 
            invitation={invitation} 
            isPreviewMode={true} 
            isEditorMode={true} 
            onEditSection={onEditSection} 
          />
        </div>
      </div>

      {/* ─── Desktop Scaled Viewport Canvas (>= md) ─── */}
      <div className="hidden md:flex flex-1 overflow-auto items-center justify-center p-4 min-h-0 min-w-0">
        <div 
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }} 
          className="transition-transform duration-150 shrink-0 flex items-center justify-center"
        >
          {device === 'mobile' ? (
            <div className="relative w-[375px] h-[720px] rounded-[40px] border-[10px] border-[#1e1e2d] shadow-[0_12px_45px_rgba(0,0,0,0.8)] bg-[#0d0d11] overflow-hidden flex flex-col">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-[#1e1e2d] rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-gray-700 rounded-full" />
              </div>

              {/* Preview scroll area */}
              <div className="flex-1 overflow-y-auto w-full h-full scroll-smooth pt-3">
                <InvitationPreview 
                  invitation={invitation} 
                  isPreviewMode={true} 
                  isEditorMode={true} 
                  onEditSection={onEditSection} 
                />
              </div>
            </div>
          ) : (
            <div className="w-[920px] max-w-[92vw] h-[600px] border border-[#26263b] bg-[#0d0d11] rounded-xl shadow-[0_12px_45px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto scroll-smooth">
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
