"use client";

import { useEffect, useState } from "react";

interface OrderSuccessOverlayProps {
  isVisible: boolean;
  orderNumber: string;
  total: number;
  onClose: () => void;
}

export function OrderSuccessOverlay({ isVisible, orderNumber, total, onClose }: OrderSuccessOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/20 backdrop-blur-md animate-fade-in p-6 overflow-hidden">
      {/* Confetti Burst */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="absolute rounded-full bg-primary animate-ping"
            style={{
              width: `${Math.random() * 20 + 8}px`,
              height: `${Math.random() * 20 + 8}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 2 + 1}s`,
              backgroundColor: ['#022448', '#FFCC00', '#22C55E', '#3B82F6'][i % 4]
            }}
          />
        ))}
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl p-10 flex flex-col items-center gap-6 max-w-sm w-full animate-scale-up text-center border border-white/50 relative">
        <button 
          onClick={() => { setShow(false); onClose(); }} 
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
          <span className="material-symbols-outlined text-white text-[56px] animate-[bounce_1s_infinite]">check_circle</span>
        </div>
        
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tight">Order Confirmed!</h2>
          <p className="text-outline font-bold uppercase tracking-widest text-[11px] mt-2">
            Ticket #{orderNumber}
          </p>
        </div>

        <div className="w-full h-px bg-slate-100" />

        <div className="flex flex-col gap-1">
          <span className="text-xs text-outline font-medium">Payment Received</span>
          <span className="text-4xl font-black text-primary tracking-tighter">₹{total.toFixed(2)}</span>
        </div>

        <p className="text-xs text-outline-variant font-medium italic">
          Receipt is being printed...
        </p>

        <div className="flex gap-1">
          {[1,2,3].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500/20 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
