// This file will contain shared TypeScript types and interfaces.

export interface Student {
  id: number; // Consider using string UUIDs for consistency if Bills use strings
  name: string;
  roomNumber: string;
  amountPaid: number;
  amountToReturn: number;
  lastMonthDue: number;
}

// --- Bill Related Types ---

export interface MarketingItem {
  id: string; // Unique identifier for the marketing item (e.g., 'pogg', 'egg')
  label: string; // Display name (e.g., 'Potato/Onion/Garlic/Ginger')
  enabled: boolean; // Whether this item is included in the current bill calculation
  amount: number | string; // The cost for this item (string during edit, number otherwise)
  isEditing: boolean; // UI state flag for inline editing
}

// Represents the structure returned by the API, closer to Prisma model
export interface Bill {
  id: string;
  date: string | Date; // Date from the form (might be string initially)
  marketingTotal: number;
  groceryTotal: number;
  totalBillAmount: number; // Overall total
  amountGiven: number; // Amount given for the task
  moneyReturned: number | null; // Calculated: amountGiven - totalBillAmount
  description: string | null;
  receiptUrl: string | null;
  submittedAt: string | Date; // When the record was created (might be string initially)
  marketingTaskId: string;
  submittedById: string;
  submittedBy: {
    // Include submittedBy user details
    id: string;
    name: string | null;
  };
  marketingItems: {
    // Reflecting Prisma's BillMarketingItem structure
    id: string;
    itemId: string;
    label: string;
    amount: number;
  }[];
  // Include the related marketing task
  marketingTask?: {
    id: string;
    status: string; // "ASSIGNED", "BILL_SUBMITTED", "COMPLETED"
    date: string | Date;
    assignedStudents?: { id: string; name: string | null }[];
  };
}

// Add other shared types below
