"use client";

import Image from "next/image";
import { usePosStore } from "@/store/usePosStore";
import clsx from "clsx";

export function QuickPicks() {
  const { addCartItem, searchQuery, products } = usePosStore();

  // Get the first 3 coffee items (or any items) as quick picks from the live DB
  const quickPicks = products.slice(0, 3);

  const filteredPicks = quickPicks.filter((item) => {
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (searchQuery && filteredPicks.length === 0) return null;

  return (
    <div>
      <h2 className="text-[13px] font-black uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">bolt</span>
        Quick Picks
      </h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar md:grid md:grid-cols-3 md:gap-4">
        {filteredPicks.map((item, index) => (
            <div 
              className={clsx(
                "relative rounded-2xl overflow-hidden aspect-[4/3] bg-surface-container",
                !item.isAvailable && "cursor-not-allowed group/sold"
              )}
            >
              <Image
                fill
                className={clsx(
                  "object-cover transition-transform duration-700",
                  item.isAvailable ? "group-hover:scale-110" : "grayscale opacity-50 transition-none"
                )}
                alt={item.name}
                src={item.primaryImageUrl || `https://loremflickr.com/200/200/${encodeURIComponent(item.name)},food/all`}
              />
              {!item.isAvailable && (
                <div className="absolute inset-0 z-10">
                  <div className="absolute top-3 -left-7 w-24 py-0.5 bg-error text-white text-[7px] font-black uppercase tracking-widest text-center -rotate-45 shadow-sm">
                    Sold Out
                  </div>
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover/sold:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-xl animate-shake">block</span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                <span className="text-white font-bold leading-tight">{item.name}</span>
                <span className="text-white/90 text-sm font-medium">₹{(item.price).toFixed(2)}</span>
              </div>
              {item.isAvailable && (
                <button className="absolute top-3 right-3 w-8 h-8 bg-secondary-container text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              )}
            </div>
        ))}
      </div>
    </div>
  );
}
