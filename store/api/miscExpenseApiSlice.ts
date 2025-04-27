import { apiSlice } from "./apiSlice";
import { User } from "./userApiSlice";

export interface MiscellaneousExpense {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  addedById: string;
  addedBy: User;
  budgetCycleId: string | null;
  createdAt: string; // ISO date string
}

export interface AddMiscExpenseRequest {
  description: string;
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  budgetCycleId?: string;
}

export interface UpdateMiscExpenseRequest {
  description?: string;
  amount?: number;
  date?: string; // ISO date string (YYYY-MM-DD)
}

export const miscExpenseApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all miscellaneous expenses (Mess Manager/GS)
    getMiscExpenses: builder.query<MiscellaneousExpense[], string | void>({
      query: (cycleId) =>
        cycleId ? `/misc-expenses?cycleId=${cycleId}` : "/misc-expenses",
      providesTags: ["MiscExpense"],
    }),

    // Add a miscellaneous expense (Mess Manager only)
    addMiscExpense: builder.mutation<
      MiscellaneousExpense,
      AddMiscExpenseRequest
    >({
      query: (data) => ({
        url: "/misc-expenses",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MiscExpense", "BudgetCycle"],
    }),

    // Update a miscellaneous expense (Mess Manager only)
    updateMiscExpense: builder.mutation<
      MiscellaneousExpense,
      { expenseId: string; data: UpdateMiscExpenseRequest }
    >({
      query: ({ expenseId, data }) => ({
        url: `/misc-expenses/${expenseId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result) => [
        "MiscExpense",
        { type: "MiscExpense", id: result?.id },
        "BudgetCycle",
      ],
    }),

    // Delete a miscellaneous expense (Mess Manager only)
    deleteMiscExpense: builder.mutation<void, string>({
      query: (expenseId) => ({
        url: `/misc-expenses/${expenseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MiscExpense", "BudgetCycle"],
    }),
  }),
});

export const {
  useGetMiscExpensesQuery,
  useAddMiscExpenseMutation,
  useUpdateMiscExpenseMutation,
  useDeleteMiscExpenseMutation,
} = miscExpenseApiSlice;
