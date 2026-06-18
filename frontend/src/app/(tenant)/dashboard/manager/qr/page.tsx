"use client"
import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
  Loader2, QrCode, Trash2, Download, Plus, AlertCircle, Table2, RefreshCw
} from "lucide-react"

interface Restaurant { id: string; name: string }
interface TableItem { id: string; table_number: string; capacity: number; restaurant_id: string }
interface QRItem {
  id: string
  table_id: string
  token: string
  status: string
  created_at: string
  qrCodeUrl?: string
  codeString?: string
  table?: TableItem
}

export default function QRPage() {
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
    try {
      const [tablesRes, qrRes] = await Promise.all([
        fetch(`/api/restaurant/tables?restaurant_id=${restaurantId}`),
        fetch(`/api/qr/list/${restaurantId}`)
      ])
      const tablesData = tablesRes.ok ? await tablesRes.json() : []
      const qrData = qrRes.ok ? await qrRes.json() : { data: [] }
      setTables(tablesData.filter((t: TableItem) => t.restaurant_id === restaurantId))
      setQrCodes(qrData.data || [])
    } catch (e) {
      console.error(e)
    }
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
      const res = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: selectedTableId })
      })
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
      if (res.ok) {
        setQrCodes(prev => prev.filter(q => q.id !== id))
        setSuccess("QR code deleted.")
      }
    } catch { /* ignore */ } finally {
      setDeletingId(null)
    }
  }

  const downloadQR = (qr: QRItem) => {
    if (!qr.qrCodeUrl) return
    const link = document.createElement("a")
    link.href = qr.qrCodeUrl
    link.download = `qr-table-${qr.table?.table_number || qr.table_id}.png`
    link.click()
  }

  const tablesWithoutQR = tables.filter(t => !qrCodes.some(q => q.table_id === t.id))

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
    </div>
  )

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">QR Code Generator 📲</h1>
        <p className="text-[var(--muted)]">Generate unique QR codes for each table. Customers scan to browse your menu and place orders.</p>
      </div>

      {/* Restaurant selector */}
      {restaurants.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-[var(--muted)]">Restaurant:</label>
          <select
            value={selectedRestaurantId}
            onChange={e => handleRestaurantChange(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          >
            {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      )}

      {/* Generator Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[var(--color-primary-600)] to-purple-600 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-1">Generate New QR Code</h2>
        <p className="text-white/70 text-sm mb-5">Select a table and generate a unique QR code linking to your digital menu.</p>

        {tablesWithoutQR.length === 0 && tables.length > 0 ? (
          <p className="text-white/80 text-sm bg-white/10 rounded-xl px-4 py-3">
            ✅ All registered tables already have QR codes. Delete an existing one to regenerate.
          </p>
        ) : tables.length === 0 ? (
          <p className="text-white/80 text-sm bg-white/10 rounded-xl px-4 py-3">
            ⚠️ No tables registered yet.{" "}
            <a href="/dashboard/manager/tables" className="underline font-semibold">Register tables first →</a>
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-white/80 text-xs font-semibold mb-1.5 uppercase tracking-wider">Select Table</label>
              <select
                value={selectedTableId}
                onChange={e => setSelectedTableId(e.target.value)}
                className="w-full bg-white/20 border border-white/30 text-white placeholder-white/60 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="" className="text-gray-900">— Choose a table —</option>
                {tablesWithoutQR.map(t => (
                  <option key={t.id} value={t.id} className="text-gray-900">Table {t.table_number} ({t.capacity} seats)</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedTableId}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-[var(--color-primary-600)] font-extrabold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60 disabled:scale-100 shrink-0"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate QR"}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm bg-red-500/20 text-white border border-red-400/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}
        {success && (
          <p className="mt-3 text-sm bg-green-500/20 text-white border border-green-400/30 rounded-lg px-3 py-2">
            ✅ {success}
          </p>
        )}
      </div>

      {/* QR Codes Grid */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Generated QR Codes ({qrCodes.length})</h2>
        <button onClick={() => fetchAll(selectedRestaurantId)} className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
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
              {/* QR Image */}
              <div className="relative w-48 h-48 bg-white rounded-xl flex items-center justify-center p-2 border border-gray-100 shadow-inner">
                {qr.qrCodeUrl ? (
                  <img src={qr.qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-16 h-16 text-gray-300" />
                )}
                <span className="absolute -top-2 -right-2 bg-[var(--color-primary-600)] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                  Table {qr.table?.table_number || "?"}
                </span>
              </div>

              {/* Info */}
              <div className="w-full text-center space-y-1">
                <p className="font-bold text-sm flex items-center justify-center gap-1.5">
                  <Table2 className="w-4 h-4 text-[var(--color-primary-600)]" />
                  Table {qr.table?.table_number}
                  {qr.table?.capacity && <span className="text-[var(--muted)] font-normal">({qr.table.capacity} seats)</span>}
                </p>
                {qr.codeString && (
                  <p className="text-[10px] font-mono text-[var(--muted)] truncate px-2">{qr.codeString.slice(0, 50)}…</p>
                )}
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${qr.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500'}`}>
                  {qr.status}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => downloadQR(qr)}
                  disabled={!qr.qrCodeUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--color-primary-600)] text-white text-xs font-bold rounded-lg hover:bg-[var(--color-primary-500)] transition-colors disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" /> Download PNG
                </button>
                <button
                  onClick={() => handleDelete(qr.id)}
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
