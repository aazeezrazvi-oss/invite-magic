'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { Heart, Lock, User, Gift, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      }
    }
    checkUser();
  }, [router]);

  // Helper to extract a human-readable error message from any error
  const getErrorMessage = (err: unknown): string => {
    if (!err) return 'An unknown error occurred.';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message || 'An unknown error occurred.';
    if (typeof err === 'object' && err !== null) {
      const obj = err as Record<string, unknown>;
      if (typeof obj.message === 'string' && obj.message) return obj.message;
      if (typeof obj.error_description === 'string' && obj.error_description) return obj.error_description;
      if (typeof obj.msg === 'string' && obj.msg) return obj.msg;
      try {
        const str = JSON.stringify(err);
        if (str && str !== '{}') return str;
      } catch (_) { /* ignore */ }
    }
    return 'An unknown error occurred.';
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error(`OAuth login error with ${provider}:`, err);
      setMessage({
        type: 'error',
        text: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address first, then click Forgot password.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setMessage({
        type: 'success',
        text: 'Password reset link sent! Please check your email inbox.',
      });
    } catch (err) {
      console.error('Password reset error:', err);
      setMessage({
        type: 'error',
        text: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

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
        // --- SIGN UP ---
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

        // Log full response for debugging
        console.log('Signup response:', { data, error });

        if (error) {
          throw new Error(error.message || 'Signup failed. Please try again.');
        }

        // Supabase returns user with empty identities[] if email is already registered
        if (data?.user?.identities?.length === 0) {
          throw new Error('This email is already registered. Please sign in instead, or use a different email.');
        }

        // Try to ensure profile row exists (backup for when trigger doesn't exist)
        if (data?.user?.id) {
          try {
            await supabase.from('users').upsert({
              id: data.user.id,
              email: data.user.email || email,
              role: 'user',
              subscription_tier: promoCode.toUpperCase() === 'LIFETIMEFREE' || promoCode.toUpperCase() === 'FREEVIP' ? 'vip' : 'free',
            }, { onConflict: 'id' });
          } catch (profileErr) {
            // Not critical — trigger may have already created it, or table may not exist
            console.log('Profile upsert note (non-critical):', profileErr);
          }
        }

        // Handle promo code locally
        if (promoCode.toUpperCase() === 'LIFETIMEFREE' || promoCode.toUpperCase() === 'FREEVIP') {
          localStorage.setItem('invite_abdul-sana_paid', 'true');
        }

        setMessage({
          type: 'success',
          text: 'Account created successfully! Please check your email to confirm your registration.',
        });

      } else {
        // --- SIGN IN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // Log full response for debugging
        console.log('Login response:', { data, error });

        if (error) {
          throw new Error(error.message || 'Invalid email or password.');
        }

        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      console.error('Auth error (full):', err);
      setMessage({
        type: 'error',
        text: getErrorMessage(err),
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
                  onClick={handleForgotPassword}
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

        {/* OR SIGN IN WITH Social Login Option */}
        <div className="space-y-4 pt-1">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#26263b]/50" />
            </div>
            <span className="relative px-3 text-[10px] text-gray-400 uppercase tracking-widest bg-[#13131d] font-semibold">
              or sign in with
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Apple Button */}
            <button
              onClick={() => handleOAuthLogin('apple')}
              type="button"
              className="h-12 border border-[#26263b] rounded-xl flex items-center justify-center bg-[#0d0d11]/40 hover:bg-[#0d0d11]/80 hover:border-[#d4af37]/50 transition-all cursor-pointer shadow-sm group"
            >
              <svg className="w-5 h-5 text-white opacity-85 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.58 2.96-1.41z" />
              </svg>
            </button>

            {/* Facebook Button */}
            <button
              onClick={() => handleOAuthLogin('facebook')}
              type="button"
              className="h-12 border border-[#26263b] rounded-xl flex items-center justify-center bg-[#0d0d11]/40 hover:bg-[#0d0d11]/80 hover:border-[#d4af37]/50 transition-all cursor-pointer shadow-sm group"
            >
              <svg className="w-5 h-5 text-white opacity-85 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
              </svg>
            </button>

            {/* Google Button */}
            <button
              onClick={() => handleOAuthLogin('google')}
              type="button"
              className="h-12 border border-[#26263b] rounded-xl flex items-center justify-center bg-[#0d0d11]/40 hover:bg-[#0d0d11]/80 hover:border-[#d4af37]/50 transition-all cursor-pointer shadow-sm group"
            >
              <svg className="w-5 h-5 text-white opacity-85 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.46 13a5.53 5.53 0 0 1 5.53-5.53c2.25 0 4.225 1.134 5.378 2.87L22.6 7.1A9.7 9.7 0 0 0 13.99 3c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75c5.385 0 9.75-4.365 9.75-9.75 0-.616-.062-1.218-.184-1.808l-11.066.093z" />
              </svg>
            </button>
          </div>

          <div className="text-center text-xs text-gray-400">
            Need to find{' '}
            <button
              type="button"
              onClick={() => setMessage({ type: 'error', text: 'Please sign in using your registered email address.' })}
              className="text-[#d4af37] hover:underline font-semibold"
            >
              your username
            </button>{' '}
            or{' '}
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[#d4af37] hover:underline font-semibold"
            >
              your password
            </button>
            ?
          </div>
        </div>

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
