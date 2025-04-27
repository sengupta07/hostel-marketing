import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

interface UpdateExpenseRequestBody {
  description?: string;
  amount?: number;
  date?: string; // ISO date string (YYYY-MM-DD)
  budgetCycleId?: string | null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { expenseId: string } }
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

    // Get the expense ID from the URL
    const { expenseId } = params;

    // Parse the request body
    const body: UpdateExpenseRequestBody = await request.json();

    // Check if the expense exists
    const expense = await prisma.miscellaneousExpense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Miscellaneous expense not found" },
        { status: 404 }
      );
    }

    // Validate the amount if provided
    if (body.amount !== undefined && body.amount <= 0) {
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

    // Prepare the update data
    const updateData: any = {};

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.amount !== undefined) {
      updateData.amount = body.amount;
    }

    if (body.date !== undefined) {
      updateData.date = new Date(body.date);
    }

    if (body.budgetCycleId !== undefined) {
      updateData.budgetCycleId = body.budgetCycleId;
    }

    // Update the expense
    const updatedExpense = await prisma.miscellaneousExpense.update({
      where: { id: expenseId },
      data: updateData,
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

    // Return the updated expense
    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error updating miscellaneous expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { expenseId: string } }
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

    // Get the expense ID from the URL
    const { expenseId } = params;

    // Check if the expense exists
    const expense = await prisma.miscellaneousExpense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Miscellaneous expense not found" },
        { status: 404 }
      );
    }

    // Delete the expense
    await prisma.miscellaneousExpense.delete({
      where: { id: expenseId },
    });

    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting miscellaneous expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
