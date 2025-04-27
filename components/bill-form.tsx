// src/components/BillForm.tsx (or appropriate path)
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckIcon, PencilIcon, Loader2 } from "lucide-react"; // Added Loader2
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Bill, MarketingItem } from "@/types"; // Ensure types are correctly defined/imported

// Type for the base definitions passed via props
export interface MarketingItemDefinition {
  id: string;
  label: string;
}

// Type for the internal state, including UI state
type MarketingItemState = MarketingItemDefinition & {
  enabled: boolean;
  amount: number | string; // Allow string during editing
  isEditing: boolean;
};

interface BillFormProps {
  // Definitions for marketing items specific to this form instance
  marketingItemDefinitions: MarketingItemDefinition[];
  initialData: // Keep initialData structure as before
  | (Partial<
        Pick<
          Bill,
          | "id"
          | "date"
          // Removed 'students' as it's not part of the core Bill model from API/DB
          | "marketingItems" // This should match the structure in Bill type now
          | "groceryTotal"
          | "amountGiven"
        >
      > & {
        marketingDetails?: { [key: string]: number }; // Keep for potential legacy data handling
      })
    | null;
  // Update onSubmit type to reflect the actual Bill structure (without UI/form-specific fields)
  onSubmit: (
    billData: Omit<
      Bill,
      "id" | "submittedAt" | "submittedBy" | "submittedById" | "marketingTaskId"
    > // Exclude fields not set by the form
  ) => void;
  submitButtonText: string;
  isLoading?: boolean; // Add isLoading prop
  isReadOnly?: boolean; // Add isReadOnly prop for view-only mode
}

// Keep BillFormData type as before
// Update BillFormData to remove 'students' and use 'moneyReturned'
type BillFormData = Partial<
  Pick<
    Bill,
    | "date"
    | "groceryTotal"
    | "amountGiven"
    | "marketingTotal"
    | "totalBillAmount"
    | "moneyReturned" // Use moneyReturned
  >
>;

// Keep calculateTotals function as before
const calculateTotals = (
  marketingItems: MarketingItemState[],
  groceryTotal: number,
  amountGiven: number
): Pick<Bill, "marketingTotal" | "totalBillAmount" | "moneyReturned"> => {
  // Return moneyReturned
  const marketingTotal: number = marketingItems.reduce(
    (sum, item) => sum + (item.enabled ? Number(item.amount) || 0 : 0),
    0
  );
  const totalBillAmount: number = marketingTotal + (Number(groceryTotal) || 0);
  const moneyReturned: number = (Number(amountGiven) || 0) - totalBillAmount; // Calculate moneyReturned
  return { marketingTotal, totalBillAmount, moneyReturned }; // Return moneyReturned
};

// --- Updated BillForm Component ---
export function BillForm({
  marketingItemDefinitions, // Use definitions from props
  initialData,
  onSubmit,
  submitButtonText,
  isLoading = false, // Default isLoading to false
  isReadOnly = false, // Default isReadOnly to false
}: BillFormProps) {
  const [formData, setFormData] = useState<BillFormData>({});
  // Initialize state based on definitions passed in props
  const [marketingItems, setMarketingItems] = useState<MarketingItemState[]>(
    () =>
      marketingItemDefinitions.map((def) => ({
        ...def,
        enabled: false,
        amount: 0,
        isEditing: false,
      }))
  );

  // Effect to initialize form data based on initialData and definitions
  useEffect(() => {
    // Initialize items based on definitions
    let initialItemsState = marketingItemDefinitions.map((def) => ({
      ...def,
      enabled: false,
      amount: 0,
      isEditing: false,
    }));

    let initialGrocery = initialData?.groceryTotal ?? 0;
    let initialAmountGiven = initialData?.amountGiven ?? 0;

    // If initialData provides marketingItems, merge them with the definitions
    if (initialData?.marketingItems && initialData.marketingItems.length > 0) {
      initialItemsState = marketingItemDefinitions.map((def) => {
        // First try to find by id (for backward compatibility)
        let savedItem = initialData.marketingItems?.find(
          (item) => item.id === def.id
        );

        // If not found by id, try to find by itemId (new structure from API)
        if (!savedItem) {
          savedItem = initialData.marketingItems?.find(
            (item) => item.itemId === def.id
          );
        }

        return savedItem
          ? {
              ...def, // Start with definition
              enabled: true, // Enable if it exists in initialData
              amount: Number(savedItem.amount) || 0,
              isEditing: false,
            }
          : { ...def, enabled: false, amount: 0, isEditing: false }; // Use definition defaults if not found
      });
    }
    // Also handle legacy marketingDetails if necessary (might need adjustment based on structure)
    else if (initialData?.marketingDetails) {
      initialItemsState = marketingItemDefinitions.map((def) => {
        const amount = initialData.marketingDetails?.[def.id];
        return amount !== undefined
          ? {
              ...def,
              enabled: true,
              amount: Number(amount) || 0,
              isEditing: false,
            }
          : { ...def, enabled: false, amount: 0, isEditing: false };
      });
    }

    setMarketingItems(initialItemsState);

    const totals = calculateTotals(
      initialItemsState,
      initialGrocery,
      initialAmountGiven
    );

    setFormData({
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      // Removed students initialization
      groceryTotal: initialGrocery,
      amountGiven: initialAmountGiven,
      ...totals,
    });
  }, [initialData, marketingItemDefinitions]); // Depend on definitions as well

  // Effect to recalculate totals when relevant data changes (keep as before)
  useEffect(() => {
    if (
      Object.keys(formData).length === 0 &&
      marketingItems.every((item) => !item.enabled && item.amount === 0)
    )
      return;

    const newTotals = calculateTotals(
      marketingItems,
      formData.groceryTotal || 0,
      formData.amountGiven || 0
    );

    // Prevent infinite loops by checking if totals actually changed
    // Check against moneyReturned
    if (
      newTotals.marketingTotal !== formData.marketingTotal ||
      newTotals.totalBillAmount !== formData.totalBillAmount ||
      newTotals.moneyReturned !== formData.moneyReturned
    ) {
      setFormData((prev) => ({
        ...prev,
        ...newTotals,
      }));
    }
  }, [
    marketingItems,
    formData.groceryTotal,
    formData.amountGiven,
    formData.marketingTotal,
    formData.totalBillAmount,
    formData.moneyReturned, // Depend on moneyReturned
    // formData object dependency might cause loops if not careful, specific props are better
  ]);

  // --- Input Handlers (Keep mostly as before) ---
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value === "" ? 0 : Number(value) || 0, // Handle empty string case
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) setFormData((prev) => ({ ...prev, date }));
  };

  // Removed handleStudentsChange

  const handleMarketingItemCheck = (itemId: string, checked: boolean) => {
    setMarketingItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              enabled: checked,
              amount: checked ? item.amount : 0, // Reset amount if unchecked
              isEditing: false, // Exit editing mode when check status changes
            }
          : item
      )
    );
  };

  const handleMarketingAmountChange = (itemId: string, value: string) => {
    setMarketingItems((prevItems) =>
      prevItems.map(
        (item) => (item.id === itemId ? { ...item, amount: value } : item) // Keep value as string temporarily
      )
    );
  };

  const handleMarketingAmountSave = useCallback((itemId: string) => {
    setMarketingItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId && item.isEditing) {
          const savedAmount = Number(item.amount) || 0; // Convert to number on save
          return { ...item, amount: savedAmount, isEditing: false };
        }
        return item;
      })
    );
  }, []); // Empty dependency array should be okay here

  const handleMarketingAmountEdit = (itemId: string) => {
    // Save any other item currently being edited first
    setMarketingItems((prevItems) =>
      prevItems.map((item) => {
        if (item.isEditing && item.id !== itemId) {
          // Save previously editing item
          const savedAmount = Number(item.amount) || 0;
          return { ...item, amount: savedAmount, isEditing: false };
        }
        // Set the clicked item to editing mode
        return { ...item, isEditing: item.id === itemId };
      })
    );
  };

  // --- Submit Handler (Keep mostly as before, uses internal state) ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Removed students validation
    if (!formData.date) {
      alert("Please fill in the Date."); // Use toast later
      return;
    }

    // Ensure any currently edited item is saved before submitting
    let finalItems = marketingItems;
    const currentlyEditing = marketingItems.find((item) => item.isEditing);
    if (currentlyEditing) {
      // Create the state as it would be *after* saving
      finalItems = marketingItems.map((item) =>
        item.id === currentlyEditing.id
          ? { ...item, amount: Number(item.amount) || 0, isEditing: false }
          : item
      );
      // Also update the state visually, though onSubmit will likely unmount/reset
      handleMarketingAmountSave(currentlyEditing.id);
    } else {
      // Ensure all amounts are numbers if nothing was being edited
      finalItems = marketingItems.map((item) => ({
        ...item,
        amount: Number(item.amount) || 0,
      }));
    }

    // Filter only enabled items with valid amounts for submission
    const itemsToSubmit = finalItems
      .filter((item) => item.enabled && Number(item.amount) > 0)
      .map((item) => ({
        // Map to the structure expected by Bill type
        id: item.id, // Keep id for compatibility
        itemId: item.id, // Map form item id to itemId
        label: item.label,
        amount: Number(item.amount), // Ensure amount is number
      }));

    // Recalculate totals based *only* on the items being submitted
    const finalTotals = calculateTotals(
      finalItems, // Use finalItems state for calculation base
      formData.groceryTotal ?? 0,
      formData.amountGiven ?? 0
    );

    // Prepare submission data matching the Omit type in onSubmit prop
    const submissionData: Omit<
      Bill,
      "id" | "submittedAt" | "submittedBy" | "submittedById" | "marketingTaskId"
    > = {
      date: formData.date!,
      // Removed students
      marketingItems: itemsToSubmit,
      marketingTotal: finalTotals.marketingTotal,
      groceryTotal: formData.groceryTotal ?? 0,
      totalBillAmount: finalTotals.totalBillAmount,
      amountGiven: formData.amountGiven ?? 0,
      moneyReturned: finalTotals.moneyReturned, // Use moneyReturned
      // Fields like description, receiptUrl are not currently in the form, add if needed
      description: null, // Add default/empty values if needed by type
      receiptUrl: null,
    };

    // Call the onSubmit prop passed from the parent
    // The type of submissionData now matches the expected argument type of onSubmit
    onSubmit(submissionData);
  };

  // --- Animations (Keep as before) ---
  const inputAnimation = {
    /* ... */
  };
  const textAnimation = {
    /* ... */
  };

  // --- JSX (Add disabled state to submit button) ---
  return (
    <form onSubmit={handleSubmit} className="grid gap-6 py-4">
      {/* Date and Students Inputs (Keep as before) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
          <Label htmlFor="date" className="text-right sm:text-left">
            Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
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
                selected={
                  formData.date instanceof Date ? formData.date : undefined
                }
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        {/* Removed Students Input Field */}
      </div>

      {/* Marketing Details Card and Table (Keep as before, but uses internal state) */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead className="w-[80px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketingItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      id={`check-${item.id}`}
                      checked={item.enabled}
                      onCheckedChange={(checked) =>
                        !isReadOnly &&
                        handleMarketingItemCheck(item.id, !!checked)
                      }
                      disabled={isReadOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <Label htmlFor={`check-${item.id}`}>{item.label}</Label>
                  </TableCell>
                  <TableCell className="text-right relative">
                    <AnimatePresence mode="wait" initial={false}>
                      {/* Conditional rendering for input/text based on item.enabled and item.isEditing */}
                      {item.enabled ? (
                        item.isEditing ? (
                          /* Input Field */ <motion.div
                            key={`input-${item.id}`} /* ... */
                          >
                            {" "}
                            <Input
                              type="number"
                              id={`amount-${item.id}`}
                              value={item.amount}
                              onChange={(e) =>
                                !isReadOnly &&
                                handleMarketingAmountChange(
                                  item.id,
                                  e.target.value
                                )
                              }
                              disabled={isReadOnly}
                              step="0.01"
                              className="h-8 w-24 text-right"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleMarketingAmountSave(item.id);
                                } else if (e.key === "Escape") {
                                  /* Revert logic */ setMarketingItems((prev) =>
                                    prev.map((i) =>
                                      i.id === item.id
                                        ? {
                                            ...i,
                                            amount: Number(i.amount) || 0,
                                            isEditing: false,
                                          }
                                        : i
                                    )
                                  );
                                }
                              }}
                            />
                          </motion.div>
                        ) : (
                          /* Display Text */ <motion.span
                            key={`text-${item.id}`}
                            /* ... */ className="inline-block px-1"
                          >
                            {Number(item.amount) > 0
                              ? Number(item.amount).toFixed(2)
                              : "0.00"}
                          </motion.span>
                        )
                      ) : (
                        /* Disabled Text */ <motion.span
                          key={`disabled-${item.id}`}
                          /* ... */ className="text-muted-foreground inline-block px-1"
                        >
                          -
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </TableCell>
                  <TableCell className="text-center">
                    {/* Conditional rendering for Edit/Save button */}
                    {item.enabled &&
                      (item.isEditing ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            !isReadOnly && handleMarketingAmountSave(item.id)
                          }
                          disabled={isReadOnly}
                          title="Save Amount"
                          type="button"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            !isReadOnly && handleMarketingAmountEdit(item.id)
                          }
                          title="Edit Amount"
                          type="button"
                          disabled={!item.enabled || isReadOnly}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-right">
            <Label className="text-muted-foreground">Marketing Total:</Label>
            <div className="text-lg font-semibold">
              ₹{formData.marketingTotal?.toFixed(2) ?? "0.00"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grocery Details Card (Keep as before) */}
      <Card>
        <CardHeader>
          <CardTitle>Grocery Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <Label htmlFor="groceryTotal">Grocery Total</Label>
            <Input
              id="groceryTotal"
              type="number"
              value={formData.groceryTotal ?? 0}
              onChange={(e) => !isReadOnly && handleNumberInputChange(e)}
              disabled={isReadOnly}
              step="0.01"
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Totals Summary Section (Keep as before) */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-sm text-muted-foreground">
            Total Bill Amount
          </Label>
          <div className="text-xl font-semibold">
            ₹{formData.totalBillAmount?.toFixed(2) ?? "0.00"}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <Label htmlFor="amountGiven">Amount Given</Label>
          <Input
            id="amountGiven"
            type="number"
            value={formData.amountGiven ?? 0}
            onChange={(e) => !isReadOnly && handleNumberInputChange(e)}
            disabled={isReadOnly}
            step="0.01"
            className="w-32"
          />
        </div>
        <div className="space-y-1 text-right sm:text-left">
          <Label className="text-sm text-muted-foreground">
            Amount Returned
          </Label>
          <div className="text-xl font-semibold">
            ₹{formData.moneyReturned?.toFixed(2) ?? "0.00"}{" "}
            {/* Use moneyReturned */}
          </div>
        </div>
      </div>

      {/* Submit Button (Add disabled state and loading indicator) - Hide in read-only mode */}
      {!isReadOnly && submitButtonText && (
        <Button
          type="submit"
          className="mt-2 w-full sm:w-auto sm:justify-self-end"
          disabled={isLoading} // Disable button when loading
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      )}
    </form>
  );
}
