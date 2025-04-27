// src/app/api/bills/submit/route.ts (or appropriate file)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route"; // Adjust path if needed
import { PrismaClient, MarketingTaskStatus, UserRole } from "@prisma/client";
import type {
  Bill as BillType,
  MarketingItem as MarketingItemType,
} from "@/types"; // Import frontend types for structure reference

const prisma = new PrismaClient();

// Define the expected structure of the Bill details part of the request
// This should match the BillSubmissionData type used in the frontend slice
type BillSubmissionDataPayload = Omit<
  BillType,
  | "id"
  | "submittedAt"
  | "submittedBy"
  | "submittedById"
  | "marketingTaskId"
  | "marketingTask"
>;

// Define the full expected request body structure
interface RequestBody {
  marketingTaskId: string;
  billData: BillSubmissionDataPayload; // Nested bill details object
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      // Check for user ID as well
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the *new* request body structure
    const body: RequestBody = await request.json();
    const { marketingTaskId, billData } = body;

    // --- Updated Validation ---
    if (
      !marketingTaskId ||
      !billData ||
      !billData.date ||
      billData.totalBillAmount == null || // Use the main total for validation
      billData.amountGiven == null
    ) {
      console.log("Validation failed. Received body:", body); // Log received data on error
      return NextResponse.json(
        { error: "Missing required bill data fields" },
        { status: 400 }
      );
    }

    // Validate total amount (can be zero if amountGiven matches expenses exactly)
    if (billData.totalBillAmount < 0) {
      return NextResponse.json(
        { error: "Total bill amount cannot be negative" },
        { status: 400 }
      );
    }
    // Validate individual item amounts if needed
    if (
      billData.marketingItems.some((item) => Number(item.amount) < 0) ||
      billData.groceryTotal < 0
    ) {
      return NextResponse.json(
        { error: "Item amounts cannot be negative" },
        { status: 400 }
      );
    }
    // --- End Updated Validation ---

    // Fetch the marketing task, including student IDs and check for existing bill
    const marketingTask = await prisma.marketingTask.findUnique({
      where: { id: marketingTaskId },
      include: {
        assignedStudents: { select: { id: true } }, // Only need IDs for auth check
        bill: { select: { id: true } }, // Check if bill relation exists
      },
    });

    if (!marketingTask) {
      return NextResponse.json(
        { error: "Marketing task not found" },
        { status: 404 }
      );
    }

    // Check if the logged-in user is assigned to this task
    const isAssigned = marketingTask.assignedStudents.some(
      (student) => student.id === session.user.id
    );
    // Allow Managers/GS to potentially submit/override? If so, add roles here.
    // For now, restrict to assigned boarder as per original logic assumption.
    if (
      !isAssigned &&
      session.user.role !== UserRole.MESS_MANAGER &&
      session.user.role !== UserRole.GENERAL_SECRETARY
    ) {
      return NextResponse.json(
        { error: "You are not assigned to this task or lack permission" },
        { status: 403 }
      );
    }

    // Check if a bill *already exists* for this task
    if (marketingTask.bill) {
      return NextResponse.json(
        { error: "A bill already exists for this marketing task" },
        { status: 409 }
      );
    }

    // Check if task is actually in ASSIGNED state before allowing bill submission
    if (marketingTask.status !== MarketingTaskStatus.ASSIGNED) {
      return NextResponse.json(
        {
          error: `Task is not in ASSIGNED state (current: ${marketingTask.status})`,
        },
        { status: 400 }
      );
    }

    // --- Updated Bill Creation within Transaction ---
    const createdBill = await prisma.$transaction(async (tx) => {
      const newBill = await tx.bill.create({
        data: {
          // Map fields from billData to the Prisma Bill model
          date: new Date(billData.date), // Convert ISO string to Date
          marketingTotal: billData.marketingTotal,
          groceryTotal: billData.groceryTotal,
          totalBillAmount: billData.totalBillAmount, // Use the total from form data
          amountGiven: billData.amountGiven, // Use amountGiven from form data
          moneyReturned: billData.moneyReturned, // Use amountReturned from form data
          description: billData.description, // Optional
          receiptUrl: billData.receiptUrl, // Optional

          // Relationships / Generated fields
          marketingTaskId: marketingTaskId, // Link to the MarketingTask
          submittedById: session.user.id!, // Link to the logged-in user

          // Create nested Marketing Items (requires schema change mentioned above)
          marketingItems: {
            create: billData.marketingItems.map((item) => ({
              itemId: item.id, // e.g., "pogg", "egg"
              label: item.label, // e.g., "Potato/Onion/..."
              amount: Number(item.amount), // The specific cost for this item
            })),
          },
          // status: BillStatus.PENDING // Set initial status if using enum
        },
        // Include related data needed for the response
        include: {
          submittedBy: {
            select: { id: true, name: true, email: true, image: true },
          },
          marketingItems: true, // Include the created items in the response
          // marketingTask: false, // Avoid circular inclusion unless needed
        },
      });

      // Update the marketing task status to BILL_SUBMITTED
      await tx.marketingTask.update({
        where: { id: marketingTaskId },
        data: {
          status: MarketingTaskStatus.BILL_SUBMITTED,
        },
      });

      return newBill; // Return the created bill with includes
    });
    // --- End Updated Bill Creation ---

    return NextResponse.json(createdBill); // Return the detailed created bill object
  } catch (error) {
    console.error("Error submitting bill:", error);
    // Handle potential JSON parsing errors or other exceptions
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error during bill submission" },
      { status: 500 }
    );
  }
}
