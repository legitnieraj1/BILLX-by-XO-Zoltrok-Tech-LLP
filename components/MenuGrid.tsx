"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { usePosStore } from "@/store/usePosStore";
import clsx from "clsx";

export function MenuGrid() {
  const { addCartItem, searchQuery, products } = usePosStore();
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    return ["All", ...cats];
  }, [products]);

  // Set default category to the first non-All category if products load
  useEffect(() => {
    if (categories.length > 1 && activeCategory === "All" && !searchQuery) {
      setActiveCategory(categories[1]); // e.g. "SPILL THE TEA"
    }
  }, [categories, activeCategory, searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (searchQuery) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      if (activeCategory === "All") return true;
      return item.category === activeCategory;
    });
  }, [products, searchQuery, activeCategory]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={clsx(
              "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300",
              activeCategory === cat
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-100"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest scale-95 hover:scale-100"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Full Grid */}
      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20 no-scrollbar">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4 text-outline-variant">
              <span className="material-symbols-outlined text-4xl">search_off</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">No items found</h3>
            <p className="text-sm text-outline font-medium mt-1 max-w-[240px]">
              We couldn't find any products matching your search or category selection.
            </p>
          </div>
        ) : (
          filteredProducts.map((item, index) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest rounded-3xl p-4 flex flex-col gap-4 group transition-all duration-300 hover:shadow-ambient hover:-translate-y-1 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div 
                className={clsx(
                  "relative rounded-2xl overflow-hidden aspect-square bg-surface-container animate-shimmer bg-gradient-to-r from-surface-container via-surface-container-high to-surface-container",
                  !item.isAvailable && "cursor-not-allowed group/sold"
                )}
              >
                <Image
                  fill
                  className={clsx(
                    "object-cover transition-transform duration-700",
                    item.isAvailable ? "group-hover:scale-105" : "grayscale opacity-50 scale-100"
                  )}
                  alt={item.name}
                  src={item.primaryImageUrl || `https://loremflickr.com/200/200/${encodeURIComponent(item.name)},food/all`}
                />
                
                {!item.isAvailable && (
                  <div className="absolute inset-0 z-10">
                    {/* Diagonal Ribbon */}
                    <div className="absolute top-4 -left-8 w-32 py-1 bg-error text-white text-[9px] font-black uppercase tracking-[0.2em] text-center -rotate-45 shadow-lg border-y border-white/20">
                      Sold Out
                    </div>
                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover/sold:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white text-3xl animate-shake">block</span>
                    </div>
                  </div>
                )}

                {item.badge && item.isAvailable && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur rounded-[8px] text-[10px] font-black uppercase tracking-tighter shadow-sm text-primary z-20">
                    {item.badge}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <h3 className={clsx("font-bold text-base leading-tight tracking-tight", item.isAvailable ? "text-on-surface" : "text-outline")}>
                    {item.name}
                  </h3>
                  <p className="text-xs text-outline font-medium mt-1 line-clamp-2">{item.description}</p>
                </div>
                <span className={clsx("font-black text-base", item.isAvailable ? "text-primary" : "text-outline")}>₹{(item.price).toFixed(2)}</span>
              </div>

              <button 
                onClick={() => item.isAvailable && addCartItem(item)}
                disabled={!item.isAvailable}
                className={clsx(
                  "w-full mt-auto py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-sm",
                  item.isAvailable 
                    ? "bg-surface text-primary group-hover:bg-secondary-container group-hover:text-white" 
                    : "bg-surface-container-high text-outline cursor-not-allowed opacity-50"
                )}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {item.isAvailable ? "add_circle" : "block"}
                </span>
                <span className="text-sm">{item.isAvailable ? "Add to Cart" : "Unavailable"}</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
