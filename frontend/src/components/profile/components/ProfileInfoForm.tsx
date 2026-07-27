"use client";

import * as React from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileInfoFormProps {
  user: { name: string; email: string; phone: string } | null;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  savingProfile: boolean;
  profileMsg: { type: "success" | "error"; text: string } | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProfileInfoForm({
  user,
  name,
  setName,
  phone,
  setPhone,
  savingProfile,
  profileMsg,
  onSubmit,
}: ProfileInfoFormProps) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-[var(--color-primary-600)]" />
          Personal Information
        </CardTitle>
        <CardDescription>Update your personal details and contact email/phone.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {profileMsg && (
            <div
              className={`p-3 rounded-lg text-sm ${
                profileMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-200"
                  : "bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200"
              }`}
            >
              {profileMsg.text}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">Full Name</label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[var(--muted)]">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--muted)]">Email Address</label>
            <Input disabled value={user?.email || ""} className="opacity-60 bg-transparent" />
            <p className="text-[10px] text-[var(--muted)]">Email address changes must be requested through support.</p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={savingProfile}
              className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white"
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
