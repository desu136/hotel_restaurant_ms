"use client"

import * as React from "react"
import { Clock, BarChart2, Users2, Building2 } from "lucide-react"
import { fmt, fmtDate, fmtHour, ReportData } from "./ReportPanels"

export function DailyRevenueTrendChart({ data }: { data: ReportData }) {
  const maxDaily = Math.max(...data.dailyTrend.map(d => d.revenue), 1)
  return (
    <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2"><BarChart2 className="w-5 h-5 text-[var(--color-primary-400)]" /> Daily Revenue Trend</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">Revenue collected from paid bills per day</p>
        </div>
      </div>
      {data.dailyTrend.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-[var(--muted)] text-sm">No revenue data in this period.</div>
      ) : (
        <div className="flex items-end gap-1 h-40">
          {data.dailyTrend.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full">
                <div className="w-full rounded-t-md bg-[var(--color-primary-600)]/60 hover:bg-[var(--color-primary-600)] transition-all"
                  style={{ height: `${Math.max(4, (d.revenue / maxDaily) * 140)}px` }} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-lg px-2.5 py-1.5 text-[10px] font-semibold whitespace-nowrap shadow-lg">
                    {fmtDate(d.date)}<br />
                    <span className="text-[var(--color-primary-400)]">${fmt(d.revenue)}</span>
                    <span className="text-[var(--muted)] ml-1">· {d.orders} orders</span>
                  </div>
                </div>
              </div>
              <span className="text-[9px] text-[var(--muted)] truncate max-w-full px-0.5">{fmtDate(d.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PeakHoursChart({ data }: { data: ReportData }) {
  const maxPeak = Math.max(...data.peakHours.map(h => h.count), 1)
  return (
    <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
      <h2 className="text-lg font-black flex items-center gap-2 mb-6"><Clock className="w-5 h-5 text-rose-400" /> Order Volume by Hour</h2>
      <div className="flex items-end gap-1 h-24">
        {data.peakHours.map((h) => (
          <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full">
              <div className="w-full rounded-t-sm bg-rose-500/40 hover:bg-rose-500/80 transition-colors" style={{ height: `${Math.max(3, (h.count / maxPeak) * 88)}px` }} />
              {h.count > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-[var(--surface-hover)] border border-[var(--surface-border)] rounded-md px-2 py-1 text-[9px] font-bold whitespace-nowrap shadow">{fmtHour(h.hour)}: {h.count}</div>
                </div>
              )}
            </div>
            {h.hour % 3 === 0 && <span className="text-[8px] text-[var(--muted)]">{fmtHour(h.hour)}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CustomerStatsTable({ data }: { data: ReportData }) {
  if (!data.customerStats || data.customerStats.length === 0) return null
  return (
    <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
      <h2 className="text-lg font-black flex items-center gap-2 mb-5"><Users2 className="w-5 h-5 text-indigo-400" /> Customer Activity & Usage</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b border-[var(--surface-border)]">
            {["Customer", "Contact", "Orders", "Total Spent", "Avg. Order"].map(h => (
              <th key={h} className="pb-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.customerStats.map((c, idx) => (
              <tr key={c.id} className="border-b border-[var(--surface-border)]/50 hover:bg-[var(--surface-hover)]/40 transition-colors">
                <td className="py-3 pr-4"><div className="flex items-center gap-2"><span className="text-xs font-mono text-[var(--muted)] w-5">{idx + 1}</span><span className="font-semibold">{c.name}</span></div></td>
                <td className="py-3 pr-4 text-[var(--muted)] text-xs">{c.email || c.phone || "—"}</td>
                <td className="py-3 pr-4 font-semibold">{c.ordersCount}</td>
                <td className="py-3 pr-4 font-black text-emerald-400">${fmt(c.totalSpent)}</td>
                <td className="py-3 font-semibold text-[var(--muted)]">${c.ordersCount ? fmt(c.totalSpent / c.ordersCount) : "0.00"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BranchPerformanceTable({ data }: { data: ReportData }) {
  if (data.branchBreakdown.length === 0) return null
  return (
    <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6">
      <h2 className="text-lg font-black flex items-center gap-2 mb-5"><Building2 className="w-5 h-5 text-blue-400" /> Branch Performance</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b border-[var(--surface-border)]">
            {["Branch", "Orders", "Revenue", "Avg. Order"].map(h => (
              <th key={h} className="pb-3 pr-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.branchBreakdown.sort((a, b) => b.revenue - a.revenue).map((b, idx) => (
              <tr key={b.branchId} className="border-b border-[var(--surface-border)]/50 hover:bg-[var(--surface-hover)]/40 transition-colors">
                <td className="py-3 pr-4"><div className="flex items-center gap-2"><span className="text-xs font-mono text-[var(--muted)] w-5">{idx + 1}</span><span className="font-semibold">{b.name}</span></div></td>
                <td className="py-3 pr-4 font-semibold">{b.orders}</td>
                <td className="py-3 pr-4 font-black text-[var(--color-primary-400)]">${fmt(b.revenue)}</td>
                <td className="py-3 font-semibold text-[var(--muted)]">${b.orders ? fmt(b.revenue / b.orders) : "0.00"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
