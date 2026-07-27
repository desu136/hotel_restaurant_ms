"use client"
import { createPortal } from "react-dom"
import { QrCode } from "lucide-react"

interface Order { id: string; order_number?: string | null }

interface Props {
  activeQrOrder: Order | null
  onClose: () => void
  onScanQR: () => void
  onConfirmManual: (orderId: string) => void
}

export function DeliveryVerificationModal({ activeQrOrder, onClose, onScanQR, onConfirmManual }: Props) {
  if (!activeQrOrder || typeof window === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--surface-border)] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
        <div className="p-5 border-b border-[var(--surface-border)] flex justify-between items-center bg-[var(--surface-hover)]/40 shrink-0">
          <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
            <QrCode className="w-4 h-4 text-amber-500" /> Confirm Delivery
          </h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm px-2.5 py-1 hover:bg-[var(--surface-hover)] rounded-lg transition-colors cursor-pointer">Close</button>
        </div>

        <div className="p-6 flex flex-col items-center justify-center bg-[var(--surface)] gap-5 text-center">
          <div className="space-y-1">
            <p className="text-xs text-[var(--muted)] font-bold uppercase tracking-wider">Order Verification</p>
            <p className="text-lg font-black text-[var(--foreground)]">
              Order #{activeQrOrder.order_number || activeQrOrder.id.slice(-6).toUpperCase()}
            </p>
          </div>

          <div className="w-full border border-[var(--surface-border)] rounded-2xl p-4 bg-[var(--surface-hover)]/20 space-y-3">
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">Method 1: Scan the customer's QR code on their device.</p>
            <button onClick={() => { onClose(); onScanQR() }} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md">
              <QrCode className="w-4 h-4" /> Scan Customer QR
            </button>
          </div>

          <div className="w-full border border-[var(--surface-border)] rounded-2xl p-4 bg-[var(--surface-hover)]/20 space-y-3">
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">Method 2: Confirm by manually viewing and matching the order code.</p>
            <button onClick={() => onConfirmManual(activeQrOrder.id)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md">
              Confirm Delivery by Code
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
