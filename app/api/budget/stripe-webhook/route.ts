import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { headers } from "next/headers";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get("stripe-signature") || "";

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  const { userId, budgetCycleId } = paymentIntent.metadata;

  if (!userId || !budgetCycleId) {
    console.error("Missing metadata in payment intent:", paymentIntent.id);
    return;
  }

  // Check if a payment record already exists
  const existingPayment = await prisma.payment.findUnique({
    where: {
      userId_budgetCycleId: {
        userId,
        budgetCycleId,
      },
    },
  });

  if (existingPayment) {
    // Update the existing payment
    await prisma.payment.update({
      where: {
        id: existingPayment.id,
      },
      data: {
        status: "succeeded",
        stripePaymentIntentId: paymentIntent.id,
      },
    });
  } else {
    // Create a new payment record
    await prisma.payment.create({
      data: {
        userId,
        budgetCycleId,
        amountPaid: paymentIntent.amount / 100, // Convert from cents/paise
        status: "succeeded",
        stripePaymentIntentId: paymentIntent.id,
      },
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { userId, budgetCycleId } = paymentIntent.metadata;

  if (!userId || !budgetCycleId) {
    console.error("Missing metadata in payment intent:", paymentIntent.id);
    return;
  }

  // Check if a payment record already exists
  const existingPayment = await prisma.payment.findUnique({
    where: {
      userId_budgetCycleId: {
        userId,
        budgetCycleId,
      },
    },
  });

  if (existingPayment) {
    // Update the existing payment
    await prisma.payment.update({
      where: {
        id: existingPayment.id,
      },
      data: {
        status: "failed",
        stripePaymentIntentId: paymentIntent.id,
      },
    });
  } else {
    // Create a new payment record with failed status
    await prisma.payment.create({
      data: {
        userId,
        budgetCycleId,
        amountPaid: paymentIntent.amount / 100, // Convert from cents/paise
        status: "failed",
        stripePaymentIntentId: paymentIntent.id,
      },
    });
  }
}
