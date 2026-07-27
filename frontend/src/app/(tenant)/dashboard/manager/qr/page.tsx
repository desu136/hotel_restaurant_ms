"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, QrCode, AlertCircle } from "lucide-react"
import { QRCodesGrid } from "./components/QRCodesGrid"

interface Restaurant { id: string; name: string }
interface TableItem { id: string; table_number: string; capacity: number; branch_id: string; branch?: { id: string; name: string } }
interface QRItem { id: string; table_id: string; token: string; status: string; created_at: string; qrCodeUrl?: string; codeString?: string; table?: TableItem }

function QRPageContent() {
  const searchParams = useSearchParams()
  const preselectedRestaurant = searchParams.get("restaurant_id") || ""
  const preselectedTable = searchParams.get("table_id") || ""

  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = React.useState(preselectedRestaurant)
  const [tables, setTables] = React.useState<TableItem[]>([])
  const [qrCodes, setQrCodes] = React.useState<QRItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [selectedTableId, setSelectedTableId] = React.useState(preselectedTable)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  const fetchAll = React.useCallback(async (restaurantId: string) => {
    if (!restaurantId) return
    const [tablesRes, qrRes] = await Promise.all([
      fetch(`/api/restaurant/tables?restaurant_id=${restaurantId}`),
      fetch(`/api/qr/list/${restaurantId}`)
    ])
    setTables(tablesRes.ok ? await tablesRes.json() : [])
    const qrData = qrRes.ok ? await qrRes.json() : { data: [] }
    setQrCodes(qrData.data || [])
  }, [])

  React.useEffect(() => {
    const init = async () => {
      setLoading(true)
      const res = await fetch("/api/restaurant/list")
      const data = res.ok ? await res.json() : []
      setRestaurants(data)
      const rid = preselectedRestaurant || data[0]?.id || ""
      setSelectedRestaurantId(rid)
      if (rid) await fetchAll(rid)
      setLoading(false)
    }
    init()
  }, [fetchAll, preselectedRestaurant])

  const handleRestaurantChange = async (id: string) => {
    setSelectedRestaurantId(id)
    setSelectedTableId("")
    setQrCodes([])
    setTables([])
    if (id) await fetchAll(id)
  }

  const handleGenerate = async () => {
    if (!selectedTableId) { setError("Please select a table to generate a QR code for"); return }
    setGenerating(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/qr/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table_id: selectedTableId }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to generate QR code"); return }
      setSuccess("QR code generated successfully!")
      await fetchAll(selectedRestaurantId)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this QR code? Customers with this QR link won't be able to access the menu.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/qr/${id}`, { method: "DELETE" })
      if (res.ok) { setQrCodes(prev => prev.filter(q => q.id !== id)); setSuccess("QR code deleted.") }
    } finally { setDeletingId(null) }
  }

  const downloadQR = (qr: QRItem) => {
    if (!qr.qrCodeUrl) return
    const link = document.createElement("a")
    link.href = qr.qrCodeUrl
    link.download = `qr-table-${qr.table?.table_number || qr.table_id}.png`
    link.click()
  }

  const tablesWithoutQR = tables.filter(t => !qrCodes.some(q => q.table_id === t.id))

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" /></div>

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">QR Code Generator</h1>
        <p className="text-[var(--muted)]">Generate unique QR codes for each table. Customers scan to browse your menu and place orders.</p>
      </div>

      {restaurants.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-[var(--muted)]">Restaurant:</label>
          <select value={selectedRestaurantId} onChange={e => handleRestaurantChange(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none">
            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      )}

      <div className="rounded-2xl bg-[var(--foreground)] p-6 text-[var(--background)] shadow-lg">
        <h2 className="text-xl font-bold mb-1">Generate New QR Code</h2>
        <p className="text-[var(--background)]/70 text-sm mb-5">Select a table and generate a unique QR code linking to your digital menu.</p>

        {tables.length === 0 ? (
          <p className="text-white/80 text-sm bg-white/10 rounded-xl px-4 py-3">⚠️ No tables registered yet. <a href="/dashboard/manager/tables" className="underline font-semibold">Register tables first →</a></p>
        ) : tablesWithoutQR.length === 0 ? (
          <p className="text-[var(--background)] text-sm bg-[var(--foreground)] rounded-xl px-4 py-3">✅ All tables already have QR codes. Delete an existing one to regenerate.</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-[var(--background)] text-xs font-semibold mb-1.5 uppercase tracking-wider">Select Table</label>
              <select value={selectedTableId} onChange={e => setSelectedTableId(e.target.value)}
                className="w-full bg-[var(--surface-hover)] border border-white/30 text-[var(--foreground)] rounded-xl px-4 py-2.5 outline-none">
                <option value="">— Choose a table —</option>
                {tablesWithoutQR.map(t => <option key={t.id} value={t.id}>Table {t.table_number} ({t.capacity} seats)</option>)}
              </select>
            </div>
            <button onClick={handleGenerate} disabled={generating || !selectedTableId}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--background)] text-[var(--foreground)] font-extrabold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60 disabled:scale-100 shrink-0">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate QR"}
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-sm bg-red-500/20 text-white border border-red-400/30 rounded-lg px-3 py-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</p>}
        {success && <p className="mt-3 text-sm bg-green-500/20 text-white border border-green-400/30 rounded-lg px-3 py-2">✅ {success}</p>}
      </div>

      <QRCodesGrid qrCodes={qrCodes} deletingId={deletingId} onDelete={handleDelete} onDownload={downloadQR} onRefresh={() => fetchAll(selectedRestaurantId)} />
    </div>
  )
}

export default function QRPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" /></div>}>
      <QRPageContent />
    </React.Suspense>
  )
}
