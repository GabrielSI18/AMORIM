# Regras para Agentes de IA

## 🎯 Objetivo Deste Arquivo

Este arquivo define **como você deve trabalhar** com este projeto: regras de workflow, convenções de código, arquitetura e boas práticas. 

**Separação de responsabilidades:**
- **AGENTS.md (este arquivo)**: Regras, convenções, arquitetura técnica
- **[README.md](./README.md)**: Overview técnico, features, tech stack
- **[INIT-BASE.md](./INIT-BASE.md)**: Guia prático para iniciar novo projeto
- **[STRIPE.md](./STRIPE.md)**: Lógica de negócio de pagamentos
- **[AI.md](./AI.md)**: Lógica de negócio de IA (5 casos de uso)

⚠️ **REGRA ANTI-DUPLICAÇÃO**: Nunca duplique informações entre arquivos. Sempre referencie o arquivo apropriado.

---

## 📘 Inicializando um Novo Projeto

Quando o usuário pedir para **"iniciar novo projeto"**, **"criar projeto"**, **"configurar novo projeto"**:

1. ✅ Consulte **[INIT-BASE.md](./INIT-BASE.md)** para o checklist completo
2. ✅ **Modo Assistido**: Faça perguntas sequenciais (nome, descrição, cores, Clerk keys, etc)
3. ✅ **Aguarde respostas** antes de executar mudanças
4. ✅ **Crie TODO list** com todos os passos
5. ✅ **Execute sequencialmente** cada item
6. ✅ **Valide erros** ao final de cada etapa

**Não duplique** o conteúdo do INIT-BASE aqui - apenas referencie-o.

---

## Regra Central

Você é um **desenvolvedor fullstack, professor e didático**. Para cada solicitação de feature ou tarefa:

### 1. Planejamento e Explicação
- **Criar um plano detalhado** do que será implementado
- **Explicar o plano** de forma clara e didática
- **Apresentar opções de saída** (se houver alternativas)
- **Listar possibilidades e vantagens** de cada abordagem
- Aguardar confirmação antes de prosseguir

### 2. Execução com TODO
- **Criar um TODO list** usando a ferramenta `manage_todo_list`
- Seguir o TODO **passo a passo** para não se perder
- Marcar cada item como "in-progress" antes de iniciar
- Marcar cada item como "completed" imediatamente após finalizar

### 3. Validação Contínua
- **Ao final de cada TODO**:
  - Resumir inline o que foi feito
  - Executar check de erros (TypeScript/ESLint)
  - Garantir que não há problemas antes de prosseguir

## Regras Negativas

As seguintes ações **NÃO** devem ser realizadas, exceto quando explicitamente solicitado:

### 1. Testes via Arquivo
- **Não** realizar testes através de arquivos de teste
- Executar apenas **checks** (verificações estáticas)

### 2. Execução de Scripts
- **Não** executar scripts de desenvolvimento como:
  - `npm run dev` / `yarn dev`
  - `npm run lint` / `yarn lint`
  - `tsc` (TypeScript compiler)
  - Outros scripts similares
- Exceção: Quando **explicitamente solicitado** pelo usuário

### 3. Criação de Arquivos Markdown
- **Não** criar arquivos `.md` para documentar mudanças
- **Não** criar arquivos `.md` para resumir o trabalho
- Exceção: Quando **explicitamente solicitado** pelo usuário (como este arquivo)

### 4. Testes Visuais
- **Não** abrir navegador para testar visualmente
- **Não** solicitar validação visual do usuário
- Exceção: Quando **explicitamente solicitado** pelo usuário

### 5. Verificações de Funcionamento
- **Não** executar comandos apenas para "verificar se está funcionando"
- **Não** rodar servidor de desenvolvimento para validação
- Confiar nos checks estáticos (TypeScript, ESLint)
- Exceção: Quando necessário para debug de erro específico

## Stack do Projeto

**📚 Para informações completas sobre tecnologias e features, consulte: [README.md](./README.md)**

### Convenções Importantes

#### Prisma (Banco de Dados)
- **Nomenclatura**: Usar **snake_case** para colunas do banco
  ```prisma
  model User {
    clerk_id     String  @unique @map("clerk_id")
    first_name   String? @map("first_name")
    created_at   DateTime @default(now()) @map("created_at")
  }
  ```
- **Variáveis de Ambiente**:
  - `.env.example` → Template commitado (apenas placeholders)
  - `.env.local` → Valores reais (ignorado no git, usado por Next.js)
  - `.env` → Mínimo para Prisma CLI (DATABASE_URL + DIRECT_URL, ignorado no git)
  - ❌ **Não usar** `prisma.config.ts` (causa conflitos)
  - **Importante**: Prisma CLI precisa de `.env`, Next.js usa `.env.local`
  
#### Clerk (Autenticação)
- Localização: `ptBR` configurado no `ClerkProvider`
- Middleware: `src/middleware.ts` protege rotas
- Webhook: `src/app/api/webhooks/clerk/route.ts` sincroniza User

#### IA (3 Providers)
- **Para lógica de negócio**: Consulte **[AI.md](./AI.md)**
- Sistema modular: 5 casos de uso (chat, completion, image, audio, vision)
- 3 Providers: Groq (gratuito), OpenAI (produção), DeepInfra (avançado)
- Controle: `ACTIVE_AI_<PROVIDER>="true"` no `.env.local`
- Arquitetura: Hooks + API Routes + Types completos

#### Stripe (Pagamentos)
- **Para lógica de negócio**: Consulte **[STRIPE.md](./STRIPE.md)**
- Arquitetura: Plans (levels) → Prices → Subscriptions
- Webhook: 9 eventos tratados em `src/app/api/webhooks/stripe/route.ts`

#### Validação & Segurança
- **Zod**: Usar schemas de `src/lib/validations.ts`
  ```tsx
  import { checkoutSchema, safeParse } from '@/lib/validations';
  
  // Validação segura (retorna { success, data, error })
  const validation = safeParse(checkoutSchema, body);
  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  const { priceId } = validation.data!;
  ```
- **Rate Limiting**: Usar limiters de `src/lib/rate-limit.ts`
  ```tsx
  import { checkoutLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';
  
  const rateLimitResult = checkoutLimiter(userId);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }
  ```
- **Limiters predefinidos**:
  - `generalApiLimiter`: 100 req/min (APIs gerais)
  - `checkoutLimiter`: 10 req/min (pagamentos)
  - `chatLimiter`: 30 req/min (chat/IA)
  - `imageLimiter`: 5 req/min (geração de imagens)
  - `webhookLimiter`: 1000 req/min (webhooks)
- **Não usar**: Validação manual com `typeof`, regex solto

#### Error Handling & Toasts
- **Toast**: Usar `sonner` (já configurado no layout)
- **API Errors**: Usar helpers de `src/lib/api-error.ts`
  ```tsx
  import { toast } from 'sonner';
  import { apiFetch, apiPost, withToast, showErrorToast } from '@/lib/api-error';
  
  // Simples
  toast.success('Salvo!');
  toast.error('Erro ao salvar');
  
  // Com loading automático
  const { data, error } = await withToast(
    () => apiPost('/api/checkout', { priceId }),
    { loading: 'Processando...', success: 'Pronto!', error: 'Falhou' }
  );
  ```
- **Não usar**: `alert()`, `console.log` para feedback ao usuário
- **Error Boundary**: `src/app/error.tsx` captura erros globais
- **404**: `src/app/not-found.tsx` para rotas inexistentes

#### Loading States
- **Skeleton**: Usar `@/components/ui/skeleton` (shadcn/ui + extensões)
  ```tsx
  import { Skeleton, SkeletonCard, SkeletonTable, SkeletonStatsCard } from '@/components/ui/skeleton';
  
  // Base (shadcn)
  <Skeleton className="h-4 w-32" />
  
  // Extensões customizadas
  <SkeletonCard />
  <SkeletonTable rows={5} columns={4} />
  <SkeletonStatsCard />
  ```
- **Spinner**: Usar `@/components/ui/spinner` para loading inline
  ```tsx
  import { Spinner, SpinnerWithText } from '@/components/ui/spinner';
  
  <Spinner size="md" />
  <SpinnerWithText text="Carregando..." />
  ```
- **Loading Pages**: Next.js `loading.tsx` para transições de rota
- **Não usar**: Spinners CSS customizados, loading manual com useState

#### Storage (Upload de Arquivos)
- **Server Actions**: Usar actions de `src/actions/storage.ts`
  ```tsx
  import { uploadFile, getFileUrl, deleteFile, listUserFiles } from '@/actions/storage';
  
  // Upload
  const formData = new FormData();
  formData.append('file', file);
  const result = await uploadFile(formData, { folder: 'documents' });
  
  // URL assinada
  const { url } = await getFileUrl(result.file.path);
  ```
- **Hook cliente**: Usar `useStorage` para componentes React
  ```tsx
  import { useStorage } from '@/hooks/use-storage';
  
  const { upload, uploading, files, remove } = useStorage();
  await upload(file, { folder: 'avatars' });
  ```
- **Componente UI**: Usar `FileUpload` para drag & drop
  ```tsx
  import { FileUpload } from '@/components/ui/file-upload';
  
  <FileUpload
    onUploadComplete={(file) => console.log(file)}
    accept="image/*"
    maxSize={5 * 1024 * 1024}
    variant="avatar" // 'default' | 'compact' | 'avatar'
  />
  ```
- **Segurança**: Arquivos sempre em `users/{userId}/...`, validação automática
- **Bucket**: `artifacts` (privado, acesso via URL assinada)
- **Não usar**: API Routes para upload (usar Server Actions)

---

## Design System - Base2025

### Paleta de Cores

#### Light Mode
- **Primary**: `oklch(0.55 0.22 252)` - Azul vibrante SaaS
- **Background**: `oklch(0.99 0 0)` - Branco suave
- **Foreground**: `oklch(0.15 0 0)` - Preto quase total
- **Card**: `oklch(1 0 0)` - Branco puro
- **Border**: `oklch(0.90 0 0)` - Cinza claro

#### Dark Mode
- **Primary**: `oklch(0.65 0.22 252)` - Azul mais claro
- **Background**: `oklch(0.10 0 0)` - Preto profundo
- **Foreground**: `oklch(0.98 0 0)` - Branco quase total
- **Card**: `oklch(0.15 0 0)` - Cinza escuro
- **Border**: `oklch(1 0 0 / 10%)` - Branco transparente

### Espaçamentos

Sistema baseado em múltiplos de 4px:

```tsx
.spacing-xs   // gap-2  -> 8px
.spacing-sm   // gap-3  -> 12px
.spacing-md   // gap-4  -> 16px
.spacing-lg   // gap-6  -> 24px
.spacing-xl   // gap-8  -> 32px
.spacing-2xl  // gap-12 -> 48px
.spacing-3xl  // gap-16 -> 64px
```

### Tipografia

- **Font Family**: Geist Sans (variável)
- **Font Mono**: Geist Mono (código)
- **Features**: `cv11`, `ss01` (ligatures modernas)
- **Optical Sizing**: Automático

### Border Radius

```tsx
--radius-sm: 0.375rem  // 6px
--radius-md: 0.5rem    // 8px
--radius-lg: 0.75rem   // 12px (padrão)
--radius-xl: 1rem      // 16px
```

### Utilitários Customizados

```tsx
.container-custom     // Container responsivo max-w-7xl
.transition-smooth    // Transição suave 300ms
.bg-gradient-primary  // Gradiente azul
.glass               // Efeito glass morphism
```

### Componentes de UI

#### Botões
- **Primary**: Fundo azul vibrante, texto branco
- **Secondary**: Fundo cinza, texto preto
- **Outline**: Apenas borda, transparente
- **Ghost**: Sem borda, hover com fundo

#### Cards
- **Padrão**: Fundo branco, borda sutil, radius-lg
- **Glass**: backdrop-blur-xl com opacidade

#### Animações
- **Entrada**: fade-in com slide-up
- **Hover**: scale(1.02) com shadow
- **Transições**: 300ms ease-in-out

### Boas Práticas

1. **Sempre use variáveis CSS** ao invés de cores hardcoded
2. **Espaçamentos consistentes** usando classes .spacing-*
3. **Animações suaves** com .transition-smooth
4. **Mobile-first** com breakpoints Tailwind
5. **Acessibilidade** com contrast ratio mínimo 4.5:1

---

## Dependências Adicionais

### Animações
- **framer-motion** (v11+)
  - Biblioteca para animações React
  - Uso: `import { motion } from 'framer-motion'`
  - Exemplo: `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>`
  - Componentes: `motion.div`, `motion.button`, etc.

### Webhooks
- **svix** (v1+)
  - Validação de webhooks do Clerk
  - Uso: `import { Webhook } from 'svix'`
  - Propósito: Verificar assinatura dos eventos do Clerk
  - Local: `src/app/api/webhooks/clerk/route.ts`

---

## Configuração Clerk - Explicação das URLs

### Frontend API URL
- **O que é**: URL pública do Clerk para comunicação do navegador
- **Quando usar**: Configurações de client-side (componentes React)
- **Exemplo**: `https://learning-puma-5.clerk.accounts.dev`
- **Uso**: Automático pelo SDK `@clerk/nextjs`

### Backend API URL
- **O que é**: Endpoint da API Clerk para servidor
- **Valor padrão**: `https://api.clerk.com`
- **Quando usar**: Chamadas server-side (API routes, server components)
- **Uso**: Automático pelo SDK, não precisa configurar manualmente

### JWKS URL (JSON Web Key Set)
- **O que é**: Endpoint com chaves públicas do Clerk
- **Propósito**: Validar tokens JWT automaticamente
- **Como funciona**: Next.js busca as chaves e valida tokens de sessão
- **Uso**: Totalmente automático, não precisa configurar
- **Exemplo**: `https://learning-puma-5.clerk.accounts.dev/.well-known/jwks.json`

**Resumo**: Essas 3 URLs são **gerenciadas automaticamente** pelo Clerk. Você **não precisa** configurá-las manualmente no código - elas aparecem no dashboard apenas para referência e debugging.

---

## Revisão de Documentação (DRY)

Quando o usuário pedir para **"revisar documentação"**, **"atualizar MDs"**, **"sincronizar docs"**:

### Princípio de Separação

| Arquivo | Propósito | O que documentar |
|---------|-----------|------------------|
| **README.md** | Overview técnico | Tech stack, estrutura de pastas, comandos |
| **AGENTS.md** | Convenções de código | Padrões repetitivos (como usar X, não usar Y) |
| **INIT-BASE.md** | Configuração inicial | O que mudar ao criar novo projeto |
| **STRIPE.md** | Lógica de pagamentos | Arquitetura, fluxos, eventos |
| **AI.md** | Lógica de IA | Providers, casos de uso, hooks |

### Critérios para Documentar

**✅ DOCUMENTAR quando:**
- É um **padrão repetitivo** (toast, skeleton, spinner) → AGENTS.md
- É uma **configuração obrigatória** para novos projetos → INIT-BASE.md
- É uma **tecnologia/dependência** nova → README.md (Tech Stack)
- É um **arquivo estrutural** novo → README.md (Estrutura)

**❌ NÃO documentar quando:**
- É implementação específica (billing page, dashboard)
- É lógica interna de uma feature (APIs internas)
- É código autoexplicativo
- Já está documentado em outro arquivo (DRY)

### Checklist de Revisão

Ao finalizar uma feature grande ou TODO:

1. **Houve nova dependência?** → README.md Tech Stack
2. **Houve novo arquivo estrutural?** → README.md Estrutura
3. **Houve novo padrão de código?** → AGENTS.md Convenções
4. **Houve nova config para projetos?** → INIT-BASE.md
5. **Houve mudança em Stripe/IA?** → Arquivo específico

### Comando Rápido

Quando o usuário disser: **"revise os docs"** ou **"atualize a documentação"**:

1. Liste as mudanças feitas desde último commit/sync
2. Aplique os critérios acima
3. Proponha o que atualizar (com justificativa)
4. Aguarde confirmação antes de editar

---

## Objetivo

Estas regras visam manter o fluxo de trabalho eficiente, evitando execuções desnecessárias e criação de arquivos redundantes.
