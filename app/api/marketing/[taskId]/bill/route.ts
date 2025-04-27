import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.taskId;
    if (!taskId) {
      return NextResponse.json(
        { error: "Marketing task ID is required" },
        { status: 400 }
      );
    }

    // Get the marketing task to check permissions
    const marketingTask = await prisma.marketingTask.findUnique({
      where: {
        id: taskId,
      },
      include: {
        assignedStudents: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!marketingTask) {
      return NextResponse.json(
        { error: "Marketing task not found" },
        { status: 404 }
      );
    }

    // Check if the user has permission to view this task's bill
    const userId = session.user.id;
    const userRole = session.user.role;

    // General Secretary and Mess Manager can view all bills
    if (
      userRole !== "GENERAL_SECRETARY" &&
      userRole !== "MESS_MANAGER" &&
      !marketingTask.assignedStudents.some((student) => student.id === userId)
    ) {
      return NextResponse.json(
        { error: "You do not have permission to view this bill" },
        { status: 403 }
      );
    }

    // Get the bill for the marketing task
    const bill = await prisma.bill.findFirst({
      where: {
        marketingTaskId: taskId,
      },
      include: {
        submittedBy: {
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

    if (!bill) {
      return NextResponse.json(
        { error: "No bill found for this marketing task" },
        { status: 404 }
      );
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error fetching bill for marketing task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
