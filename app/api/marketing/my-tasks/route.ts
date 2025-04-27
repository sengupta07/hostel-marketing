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

    // Get the user's ID from the session
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    // Get all marketing tasks assigned to the user
    const marketingTasks = await prisma.marketingTask.findMany({
      where: {
        assignedStudents: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        assignedStudents: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
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
    console.error("Error fetching user's marketing tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
