import type { Metadata } from 'next'
import { Suspense } from 'react'
import CreatePromotionClientView from './CreatePromotionClientView'

export const metadata: Metadata = {
  title: 'Create Promotion | Manager Dashboard',
  description: 'Configure and publish campaign rules and discounts.',
}

// Server Component — streams page shell to the client, interactive wizard hydrated via CreatePromotionClientView inside Suspense boundary
export default function CreatePromotionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--muted)] animate-pulse">Loading campaign builder...</div>}>
      <CreatePromotionClientView />
    </Suspense>
  )
}
