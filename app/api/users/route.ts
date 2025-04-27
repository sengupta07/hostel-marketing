import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
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
    // Note: This check is also handled by the middleware, but it's good to have it here as well
    if (
      session.user.role !== UserRole.GENERAL_SECRETARY &&
      session.user.role !== UserRole.MESS_MANAGER
    ) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    // Get all users from the database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Return the users
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
