import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - InviteMagic',
  description: 'Privacy Policy and data practices for users and guests of InviteMagic.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col font-sans relative">
      {/* Background radial gradients for ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d4af37]/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-[#d4af37]/3 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Header / Navbar */}
      <nav className="border-b border-[#26263b] bg-[#161622]/40 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Heart className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
          <span className="text-lg font-bold tracking-wider font-cinzel text-[#d4af37]">InviteMagic</span>
        </Link>
        <Link 
          href="/login" 
          className="text-xs uppercase tracking-widest font-semibold hover:text-[#d4af37] transition-all flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 z-10 space-y-10 relative">
        <div className="space-y-4 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-light text-white font-cinzel tracking-wide">
            Privacy <span className="text-[#d4af37]">Policy</span>
          </h1>
          <p className="text-xs text-gray-400 font-mono">Last Updated: July 3, 2026</p>
          <div className="h-[1px] bg-gradient-to-r from-[#d4af37]/50 to-transparent w-full md:w-1/2 mt-4" />
        </div>

        {/* Introduction */}
        <p className="text-sm md:text-base text-gray-300 leading-relaxed">
          At InviteMagic, we value and respect your privacy. This Privacy Policy details what information we collect from you, how we use it, how we secure it, and your rights concerning your personal data. This policy applies to website visitors, registered users, and wedding guests submitting RSVPs or digital gift logs.
        </p>

        {/* Content Box */}
        <div className="space-y-8 bg-[#161622]/40 border border-[#26263b] rounded-[20px] p-6 md:p-10 backdrop-blur-sm">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">1.</span> Information We Collect
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed mb-2">
              We collect information to host your invitations and manage guest RSVP entries:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4 text-xs text-gray-300 leading-relaxed">
              <li><span className="font-semibold text-white">Account Information:</span> Email, password (hashed securely), and name when you sign up.</li>
              <li><span className="font-semibold text-white">Invitation Details:</span> Groom/bride names, bios, event schedules, venues, maps, background music selections, styling preferences, and photos you upload.</li>
              <li><span className="font-semibold text-white">UPI Details:</span> Receivers name and UPI address to log UPI transaction references.</li>
              <li><span className="font-semibold text-white">Guest RSVP Submissions:</span> Guest name, attendance status, wishes, and guest count.</li>
              <li><span className="font-semibold text-white">Payment Records:</span> Razorpay transaction ID, amount, and tier purchased (credit card numbers and payment details are handled exclusively by Razorpay and never stored on our servers).</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">2.</span> How We Use Your Information
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed mb-2">
              We utilize collected data to perform the following:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4 text-xs text-gray-300 leading-relaxed">
              <li>To construct and publicly host your customizable wedding invitation page.</li>
              <li>To display guest RSVPs and digital gift counts inside the host dashboard.</li>
              <li>To prevent fraud, secure accounts, and apply promo code discounts.</li>
              <li>To monitor and track basic visit analytics (page views) on invitation pages.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">3.</span> Cookies & Local Storage
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              We use necessary authentication cookies (stored locally in your browser) to keep you signed in to your InviteMagic session. We also use browser local storage to save temporary dashboard preferences and debug logs. You can disable cookies in your browser settings, but it will prevent you from signing in to the dashboard.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">4.</span> Third-Party Processors
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              We work with trusted third-party providers to host data and process checkout payments:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4 text-xs text-gray-300 leading-relaxed">
              <li><span className="font-semibold text-white">Supabase:</span> Used as our cloud database and user authenticator. All user credentials and invitation contents are stored on Supabase servers in compliance with their privacy guidelines.</li>
              <li><span className="font-semibold text-white">Razorpay:</span> Used for payment processing. Razorpay collects and processes your billing data securely.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">5.</span> Data Security
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              We employ strict security measures including SSL/TLS transfer protocols, Row-Level Security (RLS) policies in PostgreSQL to restrict data ownership, input validation using `zod` schemas to prevent XSS attacks, and token bucket rate limiters to shield APIs from abuse.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">6.</span> Your Rights & Data Deletion
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              You own your data. You can delete individual events, gallery images, or draft invitations directly from your dashboard. If you wish to delete your entire user profile and remove all associated invitations, guest RSVPs, and payments logs from our database, please contact us.
            </p>
          </section>
        </div>

        {/* Support Section */}
        <div className="text-center space-y-2 pt-6">
          <p className="text-xs text-gray-400">Want to request account deletion or have questions?</p>
          <p className="text-sm font-semibold text-[#d4af37]">privacy@invitemagic.co</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#26263b]/60 py-6 text-center text-xs text-gray-500 z-10 bg-[#0d0d11]">
        <p>© 2026 InviteMagic. All rights reserved.</p>
      </footer>
    </div>
  );
}
