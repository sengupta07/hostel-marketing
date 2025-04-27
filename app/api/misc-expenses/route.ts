import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

interface AddExpenseRequestBody {
  description: string;
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  budgetCycleId?: string;
}

export async function GET(request: Request) {
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
    if (
      session.user.role !== UserRole.MESS_MANAGER &&
      session.user.role !== UserRole.GENERAL_SECRETARY
    ) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const cycleId = url.searchParams.get("cycleId");

    // Prepare the query
    const query: any = {};

    if (cycleId) {
      query.budgetCycleId = cycleId;
    }

    // Get all miscellaneous expenses
    const expenses = await prisma.miscellaneousExpense.findMany({
      where: query,
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        budgetCycle: {
          select: {
            id: true,
            month: true,
            year: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Return the expenses
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching miscellaneous expenses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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
    const body: AddExpenseRequestBody = await request.json();

    // Validate the request body
    if (!body.description || !body.amount || !body.date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate that the amount is a positive number
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // If a budget cycle ID is provided, check if it exists
    if (body.budgetCycleId) {
      const budgetCycle = await prisma.budgetCycle.findUnique({
        where: { id: body.budgetCycleId },
      });

      if (!budgetCycle) {
        return NextResponse.json(
          { error: "Budget cycle not found" },
          { status: 404 }
        );
      }
    }

    // Create the miscellaneous expense
    const expense = await prisma.miscellaneousExpense.create({
      data: {
        description: body.description,
        amount: body.amount,
        date: new Date(body.date),
        addedById: session.user.id,
        budgetCycleId: body.budgetCycleId,
      },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        budgetCycle: {
          select: {
            id: true,
            month: true,
            year: true,
          },
        },
      },
    });

    // Return the created expense
    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error adding miscellaneous expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
