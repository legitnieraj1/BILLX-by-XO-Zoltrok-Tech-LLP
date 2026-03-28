import type { Metadata, Viewport } from "next";
import { SideNavRail } from "@/components/SideNavRail";
import { TopNavBar } from "@/components/TopNavBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SyncBootstrap } from "@/components/SyncBootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "billX POS - Premium Cafe Billing",
  description: "High-end point-of-sale system by Zoltrok Tech LLP",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "billX POS",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#022448",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" translate="no">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="bg-surface text-on-surface overflow-hidden antialiased selection:bg-primary/20">
        <SyncBootstrap />
        <div className="flex h-screen w-screen overflow-hidden bg-surface">
          <SideNavRail />
          <main className="ml-0 md:ml-20 flex-1 flex flex-col h-screen overflow-hidden pb-16 md:pb-0">
            <TopNavBar />
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </main>
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}
