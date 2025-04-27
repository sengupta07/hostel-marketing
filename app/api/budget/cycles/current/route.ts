import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json(currentCycle);
  } catch (error) {
    console.error("Error fetching current budget cycle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
