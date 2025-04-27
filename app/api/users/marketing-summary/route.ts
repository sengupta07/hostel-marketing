import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

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

    // Get all users with their marketing task count
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        assignedMarketingTasks: {
          select: {
            id: true,
          },
        },
      },
    });

    // Transform the data to include the marketing task count
    const usersWithMarketingCount = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      marketingTaskCount: user.assignedMarketingTasks.length,
    }));

    return NextResponse.json(usersWithMarketingCount);
  } catch (error) {
    console.error("Error fetching users with marketing count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
