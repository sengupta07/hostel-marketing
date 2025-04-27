import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
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

    // Get all marketing tasks with assigned students and created by user
    const marketingTasks = await prisma.marketingTask.findMany({
      include: {
        assignedStudents: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        bill: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(marketingTasks);
  } catch (error) {
    console.error("Error fetching marketing tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
