import { apiSlice } from "./apiSlice";
import { UserRole } from "@prisma/client";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
}

export interface UserWithMarketingCount extends User {
  marketingTaskCount: number;
}

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get current user profile
    getMe: builder.query<User, void>({
      query: () => "/users/me",
      providesTags: ["User"],
    }),

    // Get all users (for admin/GS)
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),

    // Get users with marketing task count (for admin/GS)
    getUsersWithMarketingCount: builder.query<UserWithMarketingCount[], void>({
      query: () => "/users/marketing-summary",
      providesTags: ["Users"],
    }),

    // Assign Mess Manager role to a user (admin/GS only)
    assignRole: builder.mutation<User, { userId: string; role: UserRole }>({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/assign-role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["Users", "User"],
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetUsersQuery,
  useGetUsersWithMarketingCountQuery,
  useAssignRoleMutation,
} = userApiSlice;
