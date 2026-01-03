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
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Affiliate {
  id: string;
  code: string;
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
  const [referralFilter, setReferralFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Stats
  const totalAffiliates = affiliates.length;
  const pendingAffiliates = affiliates.filter(a => a.status.toUpperCase() === 'PENDING').length;
  const activeAffiliates = affiliates.filter(a => a.status.toUpperCase() === 'ACTIVE').length;
  const totalCommissionsPaid = affiliates.reduce((sum, a) => sum + a.total_earnings, 0);
  const pendingCommissions = affiliates.reduce((sum, a) => sum + a.pending_earnings, 0);

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
      const params = new URLSearchParams();
      if (referralFilter !== 'all') {
        params.set('status', referralFilter.toUpperCase());
      }
      const response = await fetch(`/api/affiliates/referrals?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar indicações');
      const data = await response.json();
      setReferrals(data.referrals || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Erro ao carregar indicações');
    } finally {
      setLoadingReferrals(false);
    }
  }, [referralFilter]);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleApproveAffiliate = async (affiliateId: string) => {
    try {
      setProcessingId(affiliateId);
      const response = await fetch(`/api/affiliates/${affiliateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      
      if (!response.ok) throw new Error('Falha ao aprovar');
      
      toast.success('Afiliado aprovado com sucesso!');
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

  const handleUpdateReferralStatus = async (referralId: string, status: string) => {
    try {
      setProcessingId(referralId);
      const response = await fetch('/api/affiliates/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId, status }),
      });
      
      if (!response.ok) throw new Error('Falha ao atualizar');
      
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

  const getCommissionStatusBadge = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PAID':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Pago</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Aprovado</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pendente</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Cancelado</span>;
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
    return r.commission_status.toUpperCase() === referralFilter.toUpperCase();
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Pendente</p>
              <p className="text-lg font-bold text-yellow-600">{formatCurrency(pendingCommissions)}</p>
            </div>
          </div>
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
              Indicações
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
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {affiliate.user.first_name} {affiliate.user.last_name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">{affiliate.user.email}</p>
                          </div>
                          {getStatusBadge(affiliate.status)}
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
                              onClick={() => handleApproveAffiliate(affiliate.id)}
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
                          <Link 
                            href={`/dashboard/afiliados/${affiliate.id}`}
                            className="flex items-center justify-center gap-2 w-full h-9 px-4 text-sm rounded-lg bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] transition-colors text-gray-700 dark:text-white"
                          >
                            <Eye className="h-4 w-4" />
                            Ver Detalhes
                          </Link>
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
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button
                    variant={referralFilter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setReferralFilter('all')}
                  >
                    Todas
                  </Button>
                  <Button
                    variant={referralFilter === 'pending' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setReferralFilter('pending')}
                  >
                    Pendentes
                  </Button>
                  <Button
                    variant={referralFilter === 'approved' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setReferralFilter('approved')}
                  >
                    Aprovadas
                  </Button>
                  <Button
                    variant={referralFilter === 'paid' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setReferralFilter('paid')}
                  >
                    Pagas
                  </Button>
                </div>

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
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {referral.booking.package.title}
                                </span>
                                {getCommissionStatusBadge(referral.commission_status)}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">
                                Por: {referral.affiliate.user.first_name} {referral.affiliate.user.last_name}
                                {' '}({referral.affiliate.code})
                              </p>
                              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">
                                Reserva: {formatCurrency(referral.booking.total_price)} • {formatDate(referral.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">Comissão</p>
                              <p className="text-lg font-bold text-green-600">{formatCurrency(referral.commission_amount)}</p>
                            </div>
                          </div>

                          {referral.commission_status.toUpperCase() === 'PENDING' && (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleUpdateReferralStatus(referral.id, 'APPROVED')}
                              disabled={processingId === referral.id}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprovar Comissão
                            </Button>
                          )}

                          {referral.commission_status.toUpperCase() === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="outline"
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
