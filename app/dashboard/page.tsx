// src/app/(dashboard)/dashboard/page.tsx (Corrected Structure)
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserRole, MarketingTaskStatus } from "@prisma/client";
import {
  ShoppingBag,
  CreditCard,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Menu,
  Download, // Optional
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";
import {
  MarketingTaskWithBill,
  useGetMyMarketingTasksQuery,
} from "@/store/api/marketingTaskApiSlice";
import { useGetMyBudgetStatusQuery } from "@/store/api/budgetApiSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, UserProfile } from "@/components/sidebar";
import { useSubmitBillMutation } from "@/store/api/billApiSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Bill } from "@/types";
import { BillForm, MarketingItemDefinition } from "@/components/bill-form";

// Define Marketing Items
const boarderMarketingItemDefinitions: MarketingItemDefinition[] = [
  { id: "pogg", label: "Potato/Onion/Garlic/Ginger" },
  { id: "egg", label: "Egg" },
  { id: "chicken", label: "Chicken" },
  { id: "veg", label: "Vegetables" },
  { id: "fish", label: "Fish" },
];

// Navigation and Types
const studentNavItems = [
  { id: "tasks", label: "Marketing Tasks", icon: ShoppingBag },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "history", label: "Task History", icon: Calendar },
];
type BoarderTabKey = (typeof studentNavItems)[number]["id"];
// Update BillSubmissionData to match the new Bill type and BillForm's onSubmit parameter type
type BillSubmissionData = Omit<
  Bill,
  "id" | "submittedAt" | "submittedBy" | "submittedById" | "marketingTaskId"
>; // Matches BillForm's onSubmit parameter type

// --- Component Definition ---
export default function BoarderDashboard() {
  // --- ALL HOOKS MUST BE CALLED AT THE TOP LEVEL ---
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const validTabIds = studentNavItems.map((item) => item.id);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BoarderTabKey>(() => {
    if (typeof window !== "undefined") {
      const storedTab = localStorage.getItem("boarderActiveTab");
      if (storedTab && validTabIds.includes(storedTab as BoarderTabKey)) {
        return storedTab as BoarderTabKey;
      }
    }
    return studentNavItems[0].id;
  });
  const [isSubmitBillDialogOpen, setIsSubmitBillDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [billFormInitialData, setBillFormInitialData] = useState<
    React.ComponentProps<typeof BillForm>["initialData"] | null
  >(null);

  // RTK Query Hooks
  const { data: marketingTasksData, isLoading: isTasksLoading } =
    useGetMyMarketingTasksQuery(); // Returns MarketingTaskWithBill[] now
  const { data: budgetStatus, isLoading: isBudgetLoading } =
    useGetMyBudgetStatusQuery();
  const [submitBill, { isLoading: isSubmittingBill }] = useSubmitBillMutation();

  // Derived Data (uses RTK Query data)
  const assignedTask = useMemo(() => {
    // Ensure type compatibility if using MarketingTaskWithBill
    return (marketingTasksData as MarketingTaskWithBill[])?.find(
      (task) => task.status === MarketingTaskStatus.ASSIGNED
    );
  }, [marketingTasksData]);

  // --- Handlers (defined using useCallback AFTER all state/query hooks) ---
  const handleTabChange = useCallback(
    (tabId: string) => {
      const newTabKey = tabId as BoarderTabKey;
      if (validTabIds.includes(newTabKey)) {
        setActiveTab(newTabKey);
        if (typeof window !== "undefined") {
          localStorage.setItem("boarderActiveTab", newTabKey);
        }
        setIsSheetOpen(false);
      } else {
        console.warn("Invalid tabId:", tabId);
      }
    },
    [validTabIds]
  ); // Dependency: validTabIds (constant, but good practice)

  const handleSignOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("boarderActiveTab");
    }
    await signOut({ callbackUrl: "/auth/signin" });
  }, []); // No dependencies

  const handleOpenSubmitBillDialog = useCallback(
    (taskId: string) => {
      const task = (marketingTasksData as MarketingTaskWithBill[])?.find(
        (t) => t.id === taskId
      );
      if (!task || task.status !== MarketingTaskStatus.ASSIGNED) {
        toast({
          title: "Cannot Submit Bill",
          description: "Task not available for submission.",
          variant: "destructive",
        });
        return;
      }
      setBillFormInitialData({
        date: new Date(),
        // Removed students property as it's no longer part of the Bill type
        amountGiven: task.moneyGiven ?? 0,
        marketingItems: [],
        groceryTotal: 0,
      });
      setSelectedTaskId(taskId);
      setIsSubmitBillDialogOpen(true);
    },
    [marketingTasksData, toast] // Dependencies
  );

  const handleBillFormSubmit = useCallback(
    async (submittedBillData: BillSubmissionData) => {
      // Use correct type
      if (!selectedTaskId) {
        toast({
          title: "Error",
          description: "No marketing task selected.",
          variant: "destructive",
        });
        return;
      }
      try {
        console.log("Submitting Bill Data:", {
          marketingTaskId: selectedTaskId,
          billData: submittedBillData,
        });
        await submitBill({
          marketingTaskId: selectedTaskId,
          billData: submittedBillData,
        }).unwrap();
        toast({
          title: "Bill submitted successfully",
          description: "Submitted for review.",
        });
        setIsSubmitBillDialogOpen(false);
        setBillFormInitialData(null);
        setSelectedTaskId(null);
      } catch (error) {
        console.error("Failed to submit bill:", error);
        toast({
          title: "Failed to submit bill",
          description: "An error occurred.",
          variant: "destructive",
        });
      }
    },
    [selectedTaskId, submitBill, toast] // Dependencies
  );

  // --- Auth Effect (defined AFTER all hooks) ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== UserRole.BOARDER
    ) {
      toast({
        title: "Access Denied",
        description: "You do not have permission.",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [session, status, router, toast]); // Dependencies

  // --- User Profile (defined AFTER session hook) ---
  const studentUser: UserProfile | undefined = session?.user
    ? {
        name: session.user.name,
        image: session.user.image,
        role: session.user.role as string,
      }
    : undefined;

  // --- Early Returns (defined AFTER all hooks) ---
  const isLoading = status === "loading" || isTasksLoading || isBudgetLoading;
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        {" "}
        <Loader2 className="h-8 w-8 animate-spin text-primary" />{" "}
      </div>
    );
  }
  if (status === "unauthenticated" || !session) {
    return null;
  }
  // --- End Early Returns ---

  // --- Main Component Return (JSX) ---
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Static Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          title="Student Menu"
          titleIcon={Building}
          navItems={studentNavItems}
          activeTab={activeTab}
          setActiveTab={handleTabChange} // Pass memoized handler
          user={studentUser}
          onSignOut={handleSignOut} // Pass memoized handler
          showSearch={false}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm lg:justify-end">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar
                title="Student Menu"
                titleIcon={Building}
                navItems={studentNavItems}
                activeTab={activeTab}
                setActiveTab={handleTabChange} // Pass memoized handler
                user={studentUser}
                onSignOut={handleSignOut} // Pass memoized handler
                showSearch={false}
              />
            </SheetContent>
          </Sheet>
          {/* Optional Header Actions Placeholder */}
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {/* Page Title Area */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Student Dashboard
              </h1>
              <div className="text-sm text-muted-foreground">
                Manage your tasks and payments.
              </div>
            </div>
          </div>

          {/* Tab Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto space-y-4"
            >
              {/* --- TASKS TAB --- */}
              {activeTab === "tasks" && (
                <>
                  {/* New Assignment Card */}
                  {assignedTask && (
                    <Card className="bg-yellow-50 dark:bg-yellow-900/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-medium text-yellow-800 dark:text-yellow-300">
                          <AlertCircle className="h-5 w-5" /> New Assignment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div key={assignedTask.id}>
                          <p className="text-yellow-800 dark:text-yellow-300">
                            {" "}
                            You have been assigned to marketing duty for{" "}
                            <strong>
                              {new Date(assignedTask.date).toLocaleDateString()}
                            </strong>
                            .
                          </p>
                          <div className="mt-2">
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              <strong>Partner:</strong>{" "}
                              {assignedTask.assignedStudents
                                .filter((s) => s.id !== session?.user?.id)
                                .map((s) => s.name ?? "")
                                .join(", ")}
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              <strong>Money Given:</strong> ₹
                              {assignedTask.moneyGiven || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Dialog
                          open={isSubmitBillDialogOpen}
                          onOpenChange={setIsSubmitBillDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-yellow-500 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:border-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 dark:hover:bg-yellow-900/60"
                              onClick={() =>
                                handleOpenSubmitBillDialog(assignedTask.id)
                              }
                            >
                              Submit Bill Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] border-glass-border/30 bg-glass/80 backdrop-blur-xl shadow-xl text-glass-foreground">
                            <DialogHeader>
                              <DialogTitle>
                                Submit Marketing Bill Details
                              </DialogTitle>
                              <DialogDescription>
                                Fill out the details for your marketing expenses
                                for task on{" "}
                                {assignedTask &&
                                  new Date(
                                    assignedTask.date
                                  ).toLocaleDateString()}
                                .
                              </DialogDescription>
                            </DialogHeader>
                            {billFormInitialData && (
                              <div className="flex-1 overflow-y-auto p-6">
                                <BillForm
                                  marketingItemDefinitions={
                                    boarderMarketingItemDefinitions
                                  }
                                  initialData={billFormInitialData}
                                  onSubmit={handleBillFormSubmit}
                                  submitButtonText="Submit Bill"
                                  isLoading={isSubmittingBill}
                                />
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  )}

                  {/* Marketing Tasks Table Card */}
                  {marketingTasksData &&
                    (marketingTasksData as MarketingTaskWithBill[]).length >
                      0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Marketing Tasks</CardTitle>
                          <CardDescription>
                            Your marketing assignments
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-md border">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50 text-left">
                                  <th className="p-2 font-medium">Date</th>
                                  <th className="p-2 font-medium">Partner</th>
                                  <th className="p-2 font-medium">
                                    Money Given
                                  </th>
                                  <th className="p-2 font-medium">Status</th>
                                  <th className="p-2 font-medium">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(
                                  marketingTasksData as MarketingTaskWithBill[]
                                ).map(
                                  (
                                    task // Cast here if needed for type safety inside map
                                  ) => (
                                    <tr key={task.id} className="border-b">
                                      <td className="p-2">
                                        {new Date(
                                          task.date
                                        ).toLocaleDateString()}
                                      </td>
                                      <td className="p-2">
                                        {task.assignedStudents
                                          .filter(
                                            (s) => s.id !== session?.user?.id
                                          )
                                          .map((s) => s.name ?? "")
                                          .join(", ")}
                                      </td>
                                      <td className="p-2">
                                        ₹{task.moneyGiven || 0}
                                      </td>
                                      <td className="p-2">
                                        <span
                                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${task.status === MarketingTaskStatus.ASSIGNED ? "bg-blue-100 text-blue-800" : task.status === MarketingTaskStatus.BILL_SUBMITTED ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                                        >
                                          {task.status.replace("_", " ")}
                                        </span>
                                      </td>
                                      <td className="p-2">
                                        {task.status ===
                                          MarketingTaskStatus.ASSIGNED && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleOpenSubmitBillDialog(
                                                task.id
                                              )
                                            }
                                          >
                                            Submit Bill
                                          </Button>
                                        )}
                                        {(task.status ===
                                          MarketingTaskStatus.BILL_SUBMITTED ||
                                          task.status ===
                                            MarketingTaskStatus.COMPLETED) && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled
                                          >
                                            View Bill
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  {/* No tasks message */}
                  {(!marketingTasksData ||
                    (marketingTasksData as MarketingTaskWithBill[]).length ===
                      0) &&
                    !isTasksLoading && (
                      <Card className="flex items-center justify-center p-6 border-dashed">
                        <p className="text-muted-foreground">
                          No marketing tasks assigned yet.
                        </p>
                      </Card>
                    )}
                </>
              )}

              {/* --- PAYMENTS TAB --- */}
              {activeTab === "payments" && (
                <>
                  {budgetStatus ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Mess Cycle</CardTitle>
                        <CardDescription>
                          {budgetStatus.currentCycle.month}/
                          {budgetStatus.currentCycle.year} Mess Cycle
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">
                                Payment Status
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center gap-2">
                              {budgetStatus.hasPaid ? (
                                <>
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  <div className="text-lg font-medium text-green-600">
                                    Paid
                                  </div>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                  <div className="text-lg font-medium text-red-600">
                                    Unpaid
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">
                                Amount Paid
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {budgetStatus.hasPaid && budgetStatus.payment
                                  ? `₹${budgetStatus.payment.amountPaid}`
                                  : "₹0"}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">
                                Payment Date
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-lg">
                                {budgetStatus.hasPaid && budgetStatus.payment
                                  ? new Date(
                                      budgetStatus.payment.paymentDate
                                    ).toLocaleDateString()
                                  : "Not paid yet"}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        <div className="rounded-md border bg-muted/30 p-4">
                          <h3 className="mb-2 text-lg font-medium">
                            Mess Cycle Details
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Cycle Period:</span>
                              <span>
                                {new Date(
                                  budgetStatus.currentCycle.startDate
                                ).toLocaleDateString()}{" "}
                                -{" "}
                                {new Date(
                                  budgetStatus.currentCycle.endDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Payment Deadline:</span>
                              <span>
                                {new Date(
                                  budgetStatus.currentCycle.paymentDeadline
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Per-head Cost:</span>
                              <span>
                                {budgetStatus.perHeadCost
                                  ? `₹${budgetStatus.perHeadCost}`
                                  : "Not yet calculated"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Refund/Due:</span>
                              <span>
                                {budgetStatus.refundOrDue !== null
                                  ? budgetStatus.refundOrDue > 0
                                    ? `₹${budgetStatus.refundOrDue} (Refund)`
                                    : `₹${Math.abs(budgetStatus.refundOrDue)} (Due)`
                                  : "Calculated at cycle end"}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!budgetStatus.hasPaid && (
                          <div className="mt-4">
                            <Button
                              className="w-full"
                              disabled={!budgetStatus.perHeadCost}
                            >
                              Pay Mess Bill (₹
                              {budgetStatus.perHeadCost || "..."})
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="flex items-center justify-center p-6 border-dashed">
                      <p className="text-muted-foreground">
                        Budget information not available.
                      </p>
                    </Card>
                  )}
                </>
              )}

              {/* --- HISTORY TAB --- */}
              {activeTab === "history" && (
                <>
                  {marketingTasksData &&
                  (marketingTasksData as MarketingTaskWithBill[]).filter(
                    (t) => t.status !== MarketingTaskStatus.ASSIGNED
                  ).length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Task History</CardTitle>
                        <CardDescription>
                          Your past marketing assignments and their status
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50 text-left">
                                <th className="p-2 font-medium">Date</th>
                                <th className="p-2 font-medium">Partner</th>
                                <th className="p-2 font-medium">Money Given</th>
                                <th className="p-2 font-medium">Status</th>
                                <th className="p-2 font-medium">Bill Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(marketingTasksData as MarketingTaskWithBill[])
                                .filter(
                                  (task) =>
                                    task.status !== MarketingTaskStatus.ASSIGNED
                                )
                                .sort(
                                  (a, b) =>
                                    new Date(b.date).getTime() -
                                    new Date(a.date).getTime()
                                )
                                .map((task) => (
                                  <tr key={task.id} className="border-b">
                                    <td className="p-2">
                                      {new Date(task.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-2">
                                      {task.assignedStudents
                                        .filter(
                                          (s) => s.id !== session?.user?.id
                                        )
                                        .map((s) => s.name ?? "")
                                        .join(", ")}
                                    </td>
                                    <td className="p-2">
                                      ₹{task.moneyGiven || 0}
                                    </td>
                                    <td className="p-2">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${task.status === MarketingTaskStatus.BILL_SUBMITTED ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                                      >
                                        {task.status.replace("_", " ")}
                                      </span>
                                    </td>
                                    <td className="p-2">
                                      {task.bill?.totalBillAmount != null
                                        ? `₹${task.bill.totalBillAmount.toFixed(2)}`
                                        : "-"}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="flex items-center justify-center p-6 border-dashed">
                      <p className="text-muted-foreground">
                        No task history found.
                      </p>
                    </Card>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
