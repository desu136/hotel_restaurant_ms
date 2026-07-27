"use client";

import React from "react";
import { Check, Edit2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  plan: any;
  index: number;
  onEdit: (plan: any) => void;
}

export default function PlanCard({ plan, index, onEdit }: Props) {
  const isFeatured = index === 1;

  return (
    <Card className={`flex flex-col relative overflow-hidden transition-all hover:shadow-md ${isFeatured ? "border-indigo-500 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]" : ""}`}>
      {isFeatured && <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />}
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <button onClick={() => onEdit(plan)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-md transition-colors">
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
        <Button variant={isFeatured ? "primary" : "outline"} className="w-full" onClick={() => onEdit(plan)}>
          Edit Plan
        </Button>
      </CardFooter>
    </Card>
  );
}
