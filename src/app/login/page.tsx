'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { Heart, Lock, User, Gift, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('abdulazeezrazvi125@gmail.com');
  const [password, setPassword] = useState('Azeez@97');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        const mockEmail = localStorage.getItem('mock_user_email');
        if (mockEmail) {
          router.push('/dashboard');
        }
      }
    }
    checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setMessage(null);

    if (isSignUp && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Normal signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        // If promo code matches a lifetime free code, update tier locally or directly
        if (promoCode.toUpperCase() === 'LIFETIMEFREE' || promoCode.toUpperCase() === 'FREEVIP') {
          localStorage.setItem(`invite_abdul-sana_paid`, 'true');
        }

        setMessage({
          type: 'success',
          text: 'Account created! Please check your email to confirm registration.',
        });
      } else {
        // Sign in
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            // Fallback for default admin credentials if not created on remote DB yet
            if (email === 'abdulazeezrazvi125@gmail.com' && password === 'Azeez@97') {
              localStorage.setItem('mock_user_email', email);
              localStorage.setItem('invite_abdul-sana_paid', 'true');
              router.push('/dashboard');
              router.refresh();
              return;
            }
            throw error;
          }
          
          // Save sandbox status if email is a bypass email
          if (email === 'abdulazeezrazvi125@gmail.com' || email === 'abdulazeezrazvi97@gmail.com') {
            localStorage.setItem('mock_user_email', email);
            localStorage.setItem('invite_abdul-sana_paid', 'true');
          }

          router.push('/dashboard');
          router.refresh();
        } catch (err) {
          if (email === 'abdulazeezrazvi125@gmail.com' && password === 'Azeez@97') {
            localStorage.setItem('mock_user_email', email);
            localStorage.setItem('invite_abdul-sana_paid', 'true');
            router.push('/dashboard');
            router.refresh();
            return;
          }
          throw err;
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const messageText = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setMessage({
        type: 'error',
        text: messageText,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-[#f3f4f6] flex flex-col justify-center items-center p-6 relative font-sans">
      
      {/* Background radial gradients for ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none z-0" />
      
      {/* Auth Card Container - Glassmorphic design */}
      <div className="w-full max-w-[440px] bg-[#161622]/40 backdrop-blur-md border border-[#26263b] rounded-[24px] p-10 shadow-[0_8px_32px_rgba(0,0,0,0.37)] z-10 space-y-6">
        
        {/* Heart Icon Header Wrapper */}
        <div className="flex justify-start">
          <div className="w-12 h-12 rounded-[12px] bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.1)]">
            <Heart className="w-6 h-6 text-[#d4af37] fill-[#d4af37]/20" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h2 className="text-2xl font-light text-white tracking-wider font-cinzel">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h2>
          <p className="text-xs text-gray-400">
            {isSignUp ? 'Design your custom wedding invitation today' : 'Sign in to your InviteMagic account'}
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-3.5 rounded-lg text-xs border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => alert('Password reset is not enabled in offline/developer mode.')}
                  className="text-xs text-[#d4af37] hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Promo / Lifetime code <span className="text-gray-500 lowercase font-normal">(optional)</span></span>
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="e.g. LIFETIMEFREE"
                  className="w-full bg-[#0d0d11]/80 border border-[#26263b] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all uppercase font-mono"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-lg flex items-center justify-center gap-2 transition-all text-sm outline-none focus:ring-2 focus:ring-[#d4af37]/50 disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-t-transparent border-[#0d0d11] rounded-full animate-spin" />
            ) : (
              <span>{isSignUp ? 'Create account' : 'Sign in'}</span>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-400">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
              }}
              className="text-[#d4af37] hover:underline font-semibold"
            >
              {isSignUp ? 'Sign in' : 'Create account'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
