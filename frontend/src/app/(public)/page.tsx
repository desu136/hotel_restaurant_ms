import type { Metadata } from 'next'
import LandingClientView from './LandingClientView'

export const metadata: Metadata = {
  title: 'HospitalityHub | Hotel & Restaurant Management System',
  description: 'Streamlined operational management and digital ordering system.',
}

// Server Component — streams instant initial response and hydrates view via LandingClientView
export default function RootPage() {
  return <LandingClientView />
}
