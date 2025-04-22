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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { BillForm } from "./bill-form";

export interface MarketingDetails {
  potatoOnionGarlicGinger: number;
  veg: number;
  egg: number;
  fish: number;
  chicken: number;
}

export interface Bill {
  id: number;
  date: Date;
  students: string[];
  marketingDetails: MarketingDetails;
  marketingTotal: number;
  groceryTotal: number;
  totalBillAmount: number;
  amountGiven: number;
  amountReturned: number;
}

const ITEMS_PER_PAGE = 12;

export function BillsTab() {
  const [bills, setBills] = useState<Bill[]>([
    {
      id: 1,
      date: new Date("2023-08-01"),
      students: ["John Doe", "Jane Smith"],
      marketingDetails: {
        potatoOnionGarlicGinger: 300,
        veg: 500,
        egg: 200,
        fish: 400,
        chicken: 600,
      },
      marketingTotal: 2000,
      groceryTotal: 1000,
      totalBillAmount: 3000,
      amountGiven: 3500,
      amountReturned: 500,
    },
  ]);

  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterStudent, setFilterStudent] = useState<string>("");

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

  const handleAddOrUpdateBill = (billData: Omit<Bill, "id"> | Bill) => {
    if ("id" in billData && billData.id !== 0) {
      setBills(bills.map((b) => (b.id === billData.id ? billData : b)));
    } else {
      // TODO: Replace naive ID generation (bills.length + 1) with a robust method (e.g., UUID or backend ID)
      const newBill = { ...billData, id: bills.length + 1 };
      setBills([...bills, newBill]);
    }
    setEditingBill(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (bill: Bill) => {
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

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="text-2xl font-bold">Bills</h2>
        <Button onClick={openAddDialog}>Add Bill</Button>
      </div>
      <div className="mb-4 flex gap-8">
        <div className="flex items-center gap-4">
          <Label htmlFor="filterDate">Filter by Date:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !filterDate && "text-muted-foreground"
                )}
              >
                {filterDate ? (
                  format(filterDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={setFilterDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="filterStudent" className="whitespace-nowrap">
            Filter by Student:
          </Label>
          <Select value={filterStudent} onValueChange={setFilterStudent}>
            <SelectTrigger id="filterStudent" className="min-w-60">
              <SelectValue placeholder="All Students" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Students">All Students</SelectItem>
              {uniqueStudents.map((student) => (
                <SelectItem key={student} value={student}>
                  {student}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Marketing Total</TableHead>
            <TableHead>Grocery Total</TableHead>
            <TableHead>Total Bill Amount</TableHead>
            <TableHead>Amount Given</TableHead>
            <TableHead>Amount Returned</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedBills.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell>{format(bill.date, "PPP")}</TableCell>
              <TableCell>{bill.students.join(", ")}</TableCell>
              <TableCell>₹{bill.marketingTotal.toFixed(2)}</TableCell>
              <TableCell>₹{bill.groceryTotal.toFixed(2)}</TableCell>
              <TableCell>₹{bill.totalBillAmount.toFixed(2)}</TableCell>
              <TableCell>₹{bill.amountGiven.toFixed(2)}</TableCell>
              <TableCell>₹{bill.amountReturned.toFixed(2)}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => openEditDialog(bill)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={cn(
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
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
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBill ? "Edit Bill" : "Add New Bill"}
            </DialogTitle>
          </DialogHeader>
          <BillForm
            key={editingBill?.id ?? "new"}
            initialData={editingBill}
            onSubmit={handleAddOrUpdateBill}
            submitButtonText={editingBill ? "Update Bill" : "Add Bill"}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
