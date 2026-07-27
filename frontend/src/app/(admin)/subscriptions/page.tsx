"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptions, useCreatePlan, useUpdatePlan, useModules } from "@/features/admin/subscriptions/hooks/useSubscriptions";
import PlanCard from "./components/PlanCard";
import PlanFormModal from "./components/PlanFormModal";

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
        id: plan.id, name: plan.name, description: plan.description || "",
        monthly_price: parseFloat(plan.monthly_price), annual_price: parseFloat(plan.annual_price),
        trial_days: plan.trial_days, module_ids: plan.modules?.map((pm: any) => pm.module_id) || [],
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
      if (isEditing) { await updatePlan.mutateAsync(formData); }
      else { await createPlan.mutateAsync(formData); }
      setIsModalOpen(false);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save plan.");
    }
  };

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
            <PlanCard key={plan.id} plan={plan} index={index} onEdit={handleOpenModal} />
          ))}
          {plans.length === 0 && (
            <div className="lg:col-span-3 text-center py-16 text-gray-400">
              No plans yet. Create your first subscription plan.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <PlanFormModal
          isEditing={isEditing} formData={formData} onChange={setFormData}
          modules={modules} onToggleModule={toggleModule}
          onSave={handleSave} onClose={() => setIsModalOpen(false)}
          isSaving={createPlan.isPending || updatePlan.isPending} error={saveError}
        />
      )}
    </div>
  );
}
