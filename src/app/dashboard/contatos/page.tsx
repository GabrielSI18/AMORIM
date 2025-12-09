'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  MessageSquare, 
  Search, 
  Filter,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  Loader2,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Eye,
  X
} from 'lucide-react'
import { DashboardShell } from '@/components/dashboard'

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

interface Contact {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  status: 'pending' | 'in_progress' | 'resolved' | 'archived'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  notes: string | null
  read_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

interface Stats {
  pending: number
  in_progress: number
  resolved: number
  archived: number
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', icon: Clock },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Loader2 },
  resolved: { label: 'Resolvido', color: 'bg-green-500/10 text-green-500 border-green-500/30', icon: CheckCircle2 },
  archived: { label: 'Arquivado', color: 'bg-gray-500/10 text-gray-500 border-gray-500/30', icon: Archive },
}

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-500/10 text-gray-400' },
  normal: { label: 'Normal', color: 'bg-blue-500/10 text-blue-400' },
  high: { label: 'Alta', color: 'bg-orange-500/10 text-orange-400' },
  urgent: { label: 'Urgente', color: 'bg-red-500/10 text-red-400' },
}

export default function ContatosAdminPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, in_progress: 0, resolved: 0, archived: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const loadContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)

      const res = await fetch(`/api/contacts?${params.toString()}`)
      
      if (res.status === 403) {
        toast.error('Você não tem permissão para acessar esta página')
        router.push('/dashboard')
        return
      }

      if (!res.ok) {
        throw new Error('Erro ao carregar contatos')
      }

      const data = await res.json()
      setContacts(data.data || [])
      setStats(data.stats || { pending: 0, in_progress: 0, resolved: 0, archived: 0 })
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
      toast.error('Erro ao carregar contatos')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, priorityFilter, router])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        throw new Error('Erro ao atualizar contato')
      }

      toast.success('Contato atualizado!')
      loadContacts()
      
      if (selectedContact?.id === id) {
        setSelectedContact(prev => prev ? { ...prev, ...updates } : null)
      }
    } catch (error) {
      console.error('Erro ao atualizar contato:', error)
      toast.error('Erro ao atualizar contato')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (date: string) => {
    return formatRelativeDate(date)
  }

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    const message = encodeURIComponent(`Olá ${name}! Sou da Amorim Turismo e estou entrando em contato sobre sua mensagem.`)
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank')
  }

  const openEmail = (email: string, subject: string | null) => {
    const subjectText = subject ? `Re: ${subject}` : 'Resposta - Amorim Turismo'
    window.open(`mailto:${email}?subject=${encodeURIComponent(subjectText)}`, '_blank')
  }

  return (
    <DashboardShell title="Contatos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#E0E0E0]">Central de Contatos</h1>
            <p className="text-[#A0A0A0]">Gerencie mensagens recebidas pelo formulário de contato</p>
          </div>
          <button
            onClick={() => loadContacts()}
            className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] hover:bg-[#333] transition"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className={`p-4 rounded-xl border transition ${
              statusFilter === 'pending' 
                ? 'bg-yellow-500/20 border-yellow-500/50' 
                : 'bg-[#1E1E1E] border-[#333] hover:border-yellow-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-[#E0E0E0]">{stats.pending}</p>
                <p className="text-sm text-[#A0A0A0]">Pendentes</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
            className={`p-4 rounded-xl border transition ${
              statusFilter === 'in_progress' 
                ? 'bg-blue-500/20 border-blue-500/50' 
                : 'bg-[#1E1E1E] border-[#333] hover:border-blue-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-[#E0E0E0]">{stats.in_progress}</p>
                <p className="text-sm text-[#A0A0A0]">Em Andamento</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
            className={`p-4 rounded-xl border transition ${
              statusFilter === 'resolved' 
                ? 'bg-green-500/20 border-green-500/50' 
                : 'bg-[#1E1E1E] border-[#333] hover:border-green-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-[#E0E0E0]">{stats.resolved}</p>
                <p className="text-sm text-[#A0A0A0]">Resolvidos</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'archived' ? 'all' : 'archived')}
            className={`p-4 rounded-xl border transition ${
              statusFilter === 'archived' 
                ? 'bg-gray-500/20 border-gray-500/50' 
                : 'bg-[#1E1E1E] border-[#333] hover:border-gray-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <Archive className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-[#E0E0E0]">{stats.archived}</p>
                <p className="text-sm text-[#A0A0A0]">Arquivados</p>
              </div>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone ou mensagem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1E1E1E] border border-[#333] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 bg-[#1E1E1E] border border-[#333] rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition cursor-pointer"
              >
                <option value="all">Todas Prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="normal">Normal</option>
                <option value="low">Baixa</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#D93636] animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-[#444] mx-auto mb-4" />
              <p className="text-[#A0A0A0]">Nenhum contato encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-[#333]">
              {contacts.map((contact) => {
                const StatusIcon = statusConfig[contact.status].icon
                return (
                  <div
                    key={contact.id}
                    className={`p-4 hover:bg-[#2A2A2A] transition cursor-pointer ${
                      !contact.read_at ? 'bg-[#D93636]/5' : ''
                    }`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Indicador não lido */}
                      <div className="pt-1">
                        {!contact.read_at && (
                          <div className="w-2 h-2 bg-[#D93636] rounded-full" />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#E0E0E0] truncate">{contact.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${statusConfig[contact.status].color}`}>
                            {statusConfig[contact.status].label}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${priorityConfig[contact.priority].color}`}>
                            {priorityConfig[contact.priority].label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-[#A0A0A0] mb-2">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>

                        {contact.subject && (
                          <p className="text-sm text-[#D93636] mb-1">
                            Assunto: {contact.subject}
                          </p>
                        )}

                        <p className="text-sm text-[#A0A0A0] line-clamp-2">
                          {contact.message}
                        </p>
                      </div>

                      {/* Data e ações */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-[#666] mb-2">
                          {formatDate(contact.created_at)}
                        </p>
                        <div className="flex items-center gap-1">
                          {contact.phone && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openWhatsApp(contact.phone!, contact.name)
                              }}
                              className="p-2 hover:bg-green-500/10 rounded-lg transition"
                              title="Abrir WhatsApp"
                            >
                              <Phone className="w-4 h-4 text-green-500" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEmail(contact.email, contact.subject)
                            }}
                            className="p-2 hover:bg-blue-500/10 rounded-lg transition"
                            title="Enviar E-mail"
                          >
                            <Mail className="w-4 h-4 text-blue-500" />
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
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#1E1E1E] border border-[#333] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#333]">
              <div>
                <h2 className="text-xl font-bold text-[#E0E0E0]">{selectedContact.name}</h2>
                <p className="text-sm text-[#A0A0A0]">{formatDate(selectedContact.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 hover:bg-[#2A2A2A] rounded-lg transition"
              >
                <X className="w-5 h-5 text-[#A0A0A0]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Informações de Contato */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-[#2A2A2A] rounded-lg">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-[#A0A0A0]">E-mail</p>
                    <p className="text-[#E0E0E0]">{selectedContact.email}</p>
                  </div>
                  <button
                    onClick={() => openEmail(selectedContact.email, selectedContact.subject)}
                    className="ml-auto p-2 hover:bg-[#333] rounded-lg transition"
                  >
                    <ExternalLink className="w-4 h-4 text-[#A0A0A0]" />
                  </button>
                </div>

                {selectedContact.phone && (
                  <div className="flex items-center gap-3 p-3 bg-[#2A2A2A] rounded-lg">
                    <Phone className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-[#A0A0A0]">Telefone</p>
                      <p className="text-[#E0E0E0]">{selectedContact.phone}</p>
                    </div>
                    <button
                      onClick={() => openWhatsApp(selectedContact.phone!, selectedContact.name)}
                      className="ml-auto p-2 hover:bg-[#333] rounded-lg transition"
                    >
                      <ExternalLink className="w-4 h-4 text-[#A0A0A0]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Assunto */}
              {selectedContact.subject && (
                <div>
                  <p className="text-sm text-[#A0A0A0] mb-1">Assunto</p>
                  <p className="text-[#D93636] font-medium">{selectedContact.subject}</p>
                </div>
              )}

              {/* Mensagem */}
              <div>
                <p className="text-sm text-[#A0A0A0] mb-2">Mensagem</p>
                <div className="p-4 bg-[#2A2A2A] rounded-lg">
                  <p className="text-[#E0E0E0] whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              {/* Status e Prioridade */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#A0A0A0] mb-2">Status</p>
                  <select
                    value={selectedContact.status}
                    onChange={(e) => updateContact(selectedContact.id, { status: e.target.value as Contact['status'] })}
                    disabled={isUpdating}
                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="resolved">Resolvido</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>

                <div>
                  <p className="text-sm text-[#A0A0A0] mb-2">Prioridade</p>
                  <select
                    value={selectedContact.priority}
                    onChange={(e) => updateContact(selectedContact.id, { priority: e.target.value as Contact['priority'] })}
                    disabled={isUpdating}
                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
                  >
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Notas Internas */}
              <div>
                <p className="text-sm text-[#A0A0A0] mb-2">Notas Internas (visível apenas para admins)</p>
                <textarea
                  defaultValue={selectedContact.notes || ''}
                  placeholder="Adicione notas sobre este contato..."
                  rows={3}
                  onBlur={(e) => {
                    if (e.target.value !== (selectedContact.notes || '')) {
                      updateContact(selectedContact.id, { notes: e.target.value })
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition resize-none"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t border-[#333]">
              <div className="text-xs text-[#666]">
                {selectedContact.read_at && (
                  <span>Lido {formatDate(selectedContact.read_at)}</span>
                )}
                {selectedContact.resolved_at && (
                  <span className="ml-4">Resolvido {formatDate(selectedContact.resolved_at)}</span>
                )}
              </div>

              <div className="flex gap-2">
                {selectedContact.phone && (
                  <button
                    onClick={() => openWhatsApp(selectedContact.phone!, selectedContact.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    <Phone className="w-4 h-4" />
                    WhatsApp
                  </button>
                )}
                <button
                  onClick={() => openEmail(selectedContact.email, selectedContact.subject)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Mail className="w-4 h-4" />
                  E-mail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
