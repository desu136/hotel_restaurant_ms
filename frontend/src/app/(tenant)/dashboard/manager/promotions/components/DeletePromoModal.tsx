"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Loader2 } from "lucide-react"
import { Promotion } from "./PromotionCard"

interface DeletePromoModalProps {
  target: Promotion | null
  deleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeletePromoModal({
  target,
  deleting,
  onClose,
  onConfirm,
}: DeletePromoModalProps) {
  return (
    <AnimatePresence>
      {target && (
        <>
          <motion.div
            key="del-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="del-dialog"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl border border-[var(--surface-border)] shadow-2xl p-6 flex flex-col gap-4"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-bold">Delete Promotion?</p>
                <p className="text-sm text-[var(--muted)] mt-1">
                  &ldquo;<span className="font-semibold text-[var(--foreground)]">{target.title}</span>&rdquo; will be permanently removed.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[var(--surface-border)] text-sm font-semibold hover:bg-[var(--surface-hover)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
