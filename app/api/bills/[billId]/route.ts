import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { billId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billId = params.billId;
    if (!billId) {
      return NextResponse.json(
        { error: "Bill ID is required" },
        { status: 400 }
      );
    }

    // Get the bill with all related data
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
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
        marketingItems: true, // Include marketing items
        marketingTask: {
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
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Check if the user has permission to view this bill
    const userId = session.user.id;
    const userRole = session.user.role;

    // General Secretary and Mess Manager can view all bills
    if (userRole === "GENERAL_SECRETARY" || userRole === "MESS_MANAGER") {
      return NextResponse.json(bill);
    }

    // Boarders can only view bills they submitted or bills for tasks assigned to them
    const isSubmitter = bill.submittedById === userId;
    const isAssignedToTask = bill.marketingTask.assignedStudents.some(
      (student) => student.id === userId
    );

    if (!isSubmitter && !isAssignedToTask) {
      return NextResponse.json(
        { error: "You do not have permission to view this bill" },
        { status: 403 }
      );
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
