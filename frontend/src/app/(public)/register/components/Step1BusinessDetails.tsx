"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed, Coffee, Hamburger, ArrowRight } from "lucide-react";
import type { RegisterFormData, SlideVariants } from "./types";

interface Props {
  formData: RegisterFormData;
  onChange: (data: RegisterFormData) => void;
  onNext: () => void;
  variants: SlideVariants;
}

const BUSINESS_TYPES = [
  { value: "RESTAURANT",  label: "Restaurant",       icon: UtensilsCrossed },
  { value: "COFFEE_SHOP", label: "Coffee Shop",       icon: Coffee },
  { value: "FAST_FOOD",   label: "Fast Food Center",  icon: Hamburger },
];

const activeCls =
  "border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-900)] dark:bg-[var(--color-primary-900)]/20 dark:text-blue-400 ring-1 ring-[var(--color-primary-500)]";
const inactiveCls =
  "border-[var(--surface-border)] hover:bg-[var(--surface-hover)]";

export default function Step1BusinessDetails({ formData, onChange, onNext, variants }: Props) {
  return (
    <motion.div
      key="step1"
      custom={1}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <CardHeader className="flex items-center">
        <CardTitle>Business Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-30">
          <label className="text-sm font-medium">Business Name</label>
          <Input
            required
            placeholder="Grand Cafe & Grill"
            value={formData.businessName}
            onChange={(e) => onChange({ ...formData, businessName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Business Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BUSINESS_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...formData, businessType: value })}
                className={`p-4 border rounded-lg flex flex-col items-center justify-center space-y-2 transition-all ${
                  formData.businessType === value ? activeCls : inactiveCls
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="font-medium text-sm text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <p className="text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <a href="/login" className="text-[var(--color-primary-600)] font-medium hover:underline">
            Login now
          </a>
        </p>
        <Button type="submit" disabled={!formData.businessName}>
          Next <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </motion.div>
  );
}
