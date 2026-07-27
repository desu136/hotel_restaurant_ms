"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  tenant: any;
  plans: any[];
  selectedPlanId: string;
  onPlanChange: (id: string) => void;
  onApprove: () => void;
  onClose: () => void;
  isPending: boolean;
  error: string;
}

export default function ApproveModal({
  tenant, plans, selectedPlanId, onPlanChange, onApprove, onClose, isPending, error,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Approve Tenant</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You are about to approve <strong>{tenant.business_name}</strong>. This will activate their workspace.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign Subscription Plan</label>
            <select value={selectedPlanId} onChange={(e) => onPlanChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              {plans.map((plan: any) => (
                <option key={plan.id} value={plan.id}>{plan.name} (${parseFloat(plan.monthly_price)}/mo)</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">The tenant will receive the modules associated with this plan.</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onApprove} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
            {isPending ? "Approving..." : "Confirm Approval"}
          </Button>
        </div>
      </div>
    </div>
  );
}
