import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Studio } from '../models';
import { createSubscription, cancelSubscription, verifyWebhookSignature } from '../services/RazorpayService';

/**
 * Initiates Razorpay subscription billing session
 */
export const createBillingSession = async (req: AuthRequest, res: Response) => {
  const { plan } = req.body; // 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE'

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!plan || !['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan selected' });
    }

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    // Starter is Free/Mock. If others, call Razorpay
    if (plan === 'STARTER') {
      studio.subscriptionPlan = 'STARTER';
      studio.subscriptionStatus = 'FREE';
      studio.razorpaySubscriptionId = undefined;
      await studio.save();
      return res.json({ message: 'Subscribed to Starter Plan successfully', plan: 'STARTER', status: 'FREE' });
    }

    // Call Razorpay API to generate Subscription details
    const razorpaySub = await createSubscription(plan);

    // Save temporary subscription ID
    studio.razorpaySubscriptionId = razorpaySub.id;
    studio.subscriptionStatus = 'TRIALING'; // Awaiting success webhook
    await studio.save();

    return res.json({
      subscriptionId: razorpaySub.id,
      razorpayPlanId: razorpaySub.plan_id,
      shortUrl: razorpaySub.short_url,
    });
  } catch (err: any) {
    console.error('Razorpay Session Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Cancels subscription
 */
export const cancelMySubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio || !studio.razorpaySubscriptionId) {
      return res.status(400).json({ error: 'No active paid subscription found' });
    }

    // Cancel in Razorpay
    await cancelSubscription(studio.razorpaySubscriptionId);

    // Update in DB
    studio.subscriptionStatus = 'CANCELLED';
    await studio.save();

    return res.json({ message: 'Subscription successfully scheduled for cancellation', subscriptionStatus: 'CANCELLED' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Handle incoming Razorpay billing webhooks
 */
export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  try {
    // Verify payload signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'subscription.charged') {
      const razorpaySubId = payload.subscription.entity.id;
      const planId = payload.subscription.entity.plan_id;
      
      // Determine plan name
      let plan: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE' = 'STARTER';
      if (planId === 'plan_professional_id') plan = 'PROFESSIONAL';
      else if (planId === 'plan_business_id') plan = 'BUSINESS';
      else if (planId === 'plan_enterprise_id') plan = 'ENTERPRISE';

      await Studio.findOneAndUpdate(
        { razorpaySubscriptionId: razorpaySubId },
        { subscriptionPlan: plan, subscriptionStatus: 'ACTIVE' }
      );
      console.log(`Razorpay subscription ${razorpaySubId} successfully charged`);
    }

    if (event === 'subscription.cancelled') {
      const razorpaySubId = payload.subscription.entity.id;
      await Studio.findOneAndUpdate(
        { razorpaySubscriptionId: razorpaySubId },
        { subscriptionStatus: 'CANCELLED' }
      );
      console.log(`Razorpay subscription ${razorpaySubId} successfully cancelled`);
    }

    return res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Razorpay Webhook Processing Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
