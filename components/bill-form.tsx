"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Bill, MarketingDetails } from "./bills-tab";

interface BillFormProps {
  initialData: Partial<Bill> | null;
  onSubmit: (billData: Omit<Bill, "id"> | Bill) => void;
  submitButtonText: string;
}

const calculateTotals = (
  marketingDetails: MarketingDetails,
  groceryTotal: number,
  amountGiven: number
): Pick<Bill, "marketingTotal" | "totalBillAmount" | "amountReturned"> => {
  const marketingTotal: number = Object.values(marketingDetails).reduce(
    (sum: number, value) => sum + (Number(value) || 0),
    0
  );
  const totalBillAmount: number = marketingTotal + (Number(groceryTotal) || 0);
  const amountReturned: number = (Number(amountGiven) || 0) - totalBillAmount;
  return { marketingTotal, totalBillAmount, amountReturned };
};

export function BillForm({
  initialData,
  onSubmit,
  submitButtonText,
}: BillFormProps) {
  const [formData, setFormData] = useState<Partial<Bill>>({});

  useEffect(() => {
    const defaultMarketing: MarketingDetails = {
      potatoOnionGarlicGinger: 0,
      veg: 0,
      egg: 0,
      fish: 0,
      chicken: 0,
    };
    const initialMarketing = initialData?.marketingDetails || defaultMarketing;
    const initialGrocery = initialData?.groceryTotal || 0;
    const initialAmountGiven = initialData?.amountGiven || 0;

    const totals = calculateTotals(
      initialMarketing,
      initialGrocery,
      initialAmountGiven
    );

    setFormData({
      date: new Date(),
      students: [],
      groceryTotal: 0,
      amountGiven: 0,
      ...initialData,
      marketingDetails: initialMarketing,
      ...totals,
    });
  }, [initialData]);

  const updateFormData = useCallback(
    (updates: Partial<Bill>) => {
      setFormData((prev: Partial<Bill>) => {
        const newState = { ...prev, ...updates };

        const newTotals = calculateTotals(
          newState.marketingDetails!,
          newState.groceryTotal!,
          newState.amountGiven!
        );

        return { ...newState, ...newTotals };
      });
    },
    [setFormData]
  );

  const handleMarketingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const marketingKey = id as keyof MarketingDetails;
    updateFormData({
      marketingDetails: {
        ...formData.marketingDetails!,
        [marketingKey]: Number(value) || 0,
      },
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    updateFormData({ [id]: value });
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    updateFormData({ [id]: Number(value) || 0 });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      updateFormData({ date });
    }
  };

  const handleStudentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Replace simple split with a more robust input method (e.g., tags input)
    updateFormData({
      students: e.target.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.date ||
      !formData.students ||
      formData.students.length === 0
    ) {
      alert("Please fill in Date and at least one Student.");
      return;
    }

    const finalData = {
      ...formData,
      marketingDetails: formData.marketingDetails!,
      marketingTotal: formData.marketingTotal!,
      groceryTotal: formData.groceryTotal!,
      totalBillAmount: formData.totalBillAmount!,
      amountGiven: formData.amountGiven!,
      amountReturned: formData.amountReturned!,
      date: formData.date!,
      students: formData.students!,
    };

    if (initialData?.id) {
      onSubmit({ ...finalData, id: initialData.id } as Bill);
    } else {
      onSubmit(finalData as Omit<Bill, "id">);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="flex flex-wrap gap-4 md:gap-8">
        <div className="flex items-center gap-4">
          <Label htmlFor="date" className="text-right">
            Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
              >
                {formData.date ? (
                  format(formData.date, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-grow items-center gap-4">
          <Label htmlFor="students" className="text-right">
            Students
          </Label>
          <Input
            id="students"
            value={formData.students?.join(", ") || ""}
            onChange={handleStudentsChange}
            className="flex-grow"
            placeholder="Names separated by comma"
            required
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.keys(formData.marketingDetails || {}).map((key) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={key} className="capitalize">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}{" "}
                </Label>
                <Input
                  id={key}
                  type="number"
                  value={
                    formData.marketingDetails?.[
                      key as keyof MarketingDetails
                    ] || 0
                  }
                  onChange={handleMarketingChange}
                  step="0.01"
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Label>Marketing Total</Label>
            <div className="text-lg font-semibold">
              ₹{formData.marketingTotal?.toFixed(2) ?? "0.00"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grocery Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groceryTotal">Grocery Total</Label>
            <Input
              id="groceryTotal"
              type="number"
              value={formData.groceryTotal || 0}
              onChange={handleNumberInputChange}
              step="0.01"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label>Total Bill Amount</Label>
          <div className="text-lg font-semibold">
            ₹{formData.totalBillAmount?.toFixed(2) ?? "0.00"}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amountGiven">Amount Given by Students</Label>
          <Input
            id="amountGiven"
            type="number"
            value={formData.amountGiven || 0}
            onChange={handleNumberInputChange}
            step="0.01"
          />
        </div>
        <div>
          <Label>Amount to be Returned</Label>
          <div className="text-lg font-semibold">
            ₹{formData.amountReturned?.toFixed(2) ?? "0.00"}
          </div>
        </div>
      </div>

      <Button type="submit" className="mt-4">
        {submitButtonText}
      </Button>
    </form>
  );
}
