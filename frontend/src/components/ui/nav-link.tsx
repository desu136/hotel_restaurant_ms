"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
}

export function NavLink({
  href,
  children,
  className = "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150",
  activeClassName = "bg-[var(--color-primary-600)] text-[var(--btn-fg)] font-semibold",
}: NavLinkProps) {
  const pathname = usePathname()
  
  // Match exact path or subpath (e.g. /tenants/123 matches /tenants)
  const isActive = href === "/" 
    ? pathname === "/" 
    : pathname === href || pathname.startsWith(`${href}/`)

  const combinedClass = `${className} ${
    isActive 
      ? activeClassName 
      : "hover:bg-[var(--surface-hover)] text-[var(--foreground)]"
  }`

  return (
    <Link href={href} className={combinedClass}>
      {children}
    </Link>
  )
}
