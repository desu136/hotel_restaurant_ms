import type { Metadata } from 'next'
import LoginClientView from './LoginClientView'

export const metadata: Metadata = {
  title: 'Sign In | DFoodie',
  description: 'Sign in to DFoodie — cafés, restaurants, and food chains.',
}

// Server Component — streams page shell to the client, interactive auth form hydrated via LoginClientView
export default function LoginPage() {
  return <LoginClientView />
}
