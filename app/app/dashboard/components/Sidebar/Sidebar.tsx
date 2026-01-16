import { Logo } from "../Logo/Logo";
import { SidebarRoutes } from "../SidebarRoutes/SidebarRoutes";
import React from "react";

export default function Sidebar() {
  return (
    <div className="h-screen flex">
      <div className="h-full flex flex-col border-r w-60 bg-white dark:bg-slate-900 overflow-y-auto">
        <Logo />
        <div className="mt-4 flex-1 overflow-y-auto">
          <SidebarRoutes />
        </div>
      </div>
    </div>
  )
}
