"use client"

import * as React from "react"
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, CheckCircle2, XCircle, TrendingUp, Clock, Star, BarChart2, PieChart, Utensils, Users2, Building2 } from "lucide-react"

interface Summary { totalOrders: number; completedOrders: number; cancelledOrders: number; paidOrders: number; totalRevenue: number; avgOrderValue: number }
interface DailyPoint { date: string; revenue: number; orders: number }
interface TopItem { name: string; qty: number; revenue: number }
interface PeakHour { hour: number; count: number }
interface BranchBreakdown { branchId: string; name: string; revenue: number; orders: number }
interface CustomerStat { id: string; name: string; email: string | null; phone: string | null; ordersCount: number; totalSpent: number }
export interface ReportData {
  range: number; since: string; summary: Summary; statusCounts: Record<string, number>
  typeCounts: Record<string, number>; topItems: TopItem[]; dailyTrend: DailyPoint[]
  peakHours: PeakHour[]; customerStats?: CustomerStat[]; branchBreakdown: BranchBreakdown[]
}

export function fmt(n: number) { return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) }
export function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }
export function fmtHour(h: number) { if (h === 0) return "12am"; if (h < 12) return `${h}am`; if (h === 12) return "12pm"; return `${h - 12}pm` }

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400", CONFIRMED: "bg-blue-500/15 text-blue-400",
  PREPARING: "bg-purple-500/15 text-purple-400", READY: "bg-emerald-500/15 text-emerald-400",
  COMPLETED: "bg-teal-500/15 text-teal-400", CANCELLED: "bg-red-500/15 text-red-400",
}
const TYPE_LABELS: Record<string, string> = { DINE_IN: "Dine-In", TAKEAWAY: "Takeaway", DELIVERY: "Delivery", ROOM_SERVICE: "Room Service" }

function StatCard({ icon: Icon, label, value, sub, accent = false, trend }: { icon: React.ElementType; label: string; value: string; sub?: string; accent?: boolean; trend?: "up" | "down" | null }) {
  return (
    <div className={`relative rounded-2xl border p-5 flex flex-col gap-3 overflow-hidden transition-all hover:shadow-lg group ${accent ? "border-[var(--color-primary-500)]/30 bg-gradient-to-br from-[var(--color-primary-600)]/10 to-transparent" : "border-[var(--surface-border)] bg-[var(--surface)]"}`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-[var(--color-primary-600)]/20 text-[var(--color-primary-400)]" : "bg-[var(--surface-hover)] text-[var(--muted)]"}`}><Icon className="w-5 h-5" /></div>
        {trend && <span className={`flex items-center gap-0.5 text-xs font-bold ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>{trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}</span>}
      </div>
      <div>
        <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-black tracking-tight ${accent ? "text-[var(--color-primary-400)]" : "text-[var(--foreground)]"}`}>{value}</p>
        {sub && <p className="text-xs text-[var(--muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function SalesMetricsCards({ data }: { data: ReportData }) {
  const peakHourObj = data.peakHours.reduce((a, b) => a.count > b.count ? a : b, { hour: 0, count: 0 })
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard icon={DollarSign} label="Total Revenue" value={`$${fmt(data.summary.totalRevenue)}`} sub={`${data.summary.paidOrders} paid orders`} accent />
      <StatCard icon={ShoppingBag} label="Total Orders" value={String(data.summary.totalOrders)} sub="All statuses" />
      <StatCard icon={CheckCircle2} label="Completed" value={String(data.summary.completedOrders)} sub={`${data.summary.totalOrders ? Math.round(data.summary.completedOrders / data.summary.totalOrders * 100) : 0}% of total`} trend="up" />
      <StatCard icon={XCircle} label="Cancelled" value={String(data.summary.cancelledOrders)} sub={`${data.summary.totalOrders ? Math.round(data.summary.cancelledOrders / data.summary.totalOrders * 100) : 0}% of total`} trend={data.summary.cancelledOrders > 0 ? "down" : null} />
      <StatCard icon={TrendingUp} label="Avg. Order Value" value={`$${fmt(data.summary.avgOrderValue)}`} sub="Per paid order" />
      <StatCard icon={Clock} label="Peak Hour" value={peakHourObj ? fmtHour(peakHourObj.hour) : "—"} sub={peakHourObj ? `${peakHourObj.count} orders` : ""} />
    </div>
  )
}

export function PopularItemsTable({ data }: { data: ReportData }) {
  const maxTopItem = Math.max(...data.topItems.map(i => i.qty), 1)
  const maxPeak = Math.max(...data.peakHours.map(h => h.count), 1)
  const totalStatusCount = Object.values(data.statusCounts).reduce((a, b) => a + b, 0) || 1
  const totalTypeCount = Object.values(data.typeCounts).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-black flex items-center gap-2 mb-5"><Star className="w-5 h-5 text-amber-400" /> Top Menu Items</h2>
        {data.topItems.length === 0 ? <div className="text-[var(--muted)] text-sm text-center py-8">No order data yet.</div> : (
          <div className="space-y-3">
            {data.topItems.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs font-black text-[var(--muted)] w-5 text-right shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold truncate">{item.name}</span><span className="text-xs font-bold text-[var(--muted)] shrink-0 ml-2">{item.qty}×</span></div>
                  <div className="h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: `${(item.qty / maxTopItem) * 100}%` }} /></div>
                </div>
                <span className="text-xs font-bold text-[var(--color-primary-400)] shrink-0 text-right w-16">${fmt(item.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-black flex items-center gap-2 mb-4"><PieChart className="w-5 h-5 text-purple-400" /> Order Status Breakdown</h2>
          <div className="space-y-2">
            {Object.entries(data.statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 w-24 text-center ${STATUS_COLORS[status] ?? "bg-[var(--surface-hover)] text-[var(--muted)]"}`}>{status}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden"><div className="h-full rounded-full bg-[var(--color-primary-600)]/60" style={{ width: `${(count / totalStatusCount) * 100}%` }} /></div>
                <span className="text-xs font-bold text-[var(--muted)] w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-black flex items-center gap-2 mb-4"><Utensils className="w-5 h-5 text-teal-400" /> Order Type Distribution</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.typeCounts).map(([type, count]) => (
              <div key={type} className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--surface-border)]">
                <span className="text-xs font-bold text-[var(--muted)]">{TYPE_LABELS[type] ?? type}</span>
                <span className="text-xl font-black">{count}</span>
                <span className="text-xs text-[var(--muted)]">{Math.round((count / totalTypeCount) * 100)}% of orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
