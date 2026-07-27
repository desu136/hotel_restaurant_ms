"use client"

import * as React from "react"
import { CheckCircle2, Printer, X } from "lucide-react"

interface CashierBillModalProps {
  show: boolean
  lastPaidBill: any
  onClose: () => void
  onPrint: () => void
}

export function CashierBillModal({ show, lastPaidBill, onClose, onPrint }: CashierBillModalProps) {
  if (!show || !lastPaidBill) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-[var(--muted)] hover:opacity-80">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <h3 className="text-xl font-black">Payment Processed!</h3>
          <p className="text-xs text-[var(--muted)]">Order {lastPaidBill.orderNumber} settled successfully</p>
        </div>

        <div className="border-t border-b border-[var(--surface-border)] py-3 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-[var(--muted)]">
            <span>Table:</span> <span className="font-bold text-[var(--foreground)]">{lastPaidBill.tableNumber}</span>
          </div>
          <div className="flex justify-between text-[var(--muted)]">
            <span>Payment Method:</span> <span className="font-bold uppercase text-[var(--foreground)]">{lastPaidBill.method}</span>
          </div>
          <div className="flex justify-between text-[var(--muted)] font-bold text-sm pt-1 border-t border-dashed">
            <span>Total Paid:</span> <span className="text-[var(--color-primary-600)]">${lastPaidBill.total?.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onPrint} className="flex-1 py-2.5 bg-[var(--surface-hover)] border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-opacity-80">
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-[var(--color-primary-600)] text-white rounded-xl text-xs font-bold hover:bg-[var(--color-primary-500)]">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
