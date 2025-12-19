import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Package, Handshake } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard'

export default async function RelatoriosPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Verificar se é admin
  const dbUser = await prisma.user.findUnique({
    where: { clerk_id: user.id },
  }) as any

  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  // Buscar dados reais do banco
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const [
    totalBookings,
    paidBookings,
    recentPaidBookings,
    previousPaidBookings,
    recentBookingsList,
  ] = await Promise.all([
    // Total de reservas
    prisma.booking.count(),
    // Reservas pagas
    prisma.booking.count({ where: { payment_status: 'paid' } }),
    // Reservas pagas dos últimos 30 dias
    prisma.booking.findMany({
      where: {
        payment_status: 'paid',
        created_at: { gte: thirtyDaysAgo },
      },
      select: { total_amount: true },
    }),
    // Reservas pagas dos 30 dias anteriores (para calcular crescimento)
    prisma.booking.findMany({
      where: {
        payment_status: 'paid',
        created_at: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      select: { total_amount: true },
    }),
    // Últimas reservas com detalhes e informação de afiliado
    prisma.booking.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        package: { select: { title: true } },
      },
    }),
  ])

  // Buscar indicações de afiliados para as reservas
  const bookingIds = recentBookingsList.map(b => b.id)
  const affiliateReferrals = await prisma.affiliateReferral.findMany({
    where: { booking_id: { in: bookingIds } },
    include: { affiliate: { select: { name: true, code: true } } },
  })
  
  // Criar mapa de booking -> afiliado
  const bookingAffiliateMap = new Map(
    affiliateReferrals.map(r => [r.booking_id, r.affiliate])
  )

  // Calcular métricas
  const recentRevenue = recentPaidBookings.reduce((sum, b) => sum + b.total_amount, 0)
  const previousRevenue = previousPaidBookings.reduce((sum, b) => sum + b.total_amount, 0)
  
  // Calcular crescimento (evitar divisão por zero)
  let growthRate = 0
  if (previousRevenue > 0) {
    growthRate = Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100)
  } else if (recentRevenue > 0) {
    growthRate = 100 // Se não tinha receita anterior mas tem agora, é 100% de crescimento
  }

  // Ticket médio
  const averageTicket = paidBookings > 0 
    ? Math.round(recentRevenue / recentPaidBookings.length) 
    : 0

  // Formatar tempo relativo
  function getRelativeTime(date: Date): string {
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'Agora mesmo'
    if (seconds < 3600) return `Há ${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `Há ${Math.floor(seconds / 3600)} horas`
    return `Há ${Math.floor(seconds / 86400)} dias`
  }

  return (
    <DashboardShell title="Relatórios">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Receita (30 dias)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-[#E0E0E0]">
              {(recentRevenue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Crescimento</p>
            <p className={`text-xl font-bold ${growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {growthRate >= 0 ? '+' : ''}{growthRate}%
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Total Reservas</p>
            <p className="text-xl font-bold text-gray-900 dark:text-[#E0E0E0]">{totalBookings}</p>
          </div>

          <div className="p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Ticket Médio</p>
            <p className="text-xl font-bold text-gray-900 dark:text-[#E0E0E0]">
              {(averageTicket / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] mb-4">Resumo</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#2A2A2A] rounded-lg">
              <span className="text-gray-500 dark:text-[#A0A0A0]">Reservas pagas</span>
              <span className="text-gray-900 dark:text-[#E0E0E0] font-medium">{paidBookings}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#2A2A2A] rounded-lg">
              <span className="text-gray-500 dark:text-[#A0A0A0]">Pendentes</span>
              <span className="text-gray-900 dark:text-[#E0E0E0] font-medium">{totalBookings - paidBookings}</span>
            </div>
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] mb-4">Atividade Recente</h3>
          
          {recentBookingsList.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-200 dark:text-[#333] mx-auto mb-2" />
              <p className="text-gray-500 dark:text-[#A0A0A0]">Nenhuma reserva ainda</p>
              <p className="text-sm text-gray-400 dark:text-[#666]">As reservas aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookingsList.map((booking) => {
                const affiliate = bookingAffiliateMap.get(booking.id)
                return (
                  <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-[#333] last:border-0">
                    <div>
                      <p className="text-gray-900 dark:text-[#E0E0E0] font-medium">
                        {booking.status === 'confirmed' ? 'Reserva confirmada' : 
                         booking.payment_status === 'paid' ? 'Pagamento confirmado' : 'Nova reserva'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">{booking.package.title}</p>
                      {affiliate && (
                        <p className="text-xs text-purple-500 dark:text-purple-400 flex items-center gap-1 mt-1">
                          <Handshake className="w-3 h-3" />
                          Indicado por: {affiliate.name} ({affiliate.code})
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-[#E0E0E0] font-medium">
                        {(booking.total_amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">{getRelativeTime(booking.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
