"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { eventInfo, staffProfile } from "@/lib/staff-mock";

export function StaffTopBar() {
  return (
    <header className="px-2 md:px-4 bg-on-brand w-full h-10 flex items-center justify-between border-b border-border/40">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <span className="text-xs md:text-sm font-medium text-muted-foreground hidden sm:inline">
          {eventInfo.name}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
        <span className="font-medium text-foreground">{staffProfile.name}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">{staffProfile.role}</span>
      </div>
    </header>
  );
}

