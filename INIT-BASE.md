# 🚀 Guia de Inicialização - Novo Projeto Base2025

Este guia documenta **tudo que você precisa mudar** ao iniciar um novo projeto a partir desta base.

**📚 Para overview técnico e tech stack completo**: Consulte **[README.md](./README.md)**  
**🤖 Para regras e convenções**: Consulte **[AGENTS.md](./AGENTS.md)**  
**💳 Para lógica de pagamentos**: Consulte **[STRIPE.md](./STRIPE.md)**

---

## ⚡ **PREREQUISITOS OBRIGATÓRIOS**

Antes de começar, você **PRECISA** ter:

### 1️⃣ **Conta no Clerk** (Autenticação)
- ✅ Criar conta em: https://clerk.com
- ✅ Criar nova Application
- ✅ Copiar: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`

### 2️⃣ **Banco PostgreSQL** (Supabase recomendado)
- ✅ Criar projeto em: https://supabase.com
- ✅ Copiar: `DATABASE_URL` (connection pooling) e `DIRECT_URL` (direct connection)

### 3️⃣ **Node.js 18+** instalado
- ✅ Verificar: `node -v` (deve ser >= 18)

### 4️⃣ **Git** (para versionar)
- ✅ Verificar: `git --version`

---

## 🔧 **PREREQUISITOS OPCIONAIS**

Depende das features que vai usar:

### 🤖 **IA (Inteligência Artificial)**
- **Groq** (GRATUITO) - API key: https://console.groq.com/keys
- **OpenAI** (pago) - API key: https://platform.openai.com/api-keys
- **DeepInfra** (multi-modal) - API key: https://deepinfra.com/dash/api_keys

### 💳 **Stripe (Pagamentos)**
- Conta Stripe: https://stripe.com
- Criar produtos e preços no Dashboard
- Copiar: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

**⚠️ Se não for usar IA ou Stripe, pode pular essas seções!**

---

## 🚀 **QUICK START (5 minutos)**

Se você já tem Clerk e Supabase configurados:

```bash
# 1. Clone e instale
git clone <seu-repo>
cd seu-projeto
npm install

# 2. Configure variáveis de ambiente
# Crie .env.local (usado pelo Next.js)
cp .env.example .env.local

# Crie .env (usado pelo Prisma CLI - apenas DATABASE_URL e DIRECT_URL)
echo 'DATABASE_URL="sua-connection-string"' > .env
echo 'DIRECT_URL="sua-direct-connection"' >> .env

# Edite ambos os arquivos com suas chaves:
# .env.local → Todas as variáveis (Clerk, Database, IA, Stripe)
# .env → Apenas DATABASE_URL e DIRECT_URL (para Prisma CLI)

# 3. Configure banco
npx prisma generate
npx prisma migrate dev --name init

# 4. Rode o projeto
npm run dev

# ✅ Acesse: http://localhost:3000
```

**Pronto!** Agora siga o checklist abaixo para customizar seu projeto.

---

## 📋 Checklist Completo (Passo a Passo)

### 1. Identidade do Projeto

#### 1.1 Nome e Descrição (`package.json`)
```json
{
  "name": "seu-projeto",  // ⚠️ MUDAR
  "version": "0.1.0",
  "description": "Descrição do seu projeto", // ⚠️ MUDAR
  "author": "Seu Nome", // ⚠️ MUDAR
}
```

#### 1.2 Metadata SEO (`src/lib/seo.tsx`)

O metadata é centralizado em `src/lib/seo.tsx`. Edite o `baseMetadata`:

```typescript
// src/lib/seo.tsx
export const baseMetadata: Metadata = {
  title: {
    default: 'Seu Projeto - Tagline', // ⚠️ MUDAR
    template: '%s | Seu Projeto',     // ⚠️ MUDAR
  },
  description: 'Descrição para SEO', // ⚠️ MUDAR
  keywords: ['palavra1', 'palavra2'], // ⚠️ MUDAR
  authors: [{ name: 'Seu Nome' }], // ⚠️ MUDAR
  // ...
};
```

**💡 Dica:** Veja a **Seção 9 (SEO)** para configuração completa de sitemap, robots.txt e JSON-LD.

---

### 2. Design System

#### 2.1 Paleta de Cores (`src/app/globals.css`)

**Light Mode:**
```css
:root {
  --primary: oklch(0.55 0.22 252); /* Azul vibrante - MUDAR se necessário */
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.15 0 0);
  /* ... outras cores */
}
```

**Dark Mode:**
```css
.dark {
  --primary: oklch(0.65 0.22 252); /* Azul mais claro - MUDAR se necessário */
  /* ... outras cores */
}
```

**💡 Dica:** Use [oklch.com](https://oklch.com) para criar sua paleta

#### 2.2 Espaçamentos (se precisar customizar)
```css
/* Sistema padrão: 8px, 12px, 16px, 24px, 32px, 48px, 64px */
/* Geralmente não precisa mudar */
```

#### 2.3 Border Radius (se precisar customizar)
```css
:root {
  --radius: 0.75rem; /* 12px - padrão */
}
```

---

### 3. Clerk (Autenticação)

#### 3.1 Criar Conta no Clerk
1. Acesse: https://clerk.com
2. Crie uma nova **Application**
3. Escolha **Email/Password** ou métodos OAuth

#### 3.2 Configurar `.env.local`
```bash
# Copie do dashboard do Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # ⚠️ MUDAR
CLERK_SECRET_KEY=sk_test_... # ⚠️ MUDAR

# URLs (geralmente manter assim)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### 3.3 Webhook (Opcional mas Recomendado)
Se quiser sincronizar usuários com o banco:

1. **Desenvolvimento Local:**
   ```bash
   ngrok http 3000
   # Copie a URL gerada (ex: https://abc123.ngrok.io)
   ```

2. **No Dashboard do Clerk:**
   - Webhooks → Add Endpoint
   - URL: `https://abc123.ngrok.io/api/webhooks/clerk`
   - Eventos: `user.created`, `user.updated`, `user.deleted`
   - Copie o **Signing Secret**

3. **Adicione no `.env.local`:**
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_... # ⚠️ ADICIONAR
   ```

**Produção:** Use a URL real do seu domínio

---

### 4. Banco de Dados (Supabase)

#### 4.1 Criar Projeto no Supabase
1. Acesse: https://supabase.com
2. Crie um **novo projeto**
3. Aguarde o setup (2-3 minutos)

#### 4.2 Pegar Connection Strings
No Supabase:
- **Settings** → **Database** → **Connection string**
- Copie:
  - **Connection pooling** (para `DATABASE_URL`)
  - **Direct connection** (para `DIRECT_URL`)

#### 4.3 Configurar `.env.local`
```bash
# Adicione em .env.local (valores reais, ignorado no git)

# Connection pooling (para queries normais)
DATABASE_URL="postgresql://postgres.xxx:[password]@xxx.supabase.co:6543/postgres?pgbouncer=true" # ⚠️ MUDAR

# Direct connection (para migrations)
DIRECT_URL="postgresql://postgres.xxx:[password]@xxx.supabase.co:5432/postgres" # ⚠️ MUDAR
```

**💡 Sobre `.env` vs `.env.local`:**
- `.env` → Apenas placeholders para Prisma CLI (commitado)
- `.env.local` → Valores reais (ignorado no git, tem prioridade)
- Prisma funciona com ambos, mas `.env.local` sobrescreve `.env`
- **Não crie** `prisma.config.ts` - ele causa conflitos

#### 4.4 Executar Migration
```bash
npx prisma migrate dev --name init
```

#### 4.5 Customizar Schema Prisma (se necessário)

**Adicionar novos modelos em `prisma/schema.prisma`:**
```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  userId    String
  user      User     @relation(fields: [userId], references: [clerkId])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("posts")
}
```

**Adicionar relação no User:**
```prisma
model User {
  // ... campos existentes
  posts     Post[]
}
```

**Rodar migration:**
```bash
npx prisma migrate dev --name add_posts
```

---

### 5. IA (Inteligência Artificial)

**📚 Para detalhes completos sobre providers**: Veja seção IA no **[README.md](./README.md#-tech-stack)**

#### 5.1 Groq (Gratuito - Recomendado para Dev)

1. API Key: https://console.groq.com/keys
2. Configure `.env.local`:
   ```bash
   ACTIVE_AI_GROQ="true"
   GROQ_API_KEY=gsk_... # ⚠️ MUDAR
   ```

#### 5.2 OpenAI (Pago - Recomendado para Produção)

1. API Key: https://platform.openai.com/api-keys
2. Configure `.env.local`:
   ```bash
   ACTIVE_AI_OPENAI="true"
   OPENAI_API_KEY=sk-proj-... # ⚠️ MUDAR
   ```

#### 5.3 DeepInfra (Multi-modal Avançado)

1. API Key: https://deepinfra.com/dash/api_keys
2. Configure `.env.local`:
   ```bash
   ACTIVE_AI_DEEPINFRA="true"
   DEEPINFRA_API_KEY=... # ⚠️ MUDAR
   ```

---

### 6. Landing Page

#### 5.1 Nome do Projeto (`src/components/ui/header.tsx`)
```tsx
<Link href="/" className="...">
  Seu Projeto {/* ⚠️ MUDAR de "Base2025" */}
</Link>
```

#### 5.2 Conteúdo Principal (`src/app/page.tsx`)

**Badge:**
```tsx
<span>Projeto Base 2025</span> {/* ⚠️ MUDAR */}
```

**Título:**
```tsx
<h1>
  Construa seu <span>SaaS moderno</span> em minutos {/* ⚠️ MUDAR */}
</h1>
```

**Subtítulo:**
```tsx
<p>
  Stack completa com Next.js 16... {/* ⚠️ MUDAR */}
</p>
```

**Features (array no final do arquivo):**
```tsx
const features = [
  {
    icon: '🚀',
    title: 'Performance', // ⚠️ MUDAR
    description: '...' // ⚠️ MUDAR
  },
  // ... adicione/remova/modifique features
]
```

---

### 6. Rotas Protegidas

#### 6.1 Middleware (`src/middleware.ts`)

**Adicionar rotas públicas:**
```typescript
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/about',              // ⚠️ ADICIONAR se criar página pública
  '/pricing',            // ⚠️ ADICIONAR se criar página pública
  // ... outras rotas públicas
])
```

**⚠️ Importante:**
- Toda rota **não listada** aqui será **protegida** (requer login)
- API routes `/api/webhooks/*` devem sempre ser públicas

---

### 7. Assets

#### 7.1 Favicon
- Substitua `/public/favicon.svg` pelo seu logo
- Ou crie `favicon.ico` (16x16, 32x32, 48x48)

#### 7.2 Logo
- Substitua `/public/logo.svg` pelo seu logo completo
- Recomendado: 200x200px ou maior

#### 7.3 OG Image (Opcional)
- Crie `/public/og-image.png` (1200x630px)
- Adicione no `layout.tsx`:
  ```typescript
  openGraph: {
    images: ['/og-image.png'],
  }
  ```

---

### 8. Páginas do Dashboard

#### 8.1 Dashboard Home (`src/app/dashboard/page.tsx`)

**Personalizar mensagem:**
```tsx
<h1>Olá, {user.firstName || 'Usuário'}! 👋</h1> {/* ⚠️ CUSTOMIZAR */}
<p>Bem-vindo ao seu dashboard</p> {/* ⚠️ CUSTOMIZAR */}
```

**Personalizar cards de stats:**
```tsx
<StatCard
  title="Projetos" // ⚠️ MUDAR
  value="0" // ⚠️ MUDAR (buscar do banco)
  description="..." // ⚠️ MUDAR
  icon="📁" // ⚠️ MUDAR
/>
```

---

### 9. SEO (Search Engine Optimization)

#### 9.1 Configurar Dados Base (`src/lib/seo.tsx`)

O projeto usa helpers centralizados para SEO. Configure os dados da sua empresa:

```tsx
// src/lib/seo.tsx

// ⚠️ MUDAR: Dados base do projeto
export const baseMetadata: Metadata = {
  title: {
    default: 'Seu Projeto - Tagline',
    template: '%s | Seu Projeto',
  },
  description: 'Descrição do seu projeto para SEO',
  keywords: ['palavra1', 'palavra2', 'palavra3'],
  authors: [{ name: 'Seu Nome/Empresa' }],
  // ...
};

// ⚠️ MUDAR: Dados para JSON-LD (dados estruturados Google)
export function OrganizationJsonLd() {
  const data = {
    '@type': 'Organization',
    name: 'Sua Empresa',           // ⚠️ MUDAR
    url: 'https://seudominio.com', // ⚠️ MUDAR
    logo: 'https://seudominio.com/logo.png', // ⚠️ MUDAR
    // ...
  };
}

export function SoftwareApplicationJsonLd() {
  const data = {
    '@type': 'SoftwareApplication',
    name: 'Seu App',               // ⚠️ MUDAR
    applicationCategory: 'BusinessApplication',
    // ...
  };
}
```

#### 9.2 Sitemap Dinâmico (`src/app/sitemap.ts`)

Adicione suas páginas públicas ao sitemap:

```tsx
// src/app/sitemap.ts

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seudominio.com';

  // ⚠️ ADICIONAR: Suas páginas públicas
  const staticPages = [
    '',           // Home
    '/pricing',   // Preços
    '/about',     // Sobre (se existir)
    '/blog',      // Blog (se existir)
    // ...adicione outras páginas públicas
  ];

  // ⚠️ OPCIONAL: Páginas dinâmicas do banco
  // const posts = await prisma.post.findMany({ where: { published: true } });
  // const dynamicPages = posts.map(post => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  // }));

  return staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
```

#### 9.3 Robots.txt (`public/robots.txt`)

Configure quais áreas bloquear dos crawlers:

```txt
# public/robots.txt

User-agent: *
Allow: /

# ⚠️ Bloquear áreas privadas
Disallow: /dashboard/
Disallow: /api/
Disallow: /sign-in/
Disallow: /sign-up/

# ⚠️ MUDAR: URL do sitemap
Sitemap: https://seudominio.com/sitemap.xml
```

#### 9.4 Usar Metadata em Páginas

Para páginas específicas, use o helper `generatePageMetadata`:

```tsx
// src/app/pricing/page.tsx
import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'Preços',
  description: 'Conheça nossos planos e preços',
  path: '/pricing',
});

export default function PricingPage() {
  // ...
}
```

#### 9.5 Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://seudominio.com # ⚠️ MUDAR (usado no sitemap e metadata)
```

**💡 Dica:** O JSON-LD ajuda o Google a entender melhor seu site e pode melhorar a exibição nos resultados de busca (rich snippets).

---

### 10. Email (AWS SES)

#### 10.1 Configurar AWS SES

1. Criar conta AWS: https://aws.amazon.com
2. Acessar SES: https://console.aws.amazon.com/ses
3. Verificar domínio ou email remetente
4. Criar IAM User com permissão `AmazonSESFullAccess`
5. Gerar Access Keys

#### 10.2 Variáveis de Ambiente

```bash
# .env.local

# Controle de ativação (desabilite se não usar email)
ACTIVE_EMAIL=true              # ⚠️ MUDAR para false se não usar

# AWS SES
AWS_ACCESS_KEY_ID=AKIA...      # ⚠️ MUDAR
AWS_SECRET_ACCESS_KEY=...       # ⚠️ MUDAR
AWS_REGION=us-east-1            # ⚠️ MUDAR se necessário

# Email
EMAIL_FROM=noreply@seudominio.com  # ⚠️ MUDAR (deve ser verificado no SES)
```

#### 10.3 Personalizar Templates (`src/lib/email-templates.tsx`)

Os templates de email usam React Email. Personalize:

```tsx
// Constantes no topo do arquivo
const APP_NAME = 'SeuProjeto';  // ⚠️ MUDAR
const APP_URL = 'https://seudominio.com';  // ⚠️ MUDAR
const LOGO_URL = `${APP_URL}/logo.png`;  // ⚠️ MUDAR

// Cores do botão (linha ~47)
backgroundColor: '#2563eb',  // ⚠️ MUDAR para sua cor primária
```

#### 10.4 Templates Disponíveis

- **WelcomeEmail** - Enviado ao criar usuário (Clerk webhook)
- **PaymentSuccessEmail** - Enviado ao pagar fatura (Stripe webhook)
- **PaymentFailedEmail** - Enviado ao falhar pagamento (Stripe webhook)
- **SubscriptionCanceledEmail** - Enviado ao cancelar assinatura
- **TrialEndingEmail** - Enviado 3 dias antes do trial acabar

#### 10.5 Preview de Templates

```bash
# Visualizar templates no navegador
npx react-email dev
```

**⚠️ Importante:** AWS SES tem modo sandbox. Para enviar para qualquer email, solicite acesso de produção.

---

### 11. Storage (Supabase)

O sistema de storage é abstrato e preparado para múltiplos providers (Supabase, S3, R2, Blob).
Por padrão usa Supabase Storage com bucket privado `artifacts`.

#### 11.1 Configurar Bucket no Supabase

1. Acesse Supabase Dashboard → **Storage**
2. Clique em **New bucket**
3. Nome: `artifacts`
4. **Public bucket:** ❌ **Desligado** (bucket privado)
5. Clique em **Create bucket**

#### 11.2 Obter Chaves

No Supabase Dashboard:
- **Settings** → **API**
- Copie:
  - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
  - **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`)

**⚠️ Importante:** Use `service_role` (não `anon`) para operações server-side.

#### 11.3 Variáveis de Ambiente

```bash
# .env.local

# Controle de ativação
ACTIVE_STORAGE=true              # ⚠️ MUDAR para false se não usar
ACTIVE_STORAGE_SUPABASE=true     # Provider ativo

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co  # ⚠️ MUDAR
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ⚠️ MUDAR
```

#### 11.4 Uso no Código

**Server Actions (recomendado):**
```tsx
// Em qualquer Server Component ou API Route
import { uploadFile, getFileUrl, deleteFile, listUserFiles } from '@/actions/storage';

// Upload
const formData = new FormData();
formData.append('file', file);
const result = await uploadFile(formData, { folder: 'documents' });

// URL assinada (bucket privado)
const { url } = await getFileUrl(result.file.path);

// Deletar
await deleteFile(result.file.path);
```

**Hook no Cliente:**
```tsx
'use client';
import { useStorage } from '@/hooks/use-storage';

function MyComponent() {
  const { upload, uploading, files, list, remove } = useStorage();

  const handleUpload = async (file: File) => {
    const result = await upload(file, { folder: 'avatars' });
    if (result.success) {
      console.log('Uploaded:', result.file);
    }
  };
}
```

**Componente de Upload:**
```tsx
import { FileUpload } from '@/components/ui/file-upload';

<FileUpload
  onUploadComplete={(file) => console.log('Uploaded:', file)}
  accept="image/*"
  maxSize={5 * 1024 * 1024} // 5MB
  variant="default" // 'default' | 'compact' | 'avatar'
/>
```

#### 11.5 Segurança

- ✅ Arquivos são sempre salvos em `users/{userId}/...`
- ✅ Server Actions validam que o arquivo pertence ao usuário
- ✅ Bucket privado = acesso apenas via URL assinada (expira em 1h)
- ✅ Tipos e tamanhos validados antes do upload

#### 11.6 Adicionar Novos Providers (Futuro)

O sistema é preparado para S3, R2, Blob. Para adicionar:

1. Crie `src/lib/storage/providers/s3.ts` implementando `StorageProvider`
2. Registre em `src/lib/storage/index.ts`
3. Adicione `ACTIVE_STORAGE_S3=true` no `.env.local`

---

## 🎯 Ordem Recomendada de Configuração

1. ✅ Identidade (nome, descrição, metadata)
2. ✅ Design System (cores, se necessário)
3. ✅ Clerk (auth)
4. ✅ Banco de Dados (Supabase + migrations)
5. ✅ IA (OpenAI API Key)
6. ✅ Landing Page (textos e features)
7. ✅ Assets (favicon, logo)
8. ✅ Dashboard (personalizar)
9. ✅ **SEO (sitemap, robots.txt, JSON-LD)**
10. ✅ **Email (AWS SES, templates)**
11. ✅ **Storage (Supabase, bucket artifacts)**
12. ✅ Webhook (para sincronizar usuários)
13. ✅ Rotas protegidas (se adicionar novas páginas)

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build
npm start

# Prisma
npx prisma studio              # Ver dados no navegador
npx prisma migrate dev         # Criar migration
npx prisma generate            # Regenerar Prisma Client
npx prisma db push             # Push schema (dev only)

# Ngrok (webhook local)
ngrok http 3000
```

---

## 📝 Checklist Final

Antes de começar a desenvolver, confirme:

- [ ] Nome do projeto alterado em `package.json`
- [ ] Metadata SEO configurada em `layout.tsx`
- [ ] Cores do design system ajustadas (se necessário)
- [ ] Clerk configurado (keys no `.env.local`)
- [ ] Banco de dados conectado (Supabase + migrations rodadas)
- [ ] OpenAI API Key configurada (se for usar IA)
- [ ] Landing page personalizada (textos, features)
- [ ] Header com nome do projeto
- [ ] Favicon e logo substituídos
- [ ] Dashboard personalizado
- [ ] Webhook configurado (se for usar)
- [ ] Rotas públicas/privadas revisadas (`src/proxy.ts`)

---

## 💡 Dicas

1. **Comece simples:** Configure o básico primeiro, depois customize
2. **Use o Prisma Studio:** `npx prisma studio` para ver/editar dados
3. **Teste o webhook localmente:** Use ngrok antes de deploy
4. **Git desde o início:** Faça commits frequentes
5. **Documentação:** Atualize o README.md do seu projeto

---

### 6. Stripe (Pagamentos e Assinaturas)

#### 6.1 Criar Conta no Stripe
1. Acesse: https://stripe.com
2. Crie uma conta
3. Ative o **Test Mode** (toggle no canto superior direito)

#### 6.2 Obter API Keys
1. Acesse: https://dashboard.stripe.com/apikeys
2. Copie as keys:
   - **Publishable key** (começa com `pk_test_`)
   - **Secret key** (clique em "Reveal", começa com `sk_test_`)

#### 6.3 Configurar `.env.local`
```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # ⚠️ MUDAR (Secret key do passo anterior)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # ⚠️ MUDAR (Publishable key)

# Webhook Secret (será preenchido depois)
STRIPE_WEBHOOK_SECRET=whsec_... # ⚠️ MUDAR após criar webhook
```

#### 6.4 Criar Produtos e Preços (AUTOMATIZADO! 🚀)

**Temos um script que cria tudo automaticamente!**

**Pré-requisitos:**
```bash
# Instalar Stripe CLI (se não tiver)
brew install stripe/stripe-cli/stripe

# Instalar jq (para processar JSON)
brew install jq
```

**Executar script:**
```bash
# 1. Primeiro, rode o seed para criar os plans no banco
npx prisma db seed

# 2. Execute o script que cria produtos/preços no Stripe
./scripts/create-stripe-products.sh

# 3. Atualize o banco com os IDs reais do Stripe
npx prisma db execute --file prisma/update-stripe-prices.sql --schema prisma/schema.prisma
```

**O script automaticamente:**
- ✅ Cria 3 produtos no Stripe (Basic, Pro, Enterprise)
- ✅ Cria 6 preços (mensal + anual para cada plano)
- ✅ Gera SQL para atualizar o banco com os IDs reais
- ✅ Usa a `STRIPE_SECRET_KEY` do seu `.env.local`

**Saída esperada:**
```
🚀 Criando produtos e preços no Stripe...
✅ Usando chave: sk_test_51SYfAm...

📦 Criando produtos...
  ✅ Produto Basic: prod_xxx
  ✅ Produto Pro: prod_xxx
  ✅ Produto Enterprise: prod_xxx

💰 Criando preços...
  ✅ Basic Mensal (R$29): price_xxx
  ✅ Basic Anual (R$290): price_xxx
  ...

📝 Gerando SQL para atualizar o banco...
  ✅ SQL salvo em: prisma/update-stripe-prices.sql
```

**💡 Preços padrão criados:**
| Plano | Mensal | Anual (2 meses grátis) |
|-------|--------|------------------------|
| Basic | R$ 29 | R$ 290 |
| Pro | R$ 79 | R$ 790 |
| Enterprise | R$ 199 | R$ 1.990 |

**⚠️ Para customizar valores**, edite `scripts/create-stripe-products.sh` antes de executar.

---

#### 6.5 Criar Produtos Manualmente (Alternativa)

Se preferir criar manualmente no Dashboard:

1. Acesse: https://dashboard.stripe.com/test/products
2. Clique em **"+ Add product"**
3. Crie cada plano com preços mensal e anual
4. Copie os `price_id` e `product_id` 
5. Atualize manualmente no banco via Supabase Dashboard

---

#### 6.6 Configurar Webhook Endpoint

**Localmente (Desenvolvimento):**

```bash
# Inicie o webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copie o **webhook signing secret** (começa com `whsec_`) e cole em `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_... # ⚠️ MUDAR
```

**Produção:**

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"+ Add endpoint"**
3. Endpoint URL: `https://seudominio.com/api/webhooks/stripe`
4. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. Copie o **webhook signing secret** para o ambiente de produção

---

#### 6.7 Testar Integração

**Cartões de teste:**
| Cartão | Resultado |
|--------|-----------|
| `4242 4242 4242 4242` | ✅ Sucesso |
| `4000 0025 0000 3155` | 🔐 3D Secure |
| `4000 0000 0000 9995` | ❌ Recusado |

*Use qualquer data futura e CVC de 3 dígitos*

**Testar fluxo:**
```bash
# Terminal 1: Servidor
npm run dev

# Terminal 2: Webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

1. Acesse: `http://localhost:3000/examples/stripe`
2. Clique em "Checkout" em um plano
3. Use cartão de teste `4242 4242 4242 4242`
4. Verifique webhook logs no terminal
5. Confirme subscription criada no banco

---

#### 6.8 Ir para Produção

1. **Desative Test Mode** no Stripe Dashboard
2. **Execute o script novamente** com keys de produção:
   - Atualize `STRIPE_SECRET_KEY` no `.env.local` com `sk_live_...`
   - Execute `./scripts/create-stripe-products.sh`
   - Execute o SQL gerado no banco de produção
3. **Crie webhook endpoint** de produção
4. **Atualize variáveis** no Vercel/ambiente de produção

---

#### 6.9 Add-ons (Opcional)

Para criar add-ons (compras únicas):

1. Acesse: https://dashboard.stripe.com/test/products
2. Crie produtos com **"One time"** pricing
3. Preencha a tabela `addons` no banco com os IDs

---

## 📊 **ORDEM RECOMENDADA DE CONFIGURAÇÃO**

Siga essa ordem para evitar problemas:

### **✅ Fase 1: Setup Básico (OBRIGATÓRIO)**
```
1. Identidade do Projeto (package.json, layout.tsx)
2. Design System (cores, se necessário)
3. Clerk (criar conta, copiar keys)
4. Banco de Dados (Supabase, copiar URLs)
5. Criar .env.local com valores reais
6. Rodar: npx prisma generate && npx prisma migrate dev
7. Testar: npm run dev
```

### **⚙️ Fase 2: Customizações (OPCIONAL)**
```
8. Landing Page (textos, features)
9. Assets (favicon, logo)
10. Rotas protegidas (adicionar em proxy.ts)
11. Webhook do Clerk (se quiser sync de usuários)
```

### **💳 Fase 3: Pagamentos (SE PRECISAR)**
```
12. Stripe (criar conta, copiar keys para .env.local)
13. Rodar: npx prisma db seed (cria plans no banco)
14. Rodar: ./scripts/create-stripe-products.sh (cria no Stripe)
15. Rodar: npx prisma db execute --file prisma/update-stripe-prices.sql --schema prisma/schema.prisma
16. Configurar webhook: stripe listen --forward-to localhost:3000/api/webhooks/stripe
17. Testar checkout com cartão 4242 4242 4242 4242
```

### **🤖 Fase 4: IA (SE PRECISAR)**
```
17. Escolher provider (Groq gratuito, OpenAI pago, DeepInfra avançado)
18. Criar conta no provider escolhido
19. Copiar API key para .env.local
20. Ativar provider: ACTIVE_AI_GROQ="true"
21. Testar chat com o provider
```

---

## 🎯 **CENÁRIOS COMUNS**

### **Cenário 1: MVP Simples (sem pagamentos)**
```
✅ Identidade + Design
✅ Clerk + Banco
✅ Landing Page
❌ Stripe (pular seção 6)
❌ IA (pular seção 5)
```

### **Cenário 2: SaaS com Assinaturas**
```
✅ Identidade + Design
✅ Clerk + Banco
✅ Landing Page + Pricing
✅ Stripe completo (seção 6)
⚠️ IA (opcional, só se precisar)
```

### **Cenário 3: App com IA (sem pagamentos)**
```
✅ Identidade + Design
✅ Clerk + Banco
✅ IA (Groq gratuito)
❌ Stripe (pular seção 6)
```

### **Cenário 4: SaaS Completo (tudo habilitado)**
```
✅ Identidade + Design
✅ Clerk + Banco
✅ Stripe completo
✅ IA (OpenAI para chat premium)
✅ Landing + Pricing + Dashboard
```

---

#### 6.10 Estrutura de Arquivos Stripe

```
scripts/
└── create-stripe-products.sh  # 🚀 Script automatizado!
src/
├── lib/
│   ├── stripe.ts         # Singleton e helpers
│   ├── plans.ts          # Configuração de plans (features)
│   └── addons.ts         # Configuração de add-ons
├── app/
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts  # Webhook handler
│   │   ├── checkout/
│   │   │   └── route.ts      # Criar checkout session
│   │   └── portal/
│   │       └── route.ts      # Abrir customer portal
│   ├── pricing/
│   │   └── page.tsx          # Página de preços
│   └── dashboard/
│       └── billing/
│           └── page.tsx      # Gerenciar assinatura
prisma/
├── schema.prisma              # Schema com plans, subscriptions
├── seed.ts                    # Seed com plans e prices (placeholder)
└── update-stripe-prices.sql   # Gerado pelo script (IDs reais)
```

---

**Pronto!** Agora você tem um projeto totalmente personalizado e pronto para desenvolvimento. 🎉
