"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Building } from "lucide-react";

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Redirect based on user role
    if (session?.user?.role) {
      switch (session.user.role) {
        case UserRole.GENERAL_SECRETARY:
          router.push("/admin");
          break;
        case UserRole.MESS_MANAGER:
          router.push("/manager");
          break;
        case UserRole.BOARDER:
          router.push("/dashboard");
          break;
        default:
          router.push("/auth/signin");
      }
    }
  }, [session, status, router]);

  // Show loading state while redirecting
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <div className="mb-4 flex items-center gap-2">
        <Building className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Hostel Marketing Management</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
}
