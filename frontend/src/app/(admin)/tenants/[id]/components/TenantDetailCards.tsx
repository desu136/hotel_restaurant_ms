"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, PlayCircle, AlertCircle, CheckCircle2 } from "lucide-react";

interface SubscriptionCardProps {
  tenant: any;
  activeSubscription: any;
}

export function SubscriptionCard({ tenant, activeSubscription }: SubscriptionCardProps) {
  return (
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
  );
}

interface ModulesCardProps {
  modules: any[];
}

export function GrantedModulesCard({ modules }: ModulesCardProps) {
  return (
    <Card className="border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900 dark:text-white">Granted Modules</CardTitle>
        <CardDescription>Features available to this tenant based on their plan.</CardDescription>
      </CardHeader>
      <CardContent>
        {modules && modules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules.map((tm: any) => (
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
  );
}
