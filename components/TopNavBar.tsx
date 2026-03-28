"use client";

import { usePosStore } from "@/store/usePosStore";
import clsx from "clsx";

export function TopNavBar() {
  const { bills, activeBillId, setActiveBill, addBill, removeBill, searchQuery, setSearchQuery } = usePosStore();

  return (
    <div className="flex flex-col w-full z-40 bg-surface">
      {/* Chrome-style Tab Bar */}
      <div className="flex items-end px-4 md:px-8 pt-2 bg-surface-container-high gap-1 h-12 overflow-x-auto no-scrollbar">
        {bills.map((bill) => {
          const isActive = bill.id === activeBillId;
          return (
            <div
              key={bill.id}
              onClick={() => setActiveBill(bill.id)}
              className={clsx(
                "chrome-tab group",
                isActive ? "active" : ""
              )}
            >
              <span
                className={clsx(
                  "text-xs font-bold whitespace-nowrap",
                  isActive ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                )}
              >
                {bill.label}
              </span>
              
              {/* Only show close button if there's more than 1 bill */}
              {bills.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBill(bill.id);
                  }}
                  className={clsx(
                    "material-symbols-outlined text-[16px] rounded-full p-0.5 ml-2 transition-colors",
                    isActive
                      ? "text-outline hover:bg-surface-variant hover:text-error"
                      : "text-outline-variant hover:bg-surface hover:text-error opacity-0 group-hover:opacity-100"
                  )}
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 20" }}
                >
                  close
                </button>
              )}
            </div>
          );
        })}

        <div className="flex items-center mb-1 px-2 shrink-0">
          <button
            onClick={addBill}
            className="material-symbols-outlined text-outline hover:bg-surface-variant hover:text-primary rounded-full p-1 transition-colors"
          >
            add
          </button>
        </div>
      </div>

      {/* Header Search & Actions */}
      <header className="flex justify-between items-center px-4 md:px-8 w-full h-16 bg-surface dark:bg-slate-900 font-semibold tracking-tight border-b border-outline-variant/10">
        <div className="flex items-center gap-6 flex-1">
          <div className="relative w-full lg:w-96 group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-2xl transition-transform group-focus-within:scale-110">
              search
            </span>
            <input
              type="text"
              placeholder="Search coffee, snacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border-2 border-transparent focus:bg-surface-container-lowest focus:border-primary/20 rounded-xl pl-12 pr-4 py-3 text-sm font-medium outline-none transition-all shadow-sm focus:shadow-md"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg">
            <span
              className="material-symbols-outlined text-secondary-container"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              sync
            </span>
            <span className="text-xs text-on-surface-variant tracking-wide font-bold uppercase">Cloud Synced</span>
          </div>

        </div>
      </header>
    </div>
  );
}
