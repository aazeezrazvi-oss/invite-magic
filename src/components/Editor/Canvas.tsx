'use client';

import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { Invitation } from '@/types';
import InvitationPreview from '../InvitationPreview';

interface CanvasProps {
  invitation: Partial<Invitation>;
}

export default function Canvas({ invitation }: CanvasProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

  return (
    <div className="flex-1 bg-[#0d0d11] flex flex-col h-full overflow-hidden">
      {/* Device Toolbar Controls */}
      <div className="bg-[#161622] border-b border-[#26263b] p-3 flex justify-between items-center text-xs">
        <div className="text-gray-400 font-semibold">Live Live Preview Canvas</div>
        <div className="flex bg-[#0d0d11] rounded p-1 gap-1 border border-[#26263b]">
          <button
            onClick={() => setDevice('mobile')}
            className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all font-semibold ${
              device === 'mobile'
                ? 'bg-[#d4af37] text-[#0d0d11]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile View</span>
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all font-semibold ${
              device === 'desktop'
                ? 'bg-[#d4af37] text-[#0d0d11]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop View</span>
          </button>
        </div>
        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Frame Canvas Wrapper */}
      <div className="flex-grow flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {device === 'mobile' ? (
          <div className="relative w-full max-w-[340px] xs:max-w-[375px] h-[75vh] xs:h-[760px] rounded-[30px] xs:rounded-[40px] border-4 xs:border-[12px] border-[#1e1e2d] shadow-2xl bg-[#0d0d11] overflow-hidden flex flex-col">
            {/* Phone Speaker & Camera Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 xs:w-32 h-4 xs:h-6 bg-[#1e1e2d] rounded-b-xl xs:rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-8 xs:w-12 h-0.5 xs:h-1 bg-gray-700 rounded-full mb-0.5 xs:mb-1" />
            </div>
 
            {/* Preview scroll area */}
            <div className="flex-1 overflow-y-auto w-full h-full scroll-smooth pt-4">
              <InvitationPreview invitation={invitation} isPreviewMode={true} />
            </div>
          </div>
        ) : (
          <div className="w-full h-full border border-[#26263b] bg-[#0d0d11] rounded-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto scroll-smooth">
              <InvitationPreview invitation={invitation} isPreviewMode={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
