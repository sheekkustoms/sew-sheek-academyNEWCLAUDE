import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.7.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return Response.json({ error: err.message }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  const updateMembershipFromSubscription = async (subscription) => {
    const customerId = subscription.customer;
    const status = subscription.status;
    const currentPeriodEnd = subscription.current_period_end;

    // Look up customer email
    const customer = await stripe.customers.retrieve(customerId);
    const email = customer.email;
    if (!email) {
      console.error("No email found for customer:", customerId);
      return;
    }

    const isActive = status === "active" || status === "trialing";
    const paidThrough = currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString().split("T")[0]
      : null;

    // Find existing membership record
    const existing = await base44.asServiceRole.entities.MembershipStatus.filter({ user_email: email });

    const payload = {
      user_email: email,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_status: status,
      is_active: isActive,
      ...(paidThrough ? { paid_through: paidThrough } : {}),
      admin_override: false,
    };

    if (existing.length > 0) {
      // Only update if not admin-overridden
      const record = existing[0];
      if (record.admin_override) {
        // Just update Stripe fields, preserve is_active
        await base44.asServiceRole.entities.MembershipStatus.update(record.id, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_status: status,
          ...(paidThrough ? { paid_through: paidThrough } : {}),
        });
      } else {
        await base44.asServiceRole.entities.MembershipStatus.update(record.id, payload);
      }
    } else {
      await base44.asServiceRole.entities.MembershipStatus.create(payload);
    }

    console.log(`Updated membership for ${email}: status=${status}, active=${isActive}`);
  };

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await updateMembershipFromSubscription(event.data.object);
        break;
      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          await updateMembershipFromSubscription(sub);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          await updateMembershipFromSubscription(sub);
        }
        break;
      }
      default:
        console.log("Unhandled event type:", event.type);
    }
  } catch (err) {
    console.error("Error processing webhook:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
});