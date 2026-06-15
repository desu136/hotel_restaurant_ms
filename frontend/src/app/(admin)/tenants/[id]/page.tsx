"use client";

import { useState, use } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, Calendar, ArrowLeft, CheckCircle2, AlertCircle, PlayCircle, ShieldCheck, MapPin, FileText, Landmark } from "lucide-react";
import Link from "next/link";
import { useTenant, useApproveTenant, useUpdateTenantStatus, useSubscriptionPlans } from "@/features/admin/tenants/hooks/useTenants";

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

  // Set default plan once plans load
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

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) return <div className="p-8 text-center text-gray-500">Tenant not found</div>;

  const activeSubscription = tenant.subscriptions?.find((s) => s.status === "ACTIVE" || s.status === "TRIAL");

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
              <span className="capitalize">{tenant.business_type.toLowerCase().replace("_", " & ")}</span>
              <span className="mx-2">•</span>
              <span>Registered on {new Date(tenant.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {tenant.status === "PENDING" && (
            <>
              <Button onClick={() => handleUpdateStatus("REJECTED")} variant="danger" className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border-0">Reject</Button>
              <Button onClick={() => setIsApproveModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white shadow-sm border-0">
                <ShieldCheck className="w-4 h-4 mr-2" /> Approve Tenant
              </Button>
            </>
          )}
          {tenant.status === "ACTIVE" && (
            <Button onClick={() => handleUpdateStatus("SUSPENDED")} variant="outline" className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
              Suspend Account
            </Button>
          )}
          {tenant.status === "SUSPENDED" && (
            <Button onClick={() => handleUpdateStatus("ACTIVE")} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Reactivate Account
            </Button>
          )}
        </div>
      </div>

      {/* Approval success banner */}
      {approvalResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-6 mb-6 relative">
          <button onClick={() => setApprovalResult(null)} className="absolute top-4 right-4 text-green-500 hover:text-green-700">✕</button>
          <h3 className="text-lg font-bold mb-2 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" /> Tenant Approved Successfully!
          </h3>
          <p className="mb-4 text-sm">Please securely provide these credentials to the tenant.</p>
          <div className="bg-white rounded border border-green-200 p-4 font-mono text-sm space-y-1">
            <div><strong>Email:</strong> {approvalResult.email}</div>
            {approvalResult.password && <div><strong>Temp Password:</strong> {approvalResult.password}</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <Card className="border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
                <Building2 className="w-5 h-5 mr-2 text-indigo-500" /> Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 shrink-0">
                  <span className="font-semibold text-sm">{tenant.owner_name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{tenant.owner_name}</p>
                  <p className="text-xs text-gray-500">Primary Owner</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300"><Mail className="w-4 h-4 mr-3 text-gray-400" />{tenant.email}</div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300"><Phone className="w-4 h-4 mr-3 text-gray-400" />{tenant.phone || "N/A"}</div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                <div className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                  <span className="flex-1">{tenant.address || "Address not provided"}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <FileText className="w-4 h-4 mr-3 text-gray-400" />License: {tenant.license_info || "N/A"}
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Landmark className="w-4 h-4 mr-3 text-gray-400" />Tax ID: {tenant.tax_info || "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden relative">
            <div className={`absolute top-0 inset-x-0 h-1 ${tenant.status === "ACTIVE" ? "bg-green-500" : tenant.status === "PENDING" ? "bg-amber-500" : tenant.status === "SUSPENDED" ? "bg-orange-500" : "bg-red-500"}`} />
            <CardHeader><CardTitle className="text-lg text-gray-900 dark:text-white">System Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">Account</span>
                <span className={`text-sm font-bold ${tenant.status === "ACTIVE" ? "text-green-600 dark:text-green-400" : tenant.status === "PENDING" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>{tenant.status}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">Subscription</span>
                <span className={`text-sm font-bold ${activeSubscription?.status === "TRIAL" ? "text-blue-600 dark:text-blue-400" : activeSubscription?.status === "ACTIVE" ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}>{activeSubscription?.status || "NONE"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Active Users</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{tenant.users?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right columns */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">Subscription Details</CardTitle>
                <CardDescription>Current plan and billing cycle.</CardDescription>
              </div>
              {tenant.status === "ACTIVE" && <Button variant="outline" size="sm">Change Plan</Button>}
            </CardHeader>
            <CardContent>
              {activeSubscription ? (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{activeSubscription.plan.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5" />Valid until {new Date(activeSubscription.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        ${parseFloat(activeSubscription.plan.monthly_price).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">/ month</div>
                    </div>
                  </div>
                  {activeSubscription.status === "TRIAL" && (
                    <div className="flex items-center p-4 bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30 text-blue-800 dark:text-blue-300 rounded-lg text-sm">
                      <PlayCircle className="w-5 h-5 mr-3 shrink-0" />
                      Tenant is currently in a free trial period. Wait for payment setup to activate fully.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 flex flex-col items-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <AlertCircle className="w-8 h-8 mb-3 opacity-50 text-gray-400" />
                  <p>No active subscription found.</p>
                  {tenant.status === "PENDING" && <p className="text-sm mt-1">Approve the tenant to assign a subscription.</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">Granted Modules</CardTitle>
              <CardDescription>Features available to this tenant based on their plan.</CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.modules && tenant.modules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tenant.modules.map((tm) => (
                    <div key={tm.module_id} className="flex items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mr-4 shrink-0 text-indigo-600 dark:text-indigo-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white">{tm.module.name}</h4>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{tm.module.code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4">No modules have been assigned yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Approve Tenant</h3>
              <button onClick={() => setIsApproveModalOpen(false)} className="text-gray-400 hover:text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {approveError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{approveError}</div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You are about to approve <strong>{tenant.business_name}</strong>. This will activate their workspace.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign Subscription Plan</label>
                <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  {plans.map((plan: any) => (
                    <option key={plan.id} value={plan.id}>{plan.name} (${parseFloat(plan.monthly_price)}/mo)</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">The tenant will receive the modules associated with this plan.</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancel</Button>
              <Button onClick={handleApprove} disabled={approveTenant.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                {approveTenant.isPending ? "Approving..." : "Confirm Approval"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
