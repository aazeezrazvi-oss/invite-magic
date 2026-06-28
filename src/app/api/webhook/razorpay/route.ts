import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/utils/supabase';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'razorpay_webhook_secret_temp';

    if (!signature) {
      console.warn('Webhook warning: Missing x-razorpay-signature header.');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 1. Verify Razorpay signature securely
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Webhook error: Invalid Razorpay webhook signature.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Parse payload event details
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

      // 3. Log transaction inside Payments log
      const tier = amount >= 999 ? 'vip' : amount >= 499 ? 'premium' : 'basic';
      
      const { error: paymentInsertError } = await supabase
        .from('payments')
        .upsert({
          order_id: orderId,
          payment_id: paymentId,
          amount,
          status: 'captured',
          tier
        });

      if (paymentInsertError) {
        console.error('Database Error: Failed to insert payment log:', paymentInsertError);
      }

      // 4. Update User Account subscription tier
      if (userId) {
        // Calculate subscription expiration time based on tier (Basic: 6 months, Premium: 1 year, VIP: Lifetime)
        let expiryDate: string | null = null;
        const now = new Date();
        if (tier === 'basic') {
          now.setMonth(now.getMonth() + 6);
          expiryDate = now.toISOString();
        } else if (tier === 'premium') {
          now.setFullYear(now.getFullYear() + 1);
          expiryDate = now.toISOString();
        }

        const { error: userUpdateError } = await supabase
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
