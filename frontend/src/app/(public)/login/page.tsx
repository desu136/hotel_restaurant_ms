import type { Metadata } from 'next'
import LoginClientView from './LoginClientView'

export const metadata: Metadata = {
  title: 'Sign In | HospitalityHub',
  description: 'Sign in to access your hotel and restaurant management portal.',
}

// Server Component — streams page shell to the client, interactive auth form hydrated via LoginClientView
export default function LoginPage() {
  return <LoginClientView />
}
