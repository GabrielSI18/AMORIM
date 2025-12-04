import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Users, Mail, Calendar, Search, Filter } from 'lucide-react'
import Image from 'next/image'
import { DashboardShell } from '@/components/dashboard'

export default async function ClientesPage() {
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

  // Buscar clientes (usuários com role USER)
  const clients = await prisma.user.findMany({
    where: { role: 'USER' } as any,
    orderBy: { created_at: 'desc' },
    include: {
      bookings: {
        select: { id: true },
      },
    } as any,
  }) as any[]

  const totalClients = clients.length
  const thisMonth = clients.filter(c => {
    const now = new Date()
    const createdAt = new Date(c.created_at)
    return createdAt.getMonth() === now.getMonth() && 
           createdAt.getFullYear() === now.getFullYear()
  }).length
  const withBookings = clients.filter(c => c.bookings.length > 0).length

  return (
    <DashboardShell title="Clientes">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-[#1E1E1E] border border-[#333] rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-[#A0A0A0]">Total de Clientes</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">{totalClients}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#1E1E1E] border border-[#333] rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-[#A0A0A0]">Novos este mês</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">{thisMonth}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#1E1E1E] border border-[#333] rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-[#A0A0A0]">Com Reservas</p>
              <p className="text-2xl font-bold text-[#E0E0E0]">{withBookings}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#1E1E1E] border border-[#333] text-[#E0E0E0] placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#D93636] transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1E1E1E] border border-[#333] text-[#A0A0A0] rounded-lg hover:border-[#D93636] transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        {/* Client Cards (Mobile) */}
        <div className="block lg:hidden space-y-4">
          {clients.length === 0 ? (
            <div className="p-8 text-center text-[#A0A0A0] bg-[#1E1E1E] rounded-xl border border-[#333]">
              Nenhum cliente cadastrado ainda.
            </div>
          ) : (
            clients.map((client) => (
              <div 
                key={client.id} 
                className="p-4 bg-[#1E1E1E] border border-[#333] rounded-xl space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#2A2A2A] border border-[#333] overflow-hidden flex-shrink-0">
                    {client.image_url ? (
                      <Image
                        src={client.image_url}
                        alt={client.name || 'Avatar'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A0A0A0] text-lg font-medium">
                        {client.first_name?.[0] || client.email[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#E0E0E0] truncate">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="text-sm text-[#A0A0A0] truncate">{client.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.bookings.length > 0 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {client.bookings.length} reserva{client.bookings.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[#A0A0A0]">
                    {new Date(client.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <button className="w-full py-2 text-sm bg-[#2A2A2A] text-[#E0E0E0] hover:bg-[#333] rounded-lg transition-colors">
                  Ver detalhes
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#E0E0E0]">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#E0E0E0]">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#E0E0E0]">Reservas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#E0E0E0]">Cadastro</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#E0E0E0]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#A0A0A0]">
                      Nenhum cliente cadastrado ainda.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="hover:bg-[#2A2A2A] transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#2A2A2A] border border-[#333] overflow-hidden">
                            {client.image_url ? (
                              <Image
                                src={client.image_url}
                                alt={client.name || 'Avatar'}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#A0A0A0]">
                                {client.first_name?.[0] || client.email[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#E0E0E0]">
                              {client.first_name} {client.last_name}
                            </p>
                            <p className="text-sm text-[#A0A0A0]">ID: {client.clerk_id.slice(0, 12)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[#A0A0A0]">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.bookings.length > 0 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {client.bookings.length} reserva{client.bookings.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#A0A0A0]">
                        {new Date(client.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 text-sm bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#E0E0E0] rounded-lg transition-colors">
                            Ver detalhes
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
      </div>
    </DashboardShell>
  )
}
