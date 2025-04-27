import { NextResponse } from "next/server";
import { PrismaClient, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

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

    // Get the marketing task with all related data
    const marketingTask = await prisma.marketingTask.findUnique({
      where: {
        id: taskId,
      },
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
        bill: {
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
        },
      },
    });

    if (!marketingTask) {
      return NextResponse.json(
        { error: "Marketing task not found" },
        { status: 404 }
      );
    }

    // Check if the user has permission to view this task
    const userId = session.user.id;
    const userRole = session.user.role;

    // General Secretary and Mess Manager can view all tasks
    if (userRole === "GENERAL_SECRETARY" || userRole === "MESS_MANAGER") {
      return NextResponse.json(marketingTask);
    }

    // Boarders can only view tasks assigned to them
    const isAssignedToUser = marketingTask.assignedStudents.some(
      (student) => student.id === userId
    );

    if (!isAssignedToUser) {
      return NextResponse.json(
        { error: "You do not have permission to view this task" },
        { status: 403 }
      );
    }

    return NextResponse.json(marketingTask);
  } catch (error) {
    console.error("Error fetching marketing task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Mess Manager can update tasks
    if (session.user.role !== UserRole.MESS_MANAGER) {
      return NextResponse.json(
        { error: "Only Mess Manager can update tasks" },
        { status: 403 }
      );
    }

    const taskId = params.taskId;
    if (!taskId) {
      return NextResponse.json(
        { error: "Marketing task ID is required" },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Update the marketing task
    const updatedTask = await prisma.marketingTask.update({
      where: {
        id: taskId,
      },
      data: {
        // Add fields that can be updated
        status: body.status,
        moneyGiven: body.moneyGiven,
      },
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
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating marketing task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Mess Manager can delete tasks
    if (session.user.role !== UserRole.MESS_MANAGER) {
      return NextResponse.json(
        { error: "Only Mess Manager can delete tasks" },
        { status: 403 }
      );
    }

    const taskId = params.taskId;
    if (!taskId) {
      return NextResponse.json(
        { error: "Marketing task ID is required" },
        { status: 400 }
      );
    }

    // Check if the task exists
    const task = await prisma.marketingTask.findUnique({
      where: { id: taskId },
      include: { bill: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Marketing task not found" },
        { status: 404 }
      );
    }

    // Only allow deletion of tasks that are in ASSIGNED status
    if (task.status !== "ASSIGNED") {
      return NextResponse.json(
        { error: "Only tasks in ASSIGNED status can be deleted" },
        { status: 400 }
      );
    }

    // Delete the task
    await prisma.marketingTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting marketing task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
