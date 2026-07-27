"use client"

import * as React from "react"
import { Loader2, QrCode, Trash2, Download, Table2 } from "lucide-react"

interface TableItem { id: string; table_number: string; capacity: number; branch_id: string; branch?: { id: string; name: string } }
interface QRItem { id: string; table_id: string; token: string; status: string; created_at: string; qrCodeUrl?: string; codeString?: string; table?: TableItem }

interface QRCodesGridProps {
  qrCodes: QRItem[]
  deletingId: string | null
  onDelete: (id: string) => void
  onDownload: (qr: QRItem) => void
  onRefresh: () => void
}

export function QRCodesGrid({ qrCodes, deletingId, onDelete, onDownload, onRefresh }: QRCodesGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Generated QR Codes ({qrCodes.length})</h2>
        <button onClick={onRefresh} className="flex items-center gap-1.5 text-xs text-[var(--foreground)] hover:opacity-70 transition-opacity">
          ↻ Refresh
        </button>
      </div>

      {qrCodes.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed rounded-xl text-[var(--muted)]">
          <QrCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No QR codes generated yet</p>
          <p className="text-xs mt-1">Generate your first QR code above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {qrCodes.map(qr => (
            <div key={qr.id} className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 flex flex-col items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative w-48 h-48 bg-white rounded-xl flex items-center justify-center p-2 border border-gray-100 shadow-inner">
                {qr.qrCodeUrl
                  ? <img src={qr.qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                  : <QrCode className="w-16 h-16 text-gray-300" />
                }
                <span className="absolute -top-2 -right-2 bg-[var(--foreground)] text-[var(--background)] text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                  Table {qr.table?.table_number || "?"}
                </span>
              </div>

              <div className="w-full text-center space-y-1">
                <p className="font-bold text-sm flex items-center justify-center gap-1.5">
                  <Table2 className="w-4 h-4" />
                  Table {qr.table?.table_number}
                  {qr.table?.capacity && <span className="text-[var(--muted)] font-normal">({qr.table.capacity} seats)</span>}
                </p>
                {qr.codeString && (
                  <p className="text-[10px] font-mono text-[var(--muted)] truncate px-2">{qr.codeString.slice(0, 50)}…</p>
                )}
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[var(--foreground)] text-[var(--background)]">
                  {qr.status}
                </span>
              </div>

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => onDownload(qr)}
                  disabled={!qr.qrCodeUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--foreground)] text-[var(--background)] text-xs font-bold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" /> Download PNG
                </button>
                <button
                  onClick={() => onDelete(qr.id)}
                  disabled={deletingId === qr.id}
                  className="px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                >
                  {deletingId === qr.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
