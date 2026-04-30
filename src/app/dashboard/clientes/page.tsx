import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard'
import { ClientesList } from './clientes-list'

export default async function ClientesPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const dbUser = await prisma.user.findUnique({
    where: { clerk_id: user.id },
    select: { role: true },
  })
  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN')) {
    redirect('/dashboard')
  }

  return (
    <>
      <PageHeader title="Clientes" />
      <ClientesList />
    </>
  )
}
