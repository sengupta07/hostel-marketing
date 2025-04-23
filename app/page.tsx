"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence
import { Button } from "@/components/ui/button";
import { Download, Menu } from "lucide-react"; // Import Menu icon
import { Overview } from "@/components/overview";
import { StudentsTab } from "@/components/students-tab";
import { Sidebar, TABS } from "@/components/sidebar";
import { BillsTab } from "@/components/bills-tab";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"; // Import Sheet components

type TabKey = (typeof TABS)[keyof typeof TABS];

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>(TABS.OVERVIEW);
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State for Sheet

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setIsSheetOpen(false); // Close sheet on tab change
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Static Sidebar for large screens */}
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm lg:justify-end">
          {/* Mobile Menu Button */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {/* Re-use Sidebar component structure inside Sheet */}
              <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
            </SheetContent>
          </Sheet>

          {/* Existing Header Content (Export Button) - aligned right on large screens */}
          <Button variant="secondary" className="hidden gap-2 sm:inline-flex">
            Export Data
            <Download className="h-4 w-4" />
          </Button>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {/* Moved Title and Date here, adjusted spacing */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Hostel Dashboard
              </h1>
              <div className="text-sm text-muted-foreground">
                Current Mess Date: Aug 1, 2023 - Aug 31, 2023
              </div>
            </div>
            {/* Export button visible on small screens here */}
            <Button variant="secondary" className="gap-2 sm:hidden">
              Export Data
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab} // Key change triggers animation
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === TABS.OVERVIEW && <Overview />}
              {activeTab === TABS.STUDENTS && <StudentsTab />}
              {activeTab === TABS.BILLS && <BillsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
