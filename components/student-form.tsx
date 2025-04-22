"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Student } from "@/components/students-tab";

interface StudentFormProps {
  initialData: Partial<Student> | null;
  onSubmit: (studentData: Omit<Student, "id"> | Student) => void;
  submitButtonText: string;
}

export function StudentForm({
  initialData,
  onSubmit,
  submitButtonText,
}: StudentFormProps) {
  const [formData, setFormData] = useState<Partial<Student>>({
    name: "",
    roomNumber: "",
    amountPaid: 0,
    amountToReturn: 0,
    lastMonthDue: 0,
    ...initialData,
  });

  useEffect(() => {
    setFormData({
      name: "",
      roomNumber: "",
      amountPaid: 0,
      amountToReturn: 0,
      lastMonthDue: 0,
      ...initialData,
    });
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData((prev: Partial<Student>) => ({
      ...prev,
      [id]: type === "number" ? Number(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.roomNumber) {
      if (initialData?.id) {
        onSubmit({ ...formData, id: initialData.id } as Student);
      } else {
        onSubmit(formData as Omit<Student, "id">);
      }
    } else {
      alert("Please fill in all required fields.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <Input
          id="name"
          value={formData.name || ""}
          onChange={handleChange}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="roomNumber" className="text-right">
          Room Number
        </Label>
        <Input
          id="roomNumber"
          value={formData.roomNumber || ""}
          onChange={handleChange}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="amountPaid" className="text-right">
          Amount Paid
        </Label>
        <Input
          id="amountPaid"
          type="number"
          value={formData.amountPaid || 0}
          onChange={handleChange}
          className="col-span-3"
          step="0.01"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="amountToReturn" className="text-right">
          Amount to Return
        </Label>
        <Input
          id="amountToReturn"
          type="number"
          value={formData.amountToReturn || 0}
          onChange={handleChange}
          className="col-span-3"
          step="0.01"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="lastMonthDue" className="text-right">
          Last Month Due
        </Label>
        <Input
          id="lastMonthDue"
          type="number"
          value={formData.lastMonthDue || 0}
          onChange={handleChange}
          className="col-span-3"
          step="0.01"
        />
      </div>
      <Button type="submit">{submitButtonText}</Button>
    </form>
  );
}
