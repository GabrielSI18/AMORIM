'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/dashboard/admin-guard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Copy,
  DollarSign,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  Package,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Affiliate {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  commission_rate: number;
  total_sales: number;
  total_earned: number;
  total_bookings: number;
  pix_key: string | null;
  created_at: string;
  approved_at: string | null;
  user: {
    id: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  referrals: Referral[];
}

interface Referral {
  id: string;
  package_title: string;
  customer_email: string;
  sale_amount: number;
  commission_amount: number;
  commission_status: string;
  commission_paid_at: string | null;
  created_at: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(value: number): string {
  // Value is in cents
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value / 100);
}

function AffiliateDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const affiliateId = params.id as string;

  const fetchAffiliate = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/affiliates/${affiliateId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Afiliado não encontrado');
          router.push('/dashboard/afiliados');
          return;
        }
        throw new Error('Falha ao carregar afiliado');
      }
      const data = await response.json();
      setAffiliate(data.affiliate);
    } catch (error) {
      console.error('Error fetching affiliate:', error);
      toast.error('Erro ao carregar afiliado');
    } finally {
      setLoading(false);
    }
  }, [affiliateId, router]);

  useEffect(() => {
    fetchAffiliate();
  }, [fetchAffiliate]);

  const handleUpdateStatus = async (status: string) => {
    try {
      setProcessingId('status');
      const response = await fetch(`/api/affiliates/${affiliateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error('Falha ao atualizar status');
      
      toast.success(`Status atualizado para ${status.toLowerCase()}`);
      fetchAffiliate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
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
      fetchAffiliate();
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

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/pacotes?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de afiliado copiado!');
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'active':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativo</span>;
      case 'pending':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pendente</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejeitado</span>;
      case 'suspended':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Suspenso</span>;
      default:
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getCommissionStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'paid':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Pago</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Aprovado</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pendente</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-8 space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!affiliate) {
    return null;
  }

  const pendingReferrals = affiliate.referrals.filter(r => r.commission_status.toLowerCase() === 'pending');
  const approvedReferrals = affiliate.referrals.filter(r => r.commission_status.toLowerCase() === 'approved');
  const paidReferrals = affiliate.referrals.filter(r => r.commission_status.toLowerCase() === 'paid');

  return (
    <div className="container-custom py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/afiliados')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{affiliate.name}</h1>
            {getStatusBadge(affiliate.status)}
          </div>
          <p className="text-muted-foreground">Detalhes do afiliado</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Informações do Afiliado</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{affiliate.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{affiliate.email}</span>
            </div>
            {affiliate.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{affiliate.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Cadastrado em {formatDate(affiliate.created_at)}</span>
            </div>
            {affiliate.approved_at && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Aprovado em {formatDate(affiliate.approved_at)}</span>
              </div>
            )}
          </div>

          {/* Code */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Código de Afiliado</p>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-3 py-2 rounded text-lg font-mono flex-1">
                {affiliate.code}
              </code>
              <button
                onClick={() => copyCode(affiliate.code)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Copiar código"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => copyLink(affiliate.code)}
            >
              Copiar Link de Indicação
            </Button>
          </div>

          {/* Pix Key */}
          {affiliate.pix_key && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Chave PIX</p>
              <code className="bg-muted px-3 py-2 rounded text-sm font-mono block">
                {affiliate.pix_key}
              </code>
            </div>
          )}

          {/* Actions */}
          {affiliate.status.toLowerCase() === 'pending' && (
            <div className="pt-4 border-t flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleUpdateStatus('ACTIVE')}
                disabled={processingId === 'status'}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleUpdateStatus('REJECTED')}
                disabled={processingId === 'status'}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          )}

          {affiliate.status.toLowerCase() === 'active' && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleUpdateStatus('SUSPENDED')}
                disabled={processingId === 'status'}
              >
                Suspender Afiliado
              </Button>
            </div>
          )}

          {affiliate.status.toLowerCase() === 'suspended' && (
            <div className="pt-4 border-t">
              <Button
                className="w-full"
                onClick={() => handleUpdateStatus('ACTIVE')}
                disabled={processingId === 'status'}
              >
                Reativar Afiliado
              </Button>
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Estatísticas</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Comissão</span>
              </div>
              <p className="text-2xl font-bold">{affiliate.commission_rate}%</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span className="text-sm">Reservas</span>
              </div>
              <p className="text-2xl font-bold">{affiliate.total_bookings}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Total Vendas</span>
              </div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(affiliate.total_sales)}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Total Ganho</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(affiliate.total_earned)}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Indicações pendentes</span>
              <span className="font-medium text-yellow-600">{pendingReferrals.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Indicações aprovadas</span>
              <span className="font-medium text-blue-600">{approvedReferrals.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Indicações pagas</span>
              <span className="font-medium text-green-600">{paidReferrals.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-card rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Histórico de Indicações</h2>
          <p className="text-sm text-muted-foreground">Todas as indicações feitas por este afiliado</p>
        </div>

        {affiliate.referrals.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma indicação ainda</p>
          </div>
        ) : (
          <div className="divide-y">
            {affiliate.referrals.map((referral) => (
              <div key={referral.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{referral.package_title}</span>
                    {getCommissionStatusBadge(referral.commission_status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cliente: {referral.customer_email}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(referral.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Venda</p>
                    <p className="font-medium">{formatCurrency(referral.sale_amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Comissão</p>
                    <p className="font-bold text-green-600">{formatCurrency(referral.commission_amount)}</p>
                  </div>

                  {referral.commission_status.toLowerCase() === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateReferralStatus(referral.id, 'APPROVED')}
                      disabled={processingId === referral.id}
                    >
                      Aprovar
                    </Button>
                  )}

                  {referral.commission_status.toLowerCase() === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateReferralStatus(referral.id, 'PAID')}
                      disabled={processingId === referral.id}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Pagar
                    </Button>
                  )}

                  {referral.commission_status.toLowerCase() === 'paid' && referral.commission_paid_at && (
                    <span className="text-xs text-muted-foreground">
                      Pago em {formatDate(referral.commission_paid_at)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AffiliateDetailsPage() {
  return (
    <AdminGuard>
      <AffiliateDetailsContent />
    </AdminGuard>
  );
}
