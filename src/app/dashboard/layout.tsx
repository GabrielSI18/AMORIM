import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Usuário'
  const userEmail = user.emailAddresses[0]?.emailAddress || ''

  return (
    <DashboardLayoutClient userName={userName} userEmail={userEmail}>
      {children}
    </DashboardLayoutClient>
  )
}
