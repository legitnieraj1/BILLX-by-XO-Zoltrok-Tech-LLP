"use client";

import dynamic from "next/dynamic";

const POSView = dynamic(() => import("@/components/POSView").then((mod) => mod.POSView), {
  ssr: false,
});

export default function Home() {
  return <POSView />;
}
