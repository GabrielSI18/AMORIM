import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Users, Mail, Calendar, Search, Filter, Phone, Ticket } from 'lucide-react'
import Image from 'next/image'
import { PageHeader } from '@/components/dashboard'

// Tipo unificado de cliente
interface UnifiedClient {
  id: string
  name: string
  email: string
  phone?: string
  imageUrl?: string
  source: 'user' | 'booking' // De onde veio
  bookingsCount: number
  createdAt: Date
  clerkId?: string
}

// Função para formatar telefone
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

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
  const users = await prisma.user.findMany({
    where: { role: 'USER' } as any,
    orderBy: { created_at: 'desc' },
    include: {
      bookings: {
        select: { id: true },
      },
    } as any,
  }) as any[]

  // Buscar reservas de clientes sem conta (user_id null)
  const guestBookings = await prisma.booking.findMany({
    where: { 
      user_id: null,
      status: { not: 'canceled' }
    },
    orderBy: { created_at: 'desc' },
  }) as any[]

  // Agrupar reservas por email do cliente (clientes guest)
  const guestClientsMap = new Map<string, {
    name: string
    email: string
    phone: string
    bookingsCount: number
    firstCreatedAt: Date
  }>()

  for (const booking of guestBookings) {
    // Pular reservas sem email
    if (!booking.customer_email) continue
    
    const existing = guestClientsMap.get(booking.customer_email)
    if (existing) {
      existing.bookingsCount++
      // Manter a data mais antiga
      if (new Date(booking.created_at) < existing.firstCreatedAt) {
        existing.firstCreatedAt = new Date(booking.created_at)
      }
    } else {
      guestClientsMap.set(booking.customer_email, {
        name: booking.customer_name || 'Cliente',
        email: booking.customer_email,
        phone: booking.customer_phone || '',
        bookingsCount: 1,
        firstCreatedAt: new Date(booking.created_at),
      })
    }
  }

  // Emails de usuários cadastrados (para evitar duplicação)
  const userEmails = new Set(users.map(u => u.email?.toLowerCase()).filter(Boolean))

  // Criar lista unificada de clientes
  const clients: UnifiedClient[] = []

  // Adicionar usuários cadastrados
  for (const u of users) {
    clients.push({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      email: u.email,
      imageUrl: u.image_url,
      source: 'user',
      bookingsCount: u.bookings?.length || 0,
      createdAt: new Date(u.created_at),
      clerkId: u.clerk_id,
    })
  }

  // Adicionar clientes de reserva (sem conta) que não são usuários cadastrados
  for (const [email, guest] of guestClientsMap) {
    if (!userEmails.has(email.toLowerCase())) {
      clients.push({
        id: `guest-${email}`,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        source: 'booking',
        bookingsCount: guest.bookingsCount,
        createdAt: guest.firstCreatedAt,
      })
    }
  }

  // Ordenar por data de criação (mais recente primeiro)
  clients.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const totalClients = clients.length
  const thisMonth = clients.filter(c => {
    const now = new Date()
    return c.createdAt.getMonth() === now.getMonth() && 
           c.createdAt.getFullYear() === now.getFullYear()
  }).length
  const withBookings = clients.filter(c => c.bookingsCount > 0).length

  return (
    <>
      <PageHeader title="Clientes" />
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-[#E0E0E0]">{totalClients}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Novos este mês</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-[#E0E0E0]">{thisMonth}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Com Reservas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-[#E0E0E0]">{withBookings}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#A0A0A0]" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] placeholder:text-gray-500 dark:placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#D93636] transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] text-gray-500 dark:text-[#A0A0A0] rounded-lg hover:border-[#D93636] transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        {/* Client Cards (Mobile) */}
        <div className="block lg:hidden space-y-4">
          {clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-[#A0A0A0] bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333]">
              Nenhum cliente cadastrado ainda.
            </div>
          ) : (
            clients.map((client) => (
              <div 
                key={client.id} 
                className="p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] overflow-hidden flex-shrink-0">
                    {client.imageUrl ? (
                      <Image
                        src={client.imageUrl}
                        alt={client.name || 'Avatar'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-[#A0A0A0] text-lg font-medium">
                        {client.name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-[#E0E0E0] truncate">
                        {client.name}
                      </p>
                      {client.source === 'booking' && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-orange-500/10 text-orange-400">
                          <Ticket className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-[#A0A0A0] truncate">{client.email}</p>
                  </div>
                </div>
                
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#A0A0A0]">
                    <Phone className="w-4 h-4" />
                    {formatPhone(client.phone)}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.bookingsCount > 0 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {client.bookingsCount} reserva{client.bookingsCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-500 dark:text-[#A0A0A0]">
                    {client.createdAt.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <button className="w-full py-2 text-sm bg-gray-50 dark:bg-[#2A2A2A] text-gray-900 dark:text-[#E0E0E0] hover:bg-gray-100 dark:hover:bg-[#333] rounded-lg transition-colors">
                  Ver detalhes
                </button>
              </div>
            ))
          )}
        </div>

        {/* Table (Desktop) */}
        <div className="hidden lg:block bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#2A2A2A] border-b border-gray-200 dark:border-[#333]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">Contato</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">Origem</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">Reservas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">Cadastro</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-[#A0A0A0]">
                      Nenhum cliente cadastrado ainda.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] overflow-hidden">
                            {client.imageUrl ? (
                              <Image
                                src={client.imageUrl}
                                alt={client.name || 'Avatar'}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-[#A0A0A0]">
                                {client.name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-[#E0E0E0]">
                              {client.name}
                            </p>
                            {client.clerkId && (
                              <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">ID: {client.clerkId.slice(0, 12)}...</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-[#A0A0A0]">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{client.email}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-[#A0A0A0]">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm">{formatPhone(client.phone)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          client.source === 'user' 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {client.source === 'user' ? (
                            <>
                              <Users className="w-3 h-3" />
                              Cadastrado
                            </>
                          ) : (
                            <>
                              <Ticket className="w-3 h-3" />
                              Reserva
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.bookingsCount > 0 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {client.bookingsCount} reserva{client.bookingsCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-[#A0A0A0]">
                        {client.createdAt.toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-[#2A2A2A] text-gray-500 dark:text-[#A0A0A0] hover:text-gray-900 dark:hover:text-[#E0E0E0] rounded-lg transition-colors">
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
    </>
  )
}
