import React from "react";
import { SidebarTrigger } from "../ui/sidebar";

function TopBar() {
  return (
    <div className="px-2 bg-on-brand w-full h-10 flex items-center justify-between md:">
      <SidebarTrigger />
      <div className="flex items-center">
        <div className="text-sm text-brand mr-2 pr-2 border-r-2 border-r-brand-hover">
          งานคืนสู่เหย้า 2569
        </div>
        <div className="text-sm text-brand">21 พ.ย. 2569</div>
      </div>
    </div>
  );
}

export default TopBar;
