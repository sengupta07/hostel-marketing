"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckIcon, PencilIcon } from "lucide-react";
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
// --- Framer Motion Import ---
import { motion, AnimatePresence } from "framer-motion";

// --- Define Interfaces (Assuming these might be shared or defined here) ---
export interface MarketingItem {
  id: string;
  label: string;
  enabled: boolean;
  amount: number | string; // Use string during edit, number otherwise
  isEditing: boolean;
}

export interface Bill {
  id: string;
  date: Date;
  students: string[];
  marketingItems: MarketingItem[];
  marketingTotal: number;
  groceryTotal: number;
  totalBillAmount: number;
  amountGiven: number;
  amountReturned: number;
  // marketingDetails?: { [key: string]: number }; // Legacy field (optional)
}

// --- Refactored Initial Marketing Items Data ---
const initialMarketingItemsData: MarketingItem[] = [
  {
    id: "pogg", // Combined ID
    label: "Potato/Onion/Garlic/Ginger", // Combined Label
    enabled: false,
    amount: 0,
    isEditing: false,
  },
  // Keep other items as they were
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

// --- Component Props Interface ---
interface BillFormProps {
  initialData:
    | (Partial<
        Pick<
          Bill,
          | "id"
          | "date"
          | "students"
          | "marketingItems"
          | "groceryTotal"
          | "amountGiven"
        >
      > & {
        marketingDetails?: { [key: string]: number }; // Optional legacy field
      })
    | null;
  onSubmit: (billData: Omit<Bill, "id" | "marketingDetails"> | Bill) => void;
  submitButtonText: string;
}

// --- State Type ---
type BillFormData = Partial<
  Pick<
    Bill,
    | "date"
    | "students"
    | "groceryTotal"
    | "amountGiven"
    | "marketingTotal"
    | "totalBillAmount"
    | "amountReturned"
  >
>;

// --- Helper Functions ---
const calculateTotals = (
  marketingItems: MarketingItem[],
  groceryTotal: number,
  amountGiven: number
): Pick<Bill, "marketingTotal" | "totalBillAmount" | "amountReturned"> => {
  const marketingTotal: number = marketingItems.reduce(
    (sum, item) => sum + (item.enabled ? Number(item.amount) || 0 : 0),
    0
  );
  const totalBillAmount: number = marketingTotal + (Number(groceryTotal) || 0);
  const amountReturned: number = (Number(amountGiven) || 0) - totalBillAmount;
  return { marketingTotal, totalBillAmount, amountReturned };
};

// --- Main Component ---
export function BillForm({
  initialData,
  onSubmit,
  submitButtonText,
}: BillFormProps) {
  const [formData, setFormData] = useState<BillFormData>({});
  const [marketingItems, setMarketingItems] = useState<MarketingItem[]>(
    () =>
      initialMarketingItemsData.map((item) => ({ ...item, isEditing: false })) // Initialize with deep copy & isEditing: false
  );

  // --- Effects ---
  useEffect(() => {
    // Initialize based on initialData
    let initialItems = initialMarketingItemsData.map((item) => ({
      ...item,
      isEditing: false,
    }));
    let initialGrocery = initialData?.groceryTotal ?? 0;
    let initialAmountGiven = initialData?.amountGiven ?? 0;

    if (initialData?.marketingItems && initialData.marketingItems.length > 0) {
      initialItems = initialMarketingItemsData.map((defaultItem) => {
        const savedItem = initialData.marketingItems?.find(
          (item) => item.id === defaultItem.id
        );
        return savedItem
          ? {
              ...defaultItem,
              ...savedItem,
              amount: Number(savedItem.amount) || 0,
              isEditing: false,
            }
          : { ...defaultItem, isEditing: false };
      });
    }
    // Note: Removed backward compatibility for initialData.marketingDetails here for simplicity,
    // assuming the parent component (BillsTab) handles the conversion before passing initialData.
    // If you still need it here, you'd add an `else if (initialData?.marketingDetails)` block.

    setMarketingItems(initialItems);

    const totals = calculateTotals(
      initialItems,
      initialGrocery,
      initialAmountGiven
    );

    setFormData({
      date: initialData?.date || new Date(),
      students: initialData?.students || [],
      groceryTotal: initialGrocery,
      amountGiven: initialAmountGiven,
      ...totals,
    });
  }, [initialData]);

  useEffect(() => {
    // Recalculate totals
    if (Object.keys(formData).length === 0) return; // Avoid running on initial empty state

    const newTotals = calculateTotals(
      marketingItems,
      formData.groceryTotal || 0,
      formData.amountGiven || 0
    );

    if (
      newTotals.marketingTotal !== formData.marketingTotal ||
      newTotals.totalBillAmount !== formData.totalBillAmount ||
      newTotals.amountReturned !== formData.amountReturned
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
    formData.marketingTotal, // Include totals in deps for comparison
    formData.totalBillAmount,
    formData.amountReturned,
    formData, // Include formData to run after initialization
  ]);

  // --- Handlers ---
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: Number(value) || 0,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) setFormData((prev) => ({ ...prev, date }));
  };

  const handleStudentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      students: e.target.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }));
  };

  const handleMarketingItemCheck = (itemId: string, checked: boolean) => {
    setMarketingItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              enabled: checked,
              amount: checked ? item.amount : 0,
              isEditing: false, // Stop editing if checkbox is toggled
            }
          : item
      )
    );
  };

  const handleMarketingAmountChange = (itemId: string, value: string) => {
    setMarketingItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, amount: value } : item
      )
    );
  };

  // Fix: Use functional update in useCallback to avoid stale state
  const handleMarketingAmountSave = useCallback((itemId: string) => {
    setMarketingItems(
      (
        prevItems // Use functional update
      ) =>
        prevItems.map((item) => {
          if (item.id === itemId && item.isEditing) {
            // Check isEditing here
            const savedAmount = Number(item.amount) || 0;
            return { ...item, amount: savedAmount, isEditing: false };
          }
          return item;
        })
    );
  }, []); // Keep dependency array empty

  const handleMarketingAmountEdit = (itemId: string) => {
    setMarketingItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        isEditing: item.id === itemId, // Only this item is editing
      }))
    );
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

    // Ensure any pending edits are saved *before* final calculation/submission
    let finalItems = marketingItems;
    const currentlyEditing = marketingItems.find((item) => item.isEditing);
    if (currentlyEditing) {
      // Auto-save the currently editing item
      handleMarketingAmountSave(currentlyEditing.id);
      // Update finalItems immediately for calculation (state update might be async)
      finalItems = marketingItems.map((item) =>
        item.id === currentlyEditing.id
          ? { ...item, amount: Number(item.amount) || 0, isEditing: false }
          : item
      );
      // Optionally alert the user that the value was auto-saved
      // alert(`Auto-saving amount for ${currentlyEditing.label}.`);
    } else {
      // Ensure amounts are numbers even if not editing
      finalItems = marketingItems.map((item) => ({
        ...item,
        amount: Number(item.amount) || 0,
        isEditing: false,
      }));
    }

    // Filter items for submission (optional: only include enabled with amount > 0)
    const itemsToSubmit = finalItems.filter(
      (item) => item.enabled // Decide if you want to filter by amount > 0 as well
      // && Number(item.amount) > 0
    );

    // Recalculate final totals based on the actual items *being submitted*
    const finalTotals = calculateTotals(
      itemsToSubmit,
      formData.groceryTotal ?? 0,
      formData.amountGiven ?? 0
    );

    const submissionData: Omit<Bill, "id" | "marketingDetails"> = {
      date: formData.date!,
      students: formData.students!,
      marketingItems: itemsToSubmit.map((item) => ({
        // Ensure isEditing: false in submitted data
        ...item,
        isEditing: false, // Remove isEditing from submitted data if it's just UI state
      })),
      marketingTotal: finalTotals.marketingTotal,
      groceryTotal: formData.groceryTotal ?? 0,
      totalBillAmount: finalTotals.totalBillAmount,
      amountGiven: formData.amountGiven ?? 0,
      amountReturned: finalTotals.amountReturned,
    };

    if (initialData?.id) {
      onSubmit({ ...submissionData, id: initialData.id });
    } else {
      onSubmit(submissionData);
    }
  };

  // --- Animation Variants ---
  const inputAnimation = {
    initial: { opacity: 0, y: -5 }, // Start slightly above and transparent
    animate: { opacity: 1, y: 0 }, // Fade in and slide down
    exit: { opacity: 0, y: 5 }, // Fade out and slide down further
    transition: { duration: 0.2 }, // Animation speed
  };
  const textAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  };

  // --- Render ---
  return (
    <form onSubmit={handleSubmit} className="grid gap-6 py-4">
      {/* Section 1: Date and Students (No changes needed here) */}
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
                selected={formData.date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
          <Label htmlFor="students" className="text-right sm:text-left">
            Students
          </Label>
          <Input
            id="students"
            value={formData.students?.join(", ") || ""}
            onChange={handleStudentsChange}
            placeholder="Names separated by comma"
            required
          />
        </div>
      </div>

      {/* Section 2: Marketing Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead> {/* Checkbox */}
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
                        handleMarketingItemCheck(item.id, !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Label htmlFor={`check-${item.id}`}>{item.label}</Label>
                  </TableCell>
                  {/* --- Amount Cell with Animation --- */}
                  <TableCell className="text-right relative">
                    {" "}
                    {/* Add relative positioning if needed for absolute animations, but direct animation is often fine */}
                    <AnimatePresence mode="wait" initial={false}>
                      {item.enabled ? (
                        item.isEditing ? (
                          <motion.div
                            key={`input-${item.id}`} // Unique key for input state
                            variants={inputAnimation}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={inputAnimation.transition} // Apply transition here
                            className="inline-block" // Prevents taking full width
                          >
                            <Input
                              type="number"
                              id={`amount-${item.id}`}
                              value={item.amount}
                              onChange={(e) =>
                                handleMarketingAmountChange(
                                  item.id,
                                  e.target.value
                                )
                              }
                              step="0.01"
                              className="h-8 w-24 text-right" // Input styling
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleMarketingAmountSave(item.id);
                                } else if (e.key === "Escape") {
                                  // Optional: Revert value and exit edit mode on Escape
                                  setMarketingItems((prev) =>
                                    prev.map((i) =>
                                      i.id === item.id
                                        ? {
                                            ...i,
                                            amount:
                                              Number(
                                                /* fetch original amount? */ i.amount
                                              ) || 0,
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
                          <motion.span
                            key={`text-${item.id}`} // Unique key for text state
                            variants={textAnimation}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={textAnimation.transition} // Apply transition here
                            className="inline-block px-1" // Add padding matching input if needed
                          >
                            {/* Display formatted number, handle 0 amount */}
                            {Number(item.amount) > 0
                              ? Number(item.amount).toFixed(2)
                              : "0.00"}
                          </motion.span>
                        )
                      ) : (
                        <motion.span
                          key={`disabled-${item.id}`}
                          variants={textAnimation}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={textAnimation.transition}
                          className="text-muted-foreground inline-block px-1"
                        >
                          -
                        </motion.span> // Show dash if disabled
                      )}
                    </AnimatePresence>
                  </TableCell>
                  {/* --- Action Cell --- */}
                  <TableCell className="text-center">
                    {item.enabled && ( // Show actions only if enabled
                      <>
                        {item.isEditing ? (
                          // Save Button - Now correctly triggers save
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMarketingAmountSave(item.id)}
                            title="Save Amount"
                            type="button"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          // Edit Button
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMarketingAmountEdit(item.id)}
                            title="Edit Amount"
                            type="button"
                            disabled={
                              !item.enabled
                            } /* Disable if item not enabled */
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
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

      {/* Section 3: Grocery Details (No changes needed) */}
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
              onChange={handleNumberInputChange}
              step="0.01"
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Summary (No changes needed) */}
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
            onChange={handleNumberInputChange}
            step="0.01"
            className="w-32"
          />
        </div>
        <div className="space-y-1 text-right sm:text-left">
          <Label className="text-sm text-muted-foreground">
            Amount Returned
          </Label>
          <div className="text-xl font-semibold">
            ₹{formData.amountReturned?.toFixed(2) ?? "0.00"}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="mt-2 w-full sm:w-auto sm:justify-self-end"
      >
        {submitButtonText}
      </Button>
    </form>
  );
}
