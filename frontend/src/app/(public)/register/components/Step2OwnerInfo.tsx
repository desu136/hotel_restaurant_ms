"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { RegisterFormData, SlideVariants } from "./types";

interface Props {
  formData: RegisterFormData;
  onChange: (data: RegisterFormData) => void;
  onPrev: () => void;
  variants: SlideVariants;
}

export default function Step2OwnerInfo({ formData, onChange, onPrev, variants }: Props) {
  const isValid = !!formData.ownerName && !!formData.email && !!formData.phone;

  return (
    <motion.div
      key="step2"
      custom={1}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <CardHeader>
        <CardTitle>Owner Information</CardTitle>
        <CardDescription>We need this to create your administrative account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <Input
            required
            placeholder="John Doe"
            value={formData.ownerName}
            onChange={(e) => onChange({ ...formData, ownerName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <Input
            type="email"
            required
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => onChange({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone Number</label>
          <Input
            required
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={(e) => onChange({ ...formData, phone: e.target.value })}
          />
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost" type="button" onClick={onPrev}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        <Button type="submit" disabled={!isValid}>
          Next <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </motion.div>
  );
}
