'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  Ticket,
  Search, 
  Filter,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Eye,
  X,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Bus,
  MessageCircle
} from 'lucide-react'
import { DashboardShell, AdminGuard } from '@/components/dashboard'
import { Button } from '@/components/ui/button'

// Função para formatar data relativa
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'agora mesmo'
  if (diffMinutes < 60) return `há ${diffMinutes} min`
  if (diffHours < 24) return `há ${diffHours}h`
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `há ${diffDays} dias`
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`
  
  return date.toLocaleDateString('pt-BR')
}

// Função para formatar moeda
function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100)
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

// Função para formatar CPF
function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }
  return cpf
}

interface Booking {
  id: string
  packageId: string
  package: {
    id: string
    title: string
    destination?: {
      name: string
    } | null
    destinationRel?: {
      name: string
    } | null
    departureDate?: string
    coverImage?: string
  }
  userId?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerCpf?: string
  numPassengers: number
  totalAmount: number
  selectedSeats?: number[]
  status: 'pending' | 'confirmed' | 'paid' | 'canceled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  paymentMethod?: string
  paidAt?: string
  notes?: string
  customerNotes?: string
  createdAt: string
  updatedAt: string
}

interface Stats {
  total: number
  pending: number
  confirmed: number
  paid: number
  canceled: number
  totalRevenue: number
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', icon: Clock },
  confirmed: { label: 'Confirmada', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: CheckCircle2 },
  paid: { label: 'Paga', color: 'bg-green-500/10 text-green-500 border-green-500/30', icon: DollarSign },
  canceled: { label: 'Cancelada', color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: XCircle },
}

const paymentStatusConfig = {
  pending: { label: 'Aguardando', color: 'bg-yellow-500/10 text-yellow-400' },
  paid: { label: 'Pago', color: 'bg-green-500/10 text-green-400' },
  failed: { label: 'Falhou', color: 'bg-red-500/10 text-red-400' },
}

export default function ReservasAdminPage() {
  return (
    <AdminGuard>
      <ReservasContent />
    </AdminGuard>
  )
}

function ReservasContent() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats>({ 
    total: 0, 
    pending: 0, 
    confirmed: 0, 
    paid: 0, 
    canceled: 0,
    totalRevenue: 0 
  })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const loadBookings = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/bookings')
      
      if (!response.ok) throw new Error('Erro ao carregar reservas')
      
      const { data } = await response.json()
      setBookings(data || [])
      
      // Calcular estatísticas
      const newStats: Stats = {
        total: data.length,
        pending: data.filter((b: Booking) => b.status === 'pending').length,
        confirmed: data.filter((b: Booking) => b.status === 'confirmed').length,
        paid: data.filter((b: Booking) => b.status === 'paid').length,
        canceled: data.filter((b: Booking) => b.status === 'canceled').length,
        totalRevenue: data
          .filter((b: Booking) => b.paymentStatus === 'paid')
          .reduce((sum: number, b: Booking) => sum + b.totalAmount, 0),
      }
      setStats(newStats)
    } catch (error) {
      console.error('Erro ao carregar reservas:', error)
      toast.error('Erro ao carregar reservas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const handleUpdateStatus = async (bookingId: string, status: string, paymentStatus?: string) => {
    try {
      setIsUpdating(true)
      
      const body: Record<string, string> = { id: bookingId, status }
      if (paymentStatus) body.paymentStatus = paymentStatus
      
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) throw new Error('Erro ao atualizar reserva')
      
      toast.success('Reserva atualizada com sucesso!')
      loadBookings()
      setSelectedBooking(null)
    } catch (error) {
      console.error('Erro ao atualizar reserva:', error)
      toast.error('Erro ao atualizar reserva')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOpenWhatsApp = (booking: Booking) => {
    const phone = booking.customerPhone.replace(/\D/g, '')
    const packageTitle = booking.package?.title || 'Pacote'
    const destination = booking.package?.destination?.name || booking.package?.destinationRel?.name || ''
    
    const message = `Olá ${booking.customerName}! 👋

Recebemos sua reserva para o pacote *${packageTitle}*${destination ? ` - ${destination}` : ''}.

📦 *Detalhes da Reserva:*
• Passageiros: ${booking.numPassengers}
${booking.selectedSeats && booking.selectedSeats.length > 0 ? `• Assentos: ${booking.selectedSeats.join(', ')}` : ''}
• Valor Total: ${formatCurrency(booking.totalAmount)}

Como podemos ajudar você a confirmar sua reserva?

_Amorim Turismo_`

    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Filtrar reservas
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = search === '' || 
      booking.customerName.toLowerCase().includes(search.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      booking.package?.title?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <DashboardShell 
      title="Reservas"
      action={
        <Button 
          variant="ghost" 
          size="sm"
          onClick={loadBookings}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-[#E0E0E0]">{stats.total}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Pendentes</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Confirmadas</p>
              <p className="text-xl font-bold text-blue-600">{stats.confirmed}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Pagas</p>
              <p className="text-xl font-bold text-green-600">{stats.paid}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Canceladas</p>
              <p className="text-xl font-bold text-red-600">{stats.canceled}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Receita</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou pacote..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="paid">Pagas</option>
              <option value="canceled">Canceladas</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Lista de Reservas */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-[#A0A0A0]">
                {search || statusFilter !== 'all' 
                  ? 'Nenhuma reserva encontrada com os filtros aplicados'
                  : 'Nenhuma reserva encontrada'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-[#333]">
              {filteredBookings.map((booking) => {
                const StatusIcon = statusConfig[booking.status]?.icon || Clock
                const destinationName = booking.package?.destination?.name || booking.package?.destinationRel?.name || ''
                
                return (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Info Principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {booking.customerName}
                              </h3>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig[booking.status]?.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig[booking.status]?.label}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusConfig[booking.paymentStatus]?.color}`}>
                                {paymentStatusConfig[booking.paymentStatus]?.label}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-500 dark:text-[#A0A0A0] mt-1">
                              {booking.package?.title}
                              {destinationName && ` • ${destinationName}`}
                            </p>
                            
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-[#A0A0A0]">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {booking.customerEmail}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {booking.customerPhone}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {booking.numPassengers} passageiro(s)
                              </span>
                              {booking.selectedSeats && booking.selectedSeats.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Bus className="w-3 h-3" />
                                  Assentos: {booking.selectedSeats.sort((a, b) => a - b).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Valor e Ações */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(booking.totalAmount)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">
                            {formatRelativeDate(booking.createdAt)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenWhatsApp(booking)}
                            className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Contatar via WhatsApp"
                          >
                            <MessageCircle className="w-5 h-5 text-green-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-[#333] p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalhes da Reserva
              </h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#333] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {/* Info do Pacote */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-[#A0A0A0]">Pacote</h3>
                <p className="font-semibold text-gray-900 dark:text-white break-words">
                  {selectedBooking.package?.title}
                </p>
                {(selectedBooking.package?.destination?.name || selectedBooking.package?.destinationRel?.name) && (
                  <p className="text-sm text-gray-500 dark:text-[#A0A0A0] flex items-center gap-1">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    {selectedBooking.package?.destination?.name || selectedBooking.package?.destinationRel?.name}
                  </p>
                )}
              </div>

              {/* Info do Cliente */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-[#A0A0A0]">Cliente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Nome</p>
                    <p className="font-medium text-gray-900 dark:text-white break-words">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">E-mail</p>
                    <p className="font-medium text-gray-900 dark:text-white break-all text-sm">{selectedBooking.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Telefone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatPhone(selectedBooking.customerPhone)}</p>
                  </div>
                  {selectedBooking.customerCpf && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">CPF</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatCpf(selectedBooking.customerCpf)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info da Reserva */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-[#A0A0A0]">Reserva</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Passageiros</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.numPassengers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Valor Total</p>
                    <p className="font-bold text-green-600">{formatCurrency(selectedBooking.totalAmount)}</p>
                  </div>
                  {selectedBooking.selectedSeats && selectedBooking.selectedSeats.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Assentos Reservados</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedBooking.selectedSeats.sort((a, b) => a - b).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações do Cliente */}
              {selectedBooking.customerNotes && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-[#A0A0A0]">Observações do Cliente</h3>
                  <p className="text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-[#252525] rounded-lg">
                    {selectedBooking.customerNotes}
                  </p>
                </div>
              )}

              {/* Status Atual */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 dark:bg-[#252525] rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Status da Reserva</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium border ${statusConfig[selectedBooking.status]?.color}`}>
                    {statusConfig[selectedBooking.status]?.label}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Status do Pagamento</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${paymentStatusConfig[selectedBooking.paymentStatus]?.color}`}>
                    {paymentStatusConfig[selectedBooking.paymentStatus]?.label}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="border-t border-gray-200 dark:border-[#333] pt-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-500 dark:text-[#A0A0A0]">Ações</h3>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {selectedBooking.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')}
                        disabled={isUpdating}
                        className="w-full sm:flex-1"
                        size="md"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Confirmar Reserva
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedBooking.id, 'canceled')}
                        disabled={isUpdating}
                        className="w-full sm:flex-1"
                        size="md"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  
                  {selectedBooking.status === 'confirmed' && (
                    <>
                      <Button
                        onClick={() => handleUpdateStatus(selectedBooking.id, 'paid', 'paid')}
                        disabled={isUpdating}
                        className="w-full sm:flex-1"
                        size="md"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <DollarSign className="w-4 h-4 mr-2" />
                        )}
                        Marcar como Pago
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedBooking.id, 'canceled')}
                        disabled={isUpdating}
                        className="w-full sm:flex-1"
                        size="md"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => handleOpenWhatsApp(selectedBooking)}
                    className="w-full sm:flex-1"
                    size="md"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
