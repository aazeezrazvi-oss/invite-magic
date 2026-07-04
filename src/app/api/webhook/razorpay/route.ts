import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { rateLimitRequest } from '@/utils/rateLimiter';

// Initialize a secure, server-side admin client using the service role key to bypass RLS
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceRoleKey) {
    console.warn('[getServiceSupabase] Warning: SUPABASE_SERVICE_ROLE_KEY is not set.');
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// Helper to get client IP for rate limiting
function getClientIp(req: NextRequest): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  
  // 1. Rate Limiting Check (protect against spamming webhook endpoints)
  const rateLimit = await rateLimitRequest(`rate_limit:webhook_razorpay:${ip}`, 10, 0.5); // 10 burst, 1 refill per 2 sec
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'razorpay_webhook_secret_temp';

    if (!signature) {
      console.warn('Webhook warning: Missing x-razorpay-signature header.');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 2. Verify Razorpay webhook signature securely using HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Webhook error: Invalid Razorpay webhook signature.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 3. Parse payload event details
    const payload = JSON.parse(rawBody);
    const event = payload.event;

    console.log(`Razorpay Webhook Event Received: ${event}`);

    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount / 100; // Convert from paisa to INR
      const notes = paymentEntity.notes || {};
      const userId = notes.user_id; // Metadata passed during Razorpay order generation

      console.log(`Payment captured: order_id=${orderId}, payment_id=${paymentId}, amount=${amount}, user_id=${userId}`);

      const tier = amount >= 999 ? 'vip' : amount >= 499 ? 'premium' : 'basic';
      
      const supabaseAdmin = getServiceSupabase();
      if (!supabaseAdmin) {
        console.error('Critical Error: SUPABASE_SERVICE_ROLE_KEY is not configured. Cannot log payment or upgrade subscription.');
        return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
      }

      // 4. Log transaction inside Payments log (via service role client)
      const { error: paymentInsertError } = await supabaseAdmin
        .from('payments')
        .upsert({
          order_id: orderId,
          payment_id: paymentId,
          amount,
          status: 'captured',
          tier,
          user_id: userId,
        });

      if (paymentInsertError) {
        console.error('Database Error: Failed to insert payment log:', paymentInsertError);
      }

      // 5. Update User Account subscription tier (via service role client)
      if (userId) {
        let expiryDate: string | null = null;
        const now = new Date();
        if (tier === 'basic') {
          now.setMonth(now.getMonth() + 6);
          expiryDate = now.toISOString();
        } else if (tier === 'premium') {
          now.setFullYear(now.getFullYear() + 1);
          expiryDate = now.toISOString();
        }

        const { error: userUpdateError } = await supabaseAdmin
          .from('users')
          .update({
            subscription_tier: tier,
            subscription_expires_at: expiryDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (userUpdateError) {
          console.error(`Database Error: Failed to update subscription tier for user ${userId}:`, userUpdateError);
        } else {
          console.log(`Successfully upgraded user ${userId} to ${tier} subscription tier.`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Unhandled Razorpay Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
