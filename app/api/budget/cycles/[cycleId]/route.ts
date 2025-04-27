import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { cycleId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cycleId = params.cycleId;
    if (!cycleId) {
      return NextResponse.json(
        { error: "Budget cycle ID is required" },
        { status: 400 }
      );
    }

    // Get the budget cycle
    const budgetCycle = await prisma.budgetCycle.findUnique({
      where: {
        id: cycleId,
      },
      include: {
        payments: {
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
        },
      },
    });

    if (!budgetCycle) {
      return NextResponse.json(
        { error: "Budget cycle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(budgetCycle);
  } catch (error) {
    console.error("Error fetching budget cycle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
