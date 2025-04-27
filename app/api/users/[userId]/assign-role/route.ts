import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestBody {
  role: UserRole;
}

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
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
    // Note: This check is also handled by the middleware, but it's good to have it here as well
    if (session.user.role !== UserRole.GENERAL_SECRETARY) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    // Get the user ID from the URL
    const { userId } = params;

    // Parse the request body
    const body: RequestBody = await request.json();

    // Validate the request body
    if (!body.role || !Object.values(UserRole).includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: body.role },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    // Return the updated user
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
