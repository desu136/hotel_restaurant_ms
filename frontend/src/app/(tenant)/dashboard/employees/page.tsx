export const dynamic = "force-dynamic"
import * as React from "react"
import { serverFetch } from "@/lib/server-fetch"
import EmployeeManager from "./EmployeeManager"

async function getEmployeesAndBranches() {
  try {
    const [empRes, branchRes, empRoles, meRes] = await Promise.all([
      serverFetch("/api/employees"),
      serverFetch("/api/branches"),
      serverFetch("/api/roles"),
      serverFetch("/api/auth/me"),
    ])
    const employees = empRes.ok ? await empRes.json() : []
    const branches = branchRes.ok ? await branchRes.json() : []
    const roles = empRoles.ok ? await empRoles.json() : []
    const meData = meRes.ok ? await meRes.json() : null
    // /api/auth/me returns { success, user: { id, email, roles, branch_id, ... } }
    const currentUser = meData?.user ?? null
    return { employees, branches, roles, currentUser }
  } catch {
    return { employees: [], branches: [], roles: [], currentUser: null }
  }
}


export default async function EmployeesPage() {
  const { employees, branches, roles, currentUser } = await getEmployeesAndBranches()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Employees</h1>
        <p className="text-[var(--muted)]">Manage staff accounts, branches, and role assignments.</p>
      </div>
      <EmployeeManager initialEmployees={employees} branches={branches} roles={roles} currentUser={currentUser} />
    </div>
  )
}
