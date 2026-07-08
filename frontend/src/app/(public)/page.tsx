"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isRunningInHostApp } from "@/lib/miniapp-bridge";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // If running in the host app WebView, go to /home.
    if (isRunningInHostApp()) {
      router.replace("/home");
      return;
    }

    // Double check after a short delay to account for any WebView bridge injection latency.
    const timer = setTimeout(() => {
      if (isRunningInHostApp()) {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
