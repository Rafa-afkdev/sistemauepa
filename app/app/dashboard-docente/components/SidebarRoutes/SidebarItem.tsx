"use client";

import { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  item: {
    icon: LucideIcon;
    label: string;
    href: string;
  };
}

export function SidebarItem({ item }: SidebarItemProps) {
  const { label, icon: Icon, href } = item;
  const pathname = usePathname();
  const router = useRouter();

  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  const onClick = () => {
    router.push(href);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-x-3 text-sm font-medium px-3 py-3 rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-slate-800",
        isActive && "bg-blue-400 text-white hover:bg-blue-500"
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}
