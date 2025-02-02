"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  ChevronDown,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Users,
} from "lucide-react";
import { Overview } from "@/components/overview";
import { StudentsTab } from "@/components/students-tab";
import { BillsTab } from "@/components/bills-tab";

export default function Page() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="grid lg:grid-cols-[280px_1fr] h-screen">
        <aside className="border-r bg-background/50 backdrop-blur">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Home className="h-6 w-6" />
            <span className="font-bold">Hostel Marketing</span>
          </div>
          <div className="px-4 py-4">
            <Input placeholder="Search" className="bg-background/50" />
          </div>
          <nav className="space-y-2 px-2">
            <Button
              variant={activeTab === "overview" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab("overview")}
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === "students" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab("students")}
            >
              <Users className="h-4 w-4" />
              Students
            </Button>
            <Button
              variant={activeTab === "bills" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setActiveTab("bills")}
            >
              <BarChart3 className="h-4 w-4" />
              Bills
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LifeBuoy className="h-4 w-4" />
              Support
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </nav>
        </aside>
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Hostel Marketing Dashboard</h1>
              <div className="text-sm text-muted-foreground">
                Current Mess Date: Aug 1, 2023 - Aug 31, 2023
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              Export Data
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          {activeTab === "overview" && <Overview />}
          {activeTab === "students" && <StudentsTab />}
          {activeTab === "bills" && <BillsTab />}
        </main>
      </div>
    </div>
  );
}
