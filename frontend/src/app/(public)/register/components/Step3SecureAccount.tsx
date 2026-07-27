"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { RegisterFormData, SlideVariants } from "./types";

interface Props {
  formData: RegisterFormData;
  onChange: (data: RegisterFormData) => void;
  onPrev: () => void;
  isSubmitting: boolean;
  variants: SlideVariants;
}

const NEXT_STEPS = [
  "Your tenant workspace will be created.",
  "A 14-day free trial will be automatically initiated.",
  "You will wait for Super Admin approval before going live.",
];

export default function Step3SecureAccount({ formData, onChange, onPrev, isSubmitting, variants }: Props) {
  return (
    <motion.div
      key="step3"
      custom={1}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <CardHeader>
        <CardTitle>Secure Account</CardTitle>
        <CardDescription>Set a password for your admin account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <PasswordInput
            required
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => onChange({ ...formData, password: e.target.value })}
          />
        </div>

        <div className="mt-6 p-4 bg-[var(--surface-hover)] rounded-lg text-sm">
          <h4 className="font-semibold text-blue-500 mb-2">What happens next?</h4>
          <ul className="space-y-2">
            {NEXT_STEPS.map((step) => (
              <li key={step} className="flex items-start">
                <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost" type="button" onClick={onPrev} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <Button
          type="submit"
          disabled={!formData.password || isSubmitting}
          isLoading={isSubmitting}
        >
          Complete Registration
        </Button>
      </CardFooter>
    </motion.div>
  );
}
