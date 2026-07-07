import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions - InviteMagic',
  description: 'Terms and Conditions of service for using InviteMagic digital wedding invitations.',
};

export default function TermsPage() {
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
            Terms & <span className="text-[#d4af37]">Conditions</span>
          </h1>
          <p className="text-xs text-gray-400 font-mono">Last Updated: July 3, 2026</p>
          <div className="h-[1px] bg-gradient-to-r from-[#d4af37]/50 to-transparent w-full md:w-1/2 mt-4" />
        </div>

        {/* Introduction */}
        <p className="text-sm md:text-base text-gray-300 leading-relaxed">
          Welcome to InviteMagic. These Terms & Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the InviteMagic website, platform, and services. By registering an account, purchasing our upgrade tiers, or using any part of our platform, you agree to be bound by these Terms. If you do not agree, please do not use our services.
        </p>

        {/* Grid or List of Sections */}
        <div className="space-y-8 bg-[#161622]/40 border border-[#26263b] rounded-[20px] p-6 md:p-10 backdrop-blur-sm">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">1.</span> Acceptance of Service
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              InviteMagic provides digital wedding invitation design, customization, and hosting solutions. Users can choose themes, configure layouts, upload wedding details (groom/bride profiles, gallery pictures, schedules), receive guest RSVPs, and display digital payment information (UPI). We reserve the right to modify or terminate services at any time.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">2.</span> Account Registration
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              To customize and publish invitations, you must register an account using a valid email. You are responsible for safeguarding your login credentials and are fully liable for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your credentials.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">3.</span> User-Generated Content & Conduct
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              You retain ownership of any content you upload, including photos, bios, event schedules, and wishes. However, you grant InviteMagic a license to host, display, and distribute this content solely to deliver the service. You represent that you own or have permission to use all uploaded content.
            </p>
            <p className="text-xs text-red-400 font-semibold mt-1">
              PROHIBITED CONTENT: You agree not to upload any content that is offensive, illegal, infringing, hateful, or inappropriate. InviteMagic reserves the right to suspend or delete any invitation link hosting prohibited material.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">4.</span> Billing, Upgrades, & Refund Policy
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Some features require a paid upgrade (Basic, Premium, or VIP). Upgrades are paid in advance via our payment partner Razorpay. 
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
              Due to the immediate digital provisioning of premium assets, custom themes, and hosting features, all payments made to InviteMagic are <span className="font-semibold text-white">non-refundable</span> once the upgrade tier has been unlocked.
            </p>
          </section>

          {/* Section 5 (Critical UPI Disclaimer) */}
          <section className="space-y-3 p-4 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-lg">
            <h2 className="text-lg font-bold text-[#d4af37] font-cinzel tracking-wider flex items-center gap-2">
              <span className="font-mono">5.</span> UPI Shagun / Digital Gift Disclaimer
            </h2>
            <p className="text-xs text-gray-200 leading-relaxed">
              InviteMagic displays user-configured UPI IDs (QR codes / payment details) on invitation pages to allow wedding guests to send digital wedding gifts (&ldquo;Shagun&rdquo;).
            </p>
            <p className="text-xs text-[#d4af37] font-semibold mt-1">
              PLEASE NOTE: All UPI digital gift transfers occur directly between the guest (sender) and the host (receiver) over public banking rails. InviteMagic is NOT a payment gateway, payment intermediary, or escrow provider for UPI gifts, does not process, handle, or hold any money, and has no control over banking transfers. We bear zero liability for failed payments, disputed amounts, or incorrect UPI details configured by the user.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">6.</span> Suspension & Termination
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              We reserve the right to suspend or block any invitation link (slug) or user account if we believe the user has violated these Terms, engaged in fraudulent activities, or created severe performance loads. Suspended links will display an &ldquo;Under Review&rdquo; notice.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">7.</span> Limitation of Liability
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              To the maximum extent permitted by law, InviteMagic and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your access to or use of the services.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">8.</span> Dispute Resolution & Governing Law
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              These Terms and Conditions shall be governed by, and construed in accordance with, the laws of India. Any disputes, claims, or controversies arising out of or in connection with these Terms, including their validity, breach, or termination, shall be subject to the exclusive jurisdiction of the competent courts located in Bengaluru, Karnataka, India.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white font-cinzel tracking-wider flex items-center gap-2">
              <span className="text-[#d4af37] font-mono">9.</span> Taxes & GST Disclosures
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              All prices and subscription tiers displayed on InviteMagic are listed in Indian Rupees (INR) and are inclusive of all applicable local service taxes and GST, unless explicitly stated otherwise. Customers are solely responsible for their own local tax declaration obligations.
            </p>
          </section>
        </div>

        {/* Support Section */}
        <div className="text-center space-y-2 pt-6">
          <p className="text-xs text-gray-400">Questions about our Terms & Conditions?</p>
          <p className="text-sm font-semibold text-[#d4af37]">support@invitemagic.co</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#26263b]/60 py-6 text-center text-xs text-gray-500 z-10 bg-[#0d0d11]">
        <p>© 2026 InviteMagic. All rights reserved.</p>
      </footer>
    </div>
  );
}
