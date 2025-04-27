import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { Mutex } from "async-mutex";

// Create a mutex to prevent multiple refresh token requests
const mutex = new Mutex();

// Base query with authentication handling
const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include", // Include cookies in requests
  prepareHeaders: (headers) => {
    // You can add any common headers here
    return headers;
  },
});

// Enhanced base query with error handling and token refresh logic
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait until the mutex is available without locking it
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Checking if the mutex is locked
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        // Try to get a new token
        const refreshResult = await baseQuery(
          { url: "/auth/refresh", method: "POST" },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          // Retry the initial query
          result = await baseQuery(args, api, extraOptions);
        } else {
          // If refresh fails, redirect to login
          window.location.href = "/auth/signin";
        }
      } finally {
        // Release the mutex
        release();
      }
    } else {
      // Wait until the mutex is available without locking it
      await mutex.waitForUnlock();
      // Retry the initial query
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

// Create the API slice
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Users",
    "MarketingTask",
    "MarketingTasks",
    "Bill",
    "Bills",
    "BudgetCycle",
    "Payment",
    "MiscExpense",
  ],
  endpoints: (builder) => ({}),
});
