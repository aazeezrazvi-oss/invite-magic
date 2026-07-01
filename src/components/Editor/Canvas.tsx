'use client';

import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { Invitation } from '@/types';
import InvitationPreview from '../InvitationPreview';

interface CanvasProps {
  invitation: Partial<Invitation>;
  zoom?: number;
}

export default function Canvas({ invitation, zoom = 100 }: CanvasProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const scale = zoom / 100;

  return (
    <div className="flex-1 bg-[#0d0d11] flex flex-col h-full overflow-hidden">
      {/* Device Toolbar Controls (only on desktop — mobile uses the bottom sheet) */}
      <div className="bg-[#161622] border-b border-[#26263b] p-2 md:p-3 flex justify-between items-center text-xs shrink-0">
        <div className="text-gray-500 font-semibold text-[10px] md:text-xs">Live Preview</div>
        <div className="flex bg-[#0d0d11] rounded p-0.5 md:p-1 gap-0.5 md:gap-1 border border-[#26263b]">
          <button
            onClick={() => setDevice('mobile')}
            className={`px-2 md:px-3 py-1 rounded flex items-center gap-1 md:gap-1.5 transition-all font-semibold text-[10px] md:text-xs ${
              device === 'mobile'
                ? 'bg-[#d4af37] text-[#0d0d11]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`px-2 md:px-3 py-1 rounded flex items-center gap-1 md:gap-1.5 transition-all font-semibold text-[10px] md:text-xs ${
              device === 'desktop'
                ? 'bg-[#d4af37] text-[#0d0d11]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
        </div>
        <div className="w-6 md:w-20" /> {/* Spacer for balance */}
      </div>

      {/* Frame Canvas Wrapper with zoom */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-6 min-h-0 min-w-0">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }} className="transition-transform duration-200 shrink-0 flex items-center justify-center">
          {device === 'mobile' ? (
            <div className="relative w-[340px] md:w-[375px] h-[680px] md:h-[760px] rounded-[35px] md:rounded-[40px] border-[6px] md:border-[12px] border-[#1e1e2d] shadow-2xl bg-[#0d0d11] overflow-hidden flex flex-col">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 md:w-32 h-5 md:h-6 bg-[#1e1e2d] rounded-b-xl md:rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-10 md:w-12 h-0.5 md:h-1 bg-gray-700 rounded-full" />
              </div>

              {/* Preview scroll area */}
              <div className="flex-1 overflow-y-auto w-full h-full scroll-smooth pt-4">
                <InvitationPreview invitation={invitation} isPreviewMode={true} />
              </div>
            </div>
          ) : (
            <div className="w-[900px] h-[600px] border border-[#26263b] bg-[#0d0d11] rounded-lg shadow-2xl overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto scroll-smooth">
                <InvitationPreview invitation={invitation} isPreviewMode={true} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
