import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SummaryCard } from "@/components/ui/SummaryCard";
interface RecentBill {
  id: number;
  date: string;
  totalAmount: number;
  students: string[];
}

export function Overview() {
  // TODO: Replace this hardcoded data with actual data fetching logic
  const totalCollected = 50000;
  const totalBillAmount = 48000;
  const numberOfStudents = 20;

  const additionalAmount = totalBillAmount - totalCollected;
  const amountPerStudent = totalBillAmount / numberOfStudents;

  const recentBills: RecentBill[] = [
    {
      id: 1,
      date: "2023-08-01",
      totalAmount: 2500,
      students: ["John Doe", "Jane Smith"],
    },
    {
      id: 2,
      date: "2023-08-03",
      totalAmount: 3000,
      students: ["Alice Johnson", "Bob Brown"],
    },
    {
      id: 3,
      date: "2023-08-05",
      totalAmount: 2800,
      students: ["Charlie Davis", "Diana Evans"],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Collected"
          value={totalCollected}
          icon={<ArrowUpIcon className="h-4 w-4 text-green-500" />}
        />
        <SummaryCard
          title="Total Bill Amount"
          value={totalBillAmount}
          icon={<ArrowUpIcon className="h-4 w-4 text-red-500" />}
        />
        <SummaryCard
          title="Additional Amount"
          value={
            additionalAmount > 0
              ? `₹${additionalAmount.toFixed(2)} (To Collect)`
              : `₹${Math.abs(additionalAmount).toFixed(2)} (To Return)`
          }
          icon={
            additionalAmount > 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-red-500" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-green-500" />
            )
          }
        />
        <SummaryCard
          title="Amount Per Student"
          value={amountPerStudent}
          icon={<ArrowUpIcon className="h-4 w-4 text-yellow-500" />} // Kept icon colors as is for now, can be themed later
        />
      </div>
      {/* Applied glassmorphism style to the Recent Bills card */}
      <Card className="border-glass-border/30 bg-glass/60 backdrop-blur-lg shadow-lg">
        <CardHeader>
          {/* Adjusted title color */}
          <CardTitle className="text-glass-foreground">Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {/* Added border to table header row */}
              <TableRow className="border-b border-glass-border/30 hover:bg-white/5">
                {/* Adjusted header cell style */}
                <TableHead className="text-glass-foreground/80">Date</TableHead>
                <TableHead className="text-glass-foreground/80">
                  Total Amount
                </TableHead>
                <TableHead className="text-glass-foreground/80">
                  Students
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBills.map((bill) => (
                // Removed misplaced comments
                <TableRow
                  key={bill.id}
                  className="border-b border-glass-border/20 hover:bg-white/10"
                >
                  <TableCell className="text-glass-foreground/90">
                    {bill.date}
                  </TableCell>
                  <TableCell className="text-glass-foreground/90">
                    ₹{bill.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-glass-foreground/90">
                    {bill.students.join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
