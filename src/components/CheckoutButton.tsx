'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { CreditCard, QrCode } from 'lucide-react';
import ManualUpiModal from '@/components/payment/ManualUpiModal';

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
  const [showUpiModal, setShowUpiModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowUpiModal(true)}
        className={`px-4 py-2 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-lg flex items-center justify-center gap-2 transition-all text-xs shadow-md shadow-[#d4af37]/10 hover:shadow-[#d4af37]/20 ${className}`}
      >
        <QrCode className="w-3.5 h-3.5" />
        <span>Pay ₹{amount} with UPI</span>
      </button>

      {/* Manual UPI & Receipt Upload Modal */}
      <ManualUpiModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        tier={tier}
        amount={amount}
        userId={userId}
        userEmail={userEmail}
        onSuccess={() => {
          if (onSuccess) onSuccess();
        }}
      />
    </>
  );
}

// ==============================================================================
// --- Razorpay Payment Integration (Temporarily Paused for Business Verification) ---
// ==============================================================================
/*
import { createRazorpayOrder, upgradeUserTierMock, verifyRazorpayPayment } from '@/app/actions';

const handleRazorpayCheckout = async (
  tier: 'basic' | 'premium' | 'vip',
  amount: number,
  userId: string,
  userEmail: string,
  setLoading: (val: boolean) => void,
  onSuccess?: () => void
) => {
  setLoading(true);
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  try {
    const orderRes = await createRazorpayOrder(tier, amount, userId);
    if (!orderRes.success) {
      alert(`❌ Failed to start checkout: ${orderRes.error}`);
      setLoading(false);
      return;
    }

    if (orderRes.isMock) {
      const upgradeRes = await upgradeUserTierMock(userId, tier);
      if (upgradeRes.success) {
        alert(`🎉 [Demo Mode] Mock payment of ₹${amount} completed successfully!`);
        if (onSuccess) onSuccess();
      } else {
        alert(`❌ Failed to upgrade account: ${upgradeRes.error}`);
      }
      setLoading(false);
      return;
    }

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      setLoading(false);
      return;
    }

    const options = {
      key: orderRes.keyId,
      amount: amount * 100,
      currency: 'INR',
      name: 'InviteMagic',
      description: `Upgrade to ${tier.toUpperCase()} Plan`,
      image: '/images/favicon.ico',
      order_id: orderRes.orderId,
      prefill: { email: userEmail, contact: '' },
      notes: { user_id: userId, tier },
      theme: { color: '#d4af37' },
      handler: async function (response: any) {
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
            alert(`🎉 Payment of ₹${amount} verified successfully! Account upgraded to ${tier.toUpperCase()}!`);
            if (onSuccess) onSuccess();
          } else {
            alert(`❌ Verification failed: ${verifyRes.error || 'Invalid signature'}`);
          }
        } catch (err: any) {
          console.error('Error verifying payment:', err);
          alert('Error verifying payment.');
        } finally {
          setLoading(false);
        }
      },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.on('payment.failed', function (response: any) {
      alert(`Payment Failed: ${response.error.description}`);
    });
    paymentObject.open();
  } catch (e) {
    console.error('Error starting checkout:', e);
    alert('Could not initialize payment checkout.');
  }
  setLoading(false);
};
*/
