import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { cycleId: string } }
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

    // Get the cycle ID from the URL
    const { cycleId } = params;

    // Check if the budget cycle exists
    const budgetCycle = await prisma.budgetCycle.findUnique({
      where: { id: cycleId },
      include: {
        payments: true,
      },
    });

    if (!budgetCycle) {
      return NextResponse.json(
        { error: "Budget cycle not found" },
        { status: 404 }
      );
    }

    // Check if the budget cycle is already finalized
    if (budgetCycle.isFinalized) {
      return NextResponse.json(
        { error: "Budget cycle is already finalized" },
        { status: 409 }
      );
    }

    // Get all bills for the cycle period
    const bills = await prisma.bill.findMany({
      where: {
        marketingTask: {
          date: {
            gte: budgetCycle.startDate,
            lte: budgetCycle.endDate,
          },
        },
      },
    });

    // Get all miscellaneous expenses for the cycle
    const miscExpenses = await prisma.miscellaneousExpense.findMany({
      where: {
        OR: [
          { budgetCycleId: cycleId },
          {
            date: {
              gte: budgetCycle.startDate,
              lte: budgetCycle.endDate,
            },
            budgetCycleId: null,
          },
        ],
      },
    });

    // Calculate total expenditure
    const billsTotal = bills.reduce(
      (sum, bill) => sum + bill.totalBillAmount,
      0
    ); // Use totalBillAmount
    const expensesTotal = miscExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const totalExpenditure = billsTotal + expensesTotal;

    // Get the number of students who paid
    const studentCount = budgetCycle.payments.length;

    if (studentCount === 0) {
      return NextResponse.json(
        { error: "No students have paid for this cycle" },
        { status: 400 }
      );
    }

    // Calculate per-head cost
    const perHeadCost = totalExpenditure / studentCount;

    // Update the budget cycle and payments in a transaction
    const updatedCycle = await prisma.$transaction(async (tx) => {
      // Update the budget cycle
      const updated = await tx.budgetCycle.update({
        where: { id: cycleId },
        data: {
          totalExpenditure,
          perHeadCost,
          isFinalized: true,
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
                },
              },
            },
          },
        },
      });

      // Update each payment with the amount to be returned
      for (const payment of updated.payments) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            amountReturned: payment.amountPaid - perHeadCost,
          },
        });
      }

      // Link any unlinked miscellaneous expenses to this cycle
      await tx.miscellaneousExpense.updateMany({
        where: {
          date: {
            gte: budgetCycle.startDate,
            lte: budgetCycle.endDate,
          },
          budgetCycleId: null,
        },
        data: {
          budgetCycleId: cycleId,
        },
      });

      return updated;
    });

    // Return the updated budget cycle
    return NextResponse.json(updatedCycle);
  } catch (error) {
    console.error("Error finishing budget cycle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
