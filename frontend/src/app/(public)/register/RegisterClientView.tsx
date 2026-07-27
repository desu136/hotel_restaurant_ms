"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Utensils } from "lucide-react";
import type { RegisterFormData, SlideVariants } from "./components/types";
import StepIndicator from "./components/StepIndicator";
import Step1BusinessDetails from "./components/Step1BusinessDetails";
import Step2OwnerInfo from "./components/Step2OwnerInfo";
import Step3SecureAccount from "./components/Step3SecureAccount";
import RegistrationSuccess from "./components/RegistrationSuccess";

const INITIAL_FORM: RegisterFormData = {
  businessName: "", businessType: "RESTAURANT",
  ownerName: "", email: "", phone: "", password: "",
};

const variants: SlideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 }),
};

export default function RegisterClientView() {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState<RegisterFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tenant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) { setIsSuccess(true); }
      else { alert(data.error ?? "Registration failed. Please try again."); }
    } catch (error) {
      console.error(error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) return <RegistrationSuccess />;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl flex justify-center gap-4 font-bold tracking-tight mb-2">
            <Utensils className="w-8 h-8" /> RMS
          </h1>
          <h4 className="text-3xl font-bold tracking-tight mb-2">Create your account</h4>
          <p className="text-[var(--muted)]">Join RMS and manage your Food business efficiently.</p>
        </div>

        <StepIndicator step={step} />

        <Card className="overflow-hidden glass relative">
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            <AnimatePresence mode="wait" custom={1}>
              {step === 1 && (
                <Step1BusinessDetails
                  formData={formData} onChange={setFormData}
                  onNext={handleNext} variants={variants}
                />
              )}
              {step === 2 && (
                <Step2OwnerInfo
                  formData={formData} onChange={setFormData}
                  onPrev={handlePrev} variants={variants}
                />
              )}
              {step === 3 && (
                <Step3SecureAccount
                  formData={formData} onChange={setFormData}
                  onPrev={handlePrev} isSubmitting={isSubmitting} variants={variants}
                />
              )}
            </AnimatePresence>
          </form>
        </Card>
      </div>
    </div>
  );
}
