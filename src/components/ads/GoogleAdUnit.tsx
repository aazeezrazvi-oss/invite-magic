'use client';

import React, { useEffect, useRef } from 'react';

interface GoogleAdUnitProps {
  client?: string | null;
  slot?: string | null;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
  rawEmbed?: string | null;
}

export default function GoogleAdUnit({
  client,
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  rawEmbed,
}: GoogleAdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // If raw embed code is provided (e.g. iframe or custom HTML snippet)
    if (rawEmbed && adRef.current) {
      // Clean previous content and render raw code
      adRef.current.innerHTML = rawEmbed;
      return;
    }

    // Google AdSense unit loader
    if (client && slot && !isLoaded.current) {
      try {
        if (typeof window !== 'undefined') {
          // Push to adsbygoogle array
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isLoaded.current = true;
        }
      } catch (err) {
        console.warn('Google Ads unit initialization note:', err);
      }
    }
  }, [client, slot, rawEmbed]);

  if (rawEmbed) {
    return (
      <div 
        ref={adRef} 
        className={`w-full overflow-hidden flex items-center justify-center ${className}`} 
      />
    );
  }

  if (!client || !slot) {
    return (
      <div className={`w-full py-6 px-4 rounded-xl bg-[#161622]/60 border border-dashed border-[#26263b] text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-1 ${className}`}>
        <span className="font-semibold text-gray-400">Google Ad Placement</span>
        <span className="text-[10px]">Configure Client & Slot ID in Admin Panel</span>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden flex items-center justify-center min-h-[100px] ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
