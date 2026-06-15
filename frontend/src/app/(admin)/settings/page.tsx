"use client";

import { useState } from "react";
import { useSettings, useUpdateSettings } from "@/features/admin/settings/hooks/useSettings";

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [localSettings, setLocalSettings] = useState<{ key: string; value: string }[]>([]);
  const [synced, setSynced] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync server data into local editable state once
  const settings = data?.settings ?? [];
  if (!synced && settings.length > 0) {
    setLocalSettings(settings.map((s) => ({ key: s.key, value: s.value })));
    setSynced(true);
  }

  const handleChange = (key: string, value: string) =>
    setLocalSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure global SaaS policies like trial durations and grace periods.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
          {saved && (
            <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              ✓ Settings saved successfully!
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {localSettings.map((setting) => {
              const meta = settings.find((s) => s.key === setting.key);
              return (
                <div key={setting.key} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {setting.key.replace(/_/g, " ")}
                  </label>
                  <input
                    type="number"
                    required
                    value={setting.value}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {meta?.description && <p className="text-xs text-gray-500">{meta.description}</p>}
                </div>
              );
            })}
          </div>
          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button
              type="submit"
              disabled={updateSettings.isPending}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
