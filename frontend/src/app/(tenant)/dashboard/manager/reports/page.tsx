"use client"
import * as React from "react"
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, CheckCircle2,
  XCircle, BarChart2, Clock, Star, RefreshCw, ChevronDown,
  Utensils, PieChart, Building2, ArrowUpRight, ArrowDownRight
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────
interface Summary {
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  paidOrders: number
  totalRevenue: number
  avgOrderValue: number
}
interface DailyPoint { date: string; revenue: number; orders: number }
interface TopItem { name: string; qty: number; revenue: number }
interface PeakHour { hour: number; count: number }
interface BranchBreakdown { branchId: string; name: string; revenue: number; orders: number }
interface ReportData {
  range: number
  since: string
  summary: Summary
  statusCounts: Record<string, number>
  typeCounts: Record<string, number>
  topItems: TopItem[]
  dailyTrend: DailyPoint[]
  peakHours: PeakHour[]
  branchBreakdown: BranchBreakdown[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
function fmtHour(h: number) {
  if (h === 0) return "12am"
  if (h < 12) return `${h}am`
  if (h === 12) return "12pm"
  return `${h - 12}pm`
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400",
  CONFIRMED: "bg-blue-500/15 text-blue-400",
  PREPARING: "bg-purple-500/15 text-purple-400",
  READY: "bg-emerald-500/15 text-emerald-400",
  COMPLETED: "bg-teal-500/15 text-teal-400",
  CANCELLED: "bg-red-500/15 text-red-400",
}
const TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Dine-In",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
  ROOM_SERVICE: "Room Service",
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, accent = false, trend
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  accent?: boolean
  trend?: "up" | "down" | null
}) {
  return (
    <div className={`relative rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden transition-all hover:shadow-lg group
      ${accent
        ? "border-[var(--color-primary-500)]/30 bg-gradient-to-br from-[var(--color-primary-600)]/10 to-transparent"
        : "border-[var(--surface-border)] bg-[var(--surface)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${accent ? "bg-[var(--color-primary-600)]/20 text-[var(--color-primary-400)]" : "bg-[var(--surface-hover)] text-[var(--muted)]"}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-bold
            ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
            {trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-black tracking-tight ${accent ? "text-[var(--color-primary-400)]" : "text-[var(--foreground)]"}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-[var(--muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function MiniBarChart({ data, max, color }: { data: number[]; max: number; color: string }) {
  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm transition-all ${color} opacity-80 hover:opacity-100`}
          style={{ height: max > 0 ? `${Math.max(4, (v / max) * 100)}%` : "4%" }}
          title={`${v}`}
        />
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
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

  // ── Derived data
  const maxDaily = data ? Math.max(...data.dailyTrend.map(d => d.revenue), 1) : 1
  const maxPeak = data ? Math.max(...data.peakHours.map(h => h.count), 1) : 1
  const totalStatusCount = data ? Object.values(data.statusCounts).reduce((a, b) => a + b, 0) : 1
  const totalTypeCount = data ? Object.values(data.typeCounts).reduce((a, b) => a + b, 0) : 1
  const maxTopItem = data ? Math.max(...data.topItems.map(i => i.qty), 1) : 1
  const peakHourObj = data ? data.peakHours.reduce((a, b) => a.count > b.count ? a : b, { hour: 0, count: 0 }) : null

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
      <XCircle className="w-10 h-10 text-red-500/50" />
      <p className="text-[var(--muted)] text-sm">{error}</p>
      <button onClick={() => fetchReport(range)}
        className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-500)] transition-colors">
        Retry
      </button>
    </div>
  )

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Reports & Analytics</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Performance overview {data ? `· Last ${data.range} days` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Range Selector */}
          <div className="relative">
            <select
              value={range}
              onChange={e => setRange(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
          </div>
          <button
            onClick={() => fetchReport(range)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-sm font-semibold hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        /* ── Skeleton ── */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] animate-pulse" />
          ))}
        </div>
      ) : data && (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${fmt(data.summary.totalRevenue)}`}
              sub={`${data.summary.paidOrders} paid orders`} accent />
            <StatCard icon={ShoppingBag} label="Total Orders" value={String(data.summary.totalOrders)}
              sub="All statuses" />
            <StatCard icon={CheckCircle2} label="Completed" value={String(data.summary.completedOrders)}
              sub={`${data.summary.totalOrders ? Math.round(data.summary.completedOrders / data.summary.totalOrders * 100) : 0}% of total`}
              trend="up" />
            <StatCard icon={XCircle} label="Cancelled" value={String(data.summary.cancelledOrders)}
              sub={`${data.summary.totalOrders ? Math.round(data.summary.cancelledOrders / data.summary.totalOrders * 100) : 0}% of total`}
              trend={data.summary.cancelledOrders > 0 ? "down" : null} />
            <StatCard icon={TrendingUp} label="Avg. Order Value" value={`$${fmt(data.summary.avgOrderValue)}`}
              sub="Per paid order" />
            <StatCard icon={Clock} label="Peak Hour" value={peakHourObj ? fmtHour(peakHourObj.hour) : "—"}
              sub={peakHourObj ? `${peakHourObj.count} orders` : ""} />
          </div>

          {/* ── Revenue Trend ── */}
          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[var(--color-primary-400)]" /> Daily Revenue Trend
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Revenue collected from paid bills per day</p>
              </div>
            </div>
            {data.dailyTrend.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-[var(--muted)] text-sm">No revenue data in this period.</div>
            ) : (
              <>
                {/* Bar chart */}
                <div className="flex items-end gap-1 h-40">
                  {data.dailyTrend.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full">
                        <div
                          className="w-full rounded-t-md bg-[var(--color-primary-600)]/60 hover:bg-[var(--color-primary-600)] transition-all"
                          style={{ height: `${Math.max(4, (d.revenue / maxDaily) * 140)}px` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                          <div className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg px-2.5 py-1.5 text-[10px] font-semibold whitespace-nowrap shadow-lg">
                            {fmtDate(d.date)}<br />
                            <span className="text-[var(--color-primary-400)]">${fmt(d.revenue)}</span>
                            <span className="text-[var(--muted)] ml-1">· {d.orders} orders</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] text-[var(--muted)] truncate max-w-full px-0.5">
                        {fmtDate(d.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Top Menu Items ── */}
            <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
              <h2 className="text-lg font-black flex items-center gap-2 mb-5">
                <Star className="w-5 h-5 text-amber-400" /> Top Menu Items
              </h2>
              {data.topItems.length === 0 ? (
                <div className="text-[var(--muted)] text-sm text-center py-8">No order data yet.</div>
              ) : (
                <div className="space-y-3">
                  {data.topItems.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="text-xs font-black text-[var(--muted)] w-5 text-right shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold truncate">{item.name}</span>
                          <span className="text-xs font-bold text-[var(--muted)] shrink-0 ml-2">
                            {item.qty}×
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                            style={{ width: `${(item.qty / maxTopItem) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[var(--color-primary-400)] shrink-0 text-right w-16">
                        ${fmt(item.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Order Status + Type ── */}
            <div className="space-y-6">
              {/* Status breakdown */}
              <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
                <h2 className="text-lg font-black flex items-center gap-2 mb-4">
                  <PieChart className="w-5 h-5 text-purple-400" /> Order Status Breakdown
                </h2>
                <div className="space-y-2">
                  {Object.entries(data.statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 w-24 text-center ${STATUS_COLORS[status] ?? "bg-[var(--surface-hover)] text-[var(--muted)]"}`}>
                        {status}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary-600)]/60"
                          style={{ width: `${(count / totalStatusCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--muted)] w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order type breakdown */}
              <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
                <h2 className="text-lg font-black flex items-center gap-2 mb-4">
                  <Utensils className="w-5 h-5 text-teal-400" /> Order Type Distribution
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(data.typeCounts).map(([type, count]) => (
                    <div key={type} className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--surface-border)]">
                      <span className="text-xs font-bold text-[var(--muted)]">{TYPE_LABELS[type] ?? type}</span>
                      <span className="text-xl font-black">{count}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {Math.round((count / totalTypeCount) * 100)}% of orders
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Peak Hours ── */}
          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
            <h2 className="text-lg font-black flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-rose-400" /> Order Volume by Hour
            </h2>
            <div className="flex items-end gap-1 h-24">
              {data.peakHours.map((h) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t-sm bg-rose-500/40 hover:bg-rose-500/80 transition-colors"
                      style={{ height: `${Math.max(3, (h.count / maxPeak) * 88)}px` }}
                    />
                    {h.count > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                        <div className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-md px-2 py-1 text-[9px] font-bold whitespace-nowrap shadow">
                          {fmtHour(h.hour)}: {h.count}
                        </div>
                      </div>
                    )}
                  </div>
                  {h.hour % 3 === 0 && (
                    <span className="text-[8px] text-[var(--muted)]">{fmtHour(h.hour)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Branch Breakdown (Owner only) ── */}
          {data.branchBreakdown.length > 0 && (
            <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
              <h2 className="text-lg font-black flex items-center gap-2 mb-5">
                <Building2 className="w-5 h-5 text-blue-400" /> Branch Performance
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--surface-border)]">
                      {["Branch", "Orders", "Revenue", "Avg. Order"].map(h => (
                        <th key={h} className="pb-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.branchBreakdown
                      .sort((a, b) => b.revenue - a.revenue)
                      .map((b, idx) => (
                        <tr key={b.branchId} className="border-b border-[var(--surface-border)]/50 hover:bg-[var(--surface-hover)]/40 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-[var(--muted)] w-5">{idx + 1}</span>
                              <span className="font-semibold">{b.name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 font-semibold">{b.orders}</td>
                          <td className="py-3 pr-4 font-black text-[var(--color-primary-400)]">
                            ${fmt(b.revenue)}
                          </td>
                          <td className="py-3 font-semibold text-[var(--muted)]">
                            ${b.orders ? fmt(b.revenue / b.orders) : "0.00"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
