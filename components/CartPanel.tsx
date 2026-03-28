"use client";

import Image from "next/image";
import { usePosStore } from "@/store/usePosStore";
import clsx from "clsx";

export function CartPanel() {
  const { getActiveBill, clearCart, updateCartItemQuantity, removeCartItem } = usePosStore();
  const bill = getActiveBill();

  // If no bills are open
  if (!bill) {
    return (
      <div className="flex-1 bg-surface-container-lowest rounded-[2rem] flex flex-col items-center justify-center p-6 shadow-soft border border-outline-variant/5">
        <span className="material-symbols-outlined text-outline text-[64px] mb-4">point_of_sale</span>
        <h2 className="font-bold text-lg text-on-surface-variant">No Active Bill</h2>
        <p className="text-sm text-outline mt-2 text-center">Click the + icon in the top tab bar to start a new order.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface-container-lowest rounded-[2rem] flex flex-col shadow-soft border border-outline-variant/5 animate-slide-in">
      <div className="p-6 border-b border-surface-container-highest flex justify-between items-center bg-white rounded-t-[2rem]">
        <div>
          <h2 className="font-black text-xl tracking-tight text-on-surface">Current Order</h2>
          <p className="text-xs text-outline font-bold tracking-widest uppercase mt-1">
            Order #{bill.orderNumber} &bull; Today, <span className="text-primary">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
        {bill.items.length > 0 && (
          <button 
            onClick={clearCart}
            className="text-error text-xs font-black px-4 py-2 bg-error-container hover:bg-error hover:text-white rounded-xl transition-colors tracking-widest uppercase"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {bill.items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-outline-variant">
            <span className="material-symbols-outlined text-[48px] mb-2" style={{ fontVariationSettings: "'wght' 200" }}>shopping_basket</span>
            <p className="font-medium text-sm">Cart is empty</p>
          </div>
        ) : (
          bill.items.map((item, index) => (
            <div 
              key={item.id} 
              className="p-4 bg-surface rounded-[1.5rem] space-y-4 group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container-high overflow-hidden relative shrink-0">
                    <Image
                      fill
                      className="object-cover"
                      alt={item.product.name}
                      src={item.product.primaryImageUrl || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80`}
                    />
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="font-black text-base leading-tight text-on-surface">{item.product.name}</h4>
                    <p className="text-[10px] text-outline uppercase tracking-widest font-bold mt-1">SKU: {item.product.sku}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 pt-1">
                  <span className="font-black text-lg text-primary tracking-tight">₹{(item.subtotal).toFixed(2)}</span>
                  <button 
                    onClick={() => removeCartItem(item.id)}
                    className="text-[10px] text-error font-medium uppercase tracking-widest hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-end gap-3 bg-white p-2 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 bg-surface-container-lowest text-on-surface border border-surface-container-highest rounded-xl px-2 py-1 shadow-sm">
                  <button 
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    className="material-symbols-outlined text-lg w-8 h-8 flex items-center justify-center hover:bg-surface-container-low rounded-lg transition-colors text-outline"
                    disabled={item.quantity <= 1}
                  >
                    remove
                  </button>
                  <span className="font-black text-base w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    className="material-symbols-outlined text-lg w-8 h-8 flex items-center justify-center hover:bg-surface-container-low rounded-lg transition-colors text-primary"
                  >
                    add
                  </button>
                </div>
              </div>

              {/* Modifiers removed as requested */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
