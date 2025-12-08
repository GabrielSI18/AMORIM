import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { PlusCircle, Users, Handshake, Package, Calendar, DollarSign, TrendingUp } from 'lucide-react'
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

  // Buscar estatisticas reais
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalClients,
    totalAffiliates,
    totalPackages,
    publishedPackages,
    totalBookings,
    paidBookings,
    recentBookings,
    packageStats,
  ] = await Promise.all([
    // Contagem de clientes
    prisma.user.count({ where: { role: 'USER' } as any }),
    // Contagem de afiliados
    prisma.user.count({ where: { role: 'AFFILIATE' } as any }),
    // Total de pacotes
    prisma.package.count(),
    // Pacotes publicados
    prisma.package.count({ where: { status: 'published' } }),
    // Total de reservas
    prisma.booking.count(),
    // Reservas pagas
    prisma.booking.count({ where: { payment_status: 'paid' } }),
    // Reservas dos últimos 30 dias
    prisma.booking.findMany({
      where: {
        created_at: { gte: thirtyDaysAgo },
        payment_status: 'paid',
      },
      select: {
        total_amount: true,
        created_at: true,
      },
    }),
    // Estatísticas de ocupação dos pacotes publicados
    prisma.package.aggregate({
      where: { status: 'published' },
      _sum: {
        available_seats: true,
        total_seats: true,
        bookings_count: true,
      },
    }),
  ])

  // Calcular receita dos últimos 30 dias
  const revenueLastMonth = recentBookings.reduce((sum, b) => sum + b.total_amount, 0)

  // Calcular taxa de ocupação
  const totalSeats = packageStats._sum.total_seats || 0
  const bookedSeats = packageStats._sum.bookings_count || 0
  const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0

  // Se nao for admin, mostrar dashboard simples
  if (!isAdmin) {
    // Buscar reservas do usuário
    const userBookings = await prisma.booking.findMany({
      where: { user_id: dbUser.id },
      include: { package: { select: { title: true, cover_image: true, departure_date: true } } },
      orderBy: { created_at: 'desc' },
      take: 5,
    })

    return (
      <DashboardShell
        title="Meu Painel"
        userName={user.firstName || undefined}
        userEmail={user.emailAddresses[0]?.emailAddress}
      >
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-[#E0E0E0] mb-2">
            Olá, {user.firstName || 'Usuário'}!
          </h2>
          <p className="text-[#A0A0A0] mb-8">Bem-vindo ao seu painel</p>

          <div className="bg-[#1E1E1E] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#E0E0E0] mb-4">
              Suas Viagens
            </h3>
            {userBookings.length > 0 ? (
              <div className="space-y-3">
                {userBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-4 p-3 bg-[#2A2A2A] rounded-lg">
                    <div className="flex-1">
                      <p className="text-[#E0E0E0] font-medium">{booking.package.title}</p>
                      <p className="text-sm text-[#A0A0A0]">
                        Status: {booking.status === 'confirmed' ? 'Confirmada' : booking.status === 'paid' ? 'Paga' : 'Pendente'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="text-[#A0A0A0]">
                  Você ainda não tem reservas. Explore nossos pacotes!
                </p>
                <Link
                  href="/pacotes"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#D93636] text-white rounded-lg hover:bg-[#c42f2f] transition-colors font-medium"
                >
                  Ver Pacotes
                </Link>
              </>
            )}
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

      {/* Section: Stats Cards */}
      <section className="grid grid-cols-2 gap-4">
        <Link
          href="/dashboard/clientes"
          className="flex flex-col gap-3 rounded-xl bg-[#1E1E1E] p-4 shadow-sm hover:bg-[#252525] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-400" />
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
            <div className="flex items-center justify-center size-10 rounded-full bg-purple-500/10">
              <Handshake className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-base font-bold text-[#E0E0E0]">Afiliados</p>
          </div>
          <p className="text-3xl font-bold text-[#E0E0E0]">
            {totalAffiliates.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-[#A0A0A0]">Visualizar Afiliados</p>
        </Link>

        <Link
          href="/dashboard/pacotes"
          className="flex flex-col gap-3 rounded-xl bg-[#1E1E1E] p-4 shadow-sm hover:bg-[#252525] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-green-500/10">
              <Package className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-base font-bold text-[#E0E0E0]">Pacotes</p>
          </div>
          <p className="text-3xl font-bold text-[#E0E0E0]">
            {publishedPackages}/{totalPackages}
          </p>
          <p className="text-sm text-[#A0A0A0]">Publicados / Total</p>
        </Link>

        <Link
          href="/dashboard/relatorios"
          className="flex flex-col gap-3 rounded-xl bg-[#1E1E1E] p-4 shadow-sm hover:bg-[#252525] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-orange-500/10">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-base font-bold text-[#E0E0E0]">Reservas</p>
          </div>
          <p className="text-3xl font-bold text-[#E0E0E0]">
            {paidBookings}/{totalBookings}
          </p>
          <p className="text-sm text-[#A0A0A0]">Pagas / Total</p>
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
              <p className="text-sm text-[#A0A0A0]">Últimos 30 dias</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">
                {(revenueLastMonth / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#A0A0A0]">Ocupação</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">{occupancyRate}%</p>
            </div>
          </div>

          {/* Info quando não há dados */}
          {revenueLastMonth === 0 && (
            <div className="text-center py-6 border-t border-gray-700">
              <DollarSign className="w-12 h-12 text-[#333] mx-auto mb-2" />
              <p className="text-[#A0A0A0]">Nenhuma receita registrada ainda</p>
              <p className="text-sm text-[#666]">As vendas aparecerão aqui</p>
            </div>
          )}

          {/* Gráfico simples quando há dados */}
          {revenueLastMonth > 0 && (
            <div className="flex items-center gap-2 py-4 border-t border-gray-700">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <p className="text-sm text-green-400">
                {recentBookings.length} reservas pagas nos últimos 30 dias
              </p>
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  )
}
