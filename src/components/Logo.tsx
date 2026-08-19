'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'compact' | 'iconOnly';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  href?: string;
}

export const BrandIcon = ({ className = 'w-7 h-7', size = 28 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fae084" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#aa7c11" />
      </linearGradient>
      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Top Right Sparkle Star */}
    <polygon
      points="68,10 70.5,19.5 80,22 70.5,24.5 68,34 65.5,24.5 56,22 65.5,19.5"
      fill="url(#goldGradient)"
      filter="url(#goldGlow)"
    />

    {/* Bottom Left Small Sparkle Star */}
    <polygon
      points="24,78 25.5,83 30.5,84.5 25.5,86 24,91 22.5,86 17.5,84.5 22.5,83"
      fill="url(#goldGradient)"
    />

    {/* Golden Rounded Envelope Outer Border */}
    <rect
      x="18"
      y="30"
      width="64"
      height="46"
      rx="7"
      ry="7"
      fill="none"
      stroke="url(#goldGradient)"
      strokeWidth="4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Envelope Inner V-Flap */}
    <path
      d="M20.5 32.5 L50 56.5 L79.5 32.5"
      fill="none"
      stroke="url(#goldGradient)"
      strokeWidth="4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Logo({
  variant = 'compact',
  size = 'md',
  className = '',
  href = '/',
}: LogoProps) {
  const iconSizes = {
    sm: 22,
    md: 28,
    lg: 36,
    xl: 48,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const subtitleSizes = {
    sm: 'text-[7px] tracking-[0.2em]',
    md: 'text-[8px] sm:text-[9px] tracking-[0.22em]',
    lg: 'text-[10px] tracking-[0.25em]',
    xl: 'text-xs tracking-[0.28em]',
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      <BrandIcon size={iconSizes[size]} className="transition-transform group-hover:scale-105" />

      {variant !== 'iconOnly' && (
        <div className="flex flex-col justify-center leading-tight">
          <div className={`font-bold tracking-wider font-cinzel ${textSizes[size]} flex items-center`}>
            <span className="text-[#fcf8f2] group-hover:text-white transition-colors">Invite</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fae084] via-[#d4af37] to-[#aa7c11] font-extrabold ml-0.5">
              Magic
            </span>
          </div>

          {variant === 'full' && (
            <span className={`uppercase font-sans font-medium text-[#c5a880]/80 mt-0.5 ${subtitleSizes[size]}`}>
              DIGITAL WEDDING INVITATIONS
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
