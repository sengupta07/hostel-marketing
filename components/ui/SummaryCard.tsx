import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode; // Allow passing icon components directly
}

export function SummaryCard({ title, value, icon }: SummaryCardProps) {
  // Format number values with Rupee symbol and 2 decimal places
  const formattedValue =
    typeof value === "number" ? `₹${value.toFixed(2)}` : value;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
      </CardContent>
    </Card>
  );
}
