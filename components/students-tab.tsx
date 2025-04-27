"use client";

"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UserPlus, Edit } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn, saveToLocalStorage, loadFromLocalStorage } from "@/lib/utils";
import { StudentForm } from "./student-form";
import type { Student } from "@/types";

const STUDENTS_STORAGE_KEY = "hostelMarketingApp_students";

const ITEMS_PER_PAGE = 12;

export function StudentsTab() {
  const [students, setStudents] = useState<Student[]>(() => {
    const savedStudents = loadFromLocalStorage<Student[]>(STUDENTS_STORAGE_KEY);
    return savedStudents || [];
  });

  useEffect(() => {
    saveToLocalStorage(STUDENTS_STORAGE_KEY, students);
  }, [students]);

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
      // FIXME: Replace naive ID generation with a robust method (e.g., UUID)
      const newId = Date.now(); // Simple timestamp ID for now
      const newStudent = { ...studentData, id: newId };
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
    <Card className="border-glass-border/30 bg-glass/60 backdrop-blur-lg shadow-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-glass-foreground">
          Students List
        </h2>
        <Button
          variant="secondary"
          onClick={() => {
            setEditingStudent(null);
            setIsDialogOpen(true);
          }}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Student
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-glass-border/30 hover:bg-white/5">
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
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.map((student) => (
              <TableRow
                key={student.id}
                className="border-b border-glass-border/20 hover:bg-white/10"
              >
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
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-glass-foreground/70 hover:bg-white/10 hover:text-glass-foreground"
                    onClick={() => openEditDialog(student)}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-glass-border/30 bg-glass/80 backdrop-blur-xl shadow-xl text-glass-foreground">
          <DialogHeader>
            <DialogTitle className="text-glass-foreground">
              {editingStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <StudentForm
              initialData={editingStudent}
              onSubmit={handleAddOrUpdateStudent}
              submitButtonText={
                editingStudent ? "Update Student" : "Add Student"
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
