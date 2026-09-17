import type { Metadata } from 'next'
import LandingClientView from './LandingClientView'

export const metadata: Metadata = {
  title: 'DFoodie',
  description: 'Streamlined operational management and digital ordering system.',
}

// Server Component — streams instant initial response and hydrates view via LandingClientView
export default function RootPage() {
  return <LandingClientView />
}
