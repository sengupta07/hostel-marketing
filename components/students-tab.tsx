"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card imports
import { Label } from "@/components/ui/label";
import { UserPlus, Edit } from "lucide-react"; // Added icons
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { StudentForm } from "./student-form";

export interface Student {
  id: number;
  name: string;
  roomNumber: string;
  amountPaid: number;
  amountToReturn: number;
  lastMonthDue: number;
}

const ITEMS_PER_PAGE = 12;

export function StudentsTab() {
  const [students, setStudents] = useState<Student[]>([
    {
      id: 1,
      name: "John Doe",
      roomNumber: "101",
      amountPaid: 2500,
      amountToReturn: 0,
      lastMonthDue: 0,
    },
    {
      id: 2,
      name: "Jane Smith",
      roomNumber: "102",
      amountPaid: 2300,
      amountToReturn: 200,
      lastMonthDue: 100,
    },
  ]);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE);
  const paginatedStudents = students.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddOrUpdateStudent = (
    studentData: Omit<Student, "id"> | Student
  ) => {
    if ("id" in studentData) {
      setStudents(
        students.map((s) => (s.id === studentData.id ? studentData : s))
      );
    } else {
      // TODO: Replace naive ID generation (students.length + 1) with a robust method (e.g., UUID or backend ID)
      const newStudent = { ...studentData, id: students.length + 1 };
      setStudents([...students, newStudent]);
    }
    setEditingStudent(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  return (
    // Wrapped content in a styled Card
    <Card className="border-glass-border/30 bg-glass/60 backdrop-blur-lg shadow-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        {" "}
        {/* Increased bottom margin */}
        {/* Adjusted heading color */}
        <h2 className="text-xl font-semibold text-glass-foreground">
          Students List
        </h2>
        {/* Updated Add Student button */}
        <Button
          variant="secondary" // Changed variant
          onClick={() => {
            setEditingStudent(null);
            setIsDialogOpen(true);
          }}
          className="gap-2" // Added gap for icon
        >
          <UserPlus className="h-4 w-4" /> {/* Added icon */}
          Add Student
        </Button>
      </div>
      {/* Added overflow container for table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {/* Styled table header row */}
            <TableRow className="border-b border-glass-border/30 hover:bg-white/5">
              {/* Styled table head cells */}
              <TableHead className="text-glass-foreground/80">Name</TableHead>
              <TableHead className="text-glass-foreground/80">
                Room Number
              </TableHead>
              <TableHead className="text-glass-foreground/80">
                Amount Paid
              </TableHead>
              <TableHead className="text-glass-foreground/80">
                Amount to Return
              </TableHead>
              <TableHead className="text-glass-foreground/80">
                Last Month Due
              </TableHead>
              <TableHead className="text-glass-foreground/80 text-right">
                Actions
              </TableHead>{" "}
              {/* Align Actions right */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.map((student) => (
              // Styled table body row
              <TableRow
                key={student.id}
                className="border-b border-glass-border/20 hover:bg-white/10"
              >
                {/* Styled table cells */}
                <TableCell className="text-glass-foreground/90">
                  {student.name}
                </TableCell>
                <TableCell className="text-glass-foreground/90">
                  {student.roomNumber}
                </TableCell>
                <TableCell className="text-glass-foreground/90">
                  ₹{student.amountPaid.toFixed(2)}
                </TableCell>
                <TableCell className="text-glass-foreground/90">
                  ₹{student.amountToReturn.toFixed(2)}
                </TableCell>
                <TableCell className="text-glass-foreground/90">
                  ₹{student.lastMonthDue.toFixed(2)}
                </TableCell>
                {/* Styled Actions cell and Edit button */}
                <TableCell className="text-right">
                  <Button
                    variant="ghost" // Changed variant
                    size="icon" // Made button icon-sized
                    className="text-glass-foreground/70 hover:bg-white/10 hover:text-glass-foreground" // Added hover styles
                    onClick={() => openEditDialog(student)}
                  >
                    <Edit className="h-4 w-4" /> {/* Added icon */}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>{" "}
      {/* Close overflow container */}
      {/* Styled Pagination */}
      <div className="mt-6 flex justify-center">
        {" "}
        {/* Increased margin and centered */}
        <Pagination>
          <PaginationContent className="gap-1">
            {" "}
            {/* Added gap */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={cn(
                  "text-glass-foreground/70 hover:bg-white/10 hover:text-glass-foreground", // Added styles
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                  // Added styles for active and inactive states
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
                  "text-glass-foreground/70 hover:bg-white/10 hover:text-glass-foreground", // Added styles
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* Styled Dialog Content */}
        <DialogContent className="border-glass-border/30 bg-glass/80 backdrop-blur-xl shadow-xl text-glass-foreground">
          <DialogHeader>
            {/* Adjusted title color */}
            <DialogTitle className="text-glass-foreground">
              {editingStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
          </DialogHeader>
          <StudentForm
            initialData={editingStudent}
            onSubmit={handleAddOrUpdateStudent}
            submitButtonText={editingStudent ? "Update Student" : "Add Student"}
          />
        </DialogContent>
      </Dialog>
    </Card> // Replaced final div with Card closing tag
  );
}
