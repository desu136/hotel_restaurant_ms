"use client";

import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTenant, useApproveTenant, useUpdateTenantStatus, useSubscriptionPlans } from "@/features/admin/tenants/hooks/useTenants";
import { TenantInfoCard, TenantStatusCard } from "./components/TenantCards";
import { SubscriptionCard, GrantedModulesCard } from "./components/TenantDetailCards";
import ApproveModal from "./components/ApproveModal";

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = use(params);
  const { data: tenant, isLoading } = useTenant(tenantId);
  const { data: plansRes } = useSubscriptionPlans();
  const approveTenant = useApproveTenant();
  const updateStatus = useUpdateTenantStatus();

  const plans = plansRes?.data ?? [];
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [approvalResult, setApprovalResult] = useState<{ email?: string; password?: string } | null>(null);
  const [approveError, setApproveError] = useState("");

  if (plans.length > 0 && !selectedPlanId) {
    const trial = plans.find((p: any) => p.name === "Trial Plan");
    setSelectedPlanId(trial ? trial.id : plans[0].id);
  }

  const handleUpdateStatus = async (status: string) => {
    try { await updateStatus.mutateAsync({ id: tenantId, status }); }
    catch (err: any) { alert(err.message || "Failed to update status."); }
  };

  const handleApprove = async () => {
    setApproveError("");
    try {
      const res = await approveTenant.mutateAsync({ id: tenantId, plan_id: selectedPlanId || undefined });
      setApprovalResult((res as any).credentials || { email: tenant?.email });
      setIsApproveModalOpen(false);
    } catch (err: any) {
      setApproveError(err.message || "Internal Server Error");
    }
  };

  if (isLoading) return (
    <div className="flex justify-center p-12">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!tenant) return <div className="p-8 text-center text-gray-500">Tenant not found</div>;

  const activeSubscription = tenant.subscriptions?.find((s: any) => s.status === "ACTIVE" || s.status === "TRIAL");

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/tenants" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{tenant.business_name}</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="capitalize">{tenant.business_type?.toLowerCase().replace("_", " & ")}</span>
              <span className="mx-2">•</span>
              <span>Registered on {new Date(tenant.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {tenant.status === "PENDING" && (<>
            <Button onClick={() => handleUpdateStatus("REJECTED")} variant="danger" className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border-0">Reject</Button>
            <Button onClick={() => setIsApproveModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white shadow-sm border-0">
              <ShieldCheck className="w-4 h-4 mr-2" /> Approve Tenant
            </Button>
          </>)}
          {tenant.status === "ACTIVE" && (
            <Button onClick={() => handleUpdateStatus("SUSPENDED")} variant="outline" className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">Suspend Account</Button>
          )}
          {tenant.status === "SUSPENDED" && (
            <Button onClick={() => handleUpdateStatus("ACTIVE")} className="bg-indigo-600 hover:bg-indigo-700 text-white">Reactivate Account</Button>
          )}
        </div>
      </div>

      {/* Approval success banner */}
      {approvalResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-6 mb-6 relative">
          <button onClick={() => setApprovalResult(null)} className="absolute top-4 right-4 text-green-500 hover:text-green-700">✕</button>
          <h3 className="text-lg font-bold mb-2 flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" /> Tenant Approved Successfully!</h3>
          <p className="mb-4 text-sm">Please securely provide these credentials to the tenant.</p>
          <div className="bg-white rounded border border-green-200 p-4 font-mono text-sm space-y-1">
            <div><strong>Email:</strong> {approvalResult.email}</div>
            {approvalResult.password && <div><strong>Temp Password:</strong> {approvalResult.password}</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <TenantInfoCard tenant={tenant} />
          <TenantStatusCard tenant={tenant} activeSubscription={activeSubscription} />
        </div>
        <div className="md:col-span-2 space-y-6">
          <SubscriptionCard tenant={tenant} activeSubscription={activeSubscription} />
          <GrantedModulesCard modules={tenant.modules ?? []} />
        </div>
      </div>

      {isApproveModalOpen && (
        <ApproveModal
          tenant={tenant} plans={plans}
          selectedPlanId={selectedPlanId} onPlanChange={setSelectedPlanId}
          onApprove={handleApprove} onClose={() => setIsApproveModalOpen(false)}
          isPending={approveTenant.isPending} error={approveError}
        />
      )}
    </div>
  );
}
