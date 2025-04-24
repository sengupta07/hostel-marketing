"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Import Drawer components
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { FilePlus, Edit, CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn, saveToLocalStorage, loadFromLocalStorage } from "@/lib/utils"; // Import LS utils
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile hook
import { Card } from "@/components/ui/card"; // Ensure correct import path

// --- Import Interfaces from the Single Source of Truth ---
// Assuming Bill and MarketingItem are exported from bill-form.tsx
// (Ideally, move these to a shared types file and import from there)
import { BillForm, Bill, MarketingItem } from "./bill-form";

// --- Remove Local Interface Definitions ---
// DELETE THE OLD MarketingDetails and Bill interfaces that were here

// Consider using UUIDs for IDs
// import { v4 as uuidv4 } from 'uuid';
// npm install uuid
// npm install --save-dev @types/uuid

const BILLS_STORAGE_KEY = "hostelMarketingApp_bills"; // Define storage key
const ITEMS_PER_PAGE = 12;

// Helper to create initial MarketingItem list (matching BillForm's definition)
const createInitialMarketingItems = (): MarketingItem[] => [
  {
    id: "pogg",
    label: "Potato/Onion/Garlic/Ginger",
    enabled: false,
    amount: 0,
    isEditing: false,
  },
  { id: "egg", label: "Egg", enabled: false, amount: 0, isEditing: false },
  {
    id: "chicken",
    label: "Chicken",
    enabled: false,
    amount: 0,
    isEditing: false,
  },
  {
    id: "veg",
    label: "Vegetables",
    enabled: false,
    amount: 0,
    isEditing: false,
  },
  { id: "fish", label: "Fish", enabled: false, amount: 0, isEditing: false },
];

export function BillsTab() {
  // --- State using the imported Bill type, loaded from local storage ---
  const [bills, setBills] = useState<Bill[]>(() => {
    const savedBills = loadFromLocalStorage<Bill[]>(BILLS_STORAGE_KEY);
    if (savedBills) {
      // IMPORTANT: Convert date strings back to Date objects
      return savedBills.map((bill) => ({
        ...bill,
        date: new Date(bill.date), // Parse the date string
      }));
    }
    // Provide a default empty array if nothing is saved
    // Provide a default empty array if nothing is saved
    return [];
  });

  // Save bills to local storage whenever the state changes
  useEffect(() => {
    saveToLocalStorage(BILLS_STORAGE_KEY, bills);
  }, [bills]);

  const [editingBill, setEditingBill] = useState<Bill | null>(null); // State uses correct Bill type
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterStudent, setFilterStudent] = useState<string>("");
  const isMobile = useIsMobile(); // Use the hook

  // --- Memos and Effects (should be fine if using correct Bill type) ---
  const filteredBills = useMemo(() => {
    return bills.filter(
      (bill) =>
        (filterDate
          ? bill.date.toDateString() === filterDate.toDateString()
          : true) &&
        (filterStudent && filterStudent !== "All Students"
          ? bill.students.includes(filterStudent)
          : true)
    );
  }, [bills, filterDate, filterStudent]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterStudent]);

  const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE);
  const paginatedBills = useMemo(() => {
    return filteredBills.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredBills, currentPage]);

  // --- Updated Handler using the correct Bill type ---
  // The parameter 'billData' now implicitly uses the imported Bill type
  // which matches the output of BillForm's onSubmit
  const handleAddOrUpdateBill = (billData: Omit<Bill, "id"> | Bill) => {
    if ("id" in billData && billData.id) {
      // Check if id exists and is a non-empty string
      // Update existing bill (comparing strings)
      setBills(
        bills.map((b) => (b.id === billData.id ? { ...b, ...billData } : b))
      );
    } else {
      // Add new bill
      // --- Use robust ID generation ---
      // const newId = uuidv4(); // Recommended
      const newId = `temp_${Date.now()}`; // Less ideal placeholder
      console.warn("Using temporary ID generation. Implement robust UUIDs.");

      // Ensure 'id' is not accidentally present on the Omit<Bill, "id"> type
      const { id, ...restOfBillData } = billData as Bill; // Use type assertion carefully if needed

      const newBill: Bill = {
        ...(restOfBillData as Omit<Bill, "id">), // Ensure type safety
        id: newId, // Assign the new string ID
      };
      setBills((prevBills) => [...prevBills, newBill]);
    }
    setEditingBill(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (bill: Bill) => {
    // Parameter uses correct Bill type
    setEditingBill(bill);
    setIsDialogOpen(true);
  };

  const uniqueStudents = useMemo(() => {
    return Array.from(new Set(bills.flatMap((bill) => bill.students)));
  }, [bills]);

  const openAddDialog = () => {
    setEditingBill(null);
    setIsDialogOpen(true);
  };

  // --- Reusable Bill Form Component ---
  const BillFormComponent = (
    <BillForm
      key={editingBill?.id ?? "new"} // Pass string | "new"
      initialData={editingBill} // Pass Bill (id: string) | null - THIS NOW MATCHES
      onSubmit={handleAddOrUpdateBill} // Pass function expecting Bill (id: string) - THIS NOW MATCHES
      submitButtonText={editingBill ? "Update Bill" : "Add Bill"}
    />
  );

  // --- Render ---
  return (
    <Card className="border-glass-border/30 bg-glass/60 backdrop-blur-lg shadow-lg p-6">
      {/* Header and Filters (No changes needed structurally) */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-glass-foreground">
          Bills List
        </h2>
        <Button variant="secondary" onClick={openAddDialog} className="gap-2">
          <FilePlus className="h-4 w-4" />
          Add Bill
        </Button>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-glass-border/30 bg-white/5 p-4">
        {/* Date Filter */}
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <Label htmlFor="filterDate" className="text-glass-foreground/80">
            Filter by Date:
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal border-glass-border/50 bg-white/10 text-glass-foreground/90 hover:bg-white/20 hover:text-glass-foreground",
                  !filterDate && "text-glass-foreground/60"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterDate ? (
                  format(filterDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-glass-border/30 bg-glass/90 backdrop-blur-xl text-glass-foreground"
              align="start"
            >
              <Calendar
                mode="single"
                className="[&>div]:bg-transparent [&_button]:text-glass-foreground [&_button:hover]:bg-white/10 [&_button[aria-selected]]:bg-primary/20 [&_button[aria-selected]]:text-primary"
                selected={filterDate}
                onSelect={setFilterDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        {/* Student Filter */}
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <Label
            htmlFor="filterStudent"
            className="whitespace-nowrap text-glass-foreground/80"
          >
            Filter by Student:
          </Label>
          <Select value={filterStudent} onValueChange={setFilterStudent}>
            <SelectTrigger
              id="filterStudent"
              className="min-w-60 border-glass-border/50 bg-white/10 text-glass-foreground/90 hover:bg-white/20 hover:text-glass-foreground focus:ring-primary/50"
            >
              <SelectValue placeholder="All Students" />
            </SelectTrigger>
            <SelectContent className="border-glass-border/30 bg-glass/90 backdrop-blur-xl text-glass-foreground [&_div[role=option]]:focus:bg-white/10 [&_div[role=option][aria-selected=true]]:bg-primary/20">
              <SelectItem value="All Students">All Students</SelectItem>
              {uniqueStudents.map((student) => (
                <SelectItem
                  key={student}
                  value={student}
                  className="focus:bg-white/10"
                >
                  {student}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table (No changes needed structurally, uses correct Bill type now) */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-glass-border/30 hover:bg-white/5">
              <TableHead className="text-glass-foreground/80">Date</TableHead>
              <TableHead className="text-glass-foreground/80">
                Students
              </TableHead>
              <TableHead className="text-glass-foreground/80">
                Marketing Total
              </TableHead>
              <TableHead className="text-glass-foreground/80">
                Grocery Total
              </TableHead>
              <TableHead className="text-glass-foreground/80">
                Total Bill Amount
              </TableHead>
              <TableHead className="text-glass-foreground/80">
                Amount Given
              </TableHead>
              <TableHead className="text-glass-foreground/80">
                Amount Returned
              </TableHead>
              <TableHead className="text-glass-foreground/80 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBills.map(
              (
                bill // bill is now the correct type
              ) => (
                <TableRow
                  key={bill.id}
                  className="border-b border-glass-border/20 hover:bg-white/10"
                >
                  <TableCell className="text-glass-foreground/90">
                    {format(bill.date, "PPP")}
                  </TableCell>
                  <TableCell className="text-glass-foreground/90">
                    {bill.students.join(", ")}
                  </TableCell>
                  <TableCell className="text-glass-foreground/90">
                    ₹{bill.marketingTotal.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-glass-foreground/90">
                    ₹{bill.groceryTotal.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-glass-foreground/90">
                    ₹{bill.totalBillAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-glass-foreground/90">
                    ₹{bill.amountGiven.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-glass-foreground/90">
                    ₹{bill.amountReturned.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-glass-foreground/70 hover:bg-white/10 hover:text-glass-foreground"
                      onClick={() => openEditDialog(bill)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (No changes needed structurally) */}
      <div className="mt-6 flex justify-center">
        <Pagination>
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={cn(
                  "text-glass-foreground/70 hover:bg-white/10 hover:text-glass-foreground",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                  className={cn(
                    "text-glass-foreground/70 hover:bg-white/10 hover:text-glass-foreground",
                    currentPage === i + 1 &&
                      "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                  )}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className={cn(
                  "text-glass-foreground/70 hover:bg-white/10 hover:text-glass-foreground",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Conditional Rendering: Drawer for Mobile, Dialog for Desktop */}
      {isMobile ? (
        <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {/* DrawerTrigger could be used here if needed, but we trigger manually */}
          <DrawerContent className="border-glass-border/30 bg-glass/80 backdrop-blur-xl text-glass-foreground max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-glass-foreground">
                {editingBill ? "Edit Bill" : "Add New Bill"}
              </DrawerTitle>
              {/* <DrawerDescription>...</DrawerDescription> */}
            </DrawerHeader>
            {/* Scrollable content area for Drawer */}
            <div className="overflow-y-auto p-4">{BillFormComponent}</div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] border-glass-border/30 bg-glass/80 backdrop-blur-xl shadow-xl text-glass-foreground">
            {/* DialogHeader is sticky due to previous changes */}
            <DialogHeader>
              <DialogTitle className="text-glass-foreground">
                {editingBill ? "Edit Bill" : "Add New Bill"}
              </DialogTitle>
            </DialogHeader>
            {/* Scrollable content area for Dialog */}
            <div className="flex-1 overflow-y-auto p-6">
              {BillFormComponent}
            </div>
            {/* Optional: Add a DialogFooter here if needed */}
            {/* <DialogFooter>...</DialogFooter> */}
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
