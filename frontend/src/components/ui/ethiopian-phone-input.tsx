"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ETHIOPIAN_PHONE_ERROR,
  ETHIOPIAN_PHONE_HINT,
  isValidEthiopianPhone,
} from "@/lib/ethiopian-phone";

interface EthiopianPhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showHint?: boolean;
}

export const EthiopianPhoneInput = React.forwardRef<HTMLInputElement, EthiopianPhoneInputProps>(
  ({ value, onChange, required, showHint = true, className, onBlur, ...props }, ref) => {
    const [touched, setTouched] = React.useState(false);
    const empty = !value.trim();
    const valid = empty ? !required : isValidEthiopianPhone(value);
    const showError = touched && !valid;

    return (
      <div className="space-y-1">
        <Input
          {...props}
          ref={ref}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required={required}
          placeholder="0912345678"
          value={value}
          error={showError}
          className={cn(className)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            setTouched(true);
            onBlur?.(e);
          }}
        />
        {showError ? (
          <p className="text-xs text-red-500">{ETHIOPIAN_PHONE_ERROR}</p>
        ) : showHint ? (
          <p className="text-xs text-[var(--muted)]">{ETHIOPIAN_PHONE_HINT}</p>
        ) : null}
      </div>
    );
  }
);
EthiopianPhoneInput.displayName = "EthiopianPhoneInput";
