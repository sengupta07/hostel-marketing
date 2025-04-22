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
import { Label } from "@/components/ui/label";
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
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="text-2xl font-bold">Students</h2>
        <Button
          onClick={() => {
            setEditingStudent(null);
            setIsDialogOpen(true);
          }}
        >
          Add Student
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Room Number</TableHead>
            <TableHead>Amount Paid</TableHead>
            <TableHead>Amount to Return</TableHead>
            <TableHead>Last Month Due</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedStudents.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.name}</TableCell>
              <TableCell>{student.roomNumber}</TableCell>
              <TableCell>₹{student.amountPaid.toFixed(2)}</TableCell>
              <TableCell>₹{student.amountToReturn.toFixed(2)}</TableCell>
              <TableCell>₹{student.lastMonthDue.toFixed(2)}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  onClick={() => openEditDialog(student)}
                >
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
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
    </div>
  );
}
