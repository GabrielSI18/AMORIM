'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { DashboardShell } from '@/components/dashboard'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
import { 
  Handshake,
  Link as LinkIcon,
  Copy,
  Check,
  Percent,
  Users,
  Package,
  TrendingUp,
  Clock,
  DollarSign,
  ExternalLink,
  ArrowRight,
  Zap,
  Trophy,
  Rocket,
  Gift,
  Star,
  CheckCircle2,
  AlertCircle,
  Phone,
  CreditCard,
  Wallet,
  MapPin,
  Calendar,
  Eye
} from 'lucide-react'

interface AffiliateData {
  id: string
  code: string
  name: string
  email: string
  commissionRate: number
  totalSales: number
  totalEarned: number
  totalBookings: number
  status: string
  approvedAt: string | null
  createdAt: string
  pixKey: string | null
  referrals: {
    id: string
    packageTitle: string
    customerEmail: string
    saleAmount: number
    commissionAmount: number
    commissionStatus: string
    createdAt: string
  }[]
  stats: {
    totalReferrals: number
    pendingReferrals: number
    approvedReferrals: number
    paidReferrals: number
    pendingCommission: number
    approvedCommission: number
    paidCommission: number
  }
}

interface PackageData {
  id: string
  title: string
  slug: string
  destination: string | null
  destinationRel?: { name: string } | null
  durationDays: number | null
  price: number
  originalPrice: number | null
  coverImage: string | null
  isFeatured: boolean
}

export default function ParceiroPage() {
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isAffiliate, setIsAffiliate] = useState(false)
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null)
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedPackageLink, setCopiedPackageLink] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      checkAffiliateStatus()
    }
  }, [userId])

  // Carregar pacotes quando afiliado estiver ativo
  useEffect(() => {
    if (isAffiliate && affiliateData?.status?.toLowerCase() === 'active') {
      fetchPackages()
    }
  }, [isAffiliate, affiliateData?.status])

  const fetchPackages = async () => {
    try {
      setLoadingPackages(true)
      const res = await fetch('/api/packages?status=published&limit=20')
      const data = await res.json()
      setPackages(data.data || [])
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error)
    } finally {
      setLoadingPackages(false)
    }
  }

  const checkAffiliateStatus = async () => {
    try {
      const res = await fetch('/api/affiliates/me')
      const data = await res.json()
      
      setIsAffiliate(data.isAffiliate)
      setAffiliateData(data.data)
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyCode = () => {
    if (affiliateData?.code) {
      navigator.clipboard.writeText(affiliateData.code)
      setCopied(true)
      toast.success('Código copiado!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyLink = () => {
    if (affiliateData?.code) {
      const link = `${window.location.origin}/pacotes?ref=${affiliateData.code}`
      navigator.clipboard.writeText(link)
      setCopiedLink(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const copyPackageLink = (slug: string, packageId: string) => {
    if (affiliateData?.code) {
      const link = `${window.location.origin}/pacotes/${slug}?ref=${affiliateData.code}`
      navigator.clipboard.writeText(link)
      setCopiedPackageLink(packageId)
      toast.success('Link do pacote copiado!')
      setTimeout(() => setCopiedPackageLink(null), 2000)
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  if (isLoading) {
    return (
      <DashboardShell title="Parceiro Amorim">
        <div className="flex flex-col gap-6 p-4 pb-24">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </DashboardShell>
    )
  }

  // Se não é afiliado, mostra landing page de cadastro
  if (!isAffiliate) {
    return (
      <DashboardShell title="Seja Parceiro">
        <NotAffiliateView onSuccess={checkAffiliateStatus} />
      </DashboardShell>
    )
  }

  // Se afiliado está pendente de aprovação
  if (affiliateData?.status?.toLowerCase() === 'pending') {
    return (
      <DashboardShell title="Cadastro Pendente">
        <PendingApprovalView affiliateData={affiliateData} />
      </DashboardShell>
    )
  }

  // Dashboard do afiliado ativo
  return (
    <DashboardShell title="Painel do Parceiro">
      <div className="flex flex-col gap-6 p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Painel do Parceiro
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Bem-vindo, {affiliateData?.name?.split(' ')[0]}! 🎉
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Ativo</span>
          </div>
        </div>

        {/* Link e Código */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Código de Afiliado */}
          <div className="rounded-xl bg-gradient-to-br from-[#D93636] to-[#b82e2e] p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Handshake className="w-5 h-5" />
              <span className="font-medium">Seu Código de Afiliado</span>
            </div>
            <div className="flex items-center justify-between bg-white/20 rounded-lg px-4 py-3">
              <span className="text-2xl font-bold tracking-wider">
                {affiliateData?.code}
              </span>
              <button
                onClick={copyCode}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Link de Afiliado */}
          <div className="rounded-xl bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
              <LinkIcon className="w-5 h-5" />
              <span className="font-medium">Seu Link de Divulgação</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-gray-600 dark:text-gray-400 truncate">
                {typeof window !== 'undefined' 
                  ? `${window.location.origin}/pacotes?ref=${affiliateData?.code}`
                  : `/pacotes?ref=${affiliateData?.code}`
                }
              </div>
              <button
                onClick={copyLink}
                className="p-3 rounded-lg bg-[#D93636] text-white hover:bg-[#b82e2e] transition-colors"
              >
                {copiedLink ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Comissão */}
          <div className="rounded-xl bg-white dark:bg-[#1E1E1E] p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <Percent className="w-4 h-4" />
              <span className="text-sm">Sua Comissão</span>
            </div>
            <p className="text-3xl font-bold text-[#D93636]">
              {affiliateData?.commissionRate}%
            </p>
          </div>

          {/* Total Ganho */}
          <div className="rounded-xl bg-white dark:bg-[#1E1E1E] p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Total Ganho</span>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(affiliateData?.totalEarned || 0)}
            </p>
          </div>

          {/* Indicações Bem Sucedidas */}
          <div className="rounded-xl bg-white dark:bg-[#1E1E1E] p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Vendas Concluídas</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {affiliateData?.stats?.approvedReferrals || 0}
            </p>
          </div>

          {/* Indicações Pendentes */}
          <div className="rounded-xl bg-white dark:bg-[#1E1E1E] p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pendentes</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {affiliateData?.stats?.pendingReferrals || 0}
            </p>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="rounded-xl bg-white dark:bg-[#1E1E1E] p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Resumo Financeiro
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aguardando Aprovação</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(affiliateData?.stats?.pendingCommission || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aprovado (a pagar)</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency((affiliateData?.stats?.approvedCommission || 0) - (affiliateData?.stats?.paidCommission || 0))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
              <Wallet className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Pago</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(affiliateData?.stats?.paidCommission || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Últimas Indicações */}
        <div className="rounded-xl bg-white dark:bg-[#1E1E1E] p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Últimas Indicações
          </h2>
          
          {affiliateData?.referrals && affiliateData.referrals.length > 0 ? (
            <div className="space-y-3">
              {affiliateData.referrals.slice(0, 5).map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#2a2a2a]"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {referral.packageTitle}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {referral.customerEmail.replace(/(.{3}).*@/, '$1***@')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +{formatCurrency(referral.commissionAmount)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      referral.commissionStatus === 'paid' 
                        ? 'bg-green-500/20 text-green-600'
                        : referral.commissionStatus === 'approved'
                        ? 'bg-blue-500/20 text-blue-600'
                        : 'bg-yellow-500/20 text-yellow-600'
                    }`}>
                      {referral.commissionStatus === 'paid' 
                        ? 'Pago'
                        : referral.commissionStatus === 'approved'
                        ? 'Aprovado'
                        : 'Pendente'
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Você ainda não tem indicações.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Compartilhe seu link e comece a ganhar!
              </p>
            </div>
          )}
        </div>

        {/* Seção de Pacotes para Divulgar */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#D93636] to-[#b82e2e]">
            <div className="flex items-center gap-2 text-white">
              <Package className="w-5 h-5" />
              <h3 className="font-bold">Pacotes para Divulgar</h3>
            </div>
            <p className="text-sm text-white/80 mt-1">
              Copie o link de cada pacote com seu código de afiliado
            </p>
          </div>
          
          {loadingPackages ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : packages.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex gap-4">
                    {/* Imagem do pacote */}
                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      {pkg.coverImage ? (
                        <img 
                          src={pkg.coverImage} 
                          alt={pkg.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info do pacote */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {pkg.title}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {pkg.destination || pkg.destinationRel?.name || 'A definir'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {pkg.durationDays ? `${pkg.durationDays} dias` : 'A definir'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                            <p className="text-xs text-gray-400 line-through">
                              {formatPrice(pkg.originalPrice)}
                            </p>
                          )}
                          <p className="font-bold text-[#D93636]">
                            {formatPrice(pkg.price)}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                            Comissão: {formatPrice(Math.round(pkg.price * (affiliateData?.commissionRate || 10) / 100))} ({affiliateData?.commissionRate || 10}%)
                          </p>
                        </div>
                      </div>
                      
                      {/* Botões de ação */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => copyPackageLink(pkg.slug, pkg.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            copiedPackageLink === pkg.id
                              ? 'bg-green-500 text-white'
                              : 'bg-[#D93636] text-white hover:bg-[#b82e2e]'
                          }`}
                        >
                          {copiedPackageLink === pkg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copiar Link
                            </>
                          )}
                        </button>
                        <a
                          href={`/pacotes/${pkg.slug}?ref=${affiliateData?.code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum pacote disponível no momento.
              </p>
            </div>
          )}
          
          {/* Link para ver todos */}
          {packages.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <a
                href={`/pacotes?ref=${affiliateData?.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm font-medium text-[#D93636] hover:text-[#b82e2e] transition-colors"
              >
                Ver todos os pacotes
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

// Componente para usuário não afiliado
function NotAffiliateView({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    phone: '',
    cpf: '',
    pixKey: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const benefits = [
    { icon: Zap, text: 'Comissão de 7% a 10%' },
    { icon: DollarSign, text: 'Pagamento em 48h via PIX' },
    { icon: Trophy, text: 'Bônus progressivos' },
    { icon: Rocket, text: 'Material de vendas grátis' },
    { icon: Gift, text: 'Clube VIP de afiliados' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!acceptedTerms) {
      toast.error('Aceite os termos para continuar')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/affiliates/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar')
      }

      toast.success(data.message || 'Cadastro enviado com sucesso!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D93636]/10 text-[#D93636] mb-4">
          <Handshake className="w-5 h-5" />
          <span className="font-medium">Programa de Afiliados</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Seja um Parceiro Amorim
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Ganhe comissões indicando pacotes de viagem
        </p>
      </div>

      {/* Benefícios */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {benefits.map((benefit, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700"
          >
            <benefit.icon className="w-6 h-6 text-[#D93636]" />
            <span className="text-xs text-center font-medium text-gray-700 dark:text-gray-300">
              {benefit.text}
            </span>
          </div>
        ))}
      </div>

      {/* Link para landing completa */}
      <a
        href="/afiliados"
        target="_blank"
        className="flex items-center justify-center gap-2 text-[#D93636] hover:underline"
      >
        Saiba mais sobre o programa
        <ExternalLink className="w-4 h-4" />
      </a>

      {/* Formulário de Cadastro */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl bg-white dark:bg-[#1E1E1E] p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Cadastre-se como Afiliado
          </h2>

          <div className="space-y-4">
            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone (WhatsApp)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D93636]/20 focus:border-[#D93636] transition-all"
                  required
                />
              </div>
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CPF
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D93636]/20 focus:border-[#D93636] transition-all"
                  required
                />
              </div>
            </div>

            {/* Chave PIX */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chave PIX (para receber comissões)
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D93636]/20 focus:border-[#D93636] transition-all"
                  required
                />
              </div>
            </div>

            {/* Termos */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#D93636] focus:ring-[#D93636]"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Li e aceito os{' '}
                <a href="/termos" target="_blank" className="text-[#D93636] hover:underline">
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a href="/politicas" target="_blank" className="text-[#D93636] hover:underline">
                  Política de Privacidade
                </a>{' '}
                do programa de afiliados.
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !acceptedTerms}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[#D93636] text-white font-bold hover:bg-[#b82e2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            'Enviando...'
          ) : (
            <>
              Quero ser Parceiro
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

// Componente para afiliado pendente
function PendingApprovalView({ affiliateData }: { affiliateData: AffiliateData }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4 pb-24 min-h-[60vh]">
      <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
        <Clock className="w-10 h-10 text-yellow-600" />
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Cadastro em Análise
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Seu cadastro como afiliado está sendo analisado pela nossa equipe. 
          Você receberá uma notificação assim que for aprovado.
        </p>
      </div>

      <div className="rounded-xl bg-white dark:bg-[#1E1E1E] p-4 border border-gray-200 dark:border-gray-700 w-full max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-gray-900 dark:text-white">
            Informações do cadastro
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Nome:</span>
            <span className="text-gray-900 dark:text-white">{affiliateData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Email:</span>
            <span className="text-gray-900 dark:text-white">{affiliateData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Data do cadastro:</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(affiliateData.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
        Prazo de análise: até 24 horas úteis
      </p>
    </div>
  )
}
