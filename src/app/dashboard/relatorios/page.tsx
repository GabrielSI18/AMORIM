import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Download } from 'lucide-react'
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

  // Dados simulados para relatórios
  const stats = {
    totalRevenue: 45890.50,
    monthlyGrowth: 12.5,
    totalBookings: 234,
    averageTicket: 1560.00,
  }

  const monthlyData = [
    { month: 'Jul', revenue: 32000, bookings: 45 },
    { month: 'Ago', revenue: 38000, bookings: 52 },
    { month: 'Set', revenue: 35000, bookings: 48 },
    { month: 'Out', revenue: 42000, bookings: 58 },
    { month: 'Nov', revenue: 45890, bookings: 62 },
    { month: 'Dez', revenue: 48000, bookings: 65 },
  ]

  return (
    <DashboardShell title="Relatórios">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[#1E1E1E] border border-[#333] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="text-sm text-[#A0A0A0]">Receita Total</p>
            <p className="text-xl font-bold text-[#E0E0E0]">
              {stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          <div className="p-4 bg-[#1E1E1E] border border-[#333] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-[#A0A0A0]">Crescimento</p>
            <p className="text-xl font-bold text-green-400">+{stats.monthlyGrowth}%</p>
          </div>

          <div className="p-4 bg-[#1E1E1E] border border-[#333] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-[#A0A0A0]">Total Reservas</p>
            <p className="text-xl font-bold text-[#E0E0E0]">{stats.totalBookings}</p>
          </div>

          <div className="p-4 bg-[#1E1E1E] border border-[#333] rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <p className="text-sm text-[#A0A0A0]">Ticket Médio</p>
            <p className="text-xl font-bold text-[#E0E0E0]">
              {stats.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#E0E0E0]">Receita Mensal</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#2A2A2A] text-[#A0A0A0] rounded-lg hover:text-[#E0E0E0] transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
          
          {/* Simple Bar Chart */}
          <div className="flex items-end gap-2 h-40 pt-4">
            {monthlyData.map((data, index) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className={`w-full rounded-t transition-all ${
                    index === monthlyData.length - 2 ? 'bg-[#D93636]' : 'bg-[#1E3A8A]'
                  }`}
                  style={{ height: `${(data.revenue / 50000) * 100}%` }}
                />
                <span className="text-xs text-[#A0A0A0]">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4">Atividade Recente</h3>
          
          <div className="space-y-4">
            {[
              { action: 'Nova reserva', package: 'Gramado - Serra Gaúcha', time: 'Há 2 horas', value: 'R$ 1.890,00' },
              { action: 'Pagamento confirmado', package: 'Florianópolis', time: 'Há 4 horas', value: 'R$ 2.450,00' },
              { action: 'Nova reserva', package: 'Bonito - MS', time: 'Há 6 horas', value: 'R$ 3.200,00' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-[#333] last:border-0">
                <div>
                  <p className="text-[#E0E0E0] font-medium">{activity.action}</p>
                  <p className="text-sm text-[#A0A0A0]">{activity.package}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#E0E0E0] font-medium">{activity.value}</p>
                  <p className="text-xs text-[#A0A0A0]">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
