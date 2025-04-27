import { apiSlice } from "./apiSlice";
import { User } from "./userApiSlice";

export interface BudgetCycle {
  id: string;
  month: number;
  year: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  paymentDeadline: string; // ISO date string
  totalExpenditure: number | null;
  perHeadCost: number | null;
  isFinalized: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Payment {
  id: string;
  userId: string;
  user: User;
  budgetCycleId: string;
  budgetCycle: BudgetCycle;
  amountPaid: number;
  paymentDate: string; // ISO date string
  stripePaymentIntentId: string | null;
  status: string;
  amountReturned: number | null;
}

export interface BudgetOverviewItem {
  userId: string;
  user: User;
  amountPaid: number;
  amountToBeReturned: number | null;
}

export interface PaymentStatusResponse {
  hasPaid: boolean;
  payment: Payment | null;
  currentCycle: BudgetCycle;
  perHeadCost: number | null;
  refundOrDue: number | null; // Positive for refund, negative for due
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  amount: number;
}

export const budgetApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get the current active budget cycle
    getCurrentBudgetCycle: builder.query<BudgetCycle, void>({
      query: () => "/budget/cycles/current",
      providesTags: ["BudgetCycle"],
    }),

    // Get a specific budget cycle by ID
    getBudgetCycleById: builder.query<BudgetCycle, string>({
      query: (cycleId) => `/budget/cycles/${cycleId}`,
      providesTags: (result, error, id) => [{ type: "BudgetCycle", id }],
    }),

    // Get the current user's payment status
    getMyBudgetStatus: builder.query<PaymentStatusResponse, void>({
      query: () => "/budget/my-status",
      providesTags: ["Payment"],
    }),

    // Get the budget overview (Mess Manager/GS)
    getBudgetOverview: builder.query<BudgetOverviewItem[], string | void>({
      query: (cycleId) =>
        cycleId ? `/budget/overview?cycleId=${cycleId}` : "/budget/overview",
      providesTags: ["BudgetCycle", "Payment"],
    }),

    // Create a payment intent for Stripe (Boarder)
    // createPaymentIntent: builder.mutation<CreatePaymentIntentResponse, void>({
    //   query: () => ({
    //     url: "/budget/pay",
    //     method: "POST",
    //   }),
    // }),

    // Finalize the mess budget cycle (Mess Manager)
    finishBudgetCycle: builder.mutation<BudgetCycle, string>({
      query: (cycleId) => ({
        url: `/budget/cycles/${cycleId}/finish`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "BudgetCycle",
        { type: "BudgetCycle", id },
        "Payment",
      ],
    }),

    // Create a new budget cycle (Mess Manager/GS)
    createBudgetCycle: builder.mutation<
      BudgetCycle,
      {
        month: number;
        year: number;
        startDate: string;
        endDate: string;
        paymentDeadline: string;
      }
    >({
      query: (data) => ({
        url: "/budget/cycles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["BudgetCycle"],
    }),
  }),
});

export const {
  useGetCurrentBudgetCycleQuery,
  useGetBudgetCycleByIdQuery,
  useGetMyBudgetStatusQuery,
  useGetBudgetOverviewQuery,
  //   useCreatePaymentIntentMutation,
  useFinishBudgetCycleMutation,
  useCreateBudgetCycleMutation,
} = budgetApiSlice;
