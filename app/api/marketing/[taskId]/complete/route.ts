import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { PrismaClient, UserRole, MarketingTaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestBody {
  moneyReturnReceived: boolean;
}

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
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

    // Check if the user has the required role
    if (session.user.role !== UserRole.MESS_MANAGER) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    // Get the task ID from the URL
    const { taskId } = params;

    // Parse the request body
    const body: RequestBody = await request.json();

    // Validate the request body
    if (body.moneyReturnReceived === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the marketing task exists
    const marketingTask = await prisma.marketingTask.findUnique({
      where: { id: taskId },
      include: {
        bill: true,
      },
    });

    if (!marketingTask) {
      return NextResponse.json(
        { error: "Marketing task not found" },
        { status: 404 }
      );
    }

    // Check if the marketing task has a bill submitted
    if (!marketingTask.bill) {
      return NextResponse.json(
        { error: "No bill has been submitted for this marketing task" },
        { status: 400 }
      );
    }

    // Check if the marketing task is already completed
    if (marketingTask.status === MarketingTaskStatus.COMPLETED) {
      return NextResponse.json(
        { error: "Marketing task is already completed" },
        { status: 409 }
      );
    }

    // Check if money return is received
    if (!body.moneyReturnReceived) {
      return NextResponse.json(
        { error: "Money return must be received before marking as complete" },
        { status: 400 }
      );
    }

    // Update the marketing task status
    const updatedTask = await prisma.marketingTask.update({
      where: { id: taskId },
      data: {
        status: MarketingTaskStatus.COMPLETED,
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
        bill: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Return the updated marketing task
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error completing marketing task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
