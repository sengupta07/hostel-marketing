"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Users,
  BarChart3,
} from "lucide-react";
import React from "react";

export const TABS = {
  OVERVIEW: "overview",
  STUDENTS: "students",
  BILLS: "bills",
} as const;

type TabKey = (typeof TABS)[keyof typeof TABS];

interface SidebarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="h-full w-64 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-glass text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Building className="h-6 w-6 text-primary" />
        <span className="font-semibold">Hostel Mgmt</span>
      </div>
      <div className="px-4 py-4">
        <Input
          placeholder="Search..."
          className="bg-white/5 border-sidebar-border placeholder:text-sidebar-foreground/50 focus:ring-primary/50"
        />
      </div>
      <nav className="flex flex-col space-y-1 px-2">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === TABS.OVERVIEW
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
          }`}
          onClick={() => setActiveTab(TABS.OVERVIEW)}
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === TABS.STUDENTS
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
          }`}
          onClick={() => setActiveTab(TABS.STUDENTS)}
        >
          <Users className="h-4 w-4" />
          Students
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === TABS.BILLS
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
          }`}
          onClick={() => setActiveTab(TABS.BILLS)}
        >
          <BarChart3 className="h-4 w-4" />
          Bills
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
        >
          <LifeBuoy className="h-4 w-4" />
          Support
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </nav>
    </aside>
  );
}
