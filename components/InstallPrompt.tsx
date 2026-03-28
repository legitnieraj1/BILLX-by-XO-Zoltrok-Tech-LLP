"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Wait a moment before showing the prompt so the user sees the app first
      setTimeout(() => {
        setIsInstallable(true);
      }, 1500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Also check if already installed
    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative animate-slide-up">
        <button 
          onClick={() => setIsInstallable(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-surface-container rounded-full text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md mb-5 relative bg-white flex items-center justify-center border border-outline-variant/30">
            <Image 
              src="/icon.png" 
              alt="BILLX Logo" 
              fill
              className="object-contain p-2"
            />
          </div>
          
          <h2 className="text-2xl font-black text-on-surface tracking-tight mb-2">
            Install billX POS
          </h2>
          <p className="text-sm font-medium text-outline mb-8 px-2 leading-relaxed">
            Install this app on your device for a faster, full-screen POS experience with offline support.
          </p>
          
          <button 
            onClick={handleInstallClick}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:-translate-y-0.5"
          >
            Install App
          </button>
          
          <button 
            onClick={() => setIsInstallable(false)}
            className="mt-4 text-xs font-bold uppercase tracking-widest text-outline hover:text-on-surface transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
