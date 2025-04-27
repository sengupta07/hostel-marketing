import { apiSlice } from "./apiSlice";
import { User } from "./userApiSlice"; // Assuming User type is defined here
import { MarketingTaskStatus } from "@prisma/client"; // Assuming Prisma enums are used

// Interface for a standard Marketing Task
export interface MarketingTask {
  id: string;
  date: string; // ISO date string
  status: MarketingTaskStatus;
  moneyGiven: number | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  assignedStudents: Pick<User, "id" | "name">[]; // Include only necessary User fields
  createdByUserId: string;
  createdByUser: Pick<User, "id" | "name">; // Include only necessary User fields
}

// Interface for the related Bill data (Refined)
export interface Bill {
  id: string;
  // amount: number; // Maybe keep this if it represents something specific? Or remove if redundant.
  totalBillAmount: number; // <-- Added based on BillForm calculation
  description: string | null;
  submittedAt: string; // ISO date string
  moneyReturned: number | null; // This seems calculated, maybe not stored directly? depends on backend.
  receiptUrl: string | null;
  marketingTaskId: string; // Link back to the task
  submittedById: string;
  submittedBy?: Pick<User, "id" | "name">; // Optional included relation
  // Add other relevant Bill fields like marketingItems, groceryTotal if stored & needed
  marketingItems?: { id: string; label: string; amount: number }[]; // Example if items are stored
  groceryTotal?: number;
  amountGiven?: number; // May be redundant if stored on MarketingTask
}

// Interface extending MarketingTask to include the OPTIONAL nested Bill
export interface MarketingTaskWithBill extends MarketingTask {
  bill: Pick<Bill, "id" | "totalBillAmount"> | null; // Include only necessary Bill fields, make optional
}

// Request types (kept as before)
export interface AssignMarketingTaskRequest {
  date: string;
  studentIds: string[];
  moneyGiven: number;
}

export interface CompleteMarketingTaskRequest {
  moneyReturnReceived: boolean;
}

export const marketingTaskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all marketing tasks (Mess Manager/GS) - Might also need to return MarketingTaskWithBill[]
    getAllMarketingTasks: builder.query<MarketingTaskWithBill[], void>({
      // Consider updating return type here too if needed
      query: () => "/marketing/all",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "MarketingTask" as const,
                id,
              })),
              { type: "MarketingTask", id: "ALL_LIST" }, // Use a specific LIST ID
            ]
          : [{ type: "MarketingTask", id: "ALL_LIST" }],
    }),

    // --- MODIFIED HERE ---
    // Get tasks assigned to the current user (Boarder)
    // Updated return type to expect included bill info
    getMyMarketingTasks: builder.query<MarketingTaskWithBill[], void>({
      query: () => "/marketing/my-tasks",
      // Ensure the backend API at /marketing/my-tasks includes the related 'bill'
      // with at least { id, totalBillAmount } selected
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "MarketingTask" as const,
                id,
              })),
              { type: "MarketingTask", id: "MY_LIST" }, // Use a specific LIST ID
            ]
          : [{ type: "MarketingTask", id: "MY_LIST" }],
      // Add transformResponse if API returns date strings but you want Date objects
      // transformResponse: (response: MarketingTaskWithBill[]) => {
      //   return response.map(task => ({
      //      ...task,
      //      date: new Date(task.date),
      //      createdAt: new Date(task.createdAt),
      //      updatedAt: new Date(task.updatedAt),
      //      bill: task.bill ? { ...task.bill, submittedAt: new Date(task.bill.submittedAt)} : null // Example transform for bill date
      //   }));
      // }
    }),
    // --- END MODIFICATION ---

    // Get a specific marketing task by ID (already fetches bill)
    getMarketingTaskById: builder.query<MarketingTaskWithBill, string>({
      query: (taskId) => `/marketing/${taskId}`,
      providesTags: (result, error, id) => [{ type: "MarketingTask", id }],
    }),

    // Assign students to a marketing task (Mess Manager only)
    assignMarketingTask: builder.mutation<
      MarketingTask,
      AssignMarketingTaskRequest
    >({
      query: (data) => ({
        url: "/marketing/assign",
        method: "POST",
        body: data,
      }),
      // Invalidate both lists on assignment
      invalidatesTags: [
        { type: "MarketingTask", id: "ALL_LIST" },
        { type: "MarketingTask", id: "MY_LIST" },
      ],
    }),

    // Mark a marketing task as complete (Mess Manager only)
    completeMarketingTask: builder.mutation<
      MarketingTask, // Returns the updated task
      { taskId: string; data: CompleteMarketingTaskRequest }
    >({
      query: ({ taskId, data }) => ({
        url: `/marketing/${taskId}/complete`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        // Invalidate both lists and the specific task
        { type: "Bill", id: "LIST" },
        { type: "MarketingTask", id: "ALL_LIST" },
        { type: "MarketingTask", id: "MY_LIST" },
        { type: "MarketingTask", id: taskId },
      ],
    }),

    // Delete a marketing task (Mess Manager only)
    deleteMarketingTask: builder.mutation<
      { message: string }, // Returns success message
      string // Task ID to delete
    >({
      query: (taskId) => ({
        url: `/marketing/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, taskId) => [
        // Invalidate both lists
        { type: "MarketingTask", id: "ALL_LIST" },
        { type: "MarketingTask", id: "MY_LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllMarketingTasksQuery,
  useGetMyMarketingTasksQuery, // This hook now returns MarketingTaskWithBill[]
  useGetMarketingTaskByIdQuery,
  useAssignMarketingTaskMutation,
  useCompleteMarketingTaskMutation,
  useDeleteMarketingTaskMutation,
} = marketingTaskApiSlice;
