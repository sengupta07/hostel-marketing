import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil", // Use the latest API version
});

export async function POST() {
  try {
    // Get the session
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the current budget cycle
    const currentCycle = await prisma.budgetCycle.findFirst({
      where: {
        startDate: {
          lte: new Date(),
        },
        endDate: {
          gte: new Date(),
        },
      },
    });

    if (!currentCycle) {
      return NextResponse.json(
        { error: "No active budget cycle found" },
        { status: 404 }
      );
    }

    // Check if the payment deadline has passed
    if (new Date() > new Date(currentCycle.paymentDeadline)) {
      return NextResponse.json(
        { error: "Payment deadline has passed" },
        { status: 400 }
      );
    }

    // Check if the user has already paid for this cycle
    const existingPayment = await prisma.payment.findUnique({
      where: {
        userId_budgetCycleId: {
          userId: session.user.id,
          budgetCycleId: currentCycle.id,
        },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "You have already paid for this cycle" },
        { status: 409 }
      );
    }

    // Get the fixed amount for the mess bill (this could be configurable)
    const amount = 3000; // ₹3000 as an example

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents/paise
      currency: "inr",
      metadata: {
        userId: session.user.id,
        budgetCycleId: currentCycle.id,
      },
    });

    // Return the client secret
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
