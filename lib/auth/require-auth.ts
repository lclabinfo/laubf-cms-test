import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await auth()
  if (!session?.churchId) {
    redirect('/cms/login')
  }
  return session
}
