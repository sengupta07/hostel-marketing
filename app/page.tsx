"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Overview } from "@/components/overview";
import { StudentsTab } from "@/components/students-tab";
import { Sidebar, TABS } from "@/components/sidebar";
import { BillsTab } from "@/components/bills-tab";

type TabKey = (typeof TABS)[keyof typeof TABS];

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>(TABS.OVERVIEW);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 mb-4 sm:mb-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Hostel Dashboard
            </h1>
            <div className="text-sm text-muted-foreground">
              Current Mess Date: Aug 1, 2023 - Aug 31, 2023
            </div>
          </div>
          <Button variant="secondary" className="gap-2">
            Export Data
            <Download className="h-4 w-4" />
          </Button>
        </div>
        {activeTab === TABS.OVERVIEW && <Overview />}
        {activeTab === TABS.STUDENTS && <StudentsTab />}
        {activeTab === TABS.BILLS && <BillsTab />}
      </main>
    </div>
  );
}
