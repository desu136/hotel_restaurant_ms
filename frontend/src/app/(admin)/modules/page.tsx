"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useModules, useCreateModule, useUpdateModule } from "@/features/admin/subscriptions/hooks/useSubscriptions";
import type { SystemModule } from "@/features/admin/types";

const EMPTY_FORM = { id: "", code: "", name: "", description: "", is_active: true };

export default function ModulesPage() {
  const { data, isLoading } = useModules();
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();

  const modules: SystemModule[] = data?.modules ?? [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const openCreate = () => { setIsEditing(false); setForm(EMPTY_FORM); setError(""); setIsModalOpen(true); };
  const openEdit = (mod: SystemModule) => {
    setIsEditing(true);
    setForm({ id: mod.id, code: mod.code, name: mod.name, description: mod.description ?? "", is_active: mod.is_active });
    setError(""); setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isEditing) {
        await updateModule.mutateAsync({ id: form.id, name: form.name, description: form.description, is_active: form.is_active });
      } else {
        await createModule.mutateAsync({ code: form.code, name: form.name, description: form.description, is_active: form.is_active });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save module");
    }
  };

  const isSaving = createModule.isPending || updateModule.isPending;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Platform Modules</h1>
          <p className="text-sm text-gray-500 mt-1">Manage global system modules and features.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Module
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {modules.map((mod) => (
                  <tr key={mod.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{mod.code}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{mod.name}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{mod.description}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mod.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {mod.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEdit(mod)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
                {modules.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No modules found. Create one to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{isEditing ? "Edit Module" : "New Module"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                <input required disabled={isEditing} type="text" value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                  placeholder="e.g. HOTEL" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" rows={3} />
              </div>
              <div className="flex items-center mt-2">
                <input type="checkbox" id="isActive" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Active</label>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {isSaving ? "Saving..." : "Save Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
