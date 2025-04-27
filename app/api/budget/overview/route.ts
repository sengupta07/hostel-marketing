import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only General Secretary and Mess Manager can access this endpoint
    if (
      session.user.role !== "GENERAL_SECRETARY" &&
      session.user.role !== "MESS_MANAGER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the cycle ID from the query parameters
    const url = new URL(request.url);
    const cycleId = url.searchParams.get("cycleId");

    // If no cycle ID is provided, get the current cycle
    let budgetCycle;
    if (!cycleId) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      budgetCycle = await prisma.budgetCycle.findFirst({
        where: {
          month: currentMonth,
          year: currentYear,
        },
      });

      if (!budgetCycle) {
        return NextResponse.json(
          { error: "No active budget cycle found for the current month" },
          { status: 404 }
        );
      }
    } else {
      budgetCycle = await prisma.budgetCycle.findUnique({
        where: {
          id: cycleId,
        },
      });

      if (!budgetCycle) {
        return NextResponse.json(
          { error: "Budget cycle not found" },
          { status: 404 }
        );
      }
    }

    // Get all users with BOARDER role
    const boarders = await prisma.user.findMany({
      where: {
        role: "BOARDER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    // Get payments for the budget cycle
    const payments = await prisma.payment.findMany({
      where: {
        budgetCycleId: budgetCycle.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    // Create a map of user ID to payment
    const paymentMap = new Map();
    payments.forEach((payment) => {
      paymentMap.set(payment.userId, payment);
    });

    // Create the budget overview
    const budgetOverview = boarders.map((boarder) => {
      const payment = paymentMap.get(boarder.id);
      const amountPaid = payment ? payment.amountPaid : 0;
      let amountToBeReturned = null;

      // Calculate amount to be returned if the cycle is finalized
      if (budgetCycle.isFinalized && budgetCycle.perHeadCost !== null) {
        amountToBeReturned = amountPaid - budgetCycle.perHeadCost;
      }

      return {
        userId: boarder.id,
        user: boarder,
        amountPaid,
        amountToBeReturned,
      };
    });

    return NextResponse.json(budgetOverview);
  } catch (error) {
    console.error("Error fetching budget overview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
