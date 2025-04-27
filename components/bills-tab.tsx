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
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";

import type { Bill, MarketingItem } from "@/types";
import { BillForm } from "./bill-form";

const BILLS_STORAGE_KEY = "hostelMarketingApp_bills";
const ITEMS_PER_PAGE = 12;

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
  const [bills, setBills] = useState<Bill[]>(() => {
    const savedBills = loadFromLocalStorage<Bill[]>(BILLS_STORAGE_KEY);
    if (savedBills) {
      return savedBills.map((bill) => ({
        ...bill,
        date: new Date(bill.date),
      }));
    }
    return [];
  });

  useEffect(() => {
    saveToLocalStorage(BILLS_STORAGE_KEY, bills);
  }, [bills]);

  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterStudent, setFilterStudent] = useState<string>("");
  const isMobile = useIsMobile();

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const billDate =
        bill.date instanceof Date ? bill.date : new Date(bill.date);
      const dateMatch = filterDate
        ? billDate.toDateString() === filterDate.toDateString()
        : true;
      const studentMatch =
        filterStudent && filterStudent !== "All Students"
          ? bill.submittedBy?.name === filterStudent
          : true;
      return dateMatch && studentMatch;
    });
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

  // Updated to handle the new Bill type structure
  const handleAddOrUpdateBill = (
    billData:
      | Omit<Bill, "id">
      | Bill
      | Omit<
          Bill,
          | "id"
          | "submittedAt"
          | "marketingTaskId"
          | "submittedById"
          | "submittedBy"
        >
  ) => {
    if ("id" in billData && billData.id) {
      // Update existing bill
      setBills(
        bills.map((b) => (b.id === billData.id ? { ...b, ...billData } : b))
      );
    } else {
      // Create new bill with required fields
      const newId = `bill_${Date.now()}`;
      console.warn("Using temporary timestamp ID generation for bills.");

      // Add missing required fields for the Bill type
      const newBill: Bill = {
        ...(billData as any), // Cast to any to avoid type errors
        id: newId,
        submittedAt: new Date().toISOString(), // Current timestamp
        marketingTaskId: `task_${Date.now()}`, // Dummy ID for local storage
        submittedById: "local-user", // Dummy ID for local storage
        submittedBy: {
          id: "local-user",
          name: "Local User",
        },
      };

      setBills((prevBills) => [...prevBills, newBill]);
    }
    setEditingBill(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (bill: Bill) => {
    setEditingBill(bill);
    setIsDialogOpen(true);
  };

  const uniqueStudents = useMemo(() => {
    // Get unique names from submittedBy, filtering out null/undefined names
    return Array.from(
      new Set(bills.map((bill) => bill.submittedBy?.name).filter(Boolean))
    ) as string[];
  }, [bills]);

  const openAddDialog = () => {
    setEditingBill(null);
    setIsDialogOpen(true);
  };

  const BillFormComponent = (
    <BillForm
      key={editingBill?.id ?? "new"}
      initialData={editingBill}
      marketingItemDefinitions={createInitialMarketingItems()} // Add required prop
      onSubmit={(billData) => {
        // Adapt the billData to match what handleAddOrUpdateBill expects
        if (editingBill?.id) {
          handleAddOrUpdateBill({ ...billData, id: editingBill.id });
        } else {
          handleAddOrUpdateBill(billData);
        }
      }}
      submitButtonText={editingBill ? "Update Bill" : "Add Bill"}
    />
  );

  return (
    <Card className="border-glass-border/30 bg-glass/60 backdrop-blur-lg shadow-lg p-6">
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
            {paginatedBills.map((bill) => (
              <TableRow
                key={bill.id}
                className="border-b border-glass-border/20 hover:bg-white/10"
              >
                <TableCell className="text-glass-foreground/90">
                  {format(
                    bill.date instanceof Date ? bill.date : new Date(bill.date),
                    "PPP"
                  )}
                </TableCell>
                <TableCell className="text-glass-foreground/90">
                  {bill.submittedBy?.name ?? "N/A"}{" "}
                  {/* Display submittedBy name */}
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
                  ₹{(bill.moneyReturned ?? 0).toFixed(2)}{" "}
                  {/* Use moneyReturned */}
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
            ))}
          </TableBody>
        </Table>
      </div>

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

      {isMobile ? (
        <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DrawerContent className="border-glass-border/30 bg-glass/80 backdrop-blur-xl text-glass-foreground max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-glass-foreground">
                {editingBill ? "Edit Bill" : "Add New Bill"}
              </DrawerTitle>
            </DrawerHeader>
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
            <DialogHeader>
              <DialogTitle className="text-glass-foreground">
                {editingBill ? "Edit Bill" : "Add New Bill"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {BillFormComponent}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
