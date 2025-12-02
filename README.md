# 🚀 Base2025

**Base moderna e completa para projetos SaaS/Web** com Next.js 16, Clerk, Stripe, IA e Prisma.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk)](https://clerk.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe)](https://stripe.com)

---

## ✨ Features

- ✅ **Next.js 16** - App Router, Server Components, TypeScript 5
- 🔐 **Clerk** - Autenticação completa (PT-BR), webhook de sincronização
- 💳 **Stripe** - Assinaturas, add-ons, webhook completo (9 eventos)
- 🗄️ **Prisma** - PostgreSQL/Supabase, migrações, seed automático
- 🤖 **IA (3 providers)** - Groq (grátis), OpenAI, DeepInfra com flags de ativação
- 🎨 **ShadCN + Tailwind v4** - Componentes modernos, design system completo
- 📊 **React Query** - Cache, sincronização, devtools
- 📈 **Chart.js** - Gráficos prontos para dashboards
- 🧠 **Zustand** - State management com persist
- ⚡ **Framer Motion** - Animações suaves

---

## 📚 Documentação

### **Iniciar Novo Projeto**
🔥 **[INIT-BASE.md](./INIT-BASE.md)** - Guia prático completo
- Prerequisites, quick start, checklist de mudanças

### **Lógica de Pagamentos**
💳 **[STRIPE.md](./STRIPE.md)** - Arquitetura Stripe
- Plans/Prices/Subscriptions, levels, eventos webhook

### **Lógica de IA**
🤖 **[AI.md](./AI.md)** - Sistema completo de IA
- 5 casos de uso, 3 providers, hooks + API routes
- Quick start integrado, exemplos práticos

### **Regras para Agentes**
🤖 **[AGENTS.md](./AGENTS.md)** - Convenções e workflow
- Regras de código, arquitetura, design system

---

## 🛠️ Tech Stack

| Categoria | Tecnologia | Versão | Uso |
|-----------|-----------|--------|-----|
| **Framework** | Next.js | 16.0.3 | App Router, SSR |
| **Linguagem** | TypeScript | 5 | Tipagem estática |
| **Banco de Dados** | Prisma + PostgreSQL | Latest | ORM + Supabase |
| **Autenticação** | Clerk | Latest | Auth completo (PT-BR) |
| **Pagamentos** | Stripe | 19.3.1 | Assinaturas + Add-ons |
| **IA** | Vercel AI SDK | Latest | Groq, OpenAI, DeepInfra |
| **UI** | ShadCN + Tailwind v4 | Latest | Componentes + Design |
| **State** | Zustand | Latest | Global state |
| **Queries** | React Query | Latest | Cache + Sync |
| **Gráficos** | Chart.js | Latest | Dashboards |
| **Animações** | Framer Motion | 11+ | Transições suaves |
| **Toasts** | Sonner | Latest | Notificações elegantes |
| **SEO** | Next.js Metadata | Built-in | Sitemap, JSON-LD |
| **Validação** | Zod | Latest | Schemas, type inference |
| **Email** | AWS SES + React Email | Latest | Emails transacionais |
| **Storage** | Supabase Storage | Latest | Upload de arquivos |

---

## 📂 Estrutura do Projeto

```
base2025/
├── prisma/
│   ├── schema.prisma      # 🗄️ Models: User, Plan, Price, Subscription, Addon
│   └── seed.ts            # 🌱 Dados iniciais (plans, prices, addons)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # 🎨 Layout global (ClerkProvider + Toaster)
│   │   ├── page.tsx             # 🏠 Landing page
│   │   ├── error.tsx            # ❌ Error boundary global
│   │   ├── not-found.tsx        # 🔍 Página 404 customizada
│   │   ├── loading.tsx          # ⏳ Loading state global
│   │   ├── sitemap.ts           # 🗺️ Sitemap dinâmico
│   │   └── api/
│   │       └── webhooks/
│   │           ├── clerk/       # 🔐 Sincronização de usuários
│   │           └── stripe/      # 💳 9 eventos (checkout, subscription, invoice)
│   ├── components/
│   │   ├── ui/                  # 🧩 ShadCN components (skeleton, spinner...)
│   │   └── charts/              # 📊 Chart.js wrappers
│   ├── lib/
│   │   ├── prisma.ts            # 🗄️ Singleton do Prisma Client
│   │   ├── stripe.ts            # 💳 Singleton do Stripe + 6 helpers
│   │   ├── plans.ts             # 📋 Features e upgrade/downgrade logic
│   │   ├── addons.ts            # 🔌 Add-ons com level requirements
│   │   ├── ai.ts                # 🤖 3 providers (Groq, OpenAI, DeepInfra)
│   │   ├── api-error.ts         # 🚨 Helpers de error handling
│   │   ├── validations.ts       # ✅ Zod schemas para validação
│   │   ├── rate-limit.ts        # 🚫 Rate limiting in-memory
│   │   ├── email.ts             # 📧 AWS SES email service
│   │   ├── email-templates.tsx  # 📨 React Email templates
│   │   ├── storage/             # 📁 Sistema de storage abstrato
│   │   │   ├── index.ts         # Factory + exports
│   │   │   ├── types.ts         # Interfaces e tipos
│   │   │   └── providers/
│   │   │       └── supabase.ts  # Provider Supabase Storage
│   │   ├── seo.tsx              # 🔍 Metadata e JSON-LD schemas
│   │   ├── utils.ts             # 🛠️ cn() e utilitários
│   │   └── query-provider.tsx   # 🔄 React Query provider
│   ├── hooks/
│   │   ├── use-ai.ts            # 🤖 Hook customizado para IA
│   │   ├── use-storage.ts       # 📁 Hook para storage (upload/download)
│   │   └── use-example.ts       # 📘 Exemplo de React Query hook
│   ├── stores/
│   │   └── user-store.ts        # 🧠 Zustand store (persist + devtools)
│   └── middleware.ts            # 🔒 Proteção de rotas (Clerk)
├── .env                         # 🔑 Variáveis (placeholders, commitado)
├── .env.local                   # 🔐 Valores reais (ignorado no git)
├── INIT-BASE.md                 # 📚 Guia de inicialização completo
├── STRIPE.md                    # 💳 Documentação do Stripe
└── AGENTS.md                    # 🤖 Regras para agentes de IA
```

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor local (http://localhost:3000)

# Banco de Dados
npx prisma studio        # UI para visualizar/editar dados
npx prisma migrate dev   # Cria nova migração
npx prisma db seed       # Popula banco com dados iniciais
npx prisma generate      # Gera Prisma Client (após mudanças no schema)

# IA (Testing)
# Configure .env.local com pelo menos uma API key:
# - GROQ_API_KEY (grátis) + ACTIVE_AI_GROQ="true"
# - OPENAI_API_KEY + ACTIVE_AI_OPENAI="true"
# - DEEPINFRA_API_KEY + ACTIVE_AI_DEEPINFRA="true"

# Stripe (Testing Local)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copia o webhook secret para .env.local (STRIPE_WEBHOOK_SECRET)

# Build e Deploy
npm run build            # Build de produção
npm run start            # Inicia servidor de produção
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para mudanças grandes:
1. Abra uma issue primeiro para discussão
2. Fork o projeto
3. Crie uma branch (`git checkout -b feature/AmazingFeature`)
4. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
5. Push para a branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## 🙏 Créditos

- [Next.js](https://nextjs.org) - Framework React
- [Clerk](https://clerk.com) - Autenticação
- [Stripe](https://stripe.com) - Pagamentos
- [Prisma](https://prisma.io) - ORM
- [ShadCN](https://ui.shadcn.com) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com) - Estilização
- [Vercel AI SDK](https://ai-sdk.dev) - IA

---

## 📞 Suporte

- 📚 Documentação: [INIT-BASE.md](./INIT-BASE.md)
- 💳 Stripe: [STRIPE.md](./STRIPE.md)
- 🤖 IA: [AI.md](./AI.md)
- 🤖 Agentes: [AGENTS.md](./AGENTS.md)
- 🐛 Issues: [GitHub Issues](https://github.com/exaltius-org/base-2025/issues)

---

**Feito com ❤️ pela [Exaltius](https://exaltius.com.br)**

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
