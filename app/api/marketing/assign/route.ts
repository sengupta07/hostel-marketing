import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient, UserRole, MarketingTaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestBody {
  date: string; // ISO date string (YYYY-MM-DD)
  studentIds: string[]; // Array of 2 student IDs
  moneyGiven: number;
}

export async function POST(request: Request) {
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

    // Parse the request body
    const body: RequestBody = await request.json();

    // Validate the request body
    if (!body.date || !body.studentIds || !body.moneyGiven) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate that exactly 2 students are assigned
    if (body.studentIds.length !== 2) {
      return NextResponse.json(
        { error: "Exactly 2 students must be assigned to a marketing task" },
        { status: 400 }
      );
    }

    // Validate that the money given is a positive number
    if (body.moneyGiven <= 0) {
      return NextResponse.json(
        { error: "Money given must be a positive number" },
        { status: 400 }
      );
    }

    // Check if the students exist
    const students = await prisma.user.findMany({
      where: {
        id: {
          in: body.studentIds,
        },
      },
    });

    if (students.length !== 2) {
      return NextResponse.json(
        { error: "One or more students not found" },
        { status: 404 }
      );
    }

    // Check if there's already a marketing task for the given date
    const existingTask = await prisma.marketingTask.findFirst({
      where: {
        date: new Date(body.date),
      },
    });

    if (existingTask) {
      return NextResponse.json(
        { error: "A marketing task already exists for this date" },
        { status: 409 }
      );
    }

    // Create the marketing task
    const marketingTask = await prisma.marketingTask.create({
      data: {
        date: new Date(body.date),
        status: MarketingTaskStatus.ASSIGNED,
        moneyGiven: body.moneyGiven,
        assignedStudents: {
          connect: body.studentIds.map((id) => ({ id })),
        },
        createdByUserId: session.user.id,
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
      },
    });

    // Return the created marketing task
    return NextResponse.json(marketingTask);
  } catch (error) {
    console.error("Error assigning marketing task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
