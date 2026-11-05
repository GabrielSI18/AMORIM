'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminGuard } from '@/components/dashboard/admin-guard';
import { DashboardShell } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  DollarSign,
  TrendingUp,
  Handshake,
  Eye,
  RefreshCw,
  MessageCircle,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { whatsappLink, affiliateApprovedMessage } from '@/lib/whatsapp';
import { formatReleaseDate, type PayoutState } from '@/lib/affiliate-retention';

interface Affiliate {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  status: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  created_at: string;
  user: {
    id: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface Referral {
  id: string;
  booking_id: string;
  commission_amount: number;
  commission_status: string;
  /** retida até a viagem / liberada para pagar — calculado no servidor */
  payout_state: PayoutState;
  departure_date: string | null;
  release_date: string | null;
  created_at: string;
  affiliate: {
    id: string;
    code: string;
    user: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  };
  booking: {
    id: string;
    total_price: number;
    status: string;
    travel_date: string;
    package: {
      title: string;
    };
  };
}

/**
 * Link do WhatsApp com a mensagem de aprovação pronta.
 *
 * A aprovação do parceiro é manual e os emails do programa estão desligados,
 * então é por aqui que ele fica sabendo do código e do link de divulgação.
 */
function linkAprovacao(affiliate: Affiliate): string | null {
  if (!affiliate.phone) return null;
  return whatsappLink(
    affiliate.phone,
    affiliateApprovedMessage({
      affiliateName: affiliate.name || affiliate.user?.first_name || 'parceiro',
      code: affiliate.code,
      commissionRate: affiliate.commission_rate,
      siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
    }),
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'hoje';
  if (diffInDays === 1) return 'há 1 dia';
  if (diffInDays < 30) return `há ${diffInDays} dias`;
  if (diffInDays < 60) return 'há 1 mês';
  return `há ${Math.floor(diffInDays / 30)} meses`;
}

function AfiliadosContent() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  const [activeTab, setActiveTab] = useState<'affiliates' | 'referrals'>('affiliates');
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [referralFilter, setReferralFilter] = useState<'all' | PayoutState>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Stats
  const totalAffiliates = affiliates.length;
  const pendingAffiliates = affiliates.filter(a => a.status.toUpperCase() === 'PENDING').length;
  const activeAffiliates = affiliates.filter(a => a.status.toUpperCase() === 'ACTIVE').length;
  const totalCommissionsPaid = affiliates.reduce((sum, a) => sum + a.total_earnings, 0);
  // Comissão do cliente que já pagou fica RETIDA até a viagem sair; só depois
  // ela entra em "a pagar agora". Ver src/lib/affiliate-retention.ts.
  const sumByState = (state: PayoutState) =>
    referrals.filter((r) => r.payout_state === state).reduce((sum, r) => sum + r.commission_amount, 0);
  const retainedCommissions = sumByState('retained');
  const releasableCommissions = sumByState('releasable');
  const releasableCount = referrals.filter((r) => r.payout_state === 'releasable').length;

  const fetchAffiliates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter.toUpperCase());
      }
      const response = await fetch(`/api/affiliates?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar afiliados');
      const data = await response.json();
      setAffiliates(data.affiliates || []);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast.error('Erro ao carregar afiliados');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoadingReferrals(true);
      const response = await fetch('/api/affiliates/referrals');
      if (!response.ok) throw new Error('Falha ao carregar indicações');
      const data = await response.json();
      setReferrals(data.referrals || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Erro ao carregar indicações');
    } finally {
      setLoadingReferrals(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleApproveAffiliate = async (affiliate: Affiliate) => {
    const affiliateId = affiliate.id;
    try {
      setProcessingId(affiliateId);
      const response = await fetch(`/api/affiliates/${affiliateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });

      if (!response.ok) throw new Error('Falha ao aprovar');

      // Quem avisa o parceiro é a equipe, pelo WhatsApp: o toast já abre a
      // conversa com o código e o link de divulgação escritos.
      const aviso = linkAprovacao(affiliate);
      if (aviso) {
        toast.success('Afiliado aprovado! Agora avise o parceiro.', {
          duration: 12000,
          action: {
            label: 'Avisar no WhatsApp',
            onClick: () => window.open(aviso, '_blank', 'noopener,noreferrer'),
          },
        });
      } else {
        toast.success('Afiliado aprovado. Sem telefone cadastrado — avise o parceiro por outro canal.');
      }
      fetchAffiliates();
    } catch (error) {
      console.error('Error approving affiliate:', error);
      toast.error('Erro ao aprovar afiliado');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectAffiliate = async (affiliateId: string) => {
    try {
      setProcessingId(affiliateId);
      const response = await fetch(`/api/affiliates/${affiliateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (!response.ok) throw new Error('Falha ao rejeitar');

      toast.success('Afiliado rejeitado');
      fetchAffiliates();
    } catch (error) {
      console.error('Error rejecting affiliate:', error);
      toast.error('Erro ao rejeitar afiliado');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateReferralStatus = async (referralId: string, status: string, forceRelease = false) => {
    try {
      setProcessingId(referralId);
      const response = await fetch('/api/affiliates/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId, status, forceRelease }),
      });

      if (!response.ok) {
        // A API recusa pagar comissão retida e explica até quando: mostra isso
        const data = await response.json().catch(() => null);
        toast.error(data?.error || 'Erro ao atualizar comissão');
        return;
      }

      const statusLabel = status === 'APPROVED' ? 'aprovada' : status === 'PAID' ? 'marcada como paga' : 'atualizada';
      toast.success(`Comissão ${statusLabel}!`);
      fetchReferrals();
      fetchAffiliates(); // Refresh stats
    } catch (error) {
      console.error('Error updating referral:', error);
      toast.error('Erro ao atualizar comissão');
    } finally {
      setProcessingId(null);
    }
  };

  /** Pagar antes da viagem: só com confirmação, porque o cliente ainda pode desistir */
  const handleEarlyRelease = (referral: Referral) => {
    const sai = formatReleaseDate(referral.departure_date);
    const ok = window.confirm(
      `Pagar a comissão ANTES da viagem?\n\n` +
        (sai ? `O pacote sai em ${sai}. ` : 'O pacote não tem data de saída cadastrada. ') +
        'Se o cliente cancelar e receber o dinheiro de volta, essa comissão não volta.\n\n' +
        'Confirma o pagamento antecipado?',
    );
    if (ok) handleUpdateReferralStatus(referral.id, 'PAID', true);
  };

  const getPayoutBadge = (referral: Referral) => {
    const libera = formatReleaseDate(referral.release_date);
    const base = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (referral.payout_state) {
      case 'paid':
        return <span className={`${base} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`}>Paga</span>;
      case 'releasable':
        return <span className={`${base} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`}><Unlock className="h-3 w-3" />Liberada</span>;
      case 'retained':
        return (
          <span className={`${base} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400`}>
            <Lock className="h-3 w-3" />
            {libera ? `Retida até ${libera}` : 'Retida (sem data de viagem)'}
          </span>
        );
      case 'rejected':
        return <span className={`${base} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`}>Cancelada</span>;
      default:
        return <span className={`${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`}>Cliente não pagou</span>;
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const getStatusBadge = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativo</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pendente</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejeitado</span>;
      case 'SUSPENDED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Suspenso</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const filteredAffiliates = affiliates.filter(a => {
    if (filter === 'all') return true;
    return a.status.toUpperCase() === filter.toUpperCase();
  });

  const filteredReferrals = referrals.filter(r => {
    if (referralFilter === 'all') return true;
    return r.payout_state === referralFilter;
  });

  // Valores monetários no banco são armazenados em CENTAVOS (padrão do projeto).
  // Antes essa função formatava `value` direto, fazendo R$ 104,30 (10430 centavos)
  // virar R$ 10.430,00 nos cards do painel admin de afiliados.
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  return (
    <DashboardShell
      title="Afiliados"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { fetchAffiliates(); fetchReferrals(); }}
          disabled={loading || loadingReferrals}
        >
          <RefreshCw className={`h-4 w-4 ${loading || loadingReferrals ? 'animate-spin' : ''}`} />
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-[#E0E0E0]">{totalAffiliates}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Pendentes</p>
              <p className="text-xl font-bold text-yellow-600">{pendingAffiliates}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Ativos</p>
              <p className="text-xl font-bold text-green-600">{activeAffiliates}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Pago</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalCommissionsPaid)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setActiveTab('referrals'); setReferralFilter('retained'); }}
            title="Cliente já pagou, mas a viagem ainda não aconteceu"
            className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl text-left hover:border-orange-400 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Retido até a viagem</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(retainedCommissions)}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('referrals'); setReferralFilter('releasable'); }}
            title="A viagem já saiu: estas comissões podem ser pagas"
            className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl text-left hover:border-blue-400 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">A pagar agora</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(releasableCommissions)}</p>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-[#333]">
            <button
              onClick={() => setActiveTab('affiliates')}
              className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                activeTab === 'affiliates'
                  ? 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-[#A0A0A0] hover:bg-gray-50 dark:hover:bg-[#252525]'
              }`}
            >
              <Users className="h-4 w-4" />
              Afiliados
              {pendingAffiliates > 0 && (
                <span className="ml-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                  {pendingAffiliates}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                activeTab === 'referrals'
                  ? 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-[#A0A0A0] hover:bg-gray-50 dark:hover:bg-[#252525]'
              }`}
            >
              <Handshake className="h-4 w-4" />
              Comissões
              {releasableCount > 0 && (
                <span
                  className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs bg-blue-500 text-white rounded-full"
                  title="Comissões liberadas esperando o PIX"
                >
                  {releasableCount}
                </span>
              )}
            </button>
          </div>

          <div className="p-4">
            {/* Affiliates Tab */}
            {activeTab === 'affiliates' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button
                    variant={filter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filter === 'pending' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pending')}
                  >
                    Pendentes
                  </Button>
                  <Button
                    variant={filter === 'active' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('active')}
                  >
                    Ativos
                  </Button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-[#252525] rounded-lg">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-32 mb-3" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredAffiliates.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-gray-400 dark:text-[#666] mb-4" />
                    <p className="text-gray-500 dark:text-[#A0A0A0]">
                      {filter === 'pending'
                        ? 'Nenhum afiliado pendente'
                        : 'Nenhum afiliado encontrado'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAffiliates.map((affiliate) => (
                      <div
                        key={affiliate.id}
                        className={`p-4 rounded-lg ${
                          affiliate.status.toUpperCase() === 'PENDING'
                            ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30'
                            : 'bg-gray-50 dark:bg-[#252525]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {affiliate.user.first_name} {affiliate.user.last_name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-[#A0A0A0] truncate">{affiliate.user.email}</p>
                          </div>
                          <div className="flex-shrink-0">{getStatusBadge(affiliate.status)}</div>
                        </div>

                        {/* Code */}
                        <div className="flex items-center gap-2 mb-3">
                          <code className="flex-1 bg-white dark:bg-[#1E1E1E] px-3 py-1.5 rounded text-sm font-mono border border-gray-200 dark:border-[#333]">
                            {affiliate.code}
                          </code>
                          <button
                            onClick={() => copyCode(affiliate.code)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded transition-colors"
                          >
                            <Copy className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 text-center text-sm mb-3">
                          <div className="bg-white dark:bg-[#1E1E1E] rounded p-2">
                            <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Indicações</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{affiliate.total_referrals}</p>
                          </div>
                          <div className="bg-white dark:bg-[#1E1E1E] rounded p-2">
                            <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Taxa</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{affiliate.commission_rate}%</p>
                          </div>
                          <div className="bg-white dark:bg-[#1E1E1E] rounded p-2">
                            <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Ganho</p>
                            <p className="font-semibold text-green-600">{formatCurrency(affiliate.total_earnings)}</p>
                          </div>
                          <div className="bg-white dark:bg-[#1E1E1E] rounded p-2">
                            <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Pendente</p>
                            <p className="font-semibold text-yellow-600">{formatCurrency(affiliate.pending_earnings)}</p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-[#A0A0A0] mb-3">
                          Cadastrado {formatDate(affiliate.created_at)}
                        </p>

                        {/* Actions */}
                        {affiliate.status.toUpperCase() === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleApproveAffiliate(affiliate)}
                              disabled={processingId === affiliate.id}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleRejectAffiliate(affiliate.id)}
                              disabled={processingId === affiliate.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        )}

                        {affiliate.status.toUpperCase() === 'ACTIVE' && (
                          <div className="flex gap-2">
                            <Link
                              href={`/dashboard/afiliados/${affiliate.id}`}
                              className="flex items-center justify-center gap-2 flex-1 h-9 px-4 text-sm rounded-lg bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] transition-colors text-gray-700 dark:text-white"
                            >
                              <Eye className="h-4 w-4" />
                              Ver Detalhes
                            </Link>
                            {/* Aprovação e aviso são manuais: este botão abre o
                                WhatsApp do parceiro com o código e o link prontos. */}
                            {linkAprovacao(affiliate) && (
                              <a
                                href={linkAprovacao(affiliate) as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Mandar o código e o link de divulgação pelo WhatsApp"
                                className="flex items-center justify-center gap-2 flex-1 h-9 px-4 text-sm rounded-lg bg-[#D93636] hover:bg-[#c42f2f] transition-colors text-white font-medium"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Avisar
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <div className="space-y-4">
                {/* Filtros pela situação do pagamento. A comissão de quem já
                    pagou fica retida até o dia seguinte à saída da viagem. */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {([
                    ['all', 'Todas'],
                    ['awaiting_payment', 'Cliente não pagou'],
                    ['retained', 'Retidas'],
                    ['releasable', 'A pagar agora'],
                    ['paid', 'Pagas'],
                    ['rejected', 'Canceladas'],
                  ] as ['all' | PayoutState, string][]).map(([valor, rotulo]) => (
                    <Button
                      key={valor}
                      variant={referralFilter === valor ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setReferralFilter(valor)}
                    >
                      {rotulo}
                    </Button>
                  ))}
                </div>

                {referralFilter === 'retained' && (
                  <p className="text-xs text-gray-500 dark:text-[#A0A0A0] flex items-start gap-2">
                    <Lock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    O cliente já pagou, mas a viagem ainda não aconteceu. Se ele desistir e receber o dinheiro de
                    volta, a comissão cai junto — por isso ela só é liberada no dia seguinte à saída do ônibus.
                  </p>
                )}

                {loadingReferrals ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-[#252525] rounded-lg">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                ) : filteredReferrals.length === 0 ? (
                  <div className="p-8 text-center">
                    <Handshake className="h-12 w-12 mx-auto text-gray-400 dark:text-[#666] mb-4" />
                    <p className="text-gray-500 dark:text-[#A0A0A0]">Nenhuma indicação encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReferrals.map((referral) => (
                      <div key={referral.id} className="p-4 bg-gray-50 dark:bg-[#252525] rounded-lg">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 dark:text-white text-sm break-words">
                                  {referral.booking.package.title}
                                </span>
                                {getPayoutBadge(referral)}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-[#A0A0A0] truncate">
                                Por: {referral.affiliate.user.first_name} {referral.affiliate.user.last_name}
                                {' '}({referral.affiliate.code})
                              </p>
                              <p className="text-xs text-gray-500 dark:text-[#A0A0A0] truncate">
                                Reserva: {formatCurrency(referral.booking.total_price)} • {formatDate(referral.created_at)}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Comissão</p>
                              <p className="text-lg font-bold text-green-600 whitespace-nowrap">{formatCurrency(referral.commission_amount)}</p>
                            </div>
                          </div>

                          {referral.payout_state === 'awaiting_payment' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleUpdateReferralStatus(referral.id, 'APPROVED')}
                              disabled={processingId === referral.id}
                              title="Use quando o cliente pagou por fora e a reserva não foi marcada como paga"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Confirmar pagamento do cliente
                            </Button>
                          )}

                          {referral.payout_state === 'retained' && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="flex-1 flex items-center gap-2 text-xs text-orange-700 dark:text-orange-400 bg-orange-500/10 rounded-lg px-3 py-2">
                                <Lock className="h-4 w-4 flex-shrink-0" />
                                {referral.release_date
                                  ? `Viagem em ${formatReleaseDate(referral.departure_date)} — libera para pagamento em ${formatReleaseDate(referral.release_date)}`
                                  : 'Pacote sem data de saída — libere manualmente quando a viagem acontecer'}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEarlyRelease(referral)}
                                disabled={processingId === referral.id}
                              >
                                <Unlock className="h-4 w-4 mr-1" />
                                Pagar antes
                              </Button>
                            </div>
                          )}

                          {referral.payout_state === 'releasable' && (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleUpdateReferralStatus(referral.id, 'PAID')}
                              disabled={processingId === referral.id}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Marcar como Pago
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function AfiliadosAdminPage() {
  return (
    <AdminGuard>
      <AfiliadosContent />
    </AdminGuard>
  );
}
