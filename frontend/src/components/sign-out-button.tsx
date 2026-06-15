"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <button 
      onClick={handleSignOut}
      className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors text-[var(--muted)]"
    >
      <LogOut className="w-5 h-5 mr-3" />
      Sign Out
    </button>
  );
}
