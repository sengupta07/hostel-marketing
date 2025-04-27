"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { NavItem, Sidebar, UserProfile } from "@/components/sidebar"; // Ensure NavItem, UserProfile are exported
import { UserRole, MarketingTaskStatus } from "@prisma/client";
import {
  Building,
  Users,
  ShoppingBag,
  DollarSign,
  PlusCircle,
  LogOut, // Keep if needed
  Loader2,
  AlertCircle,
  Menu, // Import Menu icon
  Download, // Optional for placeholders
  MoreHorizontal,
  CalendarIcon, // Import MoreHorizontal for dropdown trigger
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel, // Optional: For adding labels/titles
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown components
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetAllMarketingTasksQuery,
  useAssignMarketingTaskMutation,
  useCompleteMarketingTaskMutation,
  useDeleteMarketingTaskMutation,
} from "@/store/api/marketingTaskApiSlice";
import { useGetUsersQuery } from "@/store/api/userApiSlice";
import {
  useGetBudgetOverviewQuery,
  useFinishBudgetCycleMutation,
  useGetCurrentBudgetCycleQuery,
} from "@/store/api/budgetApiSlice";
import {
  useGetAllBillsQuery,
  useGetBillByIdQuery,
} from "@/store/api/billApiSlice"; // Import useGetBillByIdQuery
import {
  useGetMiscExpensesQuery, // Keep if needed for future tabs
  useAddMiscExpenseMutation, // Keep if needed
  useDeleteMiscExpenseMutation, // Keep if needed
} from "@/store/api/miscExpenseApiSlice";
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence
import {
  Sheet,
  SheetContent,
  SheetHeader, // Optional
  SheetTitle, // Optional
  SheetTrigger,
} from "@/components/ui/sheet"; // Import Sheet components
import { BillForm } from "@/components/bill-form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // --- State ---
  const [activeTab, setActiveTab] = useState("marketing"); // Default state is string
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State for mobile Sheet
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  // Assign Task Form State
  // Correct state type for Calendar
  const [assignDate, setAssignDate] = useState<Date | undefined>(undefined);
  const [student1Id, setStudent1Id] = useState("");
  const [student2Id, setStudent2Id] = useState("");
  const [moneyGiven, setMoneyGiven] = useState<number>(0);
  // View Bill Modal State
  const [isViewBillModalOpen, setIsViewBillModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  // --- End State ---

  // --- Navigation Items ---
  const managerNavItems: NavItem[] = [
    { id: "marketing", label: "Marketing Tasks", icon: ShoppingBag },
    { id: "bills", label: "Bills", icon: DollarSign },
    { id: "budget", label: "Budget Cycle", icon: CalendarIcon },
    { id: "students", label: "Students", icon: Users },
  ];
  // --- End Navigation Items ---

  // --- User Profile ---
  const managerUser: UserProfile | undefined = session?.user
    ? {
        name: session.user.name,
        image: session.user.image,
        role: session.user.role as string, // Cast role
      }
    : undefined;
  // --- End User Profile ---

  // --- Tab Change Handler ---
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsSheetOpen(false); // Close sheet on tab change
  };
  // --- End Tab Change Handler ---

  // --- RTK Query hooks ---
  const { data: marketingTasks, isLoading: isTasksLoading } =
    useGetAllMarketingTasksQuery();
  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery();
  const { data: bills, isLoading: isBillsLoading } = useGetAllBillsQuery();
  const { data: budgetOverview, isLoading: isBudgetLoading } =
    useGetBudgetOverviewQuery();
  const { data: currentBudgetCycle } = useGetCurrentBudgetCycleQuery();
  const { data: miscExpenses, isLoading: isMiscExpensesLoading } =
    useGetMiscExpensesQuery();
  // Filter boarders for assignment dropdown
  const boarders =
    users?.filter((user) => user.role === UserRole.BOARDER) || [];
  // Fetch selected bill details when modal opens
  const { data: selectedBillDetails, isLoading: isBillDetailsLoading } =
    useGetBillByIdQuery(selectedBillId!, { skip: !selectedBillId }); // Only fetch when selectedBillId is truthy
  // --- End RTK Query hooks ---

  // --- Mutations ---
  const [assignMarketingTask, { isLoading: isAssigning }] =
    useAssignMarketingTaskMutation();
  const [completeMarketingTask, { isLoading: isCompleting }] =
    useCompleteMarketingTaskMutation();
  const [finishBudgetCycle, { isLoading: isFinishingCycle }] =
    useFinishBudgetCycleMutation();
  const [addMiscExpense, { isLoading: isAddingExpense }] =
    useAddMiscExpenseMutation();
  const [deleteMiscExpense, { isLoading: isDeletingExpense }] =
    useDeleteMiscExpenseMutation();
  const [deleteMarketingTask, { isLoading: isDeletingTask }] =
    useDeleteMarketingTaskMutation();
  // --- End Mutations ---

  // --- Auth Effect ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== UserRole.MESS_MANAGER
    ) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [session, status, router, toast]);
  // --- End Auth Effect ---

  // --- Handlers ---
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const handleAssignTaskSubmit = async () => {
    // Renamed handler
    if (!assignDate || !student1Id || !student2Id || moneyGiven <= 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    try {
      await assignMarketingTask({
        date: format(assignDate, "yyyy-MM-dd"),
        studentIds: [student1Id, student2Id],
        moneyGiven: moneyGiven,
      }).unwrap();
      toast({
        title: "Task assigned successfully",
        description: "The marketing task has been assigned.",
      });
      setIsAssignDialogOpen(false);
      setAssignDate(undefined);
      setStudent1Id("");
      setStudent2Id("");
      setMoneyGiven(0); // Reset form
    } catch (error) {
      toast({
        title: "Failed to assign task",
        description: "An error occurred while assigning the task.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTaskSubmit = async (taskId: string) => {
    // Renamed handler
    try {
      await completeMarketingTask({
        taskId,
        data: { moneyReturnReceived: true },
      }).unwrap(); // Assuming manager confirms money return
      toast({
        title: "Task completed",
        description: "The marketing task has been marked as complete.",
      });
    } catch (error) {
      toast({
        title: "Failed to complete task",
        description: "An error occurred while completing the task.",
        variant: "destructive",
      });
    }
  };

  const handleFinishCycleSubmit = async () => {
    // Renamed handler
    if (!currentBudgetCycle?.id) {
      toast({ title: "No active budget cycle", variant: "destructive" });
      return;
    }
    try {
      await finishBudgetCycle(currentBudgetCycle.id).unwrap();
      toast({
        title: "Budget cycle finished",
        description: "The budget cycle has been finalized.",
      });
    } catch (error) {
      toast({
        title: "Failed to finish budget cycle",
        description: "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleOpenViewBillModal = (billId: string) => {
    setSelectedBillId(billId);
    setIsViewBillModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteMarketingTask(taskId).unwrap();
      toast({
        title: "Task deleted",
        description: "The marketing task has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete task",
        description: "An error occurred while deleting the task.",
        variant: "destructive",
      });
    }
  };
  // --- End Handlers ---

  // --- Loading State ---
  const isLoading =
    status === "loading" ||
    isTasksLoading ||
    isUsersLoading ||
    isBillsLoading ||
    isBudgetLoading ||
    isMiscExpensesLoading;
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  // --- End Loading State ---

  // --- Auth Guard ---
  if (
    status === "unauthenticated" ||
    session?.user?.role !== UserRole.MESS_MANAGER ||
    !session
  ) {
    return null; // Redirect handled by useEffect
  }
  // --- End Auth Guard ---

  // --- Main Component Return ---
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {" "}
      {/* Added w-full overflow-hidden */}
      {/* Static Sidebar (LG+) */}
      <div className="hidden lg:block">
        <Sidebar
          title="Manager Menu" // Changed title
          titleIcon={Building}
          navItems={managerNavItems}
          activeTab={activeTab}
          setActiveTab={handleTabChange} // Use the wrapper function
          showSearch={true} // Keep search enabled for manager?
          user={managerUser}
          onSignOut={handleSignOut}
        />
      </div>
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header (Consistent Structure) */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm lg:justify-end">
          {/* Mobile Menu Button using Sheet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {/* Re-use Sidebar component inside Sheet */}
              <Sidebar
                title="Manager Menu" // Changed title
                titleIcon={Building}
                navItems={managerNavItems}
                activeTab={activeTab}
                setActiveTab={handleTabChange} // Use the wrapper function
                showSearch={true} // Keep search enabled for manager?
                user={managerUser}
                onSignOut={handleSignOut}
              />
            </SheetContent>
          </Sheet>

          {/* Placeholder for header actions on large screens */}
          {/* Example: <Button variant="outline">Action</Button> */}
        </header>
        {/* End Header */}

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {" "}
          {/* Added lg:p-8 */}
          {/* Page Title Area (Consistent Structure) */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Manager Dashboard
              </h1>
              <div className="text-sm text-muted-foreground">
                Manage marketing tasks, bills, budget, and students.
              </div>
            </div>
            {/* Assign Task Dialog Trigger - Primary action for Manager */}
            <Dialog
              open={isAssignDialogOpen}
              onOpenChange={setIsAssignDialogOpen}
            >
              <DialogTrigger asChild>
                {/* Maybe only show when 'marketing' tab is active? Or always visible? */}
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" /> Assign Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Marketing Task</DialogTitle>
                </DialogHeader>
                {/* Assign Task Form */}
                <div className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="assign-task-date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="assign-task-date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !assignDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {assignDate ? (
                            format(assignDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={assignDate}
                          onSelect={setAssignDate} // Directly use state setter
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student1">Student 1</Label>
                    <Select value={student1Id} onValueChange={setStudent1Id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {boarders.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student2">Student 2</Label>
                    <Select value={student2Id} onValueChange={setStudent2Id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {boarders
                          .filter((s) => s.id !== student1Id)
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Money Given (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={moneyGiven || ""}
                      onChange={(e) => setMoneyGiven(Number(e.target.value))}
                    />
                  </div>
                </div>
                {/* Dialog Footer */}
                <DialogFooter>
                  {" "}
                  {/* Ensure DialogFooter is imported */}
                  <Button
                    className="w-full"
                    disabled={
                      isAssigning ||
                      !assignDate ||
                      !student1Id ||
                      !student2Id ||
                      moneyGiven <= 0
                    }
                    onClick={handleAssignTaskSubmit}
                  >
                    {isAssigning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      "Assign Task"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {/* End Page Title Area */}
          {/* Tab Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab} // Key change triggers animation
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto space-y-4" // Added max-width and spacing
            >
              {/* Render tab content based on activeTab */}
              {activeTab === "marketing" && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Marketing Tasks</CardTitle>
                      <CardDescription>
                        Currently active marketing tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        {/* Marketing Tasks Table */}
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-2 text-left font-medium">
                                Date
                              </th>
                              <th className="p-2 text-left font-medium">
                                Students
                              </th>
                              <th className="p-2 text-left font-medium">
                                Money Given
                              </th>
                              <th className="p-2 text-left font-medium">
                                Status
                              </th>
                              <th className="p-2 text-left font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {marketingTasks?.map((task) => (
                              <tr key={task.id} className="border-b">
                                <td className="p-2">
                                  {new Date(task.date).toLocaleDateString()}
                                </td>
                                <td className="p-2">
                                  {task.assignedStudents
                                    .map((s) => s.name)
                                    .join(", ")}
                                </td>
                                <td className="p-2">₹{task.moneyGiven || 0}</td>
                                <td className="p-2">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${task.status === MarketingTaskStatus.ASSIGNED ? "bg-blue-100 text-blue-800" : task.status === MarketingTaskStatus.BILL_SUBMITTED ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                                  >
                                    {task.status ===
                                    MarketingTaskStatus.ASSIGNED
                                      ? "Assigned"
                                      : task.status ===
                                          MarketingTaskStatus.BILL_SUBMITTED
                                        ? "Bill Submitted"
                                        : "Completed"}
                                  </span>
                                </td>
                                <td className="p-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={
                                          task.status ===
                                          MarketingTaskStatus.COMPLETED
                                        }
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {task.status ===
                                        MarketingTaskStatus.ASSIGNED && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleDeleteTask(task.id)
                                          }
                                          disabled={isDeletingTask}
                                        >
                                          {isDeletingTask ? (
                                            <>
                                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              Deleting...
                                            </>
                                          ) : (
                                            "Delete Task"
                                          )}
                                        </DropdownMenuItem>
                                      )}
                                      {task.status ===
                                        MarketingTaskStatus.BILL_SUBMITTED && (
                                        <>
                                          {task.bill?.id && (
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleOpenViewBillModal(
                                                  task.bill!.id
                                                )
                                              }
                                            >
                                              View Bill
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleCompleteTaskSubmit(task.id)
                                            }
                                          >
                                            Mark as Complete
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      {task.status ===
                                        MarketingTaskStatus.COMPLETED &&
                                        task.bill?.id && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleOpenViewBillModal(
                                                task.bill!.id
                                              )
                                            }
                                          >
                                            View Bill
                                          </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                            {(!marketingTasks ||
                              marketingTasks.length === 0) && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="p-4 text-center text-muted-foreground"
                                >
                                  No marketing tasks found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "bills" && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Bills</CardTitle>
                      <CardDescription>
                        Bills submitted by students
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        {/* Bills Table */}
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-2 text-left font-medium">
                                Date
                              </th>
                              <th className="p-2 text-left font-medium">
                                Submitted By
                              </th>
                              <th className="p-2 text-left font-medium">
                                Amount
                              </th>
                              <th className="p-2 text-left font-medium">
                                Money Returned
                              </th>
                              <th className="p-2 text-left font-medium">
                                Status
                              </th>
                              <th className="p-2 text-left font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {bills?.map((bill) => (
                              <tr key={bill.id} className="border-b">
                                <td className="p-2">
                                  {new Date(
                                    bill.submittedAt
                                  ).toLocaleDateString()}
                                </td>
                                <td className="p-2">{bill.submittedBy.name}</td>
                                <td className="p-2">₹{bill.totalBillAmount}</td>
                                <td className="p-2">
                                  ₹{bill.moneyReturned || 0}
                                </td>
                                <td className="p-2">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                      bill.marketingTask?.status === "COMPLETED"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {bill.marketingTask?.status === "COMPLETED"
                                      ? "Completed"
                                      : "Pending"}
                                  </span>
                                </td>
                                <td className="p-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleOpenViewBillModal(bill.id)
                                    }
                                  >
                                    View Bill
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            {(!bills || bills.length === 0) && (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="p-4 text-center text-muted-foreground"
                                >
                                  No bills found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "budget" && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Budget Cycle</CardTitle>
                      <CardDescription>
                        {currentBudgetCycle
                          ? `${currentBudgetCycle.month}/${currentBudgetCycle.year} Budget Cycle`
                          : "No active budget cycle"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentBudgetCycle ? (
                        <>
                          {/* Budget Stats */}
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                  Total Budget
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  ₹
                                  {budgetOverview?.reduce(
                                    (s, i) => s + i.amountPaid,
                                    0
                                  ) || 0}
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                  Total Spent
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  ₹{currentBudgetCycle.totalExpenditure || 0}
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                  Remaining
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">
                                  ₹
                                  {(budgetOverview?.reduce(
                                    (s, i) => s + i.amountPaid,
                                    0
                                  ) || 0) -
                                    (currentBudgetCycle.totalExpenditure || 0)}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          {/* Payment Status Table */}
                          <div className="mt-6">
                            <h3 className="mb-4 text-lg font-medium">
                              Payment Status
                            </h3>
                            <div className="rounded-md border">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="p-2 text-left font-medium">
                                      Student
                                    </th>
                                    <th className="p-2 text-left font-medium">
                                      Amount Paid
                                    </th>
                                    <th className="p-2 text-left font-medium">
                                      Payment Date
                                    </th>
                                    <th className="p-2 text-left font-medium">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {budgetOverview?.map((item) => (
                                    <tr key={item.userId} className="border-b">
                                      <td className="p-2">{item.user.name}</td>
                                      <td className="p-2">
                                        ₹{item.amountPaid}
                                      </td>
                                      <td className="p-2">-</td>
                                      <td className="p-2">
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                          Paid
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                  {(!budgetOverview ||
                                    budgetOverview.length === 0) && (
                                    <tr>
                                      <td
                                        colSpan={4}
                                        className="p-4 text-center text-muted-foreground"
                                      >
                                        No payment records found
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        // Placeholder if no active cycle
                        <div className="flex flex-col items-center justify-center p-8">
                          <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                          <h3 className="mb-2 text-lg font-medium">
                            No Active Budget Cycle
                          </h3>
                          <p className="mb-4 text-center text-muted-foreground">
                            Create a new budget cycle to start tracking
                            expenses.
                          </p>
                          <Button>Create Budget Cycle</Button>
                        </div>
                      )}
                    </CardContent>
                    {/* Finish Cycle Button in Footer */}
                    {currentBudgetCycle && !currentBudgetCycle.isFinalized && (
                      <CardFooter>
                        <Button
                          className="ml-auto"
                          onClick={handleFinishCycleSubmit}
                          disabled={isFinishingCycle}
                        >
                          {isFinishingCycle ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Finishing...
                            </>
                          ) : (
                            "Finish Mess Cycle"
                          )}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </div>
              )}

              {activeTab === "students" && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Student List</CardTitle>
                      <CardDescription>All registered students</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        {/* Students Table */}
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-2 text-left font-medium">
                                Name
                              </th>
                              <th className="p-2 text-left font-medium">
                                Email
                              </th>
                              <th className="p-2 text-left font-medium">
                                Marketing Tasks
                              </th>
                              <th className="p-2 text-left font-medium">
                                Payment Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {boarders.map((student) => (
                              <tr key={student.id} className="border-b">
                                <td className="p-2">{student.name}</td>
                                <td className="p-2">{student.email}</td>
                                <td className="p-2">
                                  {marketingTasks?.filter((task) =>
                                    task.assignedStudents.some(
                                      (s) => s.id === student.id
                                    )
                                  ).length || 0}
                                </td>
                                <td className="p-2">
                                  {budgetOverview?.some(
                                    (item) => item.userId === student.id
                                  ) ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                                      Unpaid
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {(!boarders || boarders.length === 0) && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="p-4 text-center text-muted-foreground"
                                >
                                  No students found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {/* End Tab Content */}
        </main>
        {/* End Scrollable Main Content */}
      </div>
      {/* End Main Content Area */}
      {/* View Bill Modal */}
      <Dialog open={isViewBillModalOpen} onOpenChange={setIsViewBillModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] border-glass-border/30 bg-glass/80 backdrop-blur-xl shadow-xl text-glass-foreground">
          <DialogHeader>
            <DialogTitle>View Bill Details</DialogTitle>
            <DialogDescription>
              Bill details submitted by student
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {selectedBillDetails && !isBillDetailsLoading ? (
              <BillForm
                marketingItemDefinitions={[
                  { id: "pogg", label: "Potato/Onion/Garlic/Ginger" },
                  { id: "egg", label: "Egg" },
                  { id: "chicken", label: "Chicken" },
                  { id: "veg", label: "Vegetables" },
                  { id: "fish", label: "Fish" },
                ]}
                initialData={selectedBillDetails}
                onSubmit={() => {}} // Empty function since this is read-only
                submitButtonText="" // No submit button in read-only mode
                isReadOnly={true} // Add this prop to BillForm
              />
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    // End Outer Layout
  );
  // --- End Main Component Return ---
}
