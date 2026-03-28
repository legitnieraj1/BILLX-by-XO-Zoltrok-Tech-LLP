"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import clsx from "clsx";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: "point_of_sale", label: "POS", href: "/" },
  { icon: "bar_chart", label: "Analytics", href: "/analytics" },
  { icon: "inventory_2", label: "Inventory", href: "/inventory" },
  { icon: "settings", label: "Settings", href: "/settings" },
];

export function SideNavRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full z-50 flex-col py-6 w-20 bg-primary dark:bg-slate-950 font-medium antialiased text-sm">
      <div className="flex flex-col items-center mb-10">
        {/* Logo replacing the original HTML logo text */}
        <div className="w-12 h-12 relative overflow-hidden rounded-xl">
           <span className="text-xl font-black tracking-tight text-white flex items-center justify-center w-full h-full bg-white/10">
             bX
           </span>
        </div>
      </div>

      <nav className="flex flex-col gap-4 flex-grow">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center rounded-xl mx-2 py-3 transition-all duration-300",
                isActive
                  ? "bg-secondary-container text-white scale-95 shadow-md shadow-secondary-container/20"
                  : "text-slate-300 hover:text-white hover:bg-primary-container dark:hover:bg-slate-800",
                "active:scale-90 transition-transform"
              )}
            >
              <span className="material-symbols-outlined" data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="text-[10px] mt-1 font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden cursor-pointer hover:border-secondary-container transition-colors">
          <Image
            alt="Cafe Manager Profile"
            width={40}
            height={40}
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxhNAOifI9jzCHvD-AJIRYMM0LOPuQJbv3wF5VEYdBqrOujkv-VlFqt-6hAhHHtmo9JL4NAc4wR5C_LqNWj_hv-vgdNE1cogwvhLd0tObabEt11bge4DqDnPqcnOwuPLV52IgpwqB2P4CSnWzd8jpC1rfpLZdSPD6NqWeG0w99Pnsc94TY5teDuMhMPFlJ-ShM-_qhzvAH1HC7OIG9pvoksMIQycrMcc33XqCH7FzhTe1-xtzP6qI8hxGqnWid7pgbU-ngMbCXgb0"
          />
        </div>
      </div>
    </aside>
  );
}
