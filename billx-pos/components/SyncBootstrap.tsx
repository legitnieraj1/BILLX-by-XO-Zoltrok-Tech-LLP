"use client";

import { useEffect, useState } from "react";

export function SyncBootstrap() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    import("@/lib/syncEngine").then(({ syncEngine }) => {
      // Pull data initially if online
      syncEngine.pullData(process.env.NEXT_PUBLIC_BUSINESS_ID || '00000000-0000-0000-0000-000000000001');
      
      // Periodically try to push
      setInterval(() => {
        syncEngine.pushPendingOrders();
      }, 30000); // every 30 seconds
    });

    const handleOnline = () => {
      setIsOffline(false);
      // Trigger immediate push when coming back online
      import("@/lib/syncEngine").then(({ syncEngine }) => {
        syncEngine.pushPendingOrders();
      });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-1 text-xs font-bold tracking-wider uppercase">
      Offline Mode — Orders saved locally, will sync when online
    </div>
  );
}
