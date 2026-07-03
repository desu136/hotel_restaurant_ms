
import { serverFetch } from "@/lib/server-fetch"
import EmployeeManager from "../../employees/EmployeeManager"

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
    console.log("roles", roles)
    return { employees, branches, roles, currentUser }
  } catch {
    return { employees: [], branches: [], roles: [], currentUser: null }
  }
}

export default async function ManagerStaffPage() {
  const { employees, branches, roles, currentUser } = await getEmployeesAndBranches()
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Branch Staff 👥</h1>
        <p className="text-[var(--muted)]">Manage waiters, chefs, cashiers, and active staff accounts for your branch.</p>
      </div>

      <EmployeeManager initialEmployees={employees} branches={branches} roles={roles} currentUser={currentUser} />

    </div>
  )
}
export const dynamic = "force-dynamic"








