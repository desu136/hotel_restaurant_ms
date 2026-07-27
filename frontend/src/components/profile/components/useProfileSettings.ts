"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function useProfileSettings() {
  const router = useRouter();
  const [user, setUser] = React.useState<{ name: string; email: string; phone: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(false);

  // Profile fields
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [profileMsg, setProfileMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordMsg, setPasswordMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete account fields
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [confirmDeletePass, setConfirmDeletePass] = React.useState("");
  const [deleteError, setDeleteError] = React.useState("");

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
          setAvatarUrl(data.user.avatar_url || "");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, avatar_url: avatarUrl || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg({ type: "success", text: "Profile updated successfully!" });
        router.refresh();
      } else {
        setProfileMsg({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch {
      setProfileMsg({ type: "error", text: "A network error occurred." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg({ type: "error", text: data.error || "Failed to change password" });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "A network error occurred." });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProfileMsg(null);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data?.data?.url) {
        setAvatarUrl(data.data.url);
        setProfileMsg({ type: "success", text: "Photo uploaded. Save profile to apply changes." });
      } else {
        setProfileMsg({ type: "error", text: data.error || "Upload failed" });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Failed to upload photo" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeletingAccount(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: confirmDeletePass }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowDeleteModal(false);
        router.push("/login");
      } else {
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch {
      setDeleteError("Failed to delete account due to network error");
    } finally {
      setDeletingAccount(false);
    }
  };

  return {
    router, user, loading, savingProfile, savingPassword, deletingAccount,
    name, setName, phone, setPhone, avatarUrl, uploading, profileMsg,
    currentPassword, setCurrentPassword, newPassword, setNewPassword,
    confirmPassword, setConfirmPassword, passwordMsg,
    showDeleteModal, setShowDeleteModal, confirmDeletePass, setConfirmDeletePass,
    deleteError, handleProfileSave, handlePasswordSave, handleImageUpload, handleDeleteAccount,
  };
}
