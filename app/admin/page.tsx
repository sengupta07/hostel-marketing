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
} from "@/components/ui/card";
import { NavItem, Sidebar, UserProfile } from "@/components/sidebar"; // Ensure NavItem, UserProfile are exported if needed elsewhere
import { UserRole } from "@prisma/client";
import {
  Building,
  Users,
  BarChart3,
  DollarSign, // Keep if needed for future tabs/icons
  Settings,
  LogOut, // Keep if needed
  Loader2,
  LayoutDashboard,
  LifeBuoy, // Keep if needed
  Menu, // Import Menu icon
  Download, // Optional for placeholders
} from "lucide-react";
import {
  useGetUsersWithMarketingCountQuery,
  useGetUsersQuery,
  useAssignRoleMutation,
} from "@/store/api/userApiSlice";
import { useGetAllMarketingTasksQuery } from "@/store/api/marketingTaskApiSlice";
import {
  useGetBudgetOverviewQuery,
  useGetCurrentBudgetCycleQuery,
} from "@/store/api/budgetApiSlice";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle, // Optional if sheet needs a title
  SheetTrigger,
} from "@/components/ui/sheet"; // Import Sheet components

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // --- State ---
  const [activeTab, setActiveTab] = useState("overview"); // Default state is string
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State for mobile Sheet
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  // --- End State ---

  // --- Navigation Items ---
  const adminNavItems: NavItem[] = [
    // Renamed for clarity
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "budget", label: "Budget", icon: BarChart3 }, // Changed icon for consistency? Check requirements
    // { id: "support", label: "Support", icon: LifeBuoy }, // Example if needed
    { id: "settings", label: "Settings", icon: Settings },
  ];
  // --- End Navigation Items ---

  // --- User Profile ---
  const currentUser: UserProfile | undefined = session?.user
    ? {
        name: session.user.name,
        image: session.user.image,
        role: session.user.role as string, // Cast role, ensure UserProfile accepts string
      }
    : undefined;
  // --- End User Profile ---

  // --- Tab Change Handler ---
  const handleTabChange = (tabId: string) => {
    // Since activeTab state is already string, no casting needed here
    setActiveTab(tabId);
    setIsSheetOpen(false); // Close sheet on tab change
  };
  // --- End Tab Change Handler ---

  // --- RTK Query hooks ---
  const {
    data: usersWithMarketingCount,
    isLoading: isUsersWithMarketingCountLoading,
  } = useGetUsersWithMarketingCountQuery();
  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery();
  const { data: marketingTasks, isLoading: isMarketingTasksLoading } =
    useGetAllMarketingTasksQuery();
  const { data: budgetOverview, isLoading: isBudgetOverviewLoading } =
    useGetBudgetOverviewQuery();
  const { data: currentBudgetCycle } = useGetCurrentBudgetCycleQuery();
  // --- End RTK Query hooks ---

  // --- Mutations ---
  const [assignRole, { isLoading: isAssigningRole }] = useAssignRoleMutation();
  // --- End Mutations ---

  // --- Auth Effect ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== UserRole.GENERAL_SECRETARY
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

  const handleAssignRoleSubmit = async () => {
    // Renamed submit handler
    if (!selectedUserId || !selectedRole) {
      toast({
        title: "Missing information",
        description: "Please select a user and a role.",
        variant: "destructive",
      });
      return;
    }
    try {
      await assignRole({
        userId: selectedUserId,
        role: selectedRole as UserRole,
      }).unwrap();
      toast({
        title: "Role assigned successfully",
        description: "The user's role has been updated.",
      });
      setIsAssignRoleDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("");
    } catch (error) {
      toast({
        title: "Failed to assign role",
        description: "An error occurred while assigning the role.",
        variant: "destructive",
      });
    }
  };
  // --- End Handlers ---

  // --- Loading State ---
  const isLoading =
    status === "loading" ||
    isUsersWithMarketingCountLoading ||
    isUsersLoading ||
    isMarketingTasksLoading ||
    isBudgetOverviewLoading;
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
    session?.user?.role !== UserRole.GENERAL_SECRETARY ||
    !session
  ) {
    return null; // Redirect handled by useEffect
  }
  // --- End Auth Guard ---

  // --- Calculated Values ---
  const totalBudget =
    budgetOverview?.reduce((sum, item) => sum + item.amountPaid, 0) || 0;
  const totalSpent = currentBudgetCycle?.totalExpenditure || 0;
  const remainingBudget = totalBudget - totalSpent;
  const activeTasksCount =
    marketingTasks?.filter((task) => task.status !== "COMPLETED").length || 0;
  const pendingBillsCount =
    marketingTasks?.filter((task) => task.status === "BILL_SUBMITTED").length ||
    0;
  const boardersCount =
    users?.filter((user) => user.role === UserRole.BOARDER).length || 0;
  // --- End Calculated Values ---

  // --- Main Component Return ---
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {" "}
      {/* Added w-full overflow-hidden */}
      {/* Static Sidebar (LG+) */}
      <div className="hidden lg:block">
        <Sidebar
          title="Admin Menu" // Changed title for context
          titleIcon={Building}
          navItems={adminNavItems} // Use admin specific items
          activeTab={activeTab}
          setActiveTab={handleTabChange} // Use the wrapper function
          showSearch={true} // Keep search enabled for admin?
          user={currentUser}
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
                title="Admin Menu" // Changed title
                titleIcon={Building}
                navItems={adminNavItems}
                activeTab={activeTab}
                setActiveTab={handleTabChange} // Use the wrapper function
                showSearch={true} // Keep search enabled for admin?
                user={currentUser}
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
                Admin Dashboard
              </h1>
              <div className="text-sm text-muted-foreground">
                Monitor and manage hostel activities, users, and budget.
              </div>
            </div>
            {/* Assign Role Dialog Trigger - Kept here as a main action for User Management perspective */}
            <Dialog
              open={isAssignRoleDialogOpen}
              onOpenChange={setIsAssignRoleDialogOpen}
            >
              <DialogTrigger asChild>
                {/* Conditionally show button? Or maybe only when 'users' tab is active? */}
                {/* For now, keep it visible as a primary admin action */}
                <Button>Assign Role</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign User Role</DialogTitle>
                </DialogHeader>
                {/* User Selection */}
                <div className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="user">Select User</Label>
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Select Role</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(value) =>
                        setSelectedRole(value as UserRole)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.GENERAL_SECRETARY}>
                          General Secretary
                        </SelectItem>
                        <SelectItem value={UserRole.MESS_MANAGER}>
                          Mess Manager
                        </SelectItem>
                        <SelectItem value={UserRole.BOARDER}>
                          Boarder
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Dialog Footer */}
                <DialogFooter>
                  <Button
                    onClick={handleAssignRoleSubmit}
                    disabled={
                      isAssigningRole || !selectedUserId || !selectedRole
                    }
                  >
                    {isAssigningRole ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      "Assign Role"
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
              {activeTab === "overview" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Overview Cards */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{boardersCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {boardersCount} active boarders
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Active Marketing Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {activeTasksCount}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pendingBillsCount} tasks pending approval
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Monthly Budget
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{totalBudget}</div>
                      <p className="text-xs text-muted-foreground">
                        ₹{totalSpent} spent so far
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "users" && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>
                        Manage users and assign roles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        {/* Users Table */}
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
                                Role
                              </th>
                              <th className="p-2 text-left font-medium">
                                Marketing Tasks
                              </th>
                              <th className="p-2 text-left font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersWithMarketingCount?.map((user) => (
                              <tr key={user.id} className="border-b">
                                <td className="p-2">{user.name}</td>
                                <td className="p-2">{user.email}</td>
                                <td className="p-2">{user.role}</td>
                                <td className="p-2">
                                  {user.marketingTaskCount}
                                </td>
                                <td className="p-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUserId(user.id);
                                      setSelectedRole(user.role);
                                      setIsAssignRoleDialogOpen(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            {(!usersWithMarketingCount ||
                              usersWithMarketingCount.length === 0) && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="p-4 text-center text-muted-foreground"
                                >
                                  No users found
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
                      <CardTitle>Budget Overview</CardTitle>
                      <CardDescription>
                        Track monthly budget and expenses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Budget Stat Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">
                                Total Budget
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                ₹{totalBudget}
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
                                ₹{totalSpent}
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
                                ₹{remainingBudget}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        {/* Current Budget Cycle Details */}
                        {currentBudgetCycle && (
                          <div className="mt-6">
                            <h3 className="mb-4 text-lg font-medium">
                              Current Budget Cycle
                            </h3>
                            <div className="rounded-md border bg-muted/30 p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Cycle Period:</span>
                                  <span>
                                    {new Date(
                                      currentBudgetCycle.startDate
                                    ).toLocaleDateString()}{" "}
                                    -{" "}
                                    {new Date(
                                      currentBudgetCycle.endDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Payment Deadline:</span>
                                  <span>
                                    {new Date(
                                      currentBudgetCycle.paymentDeadline
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Status:</span>
                                  <span>
                                    {currentBudgetCycle.isFinalized
                                      ? "Finalized"
                                      : "Active"}
                                  </span>
                                </div>
                                {currentBudgetCycle.isFinalized && (
                                  <div className="flex justify-between">
                                    <span>Per-head Cost:</span>
                                    <span>
                                      ₹{currentBudgetCycle.perHeadCost}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
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
                                    Status
                                  </th>
                                  {currentBudgetCycle?.isFinalized && (
                                    <th className="p-2 text-left font-medium">
                                      Refund/Due
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {budgetOverview?.map((item) => (
                                  <tr key={item.userId} className="border-b">
                                    <td className="p-2">{item.user.name}</td>
                                    <td className="p-2">₹{item.amountPaid}</td>
                                    <td className="p-2">
                                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                        Paid
                                      </span>
                                    </td>
                                    {currentBudgetCycle?.isFinalized && (
                                      <td className="p-2">
                                        {item.amountToBeReturned !== null ? (
                                          item.amountToBeReturned > 0 ? (
                                            <span className="text-green-600">
                                              +₹{item.amountToBeReturned}{" "}
                                              (Refund)
                                            </span>
                                          ) : (
                                            <span className="text-red-600">
                                              -₹
                                              {Math.abs(
                                                item.amountToBeReturned
                                              )}{" "}
                                              (Due)
                                            </span>
                                          )
                                        ) : (
                                          "-"
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                ))}
                                {(!budgetOverview ||
                                  budgetOverview.length === 0) && (
                                  <tr>
                                    <td
                                      colSpan={
                                        currentBudgetCycle?.isFinalized ? 4 : 3
                                      }
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
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Settings</CardTitle>
                      <CardDescription>
                        Configure system settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Example Settings Form */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Hostel Name
                            </Label>
                            <Input
                              type="text"
                              className="w-full rounded-md border border-input bg-background px-3 py-2"
                              defaultValue="Hostel XYZ"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Email</Label>
                            <Input
                              type="email"
                              className="w-full rounded-md border border-input bg-background px-3 py-2"
                              defaultValue="admin@hostel.com"
                            />
                          </div>
                        </div>
                        <Button>Save Settings</Button>
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
    </div>
  );
  // --- End Main Component Return ---
}
