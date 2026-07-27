"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function RegistrationSuccess() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full"
      >
        <Card className="text-center p-8">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl mb-2">Registration Complete!</CardTitle>
          <CardDescription className="text-base mb-6">
            Your business has been successfully registered. You are currently in a pending state
            until a Super Admin approves your account.
          </CardDescription>
          <Button className="w-full" onClick={() => (window.location.href = "/")}>
            Return Home
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
