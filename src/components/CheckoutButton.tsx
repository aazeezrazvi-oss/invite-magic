'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { createRazorpayOrder, upgradeUserTierMock, verifyRazorpayPayment } from '@/app/actions';

interface CheckoutButtonProps {
  amount: number;
  tier: 'basic' | 'premium' | 'vip';
  userEmail?: string;
  userId?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function CheckoutButton({
  amount,
  tier,
  userEmail = 'user@example.com',
  userId = 'mock-user-123',
  onSuccess,
  className = '',
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setLoading(true);
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      setLoading(false);
      return;
    }

    try {
      // 1. Generate Order ID from Server Action
      const orderRes = await createRazorpayOrder(tier, amount, userId);
      if (!orderRes.success) {
        alert(`❌ Failed to start checkout: ${orderRes.error}`);
        setLoading(false);
        return;
      }

      const options = {
        key: orderRes.keyId,
        amount: amount * 100, // in paisa
        currency: 'INR',
        name: 'InviteMagic',
        description: `Upgrade to ${tier.toUpperCase()} Plan`,
        image: '/images/favicon.ico',
        order_id: orderRes.orderId,
        prefill: {
          email: userEmail,
          contact: '',
        },
        notes: {
          user_id: userId,
          tier: tier,
        },
        theme: {
          color: '#d4af37', // Gold matching style theme
        },
        handler: async function (response: any) {
          console.log('Razorpay Payment success callback:', response);
          
          if (orderRes.isMock) {
            // Simulator Mode: Directly update tier
            const upgradeRes = await upgradeUserTierMock(userId, tier);
            if (upgradeRes.success) {
              alert(`🎉 [Demo Mode] Mock payment of ₹${amount} completed successfully!\nYour account has been upgraded to ${tier.toUpperCase()}!`);
              if (onSuccess) onSuccess();
            } else {
              alert(`❌ [Demo Mode] Payment completed, but failed to upgrade account: ${upgradeRes.error}`);
            }
          } else {
            // Live production mode: Verify payment signature securely on the server!
            setLoading(true);
            try {
              const verifyRes = await verifyRazorpayPayment(
                response.razorpay_payment_id,
                response.razorpay_order_id,
                response.razorpay_signature,
                tier,
                userId
              );
              
              if (verifyRes.success) {
                alert(`🎉 Payment of ₹${amount} verified successfully!\nYour account has been upgraded to ${tier.toUpperCase()}!`);
                if (onSuccess) onSuccess();
              } else {
                alert(`❌ Payment completed, but verification failed: ${verifyRes.error || 'Invalid signature'}`);
              }
            } catch (err: any) {
              console.error('Error verifying payment:', err);
              alert('Error verifying payment. Please contact support.');
            } finally {
              setLoading(false);
            }
          }
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        console.error('Razorpay Payment failed details:', response.error);
        alert(`Payment Failed: ${response.error.description}`);
      });

      paymentObject.open();
    } catch (e) {
      console.error('Error starting checkout:', e);
      alert('Could not initialize payment checkout. Please try again.');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`px-4 py-2 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-t-transparent border-[#0d0d11] rounded-full animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4" />
      )}
      <span>Pay ₹{amount} Now</span>
    </button>
  );
}
