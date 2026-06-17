export const dynamic = "force-dynamic"
import * as React from "react"
import { serverFetch } from "@/lib/server-fetch"
import EmployeeManager from "./EmployeeManager"

async function getEmployeesAndBranches() {
  try {
    const [empRes, branchRes] = await Promise.all([
      serverFetch("/api/employees"),
      serverFetch("/api/branches"),
    ])
    const employees = empRes.ok ? await empRes.json() : []
    const branches = branchRes.ok ? await branchRes.json() : []
    return { employees, branches }
  } catch {
    return { employees: [], branches: [] }
  }
}

export default async function EmployeesPage() {
  const { employees, branches } = await getEmployeesAndBranches()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Employees</h1>
          <p className="text-[var(--muted)]">Manage staff accounts, branches, and role assignments.</p>
        </div>
        <EmployeeManager initialEmployees={employees} branches={branches} />
      </div>
    </div>
  )
}
