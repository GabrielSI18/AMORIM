# 💳 Stripe - Lógica de Pagamentos

**📌 Objetivo deste arquivo**: Explicar a **arquitetura e lógica de negócio** do sistema de pagamentos.

**Para setup prático**: Consulte **[INIT-BASE.md - Seção 6 (Stripe)](./INIT-BASE.md#6-stripe-pagamentos-e-assinaturas)**

---

## 📊 **ARQUITETURA**

### **Plans (Planos)**
- **PLAN_FREE**: Nível 1 (Gratuito)
- **PLAN_BASIC**: Nível 2 (R$ 29/mês)
- **PLAN_PRO**: Nível 3 (R$ 79/mês)
- **PLAN_ENTERPRISE**: Nível 4 (R$ 199/mês)

**Cada plan pode ter múltiplos prices:**
- Mensal (month)
- Anual (year) - geralmente com desconto
- Trimestral (quarter)

### **Subscriptions (Assinaturas)**
Vincula **User** → **Price** → **Plan**

**Status possíveis:**
- `trialing`: Em período de teste
- `active`: Assinatura ativa
- `incomplete`: Aguardando pagamento (23h)
- `past_due`: Pagamento atrasado (Smart Retries)
- `unpaid`: Sem pagamento após retries
- `canceled`: Cancelada definitivamente
- `paused`: Trial acabou sem forma de pagamento

### **Add-ons (Extras)**
- Pagamentos únicos (one-time)
- Requerem nível mínimo de plano
- Exemplos:
  - Armazenamento Extra 50GB (R$ 49 - nível 2+)
  - Suporte Prioritário (R$ 99 - nível 2+)
  - Domínio Customizado (R$ 199 - nível 3+)
  - White Label (R$ 499 - nível 4)

---

## 💡 **LÓGICA DE LEVELS**

Sistema flexível baseado em **níveis inteiros**:

- ✅ **Qualquer integer funciona**: 1, 2, 10, 100, -1, etc
- ✅ **Sem hardcoded**: Level usado apenas para comparação (<, >, ==)
- ✅ **Flexibilidade total**: 1 plan ou 100 plans, ambos funcionam

### Comparação de Levels

```typescript
// src/lib/plans.ts
export function isUpgrade(fromPlanId: PlanId, toPlanId: PlanId): boolean {
  return PLANS[toPlanId].level > PLANS[fromPlanId].level; // Simples comparação
}

export function isDowngrade(fromPlanId: PlanId, toPlanId: PlanId): boolean {
  return PLANS[toPlanId].level < PLANS[fromPlanId].level;
}
```

### Exemplos de Uso

**Cenário 1: SaaS com 1 plan pago**
```prisma
model Plan {
  id    "PLAN_PAID"
  level 1          // ✅ Level 1 como pago funciona perfeitamente
}
```

**Cenário 2: SaaS tradicional (Free + Paid)**
```prisma
PLAN_FREE       level: 1
PLAN_PRO        level: 2
```

**Cenário 3: Múltiplos tiers**
```prisma
PLAN_FREE          level: 1
PLAN_STARTER       level: 2
PLAN_PROFESSIONAL  level: 3
PLAN_BUSINESS      level: 4
PLAN_ENTERPRISE    level: 5
```

---

## 🔄 **UPGRADE vs DOWNGRADE**

### Comportamento

| Ação | Timing | Prorata |
|------|--------|---------|
| **Upgrade** | Imediato | Cobra diferença proporcional |
| **Downgrade** | **Agendado** para fim do período | Sem cobrança |
| **Mudança de intervalo** | Imediato | Ajuste proporcional |

### Downgrade Agendado

Quando usuário faz downgrade:
1. API salva `scheduled_price_id` no banco
2. Usuário **continua no plano atual** até `current_period_end`
3. No `invoice.paid` (renovação), webhook aplica o downgrade

```prisma
model Subscription {
  // ...
  scheduled_price_id  String?  // Price para downgrade agendado
}
```

### Validações de Segurança

A API `/api/checkout` valida:
- ❌ **Mesmo priceId** → Erro `SAME_PLAN`
- ❌ **Subscription cancelando** → Erro `SUBSCRIPTION_CANCELING`
- ❌ **Price inativo** → Erro 400
- ✅ **Upgrade** → Aplica imediatamente
- ✅ **Downgrade** → Agenda para fim do período

---

## 📁 **ARQUIVOS PRINCIPAIS**

```
src/
├── lib/
│   ├── stripe.ts          # Singleton + helpers
│   ├── plans.ts           # Features por plan (hardcoded)
│   └── addons.ts          # Configuração de add-ons
├── app/api/webhooks/stripe/
│   └── route.ts           # Handler de TODOS eventos Stripe
prisma/
├── schema.prisma          # Models: Plan, Price, Subscription, Addon
└── seed.ts                # Seed de plans e addons
```

---

## 🔔 **EVENTOS DO WEBHOOK**

O webhook `/api/webhooks/stripe` escuta:

### **Checkout**
- `checkout.session.completed` → Vincular stripe_customer_id ao User

### **Subscription**
- `customer.subscription.created` → Criar subscription no DB
- `customer.subscription.updated` → Atualizar status, trial_end, cancel_at
- `customer.subscription.deleted` → Marcar como canceled
- `customer.subscription.trial_will_end` → Notificar (3 dias antes)

### **Invoice**
- `invoice.paid` → Renovar acesso + **aplicar downgrade agendado**
- `invoice.payment_failed` → Notificar falha, status = past_due
- `invoice.payment_action_required` → Requer autenticação 3DS

### **Payment Intent (Add-ons)**
- `payment_intent.succeeded` → Provisionar add-on

---

## 🛠️ **HELPERS ÚTEIS**

```typescript
import { 
  stripe, 
  createCheckoutSession, 
  createCustomerPortalSession,
  getOrCreateCustomer,        // Cria customer com metadata.clerk_id
  updateSubscriptionPrice,    // Upgrade/downgrade
} from '@/lib/stripe';
import { getPlanConfig, hasPlanFeature, isUpgrade } from '@/lib/plans';
import { getAvailableAddons, canPurchaseAddon } from '@/lib/addons';

// Criar ou buscar Customer (resolve race condition com webhooks)
const customerId = await getOrCreateCustomer({
  email: user.email,
  clerkId: user.clerkId,
  name: user.name,
});

// Criar Checkout Session
const session = await createCheckoutSession({
  priceId: 'price_xxx',
  userId: user.id,
  customerEmail: user.email,
  customerId,                // ← Usar customer criado acima
  successUrl: `${process.env.NEXT_PUBLIC_URL}/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  trialPeriodDays: 7, // Opcional
});

// Abrir Customer Portal
const portalSession = await createCustomerPortalSession({
  customerId: user.stripe_customer_id,
  returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
});

// Verificar feature do plan
const hasAPI = hasPlanFeature('PLAN_PRO', 'API Access'); // true

// Verificar se é upgrade
const upgrading = isUpgrade('PLAN_BASIC', 'PLAN_PRO'); // true

// Listar add-ons disponíveis para o usuário
const addons = getAvailableAddons(subscription.plan.level); // [...]
```



---

## ❓ **FAQ**

**Q: Como adicionar novo plano?**
1. Criar produto no Stripe Dashboard
2. Adicionar Plan em `prisma/seed.ts`
3. Adicionar Price com stripe_price_id real
4. Rodar `npx prisma db seed`
5. Adicionar features em `src/lib/plans.ts`

**Q: Como trocar de plano (upgrade/downgrade)?**

**Via API `/api/checkout`** (recomendado):
```typescript
// POST /api/checkout com priceId
// - Upgrade: aplica imediato com prorata
// - Downgrade: agenda para fim do período
const response = await fetch('/api/checkout', {
  method: 'POST',
  body: JSON.stringify({ priceId: 'price_novo' }),
});
// response.type: 'upgrade' | 'downgrade_scheduled' | 'interval_change'
```

**Via lib diretamente** (use com cuidado):
```typescript
import { updateSubscriptionPrice } from '@/lib/stripe';

await updateSubscriptionPrice({
  subscriptionId: subscription.stripe_subscription_id,
  newPriceId: 'price_novo_plano',
  prorationBehavior: 'create_prorations', // Cobrar/creditar pro rata
});
```

**Q: Como cancelar assinatura ao fim do período?**
```typescript
import { cancelSubscriptionAtPeriodEnd } from '@/lib/stripe';

await cancelSubscriptionAtPeriodEnd(subscription.stripe_subscription_id);
```

**Q: Como reativar assinatura cancelada?**
```typescript
import { reactivateSubscription } from '@/lib/stripe';

await reactivateSubscription(subscription.stripe_subscription_id);
```

**Q: Webhook não está funcionando localmente?**
- Verifique se `stripe listen` está rodando
- Confirme `STRIPE_WEBHOOK_SECRET` no `.env.local`
- Veja logs no terminal do `stripe listen`
- Teste assinatura no terminal: `stripe.webhooks.constructEvent()`

**Q: Como verificar se usuário tem plano ativo?**
```typescript
const subscription = await prisma.subscription.findFirst({
  where: {
    user_id: userId,
    status: { in: ['active', 'trialing'] },
    current_period_end: { gte: new Date() },
  },
  include: {
    price: {
      include: { plan: true },
    },
  },
});

if (subscription) {
  console.log('Plan:', subscription.price.plan.name);
  console.log('Level:', subscription.price.plan.level);
}
```

---

**✅ Sistema completo de Stripe implementado!**
