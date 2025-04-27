import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

const protectedApiRoutes: {
  path: string;
  roles: UserRole[];
  method: string;
  regex?: boolean;
}[] = [
  // User routes
  {
    path: "/api/users",
    roles: [UserRole.GENERAL_SECRETARY, UserRole.MESS_MANAGER],
    method: "GET",
  },
  {
    path: "/api/users/marketing-summary",
    roles: [UserRole.GENERAL_SECRETARY, UserRole.MESS_MANAGER],
    method: "GET",
  },
  {
    path: "/api/users/.+/assign-role",
    roles: [UserRole.GENERAL_SECRETARY],
    method: "PATCH",
    regex: true,
  },
  {
    path: "/api/users/me",
    roles: [
      UserRole.GENERAL_SECRETARY,
      UserRole.MESS_MANAGER,
      UserRole.BOARDER,
    ],
    method: "GET",
  },

  // Marketing Task routes
  {
    path: "/api/marketing/all",
    roles: [UserRole.GENERAL_SECRETARY, UserRole.MESS_MANAGER],
    method: "GET",
  },
  {
    path: "/api/marketing/assign",
    roles: [UserRole.MESS_MANAGER],
    method: "POST",
  },
  {
    path: "/api/marketing/.+/complete",
    roles: [UserRole.MESS_MANAGER],
    method: "PATCH",
    regex: true,
  },
  { path: "/api/marketing/my-tasks", roles: [UserRole.BOARDER], method: "GET" },

  // Bill routes
  {
    path: "/api/bills",
    roles: [UserRole.GENERAL_SECRETARY, UserRole.MESS_MANAGER],
    method: "GET",
  },
  {
    path: "/api/marketing/.+/bill",
    roles: [UserRole.BOARDER],
    method: "POST",
    regex: true,
  },
  {
    path: "/api/bills/.+",
    roles: [
      UserRole.GENERAL_SECRETARY,
      UserRole.MESS_MANAGER,
      UserRole.BOARDER,
    ],
    method: "GET",
    regex: true,
  },
  // { path: "/api/bills/.+", roles: [UserRole.GENERAL_SECRETARY, UserRole.MESS_MANAGER], method: "PATCH", regex: true },

  // Budget routes
  {
    path: "/api/budget/overview",
    roles: [UserRole.GENERAL_SECRETARY, UserRole.MESS_MANAGER],
    method: "GET",
  },
  { path: "/api/budget/status", roles: [UserRole.BOARDER], method: "GET" },
  {
    path: "/api/budget/cycles",
    roles: [UserRole.GENERAL_SECRETARY, UserRole.MESS_MANAGER],
    method: "POST",
  },
  {
    path: "/api/budget/cycles/current",
    roles: [
      UserRole.GENERAL_SECRETARY,
      UserRole.MESS_MANAGER,
      UserRole.BOARDER,
    ],
    method: "GET",
  },
  {
    path: "/api/budget/cycles/.+/finish",
    roles: [UserRole.MESS_MANAGER],
    method: "POST",
    regex: true,
  },
  // { path: "/api/budget/cycles/.+/pay", roles: [UserRole.BOARDER], method: "POST", regex: true },

  // Miscellaneous Expense routes
  {
    path: "/api/misc-expenses",
    roles: [UserRole.GENERAL_SECRETARY, UserRole.MESS_MANAGER],
    method: "GET",
  },
  {
    path: "/api/misc-expenses",
    roles: [UserRole.MESS_MANAGER],
    method: "POST",
  },
  {
    path: "/api/misc-expenses/.+",
    roles: [UserRole.MESS_MANAGER],
    method: "PATCH",
    regex: true,
  },
  {
    path: "/api/misc-expenses/.+",
    roles: [UserRole.MESS_MANAGER],
    method: "DELETE",
    regex: true,
  },
];

const protectedPageRoutes: {
  path: string;
  roles: UserRole[];
}[] = [
  { path: "/admin", roles: [UserRole.GENERAL_SECRETARY] },
  { path: "/manager", roles: [UserRole.MESS_MANAGER] },
  { path: "/dashboard", roles: [UserRole.BOARDER] },
  {
    path: "/",
    roles: [
      UserRole.GENERAL_SECRETARY,
      UserRole.MESS_MANAGER,
      UserRole.BOARDER,
    ],
  },
  // { path: "/profile", roles: [UserRole.GENERAL_SECRETARY, UserRole.MESS_MANAGER, UserRole.BOARDER] },
];

const publicRoutes = [
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/api/auth/register",
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;

  if (publicRoutes.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  if (path.startsWith("/api")) {
    if (path.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    const matchedApiRoute = protectedApiRoutes.find((route) => {
      if (route.method !== method) return false;
      return route.regex
        ? new RegExp(`^${route.path}$`).test(path)
        : route.path === path;
    });

    if (!matchedApiRoute) {
      return NextResponse.next();
    }

    if (!token || !token.role) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Authentication required" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    const hasRequiredApiRole = matchedApiRoute.roles.includes(
      token.role as UserRole
    );

    if (!hasRequiredApiRole) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Forbidden: Insufficient permissions",
        }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    return NextResponse.next();
  }

  if (!token || !token.role) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  const matchedPageRoute = protectedPageRoutes.find((route) => {
    return path.startsWith(route.path);
  });

  if (matchedPageRoute) {
    const hasRequiredPageRole = matchedPageRoute.roles.includes(
      token.role as UserRole
    );

    if (!hasRequiredPageRole) {
      let redirectUrl = "/auth/signin";
      switch (token.role) {
        case UserRole.GENERAL_SECRETARY:
          redirectUrl = "/admin";
          break;
        case UserRole.MESS_MANAGER:
          redirectUrl = "/manager";
          break;
        case UserRole.BOARDER:
          redirectUrl = "/dashboard";
          break;
      }
      if (request.nextUrl.pathname !== redirectUrl) {
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
