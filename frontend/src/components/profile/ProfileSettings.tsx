"use client";

import * as React from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { AvatarCard } from "./components/AvatarCard";
import { ProfileInfoForm } from "./components/ProfileInfoForm";
import { PasswordChangeForm } from "./components/PasswordChangeForm";
import { DangerZoneCard, DeleteAccountModal } from "./components/DangerZoneCard";
import { useProfileSettings } from "./components/useProfileSettings";

export function ProfileSettings() {
  const {
    router, user, loading, savingProfile, savingPassword, deletingAccount,
    name, setName, phone, setPhone, avatarUrl, uploading, profileMsg,
    currentPassword, setCurrentPassword, newPassword, setNewPassword,
    confirmPassword, setConfirmPassword, passwordMsg,
    showDeleteModal, setShowDeleteModal, confirmDeletePass, setConfirmDeletePass,
    deleteError, handleProfileSave, handlePasswordSave, handleImageUpload, handleDeleteAccount,
  } = useProfileSettings();

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
        <p className="text-sm text-[var(--muted)]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/dashboard");
            }
          }}
          className="p-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-center"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Manage your account information, security settings, and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          <AvatarCard user={user} avatarUrl={avatarUrl} uploading={uploading} onImageUpload={handleImageUpload} />
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-6">
          <ProfileInfoForm
            user={user}
            name={name}
            setName={setName}
            phone={phone}
            setPhone={setPhone}
            savingProfile={savingProfile}
            profileMsg={profileMsg}
            onSubmit={handleProfileSave}
          />
          <PasswordChangeForm
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            savingPassword={savingPassword}
            passwordMsg={passwordMsg}
            onSubmit={handlePasswordSave}
          />
          <DangerZoneCard onOpenDeleteModal={() => setShowDeleteModal(true)} />
        </div>
      </div>

      <DeleteAccountModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        confirmDeletePass={confirmDeletePass}
        setConfirmDeletePass={setConfirmDeletePass}
        deleteError={deleteError}
        deletingAccount={deletingAccount}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}
