"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { usePosStore } from "@/store/usePosStore";

const navItems = [
  { icon: "point_of_sale", label: "POS", href: "/" },
  { icon: "bar_chart", label: "Analytics", href: "/analytics" },
  { icon: "inventory_2", label: "Inventory", href: "/inventory" },
  { icon: "settings", label: "Settings", href: "/settings" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const getActiveBill = usePosStore((s) => s.getActiveBill);
  const bill = getActiveBill();
  const cartCount = bill?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary safe-area-bottom">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.href === "/" && cartCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200",
                isActive ? "text-white" : "text-slate-400 active:text-white"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-secondary-container" />
              )}
              <div className="relative">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-secondary-container text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className={clsx("text-[9px] font-bold uppercase tracking-wider", isActive ? "opacity-100" : "opacity-60")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
