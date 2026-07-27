"use client";

interface Props {
  step: number;
  totalSteps?: number;
}

export default function StepIndicator({ step, totalSteps = 3 }: Props) {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 text-[var(--background)] rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= i ? "bg-[var(--foreground)]" : "bg-[var(--surface-hover)] text-[var(--muted)]"
              }`}
            >
              {i}
            </div>
            {i < totalSteps && (
              <div
                className={`w-12 h-1 transition-colors ${
                  step > i ? "bg-[var(--color-primary-600)]" : "bg-[var(--surface-hover)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
