"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, Library, GraduationCap, Layers } from "lucide-react";

const tabs = [
  { href: "/buffer", label: "Buffer", icon: PenLine },
  { href: "/library", label: "Library", icon: Library },
  { href: "/study", label: "Study", icon: GraduationCap },
  { href: "/cards", label: "Cards", icon: Layers },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:hidden">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 ${
                isActive
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
