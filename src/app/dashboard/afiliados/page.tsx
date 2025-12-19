'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminGuard } from '@/components/dashboard/admin-guard';
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
  ArrowLeft
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
    <div className="container-custom py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Afiliados</h1>
            <p className="text-muted-foreground">
              Aprove novos afiliados e gerencie comissões
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => { fetchAffiliates(); fetchReferrals(); }}
          disabled={loading || loadingReferrals}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading || loadingReferrals ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Afiliados</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{totalAffiliates}</p>
        </div>
        
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Pendentes</span>
            <Clock className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{pendingAffiliates}</p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Ativos</span>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{activeAffiliates}</p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Comissões Pagas</span>
            <DollarSign className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCommissionsPaid)}</p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Comissões Pendentes</span>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingCommissions)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'affiliates' 
                ? 'border-primary text-primary font-medium' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
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
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'referrals' 
                ? 'border-primary text-primary font-medium' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Handshake className="h-4 w-4" />
            Indicações
          </button>
        </div>

        {/* Affiliates Tab */}
        {activeTab === 'affiliates' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border bg-card p-6">
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredAffiliates.length === 0 ? (
              <div className="rounded-xl border bg-card p-10 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {filter === 'pending' 
                    ? 'Nenhum afiliado pendente de aprovação'
                    : 'Nenhum afiliado encontrado'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAffiliates.map((affiliate) => (
                  <div 
                    key={affiliate.id} 
                    className={`rounded-xl border bg-card p-6 ${affiliate.status.toUpperCase() === 'PENDING' ? 'border-yellow-500/50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {affiliate.user.first_name} {affiliate.user.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{affiliate.user.email}</p>
                      </div>
                      {getStatusBadge(affiliate.status)}
                    </div>

                    {/* Code */}
                    <div className="flex items-center gap-2 mb-4">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1">
                        {affiliate.code}
                      </code>
                      <button
                        onClick={() => copyCode(affiliate.code)}
                        className="p-2 hover:bg-muted rounded transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground">Indicações</p>
                        <p className="font-semibold">{affiliate.total_referrals}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Comissão</p>
                        <p className="font-semibold">{affiliate.commission_rate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Ganho</p>
                        <p className="font-semibold text-green-600">{formatCurrency(affiliate.total_earnings)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pendente</p>
                        <p className="font-semibold text-yellow-600">{formatCurrency(affiliate.pending_earnings)}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-4">
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
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRejectAffiliate(affiliate.id)}
                          disabled={processingId === affiliate.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}

                    {affiliate.status.toUpperCase() === 'ACTIVE' && (
                      <Link 
                        href={`/dashboard/afiliados/${affiliate.id}`}
                        className="flex items-center justify-center gap-2 w-full h-10 px-4 text-sm rounded-lg border hover:bg-muted transition-colors"
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
            <div className="flex gap-2">
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
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="rounded-xl border bg-card p-10 text-center">
                <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma indicação encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReferrals.map((referral) => (
                  <div key={referral.id} className="rounded-xl border bg-card p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{referral.booking.package.title}</span>
                          {getCommissionStatusBadge(referral.commission_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Indicado por: <span className="font-medium">{referral.affiliate.user.first_name} {referral.affiliate.user.last_name}</span>
                          {' '}({referral.affiliate.code})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Reserva: {formatCurrency(referral.booking.total_price)}
                          {' • '}
                          {formatDate(referral.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Comissão</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(referral.commission_amount)}</p>
                        </div>

                        {referral.commission_status.toUpperCase() === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateReferralStatus(referral.id, 'APPROVED')}
                            disabled={processingId === referral.id}
                          >
                            Aprovar
                          </Button>
                        )}

                        {referral.commission_status.toUpperCase() === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateReferralStatus(referral.id, 'PAID')}
                            disabled={processingId === referral.id}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Marcar Pago
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AfiliadosAdminPage() {
  return (
    <AdminGuard>
      <AfiliadosContent />
    </AdminGuard>
  );
}
