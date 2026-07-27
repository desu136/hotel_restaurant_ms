"use client"
import { createPortal } from "react-dom"
import { QrCode, Camera } from "lucide-react"
import { QRScanner } from "./QRScanner"
import type { Table } from "./types"

interface Props {
  show: boolean
  scannerError: string | null
  myTables: Table[]
  onScan: (data: string) => void
  onError: (err: string) => void
  onClose: () => void
  onSimulate: (table: Table) => void
}

export function QRScannerModal({ show, scannerError, myTables, onScan, onError, onClose, onSimulate }: Props) {
  if (!show || typeof window === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[99999] backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md border-t sm:border border-[var(--surface-border)] rounded-t-[2.5rem] sm:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[85vh] sm:h-[500px]">
        <div className="p-5 border-b border-[var(--surface-border)] flex justify-between items-center shrink-0">
          <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
            <QrCode className="w-4 h-4" /> Scan Table QR Code
          </h3>
          <button onClick={onClose} className="hover:text-[var(--foreground)] text-sm px-2 py-1 hover:bg-[var(--surface-hover)] rounded-lg transition-colors cursor-pointer">Cancel</button>
        </div>

        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {scannerError ? (
            <div className="p-6 text-center space-y-3 z-20">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs text-[var(--foreground)] font-bold">Camera Access Failed</p>
              <p className="text-[11px] leading-relaxed max-w-[280px] mx-auto">{scannerError}</p>
              <p className="text-[10px] text-amber-500/90 font-medium">Please use HTTPS or allow camera permission. You can still test with simulated actions below.</p>
            </div>
          ) : (
            <>
              <QRScanner onScan={onScan} onError={onError} />
              <div className="absolute bottom-4 left-0 right-0 text-center z-20 pointer-events-none">
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5">
                  Point camera at table QR code
                </span>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-[var(--surface-border)] space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider block">Simulate Scanning Assigned Table QR Code</span>
          {myTables.length === 0 ? (
            <p className="text-[11px] text-center py-2">No assigned tables available to scan. Assign tables first in layouts.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
              {myTables.map(table => (
                <button key={table.id} onClick={() => onSimulate(table)}
                  className="hover:bg-[var(--surface-hover)] text-[var(--foreground)] hover:text-amber-500 text-xs font-black py-2.5 px-3 rounded-xl border border-[var(--surface-border)] hover:border-amber-500/30 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer">
                  <QrCode className="w-3.5 h-3.5" /> Table T{table.table_number}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
