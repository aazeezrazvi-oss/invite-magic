'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';

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
      // Mock order generation from a Server Action or Route
      // In a live system, we fetch this from /api/order route
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 9)}`;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
        amount: amount * 100, // in paisa
        currency: 'INR',
        name: 'InviteMagic',
        description: `Upgrade to ${tier.toUpperCase()} Plan`,
        image: '/images/favicon.ico',
        order_id: mockOrderId,
        prefill: {
          email: userEmail,
          contact: '9999999999',
        },
        notes: {
          user_id: userId,
          tier: tier,
        },
        theme: {
          color: '#d4af37', // Gold matching style theme
        },
        handler: function (response: any) {
          console.log('Razorpay Payment success callback:', response);
          alert(`Congratulations! Payment of ₹${amount} completed successfully.\nPayment ID: ${response.razorpay_payment_id}`);
          if (onSuccess) onSuccess();
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
