"use client";

import { Button, ButtonProps } from "@/components/ui/button"; // Assuming ButtonProps is exported
import { Input } from "@/components/ui/input";
import { LogOut, LucideIcon } from "lucide-react"; // Import LogOut and LucideIcon type
import React from "react";

// Define the structure for a navigation item
export interface NavItem {
  id: string; // Unique identifier for the tab/link
  label: string; // Text to display
  icon: LucideIcon; // Icon component (e.g., Users, Settings)
  onClick?: () => void; // Optional custom onClick handler (if not setting activeTab)
}

// Define the structure for user data
export interface UserProfile {
  name?: string | null;
  image?: string | null;
  role?: string; // e.g., "Admin", "General Secretary"
}

interface SidebarProps {
  title: string; // Title for the sidebar header
  titleIcon: LucideIcon; // Icon for the sidebar header
  navItems: NavItem[]; // Array of navigation items
  activeTab: string; // The ID of the currently active navigation item
  setActiveTab: (tabId: string) => void; // Function to set the active tab
  user?: UserProfile | null; // Optional user data for the profile section
  onSignOut?: () => void; // Optional sign-out handler function
  showSearch?: boolean; // Whether to show the search input
  className?: string; // Optional additional class names for the aside element
}

export function Sidebar({
  title,
  titleIcon: TitleIcon, // Rename prop for clarity when using as component
  navItems,
  activeTab,
  setActiveTab,
  user,
  onSignOut,
  showSearch = false, // Default search to hidden unless specified
  className = "", // Default className to empty string
}: SidebarProps) {
  const handleNavItemClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick(); // Use custom handler if provided
    } else {
      setActiveTab(item.id); // Default behavior: set active tab
    }
  };

  return (
    <aside
      // Combine default classes with provided className, using theme from 1st example
      className={`h-full w-64 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-glass text-sidebar-foreground flex ${className}`}
    >
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <TitleIcon className="h-6 w-6 text-primary" />
        <span className="font-semibold">{title}</span>
      </div>

      {/* Optional Search */}
      {showSearch && (
        <div className="px-4 py-4">
          <Input
            placeholder="Search..."
            className="border-sidebar-border bg-white/5 placeholder:text-sidebar-foreground/50 focus:ring-primary/50"
          />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon; // Get the icon component
          // Use variant="secondary" for active, "ghost" for inactive (like 2nd example)
          const variant: ButtonProps["variant"] =
            activeTab === item.id ? "secondary" : "ghost";

          return (
            <Button
              key={item.id}
              variant={variant}
              // Use simpler styling from 2nd example, adapt hover if needed
              className={`w-full justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                variant === "ghost"
                  ? "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground" // Keep hover from 1st example for ghost
                  : "hover:bg-secondary/80" // Standard hover for secondary
              }`}
              onClick={() => handleNavItemClick(item)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* User Profile & Sign Out Section */}
      {(user || onSignOut) && ( // Only render the bottom section if user or signout is provided
        <div className="border-t border-sidebar-border p-4">
          {user && (
            <div className="mb-4 flex items-center gap-3">
              {" "}
              {/* Increased gap slightly */}
              <div className="relative h-9 w-9 flex-shrink-0 rounded-full">
                {" "}
                {/* Slightly larger avatar */}
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-sm font-medium uppercase text-primary">
                    {" "}
                    {/* Use uppercase initial */}
                    {user.name?.charAt(0) || "U"}
                  </div>
                )}
                {/* Optional: Add status indicator here if needed */}
              </div>
              <div className="flex flex-col overflow-hidden">
                {" "}
                {/* Allow text truncation */}
                <span className="truncate text-sm font-medium">
                  {user.name || "User"}
                </span>
                {user.role && (
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          )}

          {onSignOut && (
            <Button
              // Use outline variant and similar styling to 2nd example
              variant="outline"
              className="w-full justify-start gap-2 border-sidebar-border text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}
