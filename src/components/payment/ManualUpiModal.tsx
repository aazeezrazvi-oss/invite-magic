'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Check, 
  Copy, 
  UploadCloud, 
  Image as ImageIcon, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  QrCode, 
  ExternalLink,
  Trash2
} from 'lucide-react';
import { submitManualPaymentProof } from '@/app/actions';
import { supabase } from '@/utils/supabase';

interface ManualUpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'basic' | 'premium' | 'vip';
  amount: number;
  userId?: string;
  userEmail?: string;
  onSuccess?: () => void;
}

export default function ManualUpiModal({
  isOpen,
  onClose,
  tier,
  amount,
  userId = 'mock-user-123',
  userEmail = '',
  onSuccess,
}: ManualUpiModalProps) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const defaultPrices: Record<string, number> = { basic: 299, premium: 499, vip: 999 };
  const finalAmount = (typeof amount === 'number' && !isNaN(amount) && amount > 0) 
    ? amount 
    : (defaultPrices[tier] || 299);

  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'azeezrazvi@okaxis';
  const payeeName = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || 'InviteMagic';
  const note = `InviteMagic ${tier.toUpperCase()} Upgrade`;
  
  // Standard UPI URI format with pre-set amount
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(note)}&mode=02`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Screenshot size must be under 8MB.');
      return;
    }

    setErrorMessage('');
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setScreenshotFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMessage('Please enter a valid 12-digit UPI Reference / UTR Number.');
      return;
    }

    if (!screenshotFile && !previewUrl) {
      setErrorMessage('Please upload a screenshot of your payment receipt.');
      return;
    }

    setSubmitting(true);

    try {
      let finalScreenshotUrl = previewUrl || '';

      // Try uploading to Supabase Storage if file is present
      if (screenshotFile) {
        try {
          const fileExt = screenshotFile.name.split('.').pop() || 'png';
          const fileName = `receipts/${userId}_${Date.now()}.${fileExt}`;

          const { error: uploadErr } = await supabase.storage
            .from('photos')
            .upload(fileName, screenshotFile, { upsert: true });

          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(fileName);
            if (publicUrl) {
              finalScreenshotUrl = publicUrl;
            }
          } else {
            console.warn('Storage upload notice (falling back to embedded image data):', uploadErr.message);
          }
        } catch (storageErr) {
          console.warn('Storage upload exception (using fallback preview data):', storageErr);
        }
      }

      // Submit payment verification request to server
      const res = await submitManualPaymentProof({
        userId,
        userEmail,
        tier,
        amount: finalAmount,
        utrNumber: cleanUtr,
        screenshotUrl: finalScreenshotUrl,
      });

      if (res.success) {
        setSubmittedSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Failed to submit payment verification proof. Please try again.');
      }
    } catch (err: any) {
      console.error('Error submitting payment verification:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-[#12121c] border border-[#2d2d42] rounded-2xl shadow-2xl overflow-hidden my-8 text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26263b] bg-[#161624]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white font-cinzel text-base tracking-wide flex items-center gap-2">
                <span>Upgrade to {tier.toUpperCase()}</span>
                <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded font-mono font-semibold">₹{finalAmount}</span>
              </h3>
              <p className="text-[11px] text-gray-400">Direct UPI Payment & Instant Access Unlock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {submittedSuccess ? (
            /* Success State Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-500/15 border border-green-500/40 rounded-full flex items-center justify-center mx-auto text-green-400 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white font-cinzel">Payment Proof Submitted!</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Thank you! Your payment receipt with UTR <span className="font-mono text-[#d4af37] font-semibold">{utrNumber}</span> has been received.
                </p>
              </div>

              <div className="bg-[#181827] border border-[#292942] rounded-xl p-4 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Selected Tier:</span>
                  <span className="font-semibold text-white uppercase">{tier}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Amount Paid:</span>
                  <span className="font-semibold text-[#d4af37] font-mono">₹{finalAmount}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Verification Status:</span>
                  <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Pending Review
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-lg text-[11px] text-gray-300 max-w-sm mx-auto">
                ⚡ Our admin will verify your screenshot and unlock your account access shortly.
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-xl text-xs transition-all tracking-wider uppercase font-cinzel cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            /* Payment Step & Submission Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1: Scan & Pay */}
              <div className="bg-[#181827] border border-[#292942] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#d4af37] text-[#0d0d11] font-bold text-[10px] flex items-center justify-center">1</span>
                    Scan QR or Pay with UPI App
                  </span>
                  <span className="text-[11px] font-mono text-[#d4af37] font-bold">Amount: ₹{finalAmount}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* QR Code Container */}
                  <div className="p-3 bg-white rounded-xl shadow-md flex-shrink-0 flex items-center justify-center">
                    <QRCodeSVG 
                      value={upiUri} 
                      size={140} 
                      level="M" 
                      marginSize={0}
                    />
                  </div>

                  {/* UPI Details & Mobile Quick Action */}
                  <div className="space-y-2.5 flex-1 w-full text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Pay to UPI ID</span>
                      <div className="flex items-center justify-between bg-[#0f0f18] border border-[#2b2b3f] rounded-lg px-3 py-1.5 mt-0.5">
                        <span className="font-mono text-white font-medium select-all">{upiId}</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="text-gray-400 hover:text-[#d4af37] transition-all ml-2 p-1"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Recipient</span>
                      <span className="text-white font-medium">{payeeName}</span>
                    </div>

                    {/* Mobile App Deeplink */}
                    <a
                      href={upiUri}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-[#26263b] hover:bg-[#34344d] border border-[#3c3c58] text-white rounded-lg text-xs font-semibold transition-all mt-1"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Open GPay / PhonePe / Paytm</span>
                      <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Step 2: Upload Proof & Enter UTR */}
              <div className="bg-[#181827] border border-[#292942] rounded-xl p-4 space-y-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#d4af37] text-[#0d0d11] font-bold text-[10px] flex items-center justify-center">2</span>
                  Submit Transaction Verification Proof
                </span>

                {/* 12-digit UTR Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-300 flex justify-between">
                    <span>12-Digit UPI Ref / UTR Number <span className="text-[#d4af37]">*</span></span>
                    <span className="text-[10px] text-gray-500 font-normal">Found in UPI app receipt</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 423819283746"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 22))}
                    className="w-full bg-[#0f0f18] border border-[#2e2e46] focus:border-[#d4af37] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none transition-all"
                  />
                </div>

                {/* Screenshot Upload Dropzone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-300 flex justify-between">
                    <span>Upload Payment Screenshot <span className="text-[#d4af37]">*</span></span>
                    <span className="text-[10px] text-gray-500 font-normal">PNG, JPG up to 8MB</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="relative rounded-xl border border-[#3a3a54] bg-[#0c0c14] p-2 flex items-center gap-3">
                      <img 
                        src={previewUrl} 
                        alt="Receipt preview" 
                        className="w-16 h-16 object-cover rounded-lg border border-[#2b2b3d]" 
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-semibold text-white truncate">{screenshotFile?.name || 'receipt_screenshot.png'}</p>
                        <p className="text-[10px] text-gray-500">{(screenshotFile?.size ? (screenshotFile.size / 1024).toFixed(1) + ' KB' : 'Image ready')}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-400 mt-1">
                          <Check className="w-3 h-3" /> Screenshot attached
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                        title="Remove screenshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#34344d] hover:border-[#d4af37]/60 rounded-xl p-4 text-center cursor-pointer bg-[#0e0e18]/60 hover:bg-[#131322] transition-all"
                    >
                      <UploadCloud className="w-7 h-7 text-[#d4af37] mx-auto mb-1.5 opacity-80" />
                      <p className="text-xs font-semibold text-white">Click or Drag & Drop Screenshot</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Attach the successful payment screen from your UPI app</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Security Note & Submit Button */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                  <span>100% Secure Verification • Your account access unlocks upon admin approval</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !utrNumber.trim() || !previewUrl}
                  className="w-full py-3 bg-[#d4af37] hover:bg-[#b8962e] text-[#0d0d11] font-bold rounded-xl text-xs transition-all tracking-wider uppercase font-cinzel cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/10"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-[#0d0d11] rounded-full animate-spin" />
                      <span>Submitting Proof...</span>
                    </>
                  ) : (
                    <span>Submit Payment Proof (₹{finalAmount})</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
