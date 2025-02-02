"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MarketingDetails {
  potatoOnionGarlicGinger: number
  veg: number
  egg: number
  fish: number
  chicken: number
}

interface Bill {
  id: number
  date: Date
  students: string[]
  marketingDetails: MarketingDetails
  marketingTotal: number
  groceryTotal: number
  totalBillAmount: number
  amountGiven: number
  amountReturned: number
}

const ITEMS_PER_PAGE = 12

export function BillsTab() {
  const [bills, setBills] = useState<Bill[]>([
    {
      id: 1,
      date: new Date("2023-08-01"),
      students: ["John Doe", "Jane Smith"],
      marketingDetails: {
        potatoOnionGarlicGinger: 300,
        veg: 500,
        egg: 200,
        fish: 400,
        chicken: 600,
      },
      marketingTotal: 2000,
      groceryTotal: 1000,
      totalBillAmount: 3000,
      amountGiven: 3500,
      amountReturned: 500,
    },
    // Add more sample data here...
  ])

  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [filterStudent, setFilterStudent] = useState("")

  const filteredBills = bills.filter(
    (bill) =>
      (filterDate ? bill.date.toDateString() === filterDate.toDateString() : true) &&
      (filterStudent ? bill.students.includes(filterStudent) : true),
  )

  const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE)
  const paginatedBills = filteredBills.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const prevBillRef = useRef<Bill | null>(null)

  useEffect(() => {
    if (editingBill && JSON.stringify(prevBillRef.current) !== JSON.stringify(editingBill)) {
      const marketingTotal = Object.values(editingBill.marketingDetails).reduce((sum, value) => sum + value, 0)
      const totalBillAmount = marketingTotal + editingBill.groceryTotal
      const amountReturned = editingBill.amountGiven - totalBillAmount

      if (
        marketingTotal !== editingBill.marketingTotal ||
        totalBillAmount !== editingBill.totalBillAmount ||
        amountReturned !== editingBill.amountReturned
      ) {
        setEditingBill((prev) => ({
          ...prev!,
          marketingTotal,
          totalBillAmount,
          amountReturned,
        }))
      }

      prevBillRef.current = editingBill
    }
  }, [editingBill])

  const handleAddOrUpdateBill = () => {
    if (editingBill) {
      const updatedBill = {
        ...editingBill,
        marketingTotal: Object.values(editingBill.marketingDetails).reduce((sum, value) => sum + value, 0),
        totalBillAmount: editingBill.marketingTotal + editingBill.groceryTotal,
        amountReturned: editingBill.amountGiven - editingBill.totalBillAmount,
      }

      if (editingBill.id) {
        setBills(bills.map((b) => (b.id === updatedBill.id ? updatedBill : b)))
      } else {
        setBills([...bills, { ...updatedBill, id: bills.length + 1 }])
      }
      setEditingBill(null)
      setIsDialogOpen(false)
    }
  }

  const openEditDialog = (bill: Bill) => {
    setEditingBill(bill)
    setIsDialogOpen(true)
  }

  const uniqueStudents = Array.from(new Set(bills.flatMap((bill) => bill.students)))

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="text-2xl font-bold">Bills</h2>
        <Button
          onClick={() => {
            setEditingBill({
              id: 0,
              date: new Date(),
              students: [],
              marketingDetails: {
                potatoOnionGarlicGinger: 0,
                veg: 0,
                egg: 0,
                fish: 0,
                chicken: 0,
              },
              marketingTotal: 0,
              groceryTotal: 0,
              totalBillAmount: 0,
              amountGiven: 0,
              amountReturned: 0,
            })
            setIsDialogOpen(true)
          }}
        >
          Add Bill
        </Button>
      </div>
      <div className="mb-4 flex gap-4">
        <div>
          <Label htmlFor="filterDate">Filter by Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-[240px] justify-start text-left font-normal", !filterDate && "text-muted-foreground")}
              >
                {filterDate ? format(filterDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="filterStudent">Filter by Student</Label>
          <Select value={filterStudent} onValueChange={setFilterStudent}>
            <SelectTrigger id="filterStudent">
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Students">All Students</SelectItem>
              {uniqueStudents.map((student) => (
                <SelectItem key={student} value={student}>
                  {student}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Marketing Total</TableHead>
            <TableHead>Grocery Total</TableHead>
            <TableHead>Total Bill Amount</TableHead>
            <TableHead>Amount Given</TableHead>
            <TableHead>Amount Returned</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedBills.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell>{format(bill.date, "PPP")}</TableCell>
              <TableCell>{bill.students.join(", ")}</TableCell>
              <TableCell>₹{bill.marketingTotal.toFixed(2)}</TableCell>
              <TableCell>₹{bill.groceryTotal.toFixed(2)}</TableCell>
              <TableCell>₹{bill.totalBillAmount.toFixed(2)}</TableCell>
              <TableCell>₹{bill.amountGiven.toFixed(2)}</TableCell>
              <TableCell>₹{bill.amountReturned.toFixed(2)}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => openEditDialog(bill)}>
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
                className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingBill?.id ? "Edit Bill" : "Add New Bill"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !editingBill?.date && "text-muted-foreground",
                    )}
                  >
                    {editingBill?.date ? format(editingBill.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editingBill?.date}
                    onSelect={(date) => setEditingBill((prev) => ({ ...prev!, date: date! }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="students" className="text-right">
                Students
              </Label>
              <Input
                id="students"
                value={editingBill?.students.join(", ") || ""}
                onChange={(e) => setEditingBill((prev) => ({ ...prev!, students: e.target.value.split(", ") }))}
                className="col-span-3"
                placeholder="Enter student names separated by commas"
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Marketing Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="potatoOnionGarlicGinger">Potato, Onion, Garlic, Ginger</Label>
                    <Input
                      id="potatoOnionGarlicGinger"
                      type="number"
                      value={editingBill?.marketingDetails.potatoOnionGarlicGinger || 0}
                      onChange={(e) =>
                        setEditingBill((prev) => ({
                          ...prev!,
                          marketingDetails: {
                            ...prev!.marketingDetails,
                            potatoOnionGarlicGinger: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="veg">Veg</Label>
                    <Input
                      id="veg"
                      type="number"
                      value={editingBill?.marketingDetails.veg || 0}
                      onChange={(e) =>
                        setEditingBill((prev) => ({
                          ...prev!,
                          marketingDetails: {
                            ...prev!.marketingDetails,
                            veg: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="egg">Egg</Label>
                    <Input
                      id="egg"
                      type="number"
                      value={editingBill?.marketingDetails.egg || 0}
                      onChange={(e) =>
                        setEditingBill((prev) => ({
                          ...prev!,
                          marketingDetails: {
                            ...prev!.marketingDetails,
                            egg: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="fish">Fish</Label>
                    <Input
                      id="fish"
                      type="number"
                      value={editingBill?.marketingDetails.fish || 0}
                      onChange={(e) =>
                        setEditingBill((prev) => ({
                          ...prev!,
                          marketingDetails: {
                            ...prev!.marketingDetails,
                            fish: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="chicken">Chicken</Label>
                    <Input
                      id="chicken"
                      type="number"
                      value={editingBill?.marketingDetails.chicken || 0}
                      onChange={(e) =>
                        setEditingBill((prev) => ({
                          ...prev!,
                          marketingDetails: {
                            ...prev!.marketingDetails,
                            chicken: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Marketing Total</Label>
                  <div className="text-2xl font-bold">₹{editingBill?.marketingTotal.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Grocery Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="groceryTotal">Grocery Total</Label>
                  <Input
                    id="groceryTotal"
                    type="number"
                    value={editingBill?.groceryTotal || 0}
                    onChange={(e) => setEditingBill((prev) => ({ ...prev!, groceryTotal: Number(e.target.value) }))}
                  />
                </div>
                <div className="mt-4">
                  <Label htmlFor="groceryBill">Grocery Bill Image</Label>
                  <Input id="groceryBill" type="file" accept="image/*" />
                </div>
              </CardContent>
            </Card>
            <div>
              <Label>Total Bill Amount</Label>
              <div className="text-2xl font-bold">₹{editingBill?.totalBillAmount.toFixed(2)}</div>
            </div>
            <div>
              <Label htmlFor="amountGiven">Amount Given to Students</Label>
              <Input
                id="amountGiven"
                type="number"
                value={editingBill?.amountGiven || 0}
                onChange={(e) => setEditingBill((prev) => ({ ...prev!, amountGiven: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Amount to be Returned</Label>
              <div className="text-2xl font-bold">₹{editingBill?.amountReturned.toFixed(2)}</div>
            </div>
          </div>
          <Button onClick={handleAddOrUpdateBill}>{editingBill?.id ? "Update" : "Add"} Bill</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

