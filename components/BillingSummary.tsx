"use client";

import { useState } from "react";
import { usePosStore } from "@/store/usePosStore";
import { useReceiptStore } from "@/store/useReceiptStore";
import { OrderSuccessOverlay } from "./OrderSuccessOverlay";
import clsx from "clsx";
import { OrderType, PaymentMethod } from "@/types";

export function BillingSummary() {
  const {
    getActiveBill,
    setOrderType,
    setPaymentMethod,
    setCustomerDetails,
    clearCart
  } = usePosStore();
  const { template } = useReceiptStore();
  
  const bill = getActiveBill();

  // Handle null bill properly
  if (!bill) {
    return (
      <div className="flex-[1.2] flex flex-col gap-6 h-full p-2">
        <div className="bg-surface-container-lowest rounded-[2rem] flex-1"></div>
      </div>
    );
  }

  const subtotal = bill.items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * bill.taxRate;
  const totalPay = subtotal + tax - bill.discount;

  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const handleCompleteOrder = async () => {
    if (bill.items.length === 0) return;
    
    setOrderStatus('processing');
    try {
      const payload = {
        orderNumber: bill.orderNumber,
        orderType: bill.orderType,
        customerName: bill.customer.name,
        customerPhone: bill.customer.phone,
        items: bill.items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          price: item.subtotal,
        })),
        subtotal,
        tax,
        discount: bill.discount,
        total: totalPay,
        paymentMethod: bill.paymentMethod
      };

      const { createOrder } = await import('@/lib/api');
      await createOrder(payload);

      // Auto-print receipt
      try {
        const { generateReceipt } = await import('@/lib/receiptGenerator');
        const { printReceipt } = await import('@/lib/printerBridge');
        const receiptData = {
          orderNumber: bill.orderNumber,
          orderType: bill.orderType,
          items: bill.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.price,
            subtotal: item.subtotal,
          })),
          subtotal,
          tax,
          discount: bill.discount,
          total: totalPay,
          paymentMethod: bill.paymentMethod,
          customerName: bill.customer.name,
          customerPhone: bill.customer.phone,
          dateTime: new Date(),
        };
        const escposBase64 = generateReceipt(receiptData, template);
        await printReceipt(escposBase64);
      } catch (printErr) {
        console.warn('Receipt print failed:', printErr);
      }

      setOrderStatus('success');
      setShowSuccessOverlay(true);
      
      // Delay cleaning the cart so the user sees the confirmation
      setTimeout(() => {
        clearCart();
        setOrderStatus('idle');
        setShowSuccessOverlay(false);
      }, 1000);
    } catch (err) {
      setOrderStatus('error');
      setErrorMessage((err as Error).message);
      setTimeout(() => setOrderStatus('idle'), 4000);
    }
  };

  return (
    <>
      {/* Customer & Type Context */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-6 shadow-soft border border-outline-variant/5 space-y-6 animate-slide-in">
        
        {/* Order Type Toggle */}
        <div className="flex p-1.5 bg-surface-container-high rounded-2xl shadow-inner">
          {(['dine-in', 'takeaway', 'delivery'] as OrderType[]).map((type) => {
            const isActive = bill.orderType === type;
            const icons = {
              'dine-in': 'restaurant',
              'takeaway': 'shopping_bag',
              'delivery': 'delivery_dining'
            };
            
            return (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={clsx(
                  "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300",
                  isActive
                    ? "bg-white shadow-sm text-primary scale-100"
                    : "text-on-surface-variant hover:text-on-surface scale-95 hover:scale-100"
                )}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {icons[type]}
                </span> 
                {type.replace("-", " ")}
              </button>
            );
          })}
        </div>


      </div>

      {/* Payment Strategy & Total */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-6 shadow-soft border border-outline-variant/5 flex-1 flex flex-col gap-6 animate-slide-in" style={{ animationDelay: '100ms' }}>
        
        {/* Payment Modes */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-on-surface">Payment Mode</h3>
          <div className="grid grid-cols-2 gap-3">
            {(['upi', 'cash'] as PaymentMethod[]).map((method) => {
              const isActive = bill.paymentMethod === method;
              const icons = { 'upi': 'qr_code_2', 'cash': 'payments' };
              
              return (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border-2 transition-all duration-300 group",
                    isActive
                      ? "border-secondary-container bg-secondary-container/5 shadow-sm scale-100"
                      : "border-transparent bg-surface hover:bg-surface-container-high scale-[0.98] hover:scale-100"
                  )}
                >
                  <span className={clsx("material-symbols-outlined text-2xl transition-transform group-hover:-translate-y-1", isActive ? "text-secondary-container" : "text-primary")}>
                    {icons[method as keyof typeof icons]}
                  </span>
                  <span className={clsx("text-[10px] font-black uppercase tracking-widest", isActive ? "text-secondary-container" : "text-on-surface-variant")}>
                    {method}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ledger Breakdown */}
        <div className="mt-auto space-y-4 pt-6 border-t border-surface-container-highest">
          <div className="flex justify-between text-sm font-semibold text-on-surface">
            <span>Subtotal</span>
            <span className="font-black">₹{(subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-outline">
            <span>Tax (GST 5%)</span>
            <span className="font-black">₹{(tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-secondary-container">
            <span className="uppercase tracking-widest text-[11px]">Promo Discount</span>
            <span>-₹{(bill.discount).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-end pt-4">
            <span className="text-xl font-black text-primary tracking-tight">Total Pay</span>
            <div className="text-right">
              <span className="block text-[36px] font-black text-secondary-container leading-none tracking-tighter">₹{(totalPay).toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            onClick={handleCompleteOrder}
            disabled={bill.items.length === 0 || orderStatus === 'processing' || orderStatus === 'success'}
            className={clsx(
              "w-full mt-4 py-5 text-white rounded-[2rem] font-black text-lg shadow-ambient hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:cursor-not-allowed group relative overflow-hidden",
              orderStatus === 'success' ? "bg-green-500 hover:scale-100" :
              orderStatus === 'error' ? "bg-error hover:scale-100" :
              "btn-gradient-primary hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {orderStatus === 'processing' ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : orderStatus === 'success' ? (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="material-symbols-outlined">check_circle</span>
                <span>Success!</span>
              </div>
            ) : orderStatus === 'error' ? (
              <div className="flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined">error</span>
                <span>{errorMessage || 'Failed'}</span>
              </div>
            ) : (
              <>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                Complete Order
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="flex justify-center items-center gap-2 opacity-30 my-2">
        <span className="text-[9px] font-bold uppercase tracking-widest">Powered by</span>
        <span className="text-sm font-black tracking-tighter text-on-surface">billX</span>
        <div className="w-1 h-1 rounded-full bg-outline"></div>
        <span className="text-[10px] font-semibold tracking-widest uppercase">Zoltrok Tech LLP</span>
      </div>
      <OrderSuccessOverlay 
        key={bill.orderNumber}
        isVisible={showSuccessOverlay} 
        orderNumber={bill.orderNumber} 
        total={totalPay} 
        onClose={() => setShowSuccessOverlay(false)} 
      />
    </>
  );
}
