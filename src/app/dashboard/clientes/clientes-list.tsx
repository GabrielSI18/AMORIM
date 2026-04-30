'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { CLIENTES_REFRESH_EVENT, ClientesActions } from './clientes-actions'
import {
  Users,
  Mail,
  Calendar,
  Search,
  Phone,
  Ticket,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react'

interface UnifiedClient {
  id: string
  name: string
  email: string
  phone: string | null
  cpf: string | null
  imageUrl: string | null
  source: 'user' | 'booking'
  userSource: string | null
  bookingsCount: number
  createdAt: string
  clerkId: string | null
  notes: string | null
}

interface ClientsResponse {
  data: UnifiedClient[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  stats: { total: number; thisMonth: number; withBookings: number }
}

type SortBy = 'name' | 'date' | 'bookings'
type SortOrder = 'asc' | 'desc'
type SourceFilter = 'all' | 'user' | 'booking'

const PAGE_SIZE = 20

function formatPhone(phone: string | null) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return phone
}

function formatCpf(cpf: string | null) {
  if (!cpf) return null
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text: string, term: string) {
  if (!term) return text
  const trimmed = term.trim()
  if (!trimmed) return text
  try {
    const re = new RegExp(`(${escapeRegex(trimmed)})`, 'ig')
    const parts = text.split(re)
    return parts.map((p, idx) =>
      re.test(p) ? (
        <mark key={idx} className="bg-yellow-200 dark:bg-yellow-500/40 rounded px-0.5 text-inherit">
          {p}
        </mark>
      ) : (
        <span key={idx}>{p}</span>
      ),
    )
  } catch {
    return text
  }
}

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function ClientesList() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [page, setPage] = useState(1)
  const [refreshTick, setRefreshTick] = useState(0)
  const [data, setData] = useState<ClientsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Escuta refresh disparado pelos botões "Novo Cliente" / "Importar CSV"
  useEffect(() => {
    const handler = () => setRefreshTick((t) => t + 1)
    window.addEventListener(CLIENTES_REFRESH_EVENT, handler)
    return () => window.removeEventListener(CLIENTES_REFRESH_EVENT, handler)
  }, [])

  // Reset page quando filtros mudam
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, sortBy, sortOrder, sourceFilter])

  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy,
        sortOrder,
        source: sourceFilter,
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/clients?${params.toString()}`)
      if (!res.ok) throw new Error('Falha ao carregar clientes')
      const json = (await res.json()) as ClientsResponse
      setData(json)
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, sortBy, sortOrder, sourceFilter, debouncedSearch])

  useEffect(() => {
    fetchClients()
  }, [fetchClients, refreshTick])

  const stats = data?.stats
  const pagination = data?.pagination
  const clients = data?.data || []

  const sortLabel = useMemo(() => {
    const map: Record<SortBy, string> = { name: 'Nome', date: 'Cadastro', bookings: 'Reservas' }
    return `${map[sortBy]} (${sortOrder === 'asc' ? 'crescente' : 'decrescente'})`
  }, [sortBy, sortOrder])

  return (
    <div className="space-y-6 px-4 sm:px-6 py-2">
      {/* Ações: Novo Cliente + Importar CSV */}
      <div className="flex items-center justify-end">
        <ClientesActions />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          icon={<Users className="w-6 h-6 text-blue-400" />}
          color="bg-blue-500/10"
          label="Total de Clientes"
          value={stats?.total ?? '—'}
          loading={isLoading && !stats}
        />
        <StatsCard
          icon={<Calendar className="w-6 h-6 text-green-400" />}
          color="bg-green-500/10"
          label="Novos este mês"
          value={stats?.thisMonth ?? '—'}
          loading={isLoading && !stats}
        />
        <StatsCard
          icon={<Users className="w-6 h-6 text-purple-400" />}
          color="bg-purple-500/10"
          label="Com Reservas"
          value={stats?.withBookings ?? '—'}
          loading={isLoading && !stats}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#A0A0A0]" />
          <input
            type="text"
            placeholder="Buscar por nome, email, telefone ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-10 rounded-lg bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] placeholder:text-gray-500 dark:placeholder:text-[#A0A0A0] focus:outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded transition"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Origem */}
          <div className="relative">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
              className="appearance-none h-10 pl-3 pr-9 rounded-lg bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-[#E0E0E0] focus:outline-none focus:border-primary transition cursor-pointer"
            >
              <option value="all">Todas as origens</option>
              <option value="user">Cadastrados</option>
              <option value="booking">Apenas reserva</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Ordenação */}
          <div className="relative">
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split(':') as [SortBy, SortOrder]
                setSortBy(by)
                setSortOrder(order)
              }}
              className="appearance-none h-10 pl-3 pr-9 rounded-lg bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-[#E0E0E0] focus:outline-none focus:border-primary transition cursor-pointer"
            >
              <option value="date:desc">Mais recentes</option>
              <option value="date:asc">Mais antigos</option>
              <option value="name:asc">Nome (A-Z)</option>
              <option value="name:desc">Nome (Z-A)</option>
              <option value="bookings:desc">Mais reservas</option>
              <option value="bookings:asc">Menos reservas</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Resultado */}
      {isLoading && clients.length === 0 ? (
        <div className="flex items-center justify-center py-12 bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : clients.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-[#A0A0A0] bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333]">
          {debouncedSearch
            ? `Nenhum cliente encontrado para "${debouncedSearch}".`
            : 'Nenhum cliente cadastrado ainda.'}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="block lg:hidden space-y-3">
            {clients.map((c) => (
              <ClientCard key={c.id} client={c} term={debouncedSearch} />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#2A2A2A] border-b border-gray-200 dark:border-[#333]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">
                      <SortHeader label="Cliente" by="name" current={sortBy} order={sortOrder} onClick={(o) => { setSortBy('name'); setSortOrder(o) }} />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">
                      Contato
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">
                      Origem
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">
                      <SortHeader label="Reservas" by="bookings" current={sortBy} order={sortOrder} onClick={(o) => { setSortBy('bookings'); setSortOrder(o) }} />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-[#E0E0E0]">
                      <SortHeader label="Cadastro" by="date" current={sortBy} order={sortOrder} onClick={(o) => { setSortBy('date'); setSortOrder(o) }} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                  {clients.map((c) => (
                    <ClientRow key={c.id} client={c} term={debouncedSearch} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-3 px-1">
              <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">
                Mostrando <strong>{(pagination.page - 1) * pagination.limit + 1}</strong>—
                <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> de{' '}
                <strong>{pagination.total}</strong> · {sortLabel}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1 || isLoading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-[#333] text-gray-700 dark:text-[#E0E0E0] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-[#A0A0A0]">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-[#333] text-gray-700 dark:text-[#E0E0E0] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SortHeader({
  label,
  by,
  current,
  order,
  onClick,
}: {
  label: string
  by: SortBy
  current: SortBy
  order: SortOrder
  onClick: (o: SortOrder) => void
}) {
  const active = current === by
  const nextOrder: SortOrder = active && order === 'desc' ? 'asc' : 'desc'
  return (
    <button
      type="button"
      onClick={() => onClick(nextOrder)}
      className={`inline-flex items-center gap-1 ${active ? 'text-primary' : ''}`}
    >
      {label}
      {active && <ChevronDown className={`w-3 h-3 transition-transform ${order === 'asc' ? 'rotate-180' : ''}`} />}
    </button>
  )
}

function StatsCard({
  icon,
  color,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode
  color: string
  label: string
  value: number | string
  loading: boolean
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-[#E0E0E0]">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : value}
        </p>
      </div>
    </div>
  )
}

function Avatar({ client }: { client: UnifiedClient }) {
  if (client.imageUrl) {
    return (
      <Image
        src={client.imageUrl}
        alt={client.name}
        width={40}
        height={40}
        className="w-full h-full object-cover"
      />
    )
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-[#A0A0A0] text-sm font-medium">
      {client.name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
    </div>
  )
}

function SourceBadge({ client }: { client: UnifiedClient }) {
  if (client.source === 'booking') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400">
        <Ticket className="w-3 h-3" />
        Reserva
      </span>
    )
  }
  // user
  const variant = client.userSource === 'manual' || client.userSource === 'import'
    ? { label: client.userSource === 'import' ? 'Importado' : 'Manual', color: 'bg-purple-500/10 text-purple-400' }
    : { label: 'Cadastrado', color: 'bg-blue-500/10 text-blue-400' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${variant.color}`}>
      <Users className="w-3 h-3" />
      {variant.label}
    </span>
  )
}

function ClientRow({ client, term }: { client: UnifiedClient; term: string }) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] overflow-hidden">
            <Avatar client={client} />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-[#E0E0E0]">
              {highlight(client.name, term)}
            </p>
            {client.cpf && (
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">
                CPF: {highlight(formatCpf(client.cpf) || '', term)}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-500 dark:text-[#A0A0A0]">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{highlight(client.email, term)}</span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-[#A0A0A0]">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{highlight(formatPhone(client.phone) || '', term)}</span>
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <SourceBadge client={client} />
      </td>
      <td className="px-6 py-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            client.bookingsCount > 0
              ? 'bg-green-500/10 text-green-400'
              : 'bg-gray-500/10 text-gray-400'
          }`}
        >
          {client.bookingsCount} reserva{client.bookingsCount !== 1 ? 's' : ''}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-500 dark:text-[#A0A0A0]">
        {new Date(client.createdAt).toLocaleDateString('pt-BR')}
      </td>
    </tr>
  )
}

function ClientCard({ client, term }: { client: UnifiedClient; term: string }) {
  return (
    <div className="p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] overflow-hidden flex-shrink-0">
          <Avatar client={client} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 dark:text-[#E0E0E0] truncate">
              {highlight(client.name, term)}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-[#A0A0A0] truncate">
            {highlight(client.email, term)}
          </p>
        </div>
        <SourceBadge client={client} />
      </div>

      {(client.phone || client.cpf) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-[#A0A0A0]">
          {client.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {highlight(formatPhone(client.phone) || '', term)}
            </span>
          )}
          {client.cpf && (
            <span className="text-xs">CPF: {highlight(formatCpf(client.cpf) || '', term)}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            client.bookingsCount > 0
              ? 'bg-green-500/10 text-green-400'
              : 'bg-gray-500/10 text-gray-400'
          }`}
        >
          {client.bookingsCount} reserva{client.bookingsCount !== 1 ? 's' : ''}
        </span>
        <span className="text-gray-500 dark:text-[#A0A0A0]">
          {new Date(client.createdAt).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  )
}
