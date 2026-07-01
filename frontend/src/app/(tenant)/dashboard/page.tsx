export const dynamic = "force-dynamic"
import * as React from "react"
import { serverFetch } from "@/lib/server-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch, Users2, ShieldCheck, TrendingUp } from "lucide-react"
import Link from "next/link"

async function getStats() {
  try {
    const [branchesRes, employeesRes, rolesRes] = await Promise.all([
      serverFetch("/api/branches"),
      serverFetch("/api/employees"),
      serverFetch("/api/roles"),
    ])
    const branches = branchesRes.ok ? await branchesRes.json() : []
    const employees = employeesRes.ok ? await employeesRes.json() : []
    const roles = rolesRes.ok ? await rolesRes.json() : []
    return { branches, employees, roles }
  } catch {
    return { branches: [], employees: [], roles: [] }
  }
}

export default async function DashboardOverviewPage() {
  const { branches, employees, roles } = await getStats()

  const stats = [
    {
      label: "Total Branches",
      value: branches.length,
      icon: GitBranch,
      href: "/dashboard/branches",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "Total Employees",
      value: employees.length,
      icon: Users2,
      href: "/dashboard/employees",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      label: "Active Roles",
      value: roles.length,
      icon: ShieldCheck,
      href: "/dashboard/roles",
      gradient: "from-emerald-500 to-teal-500",
    },
  ]

  const quickLinks = [
    { href: "/dashboard/branches", label: "Add a Branch", desc: "Set up a new hotel or restaurant location.", icon: GitBranch },
    { href: "/dashboard/employees", label: "Add an Employee", desc: "Register staff and assign them to a branch.", icon: Users2 },
    { href: "/dashboard/roles", label: "Manage Permissions", desc: "Review and fine-tune what each role can do.", icon: ShieldCheck },
  ]

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome back </h1>
        <p className="text-[var(--muted)]">Here's an overview of your organization.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:border-[var(--color-primary-500)]/50 transition-all hover:shadow-md cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl  flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-6 h-6 `} />
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)] font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold tracking-tight mt-0.5 group-hover:text-[var(--color-primary-600)] transition-colors">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[var(--muted)]" />
          <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((ql) => (
            <Link key={ql.href} href={ql.href}>
              <Card className="h-full hover:border-[var(--color-primary-500)]/50 transition-all hover:shadow-md cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2">
                    <ql.icon className="w-5 h-5 " />
                  </div>
                  <CardTitle className="text-base group-hover:text-[var(--color-primary-600)] transition-colors">
                    {ql.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--muted)]">{ql.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
