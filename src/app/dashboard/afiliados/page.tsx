import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserCheck, DollarSign, TrendingUp, Search, Filter, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard'

export default async function AfiliadosPage() {
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

  // Buscar afiliados
  const affiliates = await prisma.user.findMany({
    where: { role: 'AFFILIATE' } as any,
    orderBy: { created_at: 'desc' },
  }) as any[]

  // Estatísticas
  const stats = {
    totalAffiliates: affiliates.length,
    activeThisMonth: affiliates.filter(a => {
      const now = new Date()
      const created = new Date(a.created_at)
      return created.getMonth() === now.getMonth()
    }).length,
    totalCommissions: 0,
  }

  return (
    <DashboardShell 
      title="Afiliados"
      action={
        <Link
          href="/dashboard/afiliados/convites"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D93636] hover:bg-[#C52F2F] text-white font-medium rounded-lg transition-colors"
        >
          <UserCheck className="w-4 h-4" />
          Convidar
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-[#1E1E1E] border border-[#333] rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-[#A0A0A0]">Total de Afiliados</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">{stats.totalAffiliates}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#1E1E1E] border border-[#333] rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-[#A0A0A0]">Novos este mês</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">{stats.activeThisMonth}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#1E1E1E] border border-[#333] rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-[#A0A0A0]">Comissões Pagas</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">R$ 0,00</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
            <input
              type="text"
              placeholder="Buscar afiliado..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#1E1E1E] border border-[#333] text-[#E0E0E0] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#D93636] transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1E1E1E] border border-[#333] text-[#A0A0A0] rounded-lg hover:border-[#D93636] transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        {/* Affiliate Cards (Mobile) */}
        <div className="block lg:hidden space-y-4">
          {affiliates.length === 0 ? (
            <div className="p-8 text-center bg-[#1E1E1E] rounded-xl border border-[#333]">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-[#2A2A2A]">
                  <Users className="w-8 h-8 text-[#A0A0A0]" />
                </div>
                <div>
                  <p className="text-[#E0E0E0] font-medium">Nenhum afiliado ainda</p>
                  <p className="text-[#A0A0A0] text-sm mt-1">
                    Convide afiliados para começar
                  </p>
                </div>
                <Link
                  href="/dashboard/afiliados/convites"
                  className="mt-2 px-4 py-2 bg-[#D93636] text-white rounded-lg hover:bg-[#C52F2F] transition-colors"
                >
                  Convidar Afiliado
                </Link>
              </div>
            </div>
          ) : (
            affiliates.map((affiliate) => (
              <div 
                key={affiliate.id} 
                className="p-4 bg-[#1E1E1E] border border-[#333] rounded-xl space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#2A2A2A] border border-[#333] overflow-hidden flex-shrink-0">
                    {affiliate.image_url ? (
                      <Image
                        src={affiliate.image_url}
                        alt={affiliate.name || 'Avatar'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A0A0A0] text-lg font-medium">
                        {affiliate.first_name?.[0] || affiliate.email[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#E0E0E0] truncate">
                      {affiliate.first_name} {affiliate.last_name}
                    </p>
                    <p className="text-sm text-[#A0A0A0] truncate">{affiliate.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <code className="px-2 py-1 bg-[#2A2A2A] text-[#A0A0A0] rounded text-xs">
                    AF-{affiliate.id.slice(0, 6).toUpperCase()}
                  </code>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                    Ativo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-[#2A2A2A] rounded-lg text-center">
                    <p className="text-[#A0A0A0]">Vendas</p>
                    <p className="font-medium text-[#E0E0E0]">0</p>
                  </div>
                  <div className="p-2 bg-[#2A2A2A] rounded-lg text-center">
                    <p className="text-[#A0A0A0]">Comissões</p>
                    <p className="font-medium text-[#E0E0E0]">R$ 0,00</p>
                  </div>
                </div>
                
                <button className="w-full py-2 text-sm bg-[#2A2A2A] text-[#E0E0E0] hover:bg-[#333] rounded-lg transition-colors">
                  Ver perfil
                </button>
              </div>
            ))
          )}
        </div>

        {/* Table (Desktop) */}
        <div className="hidden lg:block bg-[#1E1E1E] border border-[#333] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2A2A2A] border-b border-[#333]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#E0E0E0]">Afiliado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#E0E0E0]">Código</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#E0E0E0]">Vendas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#E0E0E0]">Comissões</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#E0E0E0]">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#E0E0E0]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-[#2A2A2A]">
                          <Users className="w-8 h-8 text-[#A0A0A0]" />
                        </div>
                        <div>
                          <p className="text-[#E0E0E0] font-medium">Nenhum afiliado ainda</p>
                          <p className="text-[#A0A0A0] text-sm mt-1">
                            Convide afiliados para começar a expandir suas vendas
                          </p>
                        </div>
                        <Link
                          href="/dashboard/afiliados/convites"
                          className="mt-2 px-4 py-2 bg-[#D93636] text-white rounded-lg hover:bg-[#C52F2F] transition-colors"
                        >
                          Convidar Afiliado
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="hover:bg-[#2A2A2A] transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#2A2A2A] border border-[#333] overflow-hidden">
                            {affiliate.image_url ? (
                              <Image
                                src={affiliate.image_url}
                                alt={affiliate.name || 'Avatar'}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#A0A0A0]">
                                {affiliate.first_name?.[0] || affiliate.email[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#E0E0E0]">
                              {affiliate.first_name} {affiliate.last_name}
                            </p>
                            <p className="text-sm text-[#A0A0A0]">{affiliate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 bg-[#2A2A2A] text-[#A0A0A0] rounded text-sm">
                          AF-{affiliate.id.slice(0, 6).toUpperCase()}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-[#E0E0E0] font-medium">
                        0 vendas
                      </td>
                      <td className="px-6 py-4 text-[#E0E0E0] font-medium">
                        R$ 0,00
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                          Ativo
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 text-sm bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#E0E0E0] rounded-lg transition-colors">
                            Ver perfil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-4">
            📊 Como funciona o programa de afiliados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-[#D93636] mb-2 font-medium">1. Convite</p>
              <p className="text-[#A0A0A0]">Afiliados recebem um link único para compartilhar</p>
            </div>
            <div>
              <p className="text-[#D93636] mb-2 font-medium">2. Vendas</p>
              <p className="text-[#A0A0A0]">Quando um cliente compra pelo link, a venda é rastreada</p>
            </div>
            <div>
              <p className="text-[#D93636] mb-2 font-medium">3. Comissão</p>
              <p className="text-[#A0A0A0]">O afiliado recebe uma porcentagem de cada venda</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
