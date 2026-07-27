"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AvatarCardProps {
  user: { name: string; email: string; avatar_url: string | null } | null;
  avatarUrl: string;
  uploading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarCard({ user, avatarUrl, uploading, onImageUpload }: AvatarCardProps) {
  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <Card className="glass">
      <CardContent className="pt-6 text-center">
        <div className="relative w-28 h-28 mx-auto mb-4 group">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-[var(--surface-border)]" />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-[var(--surface-border)] shadow-inner">
              {initials}
            </div>
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <Camera className="w-6 h-6 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} disabled={uploading} />
          </label>
        </div>

        {uploading && <p className="text-xs text-[var(--color-primary-600)] animate-pulse mb-2">Uploading picture...</p>}
        <h2 className="font-bold text-lg">{user?.name}</h2>
        <p className="text-xs text-[var(--muted)] mb-4">{user?.email}</p>
      </CardContent>
    </Card>
  );
}
