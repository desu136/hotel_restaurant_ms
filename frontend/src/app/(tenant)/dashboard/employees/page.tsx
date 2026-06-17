export const dynamic = "force-dynamic"
import * as React from "react"
import { serverFetch } from "@/lib/server-fetch"
import EmployeeManager from "./EmployeeManager"

async function getEmployeesAndBranches() {
  try {
    const [empRes, branchRes, empRoles] = await Promise.all([
      serverFetch("/api/employees"),
      serverFetch("/api/branches"),
      serverFetch("/api/roles"),
    ])
    const employees = empRes.ok ? await empRes.json() : []
    const branches = branchRes.ok ? await branchRes.json() : []
    const roles = empRoles.ok ? await empRoles.json() : []
    console.log("roles", roles)
    return { employees, branches, roles }
  } catch {
    return { employees: [], branches: [], roles: [] }
  }
}


export default async function EmployeesPage() {
  const { employees, branches, roles } = await getEmployeesAndBranches()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Employees</h1>
        <p className="text-[var(--muted)]">Manage staff accounts, branches, and role assignments.</p>
      </div>
      <EmployeeManager initialEmployees={employees} branches={branches} roles={roles} />
    </div>
  )
}
