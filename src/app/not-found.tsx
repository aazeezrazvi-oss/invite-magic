import React from 'react';
import Link from 'next/link';
import { Heart, Search, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import InstagramIcon from '@/components/InstagramIcon';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col justify-between font-sans selection:bg-[#d4af37] selection:text-black">
      {/* Header */}
      <header className="border-b border-[#26263b] bg-[#161622]/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Logo variant="compact" size="sm" href="/" />
        <Link
          href="/"
          className="text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 hover:text-[#d4af37] transition-all text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Hero 404 Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.15)] animate-pulse">
          <Heart className="w-10 h-10 fill-[#d4af37]/20" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#d4af37]">404 • Page Not Found</span>
          <h1 className="text-3xl sm:text-4xl font-light text-white font-cinzel tracking-wider">
            A Moment Lost in Celebration
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            The wedding invitation or vendor page you are searching for might have been moved, renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* Quick Recovery Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
          <Link
            href="/"
            className="py-3 px-4 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <span>Create Invitation Website</span>
          </Link>
          <Link
            href="/vendors"
            className="py-3 px-4 bg-[#161622] hover:bg-[#26263b] text-white border border-[#26263b] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Browse Wedding Vendors</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#26263b] py-6 px-6 text-xs text-gray-500">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>© {new Date().getFullYear()} InviteMagic. All rights reserved.</span>
          <a
            href="https://www.instagram.com/invite_magic_"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-pink-400 transition-colors"
            title="Follow @invite_magic_ on Instagram"
          >
            <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
            <span>@invite_magic_</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
