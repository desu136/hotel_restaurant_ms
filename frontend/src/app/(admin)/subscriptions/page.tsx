"use client";

import { useState } from "react";
import { Plus, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useSubscriptions, useCreatePlan, useUpdatePlan, useModules } from "@/features/admin/subscriptions/hooks/useSubscriptions";

const EMPTY_FORM = { id: "", name: "", description: "", monthly_price: 0, annual_price: 0, trial_days: 0, module_ids: [] as string[] };

export default function SubscriptionsPage() {
  const { data: plansData, isLoading } = useSubscriptions();
  const { data: modulesData } = useModules();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  const plans = plansData?.data ?? [];
  const modules = modulesData?.modules ?? [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saveError, setSaveError] = useState("");

  const handleOpenModal = (plan: any = null) => {
    if (plan) {
      setIsEditing(true);
      setFormData({
        id: plan.id,
        name: plan.name,
        description: plan.description || "",
        monthly_price: parseFloat(plan.monthly_price),
        annual_price: parseFloat(plan.annual_price),
        trial_days: plan.trial_days,
        module_ids: plan.modules?.map((pm: any) => pm.module_id) || [],
      });
    } else {
      setIsEditing(false);
      setFormData(EMPTY_FORM);
    }
    setSaveError("");
    setIsModalOpen(true);
  };

  const toggleModule = (moduleId: string) =>
    setFormData((f) => ({
      ...f,
      module_ids: f.module_ids.includes(moduleId)
        ? f.module_ids.filter((id) => id !== moduleId)
        : [...f.module_ids, moduleId],
    }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    try {
      if (isEditing) {
        await updatePlan.mutateAsync(formData);
      } else {
        await createPlan.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save plan.");
    }
  };

  const isSaving = createPlan.isPending || updatePlan.isPending;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Subscription Plans</h1>
          <p className="text-sm text-gray-500">Configure pricing tiers and features available to tenants.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Create New Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan: any, index: number) => (
            <Card key={plan.id} className={`flex flex-col relative overflow-hidden transition-all hover:shadow-md ${index === 1 ? "border-indigo-500 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]" : ""}`}>
              {index === 1 && <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <button onClick={() => handleOpenModal(plan)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-md transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <CardDescription>{plan.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline text-3xl font-bold">
                  ${parseFloat(plan.monthly_price).toFixed(2)}
                  <span className="text-sm font-normal text-gray-500 ml-1">/ mo</span>
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-medium">Features included:</div>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-500">
                      <Check className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                      {plan.trial_days > 0 ? `${plan.trial_days} Days Free Trial` : "No Free Trial"}
                    </li>
                    {plan.modules?.map((pm: any) => (
                      <li key={pm.module_id} className="flex items-center text-sm text-gray-500">
                        <Check className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                        {pm.module.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button variant={index === 1 ? "primary" : "outline"} className="w-full" onClick={() => handleOpenModal(plan)}>
                  Edit Plan
                </Button>
              </CardFooter>
            </Card>
          ))}
          {plans.length === 0 && (
            <div className="lg:col-span-3 text-center py-16 text-gray-400">
              No plans yet. Create your first subscription plan.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{isEditing ? "Edit Plan" : "Create New Plan"}</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {saveError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{saveError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Price ($)</label>
                  <input type="number" step="0.01" required value={isNaN(formData.monthly_price) ? "" : formData.monthly_price}
                    onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Price ($)</label>
                  <input type="number" step="0.01" required value={isNaN(formData.annual_price) ? "" : formData.annual_price}
                    onChange={(e) => setFormData({ ...formData, annual_price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trial Days</label>
                  <input type="number" required value={isNaN(formData.trial_days) ? "" : formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Granted Modules</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {modules.map((mod: any) => (
                    <label key={mod.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <input type="checkbox" checked={formData.module_ids.includes(mod.id)} onChange={() => toggleModule(mod.id)}
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
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {isSaving ? "Saving..." : "Save Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
