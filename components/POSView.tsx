"use client";

import { useEffect, useState } from "react";
import { QuickPicks } from "./QuickPicks";
import { MenuGrid } from "./MenuGrid";
import { CartPanel } from "./CartPanel";
import { BillingSummary } from "./BillingSummary";
import { usePosStore } from "@/store/usePosStore";
import clsx from "clsx";

type MobileTab = "menu" | "cart" | "pay";

export function POSView() {
  const setProducts = usePosStore((state) => state.setProducts);
  const getActiveBill = usePosStore((s) => s.getActiveBill);
  const [mobileTab, setMobileTab] = useState<MobileTab>("menu");

  const bill = getActiveBill();
  const cartCount = bill?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  useEffect(() => {
    import('@/lib/api').then(({ fetchProducts }) => {
      fetchProducts()
        .then(json => {
          if (json.success) setProducts(json.data);
        })
        .catch(err => console.error("Failed to fetch products", err));
    });
  }, [setProducts]);

  const tabs: { id: MobileTab; label: string; icon: string }[] = [
    { id: "menu", label: "Menu", icon: "restaurant_menu" },
    { id: "cart", label: cartCount > 0 ? `Cart (${cartCount})` : "Cart", icon: "shopping_cart" },
    { id: "pay", label: "Pay", icon: "payments" },
  ];

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-surface animate-fade-in">

      {/* ── Mobile tab strip — visible only on < md ──────────────── */}
      <div className="md:hidden flex shrink-0 px-4 pt-3 pb-2 gap-2 bg-surface border-b border-outline-variant/10">
        {tabs.map((tab) => {
          const isActive = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant bg-surface-container-high"
              )}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      {/*
        Mobile:  single-column; each section toggled by mobileTab
        Tablet (md):  2-col — Menu | (Cart stacked with Billing in right col)
        Desktop (lg): 3-col — Menu | Cart | Billing
      */}
      <div className="flex flex-1 overflow-hidden md:p-6 md:gap-6">

        {/* MENU panel — mobile: full when tab=menu; md+: always shown */}
        <section className={clsx(
          "flex-col gap-4 h-full overflow-hidden p-4 md:p-0 md:gap-6 md:flex md:flex-[1.8]",
          mobileTab === "menu" ? "flex" : "hidden md:flex"
        )}>
          <QuickPicks />
          <MenuGrid />
        </section>

        {/* CART panel — mobile: full when tab=cart; md+: always shown */}
        <section className={clsx(
          "flex-col h-full overflow-hidden p-4 md:p-0 md:flex md:flex-1",
          mobileTab === "cart" ? "flex" : "hidden md:flex"
        )}>
          <CartPanel />
        </section>

        {/* PAY panel — mobile only: full when tab=pay */}
        <section className={clsx(
          "flex-col gap-4 h-full overflow-hidden p-4 md:hidden",
          mobileTab === "pay" ? "flex" : "hidden"
        )}>
          <BillingSummary />
        </section>

        {/* TABLET right column — md only: BillingSummary beside Cart */}
        <div className="hidden md:flex lg:hidden flex-col gap-6 w-80 h-full overflow-y-auto no-scrollbar shrink-0">
          <BillingSummary />
        </div>

        {/* DESKTOP right panel — lg+: 3rd column */}
        <section className="hidden lg:flex flex-[1.2] flex-col gap-6 h-full overflow-hidden">
          <BillingSummary />
        </section>

      </div>
    </div>
  );
}
