import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

export function SummaryCard({ title, value, icon }: SummaryCardProps) {
  const formattedValue =
    typeof value === "number" ? `₹${value.toFixed(2)}` : value;

  return (
    // Applied glassmorphism styles: background, blur, border, shadow
    <Card className="border-glass-border/30 bg-glass/60 backdrop-blur-glass shadow-lg transition-all hover:shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* Adjusted title color for glass background */}
        <CardTitle className="text-sm font-medium text-glass-foreground/80">
          {title}
        </CardTitle>
        {icon} {/* Icon styling is handled in the parent component */}
      </CardHeader>
      <CardContent>
        {/* Adjusted value color */}
        <div className="text-2xl font-bold text-glass-foreground">
          {formattedValue}
        </div>
      </CardContent>
    </Card>
  );
}
