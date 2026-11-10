import React from "react";
import { SidebarTrigger } from "../ui/sidebar";

function TopBar() {
  return (
    <div className="px-2 bg-on-brand w-full h-10 flex items-center justify-between md:">
      <SidebarTrigger />
    </div>
  );
}

export default TopBar;
