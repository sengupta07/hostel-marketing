import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    // Get the current active budget cycle
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear();

    const currentCycle = await prisma.budgetCycle.findFirst({
      where: {
        month: currentMonth,
        year: currentYear,
      },
    });

    if (!currentCycle) {
      return NextResponse.json(
        { error: "No active budget cycle found for the current month" },
        { status: 404 }
      );
    }

    // Check if the user has made a payment for this cycle
    const payment = await prisma.payment.findFirst({
      where: {
        userId: userId,
        budgetCycleId: currentCycle.id,
      },
    });

    // Calculate refund or due amount if the cycle is finalized
    let refundOrDue = null;
    if (
      currentCycle.isFinalized &&
      currentCycle.perHeadCost !== null &&
      payment
    ) {
      refundOrDue = payment.amountPaid - currentCycle.perHeadCost;
    }

    return NextResponse.json({
      hasPaid: !!payment,
      payment: payment,
      currentCycle: currentCycle,
      perHeadCost: currentCycle.perHeadCost,
      refundOrDue: refundOrDue,
    });
  } catch (error) {
    console.error("Error fetching user's budget status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
