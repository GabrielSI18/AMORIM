import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { PlusCircle, Users, Handshake } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Buscar ou criar usuario no banco (usando any para evitar erros de tipo durante regeneração do Prisma)
  const dbUser = await prisma.user.upsert({
    where: { clerk_id: user.id },
    update: {},
    create: {
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      first_name: user.firstName,
      last_name: user.lastName,
      image_url: user.imageUrl,
      role: 'SUPER_ADMIN',
    } as any,
    select: { role: true, first_name: true } as any,
  }) as any

  const isAdmin = dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPER_ADMIN'

  // Buscar estatisticas
  const [totalClients, totalAffiliates] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } as any }),
    prisma.user.count({ where: { role: 'AFFILIATE' } as any }),
  ])

  // Se nao for admin, mostrar dashboard simples
  if (!isAdmin) {
    return (
      <DashboardShell
        title="Meu Painel"
        userName={user.firstName || undefined}
        userEmail={user.emailAddresses[0]?.emailAddress}
      >
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-[#E0E0E0] mb-2">
            Ola, {user.firstName || 'Usuario'}!
          </h2>
          <p className="text-[#A0A0A0] mb-8">Bem-vindo ao seu painel</p>

          <div className="bg-[#1E1E1E] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#E0E0E0] mb-4">
              Suas Viagens
            </h3>
            <p className="text-[#A0A0A0]">
              Voce ainda nao tem reservas. Explore nossos pacotes!
            </p>
            <Link
              href="/pacotes"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#D93636] text-white rounded-lg hover:bg-[#c42f2f] transition-colors font-medium"
            >
              Ver Pacotes
            </Link>
          </div>
        </div>
      </DashboardShell>
    )
  }

  // Dashboard Super Admin
  return (
    <DashboardShell
      title="Dashboard Super Admin"
      userName={dbUser?.first_name || user.firstName || undefined}
      userEmail={user.emailAddresses[0]?.emailAddress}
    >
      {/* Section: Gerenciamento de Pacotes */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[#E0E0E0] tracking-tight">
          Gerenciamento de Pacotes
        </h2>
        <Link
          href="/dashboard/pacotes/novo"
          className="flex items-center justify-center gap-3 h-12 px-5 bg-[#D93636] hover:bg-[#c42f2f] text-white rounded-lg font-bold transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Cadastrar Pacote de Viagem</span>
        </Link>
      </section>

      {/* Section: Visualizar Clientes e Afiliados */}
      <section className="grid grid-cols-2 gap-4">
        <Link
          href="/dashboard/clientes"
          className="flex flex-col gap-3 rounded-xl bg-[#1E1E1E] p-4 shadow-sm hover:bg-[#252525] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A]">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-base font-bold text-[#E0E0E0]">Clientes</p>
          </div>
          <p className="text-3xl font-bold text-[#E0E0E0]">
            {totalClients.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-[#A0A0A0]">Visualizar Clientes</p>
        </Link>

        <Link
          href="/dashboard/afiliados"
          className="flex flex-col gap-3 rounded-xl bg-[#1E1E1E] p-4 shadow-sm hover:bg-[#252525] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A]">
              <Handshake className="w-5 h-5" />
            </div>
            <p className="text-base font-bold text-[#E0E0E0]">Afiliados</p>
          </div>
          <p className="text-3xl font-bold text-[#E0E0E0]">
            {totalAffiliates.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-[#A0A0A0]">Visualizar Afiliados</p>
        </Link>
      </section>

      {/* Section: Receita das Viagens */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[#E0E0E0] tracking-tight">
          Receita das Viagens
        </h2>
        <div className="flex flex-col gap-4 rounded-xl bg-[#1E1E1E] p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-[#A0A0A0]">Ultimos 30 dias</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">R$ 45.890,50</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#A0A0A0]">Ocupacao</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">82%</p>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-40 flex items-end gap-2 border-t border-b border-gray-700 py-4">
            <div className="flex-1 h-[60%] bg-[#1E3A8A]/30 rounded-t"></div>
            <div className="flex-1 h-[40%] bg-[#1E3A8A]/30 rounded-t"></div>
            <div className="flex-1 h-[75%] bg-[#D93636] rounded-t"></div>
            <div className="flex-1 h-[55%] bg-[#1E3A8A]/30 rounded-t"></div>
            <div className="flex-1 h-[90%] bg-[#D93636] rounded-t"></div>
            <div className="flex-1 h-[65%] bg-[#1E3A8A]/30 rounded-t"></div>
            <div className="flex-1 h-[80%] bg-[#D93636] rounded-t"></div>
          </div>
        </div>
      </section>
    </DashboardShell>
  )
}
