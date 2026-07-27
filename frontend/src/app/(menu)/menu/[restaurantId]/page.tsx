import type { Metadata } from 'next'
import { Suspense } from 'react'
import MenuClientView from './MenuClientView'

export const metadata: Metadata = {
  title: 'Menu | HospitalityHub',
  description: 'Browse the full menu, customise your order, and checkout.',
}

// Server Component — streams page shell to the client, interactive catalog hydrated via MenuClientView inside Suspense boundary
export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-4 flex items-center justify-center text-sm text-gray-400">Loading menu...</div>}>
      <MenuClientView />
    </Suspense>
  )
}
