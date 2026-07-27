import type { Metadata } from 'next'
import PromotionsClientView from './PromotionsClientView'

export const metadata: Metadata = {
  title: 'Promotions | Manager Dashboard',
  description: 'Manage active, scheduled, and draft restaurant promotions.',
}

// Server Component — streams page shell to the client, promotion list hydrated via PromotionsClientView
export default function PromotionsPage() {
  return <PromotionsClientView />
}
