"use client"

import * as React from "react"
import { RefreshCw, ChevronDown, XCircle } from "lucide-react"
import { ReportData, SalesMetricsCards, PopularItemsTable } from "./components/ReportPanels"
import { DailyRevenueTrendChart, PeakHoursChart, CustomerStatsTable, BranchPerformanceTable } from "./components/ReportCharts"

export default function ReportsPage() {
  const [data, setData] = React.useState<ReportData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [range, setRange] = React.useState("7")

  const fetchReport = React.useCallback(async (r: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/reports/summary?range=${r}`)
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load")
      setData(await res.json())
    } catch (e: any) {
      setError(e.message ?? "Network error")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchReport(range) }, [range, fetchReport])

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
      <XCircle className="w-10 h-10 text-red-500/50" />
      <p className="text-[var(--muted)] text-sm">{error}</p>
      <button onClick={() => fetchReport(range)} className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg text-sm font-semibold">Retry</button>
    </div>
  )

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Reports & Analytics</h1>
          <p className="text-[var(--muted)] text-sm mt-1">Performance overview {data ? `· Last ${data.range} days` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={range} onChange={e => setRange(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-sm font-semibold focus:outline-none cursor-pointer">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
          </div>
          <button onClick={() => fetchReport(range)} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-sm font-semibold hover:bg-[var(--surface-hover)] disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] animate-pulse" />)}
        </div>
      ) : data && (
        <>
          <SalesMetricsCards data={data} />
          <DailyRevenueTrendChart data={data} />
          <PopularItemsTable data={data} />
          <PeakHoursChart data={data} />
          <CustomerStatsTable data={data} />
          <BranchPerformanceTable data={data} />
        </>
      )}
    </div>
  )
}
