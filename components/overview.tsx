import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function Overview() {
  // This data should be fetched from your backend
  const totalCollected = 50000
  const totalBillAmount = 48000
  const numberOfStudents = 20

  const additionalAmount = totalBillAmount - totalCollected
  const amountPerStudent = totalBillAmount / numberOfStudents

  const recentBills = [
    { id: 1, date: "2023-08-01", totalAmount: 2500, students: ["John Doe", "Jane Smith"] },
    { id: 2, date: "2023-08-03", totalAmount: 3000, students: ["Alice Johnson", "Bob Brown"] },
    { id: 3, date: "2023-08-05", totalAmount: 2800, students: ["Charlie Davis", "Diana Evans"] },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCollected.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bill Amount</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBillAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Additional Amount</CardTitle>
            {additionalAmount > 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-red-500" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {additionalAmount > 0
                ? `₹${additionalAmount.toFixed(2)} (To Collect)`
                : `₹${Math.abs(additionalAmount).toFixed(2)} (To Return)`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Per Student</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{amountPerStudent.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>{bill.date}</TableCell>
                  <TableCell>₹{bill.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{bill.students.join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

