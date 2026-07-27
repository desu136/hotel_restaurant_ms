import type { Metadata } from 'next'
import { Suspense } from 'react'
import HomeClientView from './HomeClientView'

export const metadata: Metadata = {
  title: 'HospitalityHub | Discover Restaurants & Offers',
  description: 'Browse nearby restaurants, explore exclusive promotions, and order your favourite food.',
}

// Server Component — renders immediately with streamed HTML, hydrates interactivity via HomeClientView inside Suspense boundary
export default function MiniAppHomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-4 flex items-center justify-center text-sm text-gray-400">Loading home page...</div>}>
      <HomeClientView />
    </Suspense>
  )
}
