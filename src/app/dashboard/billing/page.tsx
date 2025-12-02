/**
 * Billing Dashboard Page
 * 
 * Mostra plano atual, próxima cobrança, ações e histórico de faturas
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/header';
import { Button } from '@/components/ui/button';

// Types
interface SubscriptionData {
  subscription: {
    id: string;
    stripeSubscriptionId: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    cancelAt: string | null;
    trialEnd: string | null;
  } | null;
  plan: {
    id: string;
    name: string;
    level: number;
    description?: string;
  };
  price?: {
    id: string;
    stripePriceId: string;
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
  };
  status: string;
  stripeCustomerId: string | null;
}

interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  amountPaid: number;
  currency: string;
  created: string;
  paidAt: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

// Helper: formatar moeda
function formatCurrency(amount: number, currency: string = 'brl') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// Helper: formatar data
function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Helper: badge de status
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: 'Ativo', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    trialing: { label: 'Trial', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    past_due: { label: 'Pagamento Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    canceled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    unpaid: { label: 'Não Pago', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    free: { label: 'Gratuito', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

// Component: Plano Atual
function CurrentPlanCard({ data, loading }: { data: SubscriptionData | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-4" />
        <div className="h-8 bg-muted rounded w-32 mb-2" />
        <div className="h-4 bg-muted rounded w-48" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="glass p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Plano Atual</h3>
        <StatusBadge status={data.status} />
      </div>
      
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{data.plan.name}</h2>
        {data.plan.description && (
          <p className="text-sm text-muted-foreground mt-1">{data.plan.description}</p>
        )}
      </div>

      {data.price && (
        <div className="text-lg">
          <span className="font-semibold">{formatCurrency(data.price.amount, data.price.currency)}</span>
          <span className="text-muted-foreground text-sm">
            /{data.price.interval === 'month' ? 'mês' : data.price.interval === 'year' ? 'ano' : data.price.interval}
          </span>
        </div>
      )}

      {data.subscription?.cancelAtPeriodEnd && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Sua assinatura será cancelada em {formatDate(data.subscription.currentPeriodEnd)}
          </p>
        </div>
      )}
    </div>
  );
}

// Component: Próxima Cobrança
function NextBillingCard({ data, loading }: { data: SubscriptionData | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-4 bg-muted rounded w-32 mb-4" />
        <div className="h-8 bg-muted rounded w-40 mb-2" />
        <div className="h-4 bg-muted rounded w-24" />
      </div>
    );
  }

  if (!data || !data.subscription || data.status === 'free') {
    return (
      <div className="glass p-6 rounded-xl">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Próxima Cobrança</h3>
        <p className="text-muted-foreground">Nenhuma cobrança programada</p>
        <p className="text-sm text-muted-foreground mt-2">
          Faça upgrade para um plano pago para desbloquear mais recursos.
        </p>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Próxima Cobrança</h3>
      
      <div className="mb-2">
        <span className="text-2xl font-bold">
          {formatDate(data.subscription.currentPeriodEnd)}
        </span>
      </div>

      {data.price && !data.subscription.cancelAtPeriodEnd && (
        <p className="text-muted-foreground">
          Valor: {formatCurrency(data.price.amount, data.price.currency)}
        </p>
      )}

      {data.subscription.trialEnd && new Date(data.subscription.trialEnd) > new Date() && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            🎁 Trial termina em {formatDate(data.subscription.trialEnd)}
          </p>
        </div>
      )}
    </div>
  );
}

// Component: Ações de Billing
function BillingActions({ data, loading }: { data: SubscriptionData | null; loading: boolean }) {
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManagePayment = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/portal', { method: 'POST' });
      const result = await response.json();
      
      if (result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || 'Erro ao abrir portal de pagamento');
      }
    } catch (error) {
      console.error('Erro ao criar portal session:', error);
      alert('Erro ao abrir portal de pagamento');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-4 bg-muted rounded w-20 mb-4" />
        <div className="flex gap-4">
          <div className="h-10 bg-muted rounded w-32" />
          <div className="h-10 bg-muted rounded w-40" />
        </div>
      </div>
    );
  }

  const isPaidPlan = data?.status !== 'free' && data?.subscription;
  const hasStripeCustomer = !!data?.stripeCustomerId;

  return (
    <div className="glass p-6 rounded-xl">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Ações</h3>
      
      <div className="flex flex-wrap gap-4">
        <Link href="/#pricing">
          <Button variant={isPaidPlan ? 'outline' : 'primary'}>
            {isPaidPlan ? 'Alterar Plano' : 'Fazer Upgrade'}
          </Button>
        </Link>

        {hasStripeCustomer && (
          <Button 
            variant="outline" 
            onClick={handleManagePayment}
            disabled={portalLoading}
          >
            {portalLoading ? 'Carregando...' : 'Gerenciar Pagamento'}
          </Button>
        )}
      </div>

      {!isPaidPlan && (
        <p className="text-sm text-muted-foreground mt-4">
          Faça upgrade para desbloquear recursos premium como mais armazenamento, 
          suporte prioritário e funcionalidades avançadas.
        </p>
      )}
    </div>
  );
}

// Component: Histórico de Faturas
function InvoiceHistory({ invoices, loading }: { invoices: Invoice[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-4 bg-muted rounded w-40 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-6">Histórico de Faturas</h3>
      
      {invoices.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhuma fatura encontrada
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Data</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Número</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-2 text-sm">{formatDate(invoice.created)}</td>
                  <td className="py-4 px-2 text-sm font-mono">{invoice.number || '-'}</td>
                  <td className="py-4 px-2 text-sm">{formatCurrency(invoice.amount, invoice.currency)}</td>
                  <td className="py-4 px-2">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.hostedInvoiceUrl && (
                        <a 
                          href={invoice.hostedInvoiceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          Ver
                        </a>
                      )}
                      {invoice.invoicePdf && (
                        <a 
                          href={invoice.invoicePdf} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Helper: badge de status de invoice
function InvoiceStatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    paid: { label: 'Pago', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    open: { label: 'Aberto', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    uncollectible: { label: 'Não Cobrável', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    void: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  };

  const config = status ? statusConfig[status] : null;
  if (!config) return <span className="text-sm text-muted-foreground">-</span>;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

// Main Page Component
export default function BillingPage() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  useEffect(() => {
    // Fetch subscription data
    fetch('/api/subscription')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setSubscriptionData(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSubscription(false));

    // Fetch invoices
    fetch('/api/invoices')
      .then((res) => res.json())
      .then((data) => {
        if (data.invoices) {
          setInvoices(data.invoices);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingInvoices(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container-custom">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span>Billing</span>
            </div>
            <h1 className="text-3xl font-bold">Faturamento</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua assinatura e histórico de pagamentos
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <CurrentPlanCard data={subscriptionData} loading={loadingSubscription} />
            <NextBillingCard data={subscriptionData} loading={loadingSubscription} />
            <BillingActions data={subscriptionData} loading={loadingSubscription} />
          </div>

          {/* Invoice History */}
          <InvoiceHistory invoices={invoices} loading={loadingInvoices} />
        </div>
      </main>
    </div>
  );
}
