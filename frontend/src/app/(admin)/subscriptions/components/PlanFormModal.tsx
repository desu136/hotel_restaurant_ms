"use client";

import React from "react";

interface FormData {
  id: string; name: string; description: string;
  monthly_price: number; annual_price: number;
  trial_days: number; module_ids: string[];
}

interface Props {
  isEditing: boolean;
  formData: FormData;
  onChange: (data: FormData) => void;
  modules: any[];
  onToggleModule: (id: string) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
  isSaving: boolean;
  error: string;
}

export default function PlanFormModal({
  isEditing, formData, onChange, modules, onToggleModule, onSave, onClose, isSaving, error,
}: Props) {
  const inputCls = "w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{isEditing ? "Edit Plan" : "Create New Plan"}</h3>
        </div>
        <form onSubmit={onSave} className="p-6 space-y-6">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input type="text" required value={formData.name}
                onChange={(e) => onChange({ ...formData, name: e.target.value })} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea rows={2} value={formData.description}
                onChange={(e) => onChange({ ...formData, description: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Price ($)</label>
              <input type="number" step="0.01" required value={isNaN(formData.monthly_price) ? "" : formData.monthly_price}
                onChange={(e) => onChange({ ...formData, monthly_price: parseFloat(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Price ($)</label>
              <input type="number" step="0.01" required value={isNaN(formData.annual_price) ? "" : formData.annual_price}
                onChange={(e) => onChange({ ...formData, annual_price: parseFloat(e.target.value) })} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trial Days</label>
              <input type="number" required value={isNaN(formData.trial_days) ? "" : formData.trial_days}
                onChange={(e) => onChange({ ...formData, trial_days: parseInt(e.target.value) })} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Granted Modules</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modules.map((mod: any) => (
                <label key={mod.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <input type="checkbox" checked={formData.module_ids.includes(mod.id)} onChange={() => onToggleModule(mod.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{mod.name}</div>
                    <div className="text-xs text-gray-500">{mod.code}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {isSaving ? "Saving..." : "Save Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
