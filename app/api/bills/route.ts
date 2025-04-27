import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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

    // Get all bills with related data
    const bills = await prisma.bill.findMany({
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
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
