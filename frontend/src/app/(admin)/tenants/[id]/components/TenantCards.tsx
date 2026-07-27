"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, Mail, Phone, MapPin, FileText, Landmark } from "lucide-react";

interface Props {
  tenant: any;
  activeSubscription: any;
}

export function TenantInfoCard({ tenant }: { tenant: any }) {
  return (
    <Card className="border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
          <Building2 className="w-5 h-5 mr-2 text-indigo-500" /> Business Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 shrink-0">
            <span className="font-semibold text-sm">{tenant.owner_name?.charAt(0)}</span>
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
  );
}

export function TenantStatusCard({ tenant, activeSubscription }: Props) {
  const status: string = tenant.status ?? "";
  const statusColor = ({
    ACTIVE: "bg-green-500", PENDING: "bg-amber-500", SUSPENDED: "bg-orange-500", REJECTED: "bg-red-500",
  } as Record<string, string>)[status] ?? "bg-gray-400";

  const statusText = ({
    ACTIVE: "text-green-600 dark:text-green-400",
    PENDING: "text-amber-600 dark:text-amber-400",
  } as Record<string, string>)[status] ?? "text-red-600 dark:text-red-400";

  const subText = activeSubscription?.status === "TRIAL"
    ? "text-blue-600 dark:text-blue-400"
    : activeSubscription?.status === "ACTIVE"
    ? "text-green-600 dark:text-green-400"
    : "text-gray-500";

  return (
    <Card className="border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden relative">
      <div className={`absolute top-0 inset-x-0 h-1 ${statusColor}`} />
      <CardHeader><CardTitle className="text-lg text-gray-900 dark:text-white">System Status</CardTitle></CardHeader>
      <CardContent>
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500">Account</span>
          <span className={`text-sm font-bold ${statusText}`}>{tenant.status}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500">Subscription</span>
          <span className={`text-sm font-bold ${subText}`}>{activeSubscription?.status || "NONE"}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-500">Active Users</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{tenant.users?.length || 0}</span>
        </div>
      </CardContent>
    </Card>
  );
}
