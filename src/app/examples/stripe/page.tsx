'use client';

/**
 * Página de Exemplo - Stripe
 *
 * Testa checkout, portal e webhooks do Stripe
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface Plan {
  id: string;
  name: string;
  level: number;
  prices: {
    id: string;
    stripe_price_id: string;
    interval: string;
    amount: number;
  }[];
}

interface UserSubscription {
  planName: string;
  status: string;
  currentPeriodEnd: string | null;
}

export default function StripeExamplesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Carrega planos e subscription
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Busca planos
      const plansRes = await fetch('/api/plans');
      if (plansRes.ok) {
        const data = await plansRes.json();
        // API retorna array direto, não { plans: [...] }
        setPlans(Array.isArray(data) ? data : (data.plans || []));
      }

      // Busca subscription atual
      const subRes = await fetch('/api/subscription');
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data.subscription || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Inicia checkout ou upgrade/downgrade
  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Se é checkout (primeira assinatura), redireciona
        if (data.type === 'checkout' && data.url) {
          window.location.href = data.url;
        } 
        // Se é upgrade, mostra toast de sucesso
        else if (data.type === 'upgrade') {
          toast.success(data.message || 'Upgrade realizado com sucesso!');
          loadData(); // Recarrega subscription
        }
        // Se é downgrade AGENDADO, mostra toast informativo
        else if (data.type === 'downgrade_scheduled') {
          toast.info(data.message || 'Downgrade agendado para o final do período.');
          loadData(); // Recarrega subscription
        }
        // Se é mudança de intervalo (mensal → anual)
        else if (data.type === 'interval_change') {
          toast.success(data.message || 'Período alterado com sucesso!');
          loadData(); // Recarrega subscription
        }
      } else {
        // Tratamento de erros específicos
        if (data.code === 'SAME_PLAN') {
          toast.warning(`Você já está no plano ${data.currentPlan}`);
        } else if (data.code === 'SUBSCRIPTION_CANCELING') {
          toast.error(data.error);
        } else {
          toast.error(data.error || 'Erro ao processar');
        }
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Abre portal do cliente
  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Erro ao abrir portal');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setPortalLoading(false);
    }
  };

  // Formata valor
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">💳 Stripe Examples</h1>
        <p className="text-muted-foreground">
          Teste checkout, portal do cliente e webhooks do Stripe.
        </p>
      </div>

      {/* Status */}
      <div className="mb-8 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">⚙️ Configuração</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <code>STRIPE_SECRET_KEY</code> no .env.local</li>
          <li>• <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> no .env.local</li>
          <li>• <code>STRIPE_WEBHOOK_SECRET</code> (para webhooks locais)</li>
          <li>• Planos e preços criados no Stripe Dashboard</li>
        </ul>
      </div>

      {/* Webhook Info */}
      <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h2 className="font-semibold mb-2">🔄 Webhook Local</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Para testar webhooks localmente, execute:
        </p>
        <pre className="bg-background p-3 rounded text-sm overflow-x-auto">
          stripe listen --forward-to localhost:3000/api/webhooks/stripe
        </pre>
        <p className="text-sm text-muted-foreground mt-2">
          Copie o webhook secret e adicione em <code>STRIPE_WEBHOOK_SECRET</code>
        </p>
      </div>

      {/* Test Cards */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">💳 Cartões de Teste</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-muted rounded">
            <span className="font-mono">4242 4242 4242 4242</span>
            <span className="text-muted-foreground ml-2">✅ Sucesso</span>
          </div>
          <div className="p-2 bg-muted rounded">
            <span className="font-mono">4000 0000 0000 9995</span>
            <span className="text-muted-foreground ml-2">❌ Recusado</span>
          </div>
          <div className="p-2 bg-muted rounded">
            <span className="font-mono">4000 0025 0000 3155</span>
            <span className="text-muted-foreground ml-2">🔐 3D Secure</span>
          </div>
          <div className="p-2 bg-muted rounded">
            <span className="font-mono">4000 0000 0000 3220</span>
            <span className="text-muted-foreground ml-2">🔐 3D Secure 2</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Use qualquer data futura para expiração e qualquer CVC de 3 dígitos.
        </p>
      </div>

      {/* Current Subscription */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📋 Sua Assinatura</h2>
        {loading ? (
          <div className="text-center py-4">
            <Spinner size="md" />
          </div>
        ) : subscription ? (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{subscription.planName}</p>
                <p className="text-sm text-muted-foreground">
                  Status: <span className={subscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'}>
                    {subscription.status}
                  </span>
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground">
                    Próxima cobrança: {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <Button onClick={handlePortal} disabled={portalLoading}>
                {portalLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Gerenciar
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 border rounded-lg text-center text-muted-foreground">
            Você não tem uma assinatura ativa
          </div>
        )}
      </section>

      {/* Plans */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🎯 Planos Disponíveis</h2>
        {loading ? (
          <div className="text-center py-8">
            <Spinner size="lg" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum plano encontrado.</p>
            <p className="text-sm mt-2">
              Certifique-se de que os planos estão criados no banco (npx prisma db seed)
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 border rounded-lg"
              >
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Nível {plan.level}
                </p>
                
                {plan.prices.length > 0 ? (
                  <div className="space-y-2">
                    {plan.prices.map((price) => (
                      <div
                        key={price.id}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div>
                          <span className="font-medium">{formatPrice(price.amount)}</span>
                          <span className="text-sm text-muted-foreground">/{price.interval === 'month' ? 'mês' : 'ano'}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCheckout(price.stripe_price_id)}
                          disabled={checkoutLoading !== null}
                        >
                          {checkoutLoading === price.stripe_price_id ? (
                            <Spinner size="sm" />
                          ) : (
                            'Assinar'
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum preço configurado
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Docs */}
      <section className="mt-8 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">📚 Documentação</h2>
        <ul className="text-sm space-y-1">
          <li>• Stripe helpers: <code>src/lib/stripe.ts</code></li>
          <li>• Plans config: <code>src/lib/plans.ts</code></li>
          <li>• Checkout API: <code>src/app/api/checkout/route.ts</code></li>
          <li>• Portal API: <code>src/app/api/portal/route.ts</code></li>
          <li>• Webhook: <code>src/app/api/webhooks/stripe/route.ts</code></li>
          <li>• Lógica de negócio: <code>STRIPE.md</code></li>
        </ul>
      </section>
    </div>
  );
}
