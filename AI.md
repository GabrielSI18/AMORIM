# 🤖 Sistema de IA - Lógica de Negócio

**📌 Objetivo deste arquivo**: Explicar a **arquitetura e lógica de negócio** do sistema de IA.

**Para setup prático**: Consulte **[INIT-BASE.md - Seção 7 (IA)](./INIT-BASE.md#7-ia-3-providers)**  
**Para documentação técnica completa**: Consulte **[src/hooks/use-ai/README.md](./src/hooks/use-ai/README.md)**

---

## 🚀 **QUICK START**

### ✅ Sistema 100% Pronto

Seu sistema de IA está completamente refatorado e **preparado para todos os casos de uso**:

**Estrutura Criada:**
```
src/
├── app/api/ai/          ← 5 API Routes prontas
│   ├── chat/            ✅ Chat conversacional
│   ├── completion/      ✅ Prompts únicos
│   ├── image/           ✅ Geração/análise de imagens
│   ├── audio/           ✅ Transcrição/TTS
│   └── vision/          ✅ Multi-modal
│
├── hooks/use-ai/        ← 5 Hooks React prontos
│   ├── use-ai-chat.ts           ✅
│   ├── use-ai-completion.ts     ✅
│   ├── use-ai-image.ts          ✅
│   ├── use-ai-audio.ts          ✅
│   ├── use-ai-vision.ts         ✅
│   ├── index.ts                 ✅ Barrel file
│   └── README.md                ✅ Documentação técnica
│
├── types/ai.ts          ✅ 180+ linhas de types TypeScript
└── lib/ai.ts            ✅ Helpers e validações
```

### 🎯 Como Usar (Copy-Paste Ready!)

#### 1️⃣ Chat Conversacional

```tsx
import { useAIChat } from '@/hooks/use-ai';

const chat = useAIChat({ provider: 'groq' }); // GRATUITO!

// Enviar mensagem
chat.sendMessage({ 
  role: 'user', 
  parts: [{ type: 'text', text: 'Olá!' }] 
});

// Acessar mensagens
chat.messages.forEach(msg => console.log(msg));
```

#### 2️⃣ Criativos de Anúncios

```tsx
import { useAICompletion } from '@/hooks/use-ai';

const { complete } = useAICompletion({ provider: 'groq' });

const slogan = await complete('Crie um slogan para cafeteria moderna');
console.log(slogan);
```

#### 3️⃣ Gerar Imagens

```tsx
import { useAIImage } from '@/hooks/use-ai';

const { execute } = useAIImage({ provider: 'openai' });

const result = await execute({
  operation: 'generate',
  prompt: 'Gato astronauta no espaço',
  size: '1024x1024'
});

console.log(result.urls); // URLs das imagens
```

#### 4️⃣ Transcrever Áudio (GRATUITO!)

```tsx
import { useAIAudio } from '@/hooks/use-ai';

const { execute } = useAIAudio({ provider: 'groq' }); // GRATUITO!

const result = await execute({
  operation: 'transcribe',
  audio: audioFile,
  language: 'pt',
  timestamp: true
});

console.log(result.text); // Transcrição completa
console.log(result.segments); // Com timestamps
```

#### 5️⃣ Análise Multi-modal (Múltiplas Imagens)

```tsx
import { useAIVision } from '@/hooks/use-ai';

const { sendMessage } = useAIVision({ provider: 'openai' });

await sendMessage([
  { type: 'text', text: 'Compare estas imagens' },
  { type: 'image', file: image1 },
  { type: 'image', file: image2 }
]);
```

### 🔑 Configuração Rápida

**Variáveis de Ambiente (`.env.local`):**

```bash
# Groq (GRATUITO)
GROQ_API_KEY="gsk_..."
ACTIVE_AI_GROQ="true"

# OpenAI
OPENAI_API_KEY="sk-proj-..."
ACTIVE_AI_OPENAI="true"

# DeepInfra (opcional)
DEEPINFRA_API_KEY="..."
ACTIVE_AI_DEEPINFRA="false"
```

**Obter API Keys:**
- **Groq**: https://console.groq.com/keys (GRATUITO!)
- **OpenAI**: https://platform.openai.com/api-keys

### 🎨 Página de Exemplos

Criada página completa com **todos os 5 casos de uso** funcionais:

```
http://localhost:3000/examples/ai
```

**Features**: Tabs interativos, forms funcionais, upload de arquivos, visualização de resultados, loading states, error handling

### 💡 Dica Final

Comece com **Groq (GRATUITO)** para:
- Chat
- Completion
- Transcrição de áudio (Whisper)

Use **OpenAI** para:
- Geração de imagens (DALL-E)
- Vision (análise de imagens)
- Text-to-Speech

**Custos**: Groq = $0 | OpenAI = ~$0.0025/1k tokens

---

## 📊 **ARQUITETURA**

### **3 Providers de IA**

#### 1️⃣ **Groq** (GRATUITO - Recomendado para Dev)
- **Custo**: $0 (gratuito!)
- **Rate Limits**: 30 req/min, 14.400 tokens/min
- **Modelos**:
  - Llama 3.3 70B (versatile)
  - Mixtral 8x7B (32k context)
  - DeepSeek R1 (reasoning)
  - Qwen 3 32B (reasoning)
  - Whisper Large V3 (transcrição de áudio)
- **Uso**: Desenvolvimento, testes, transcrição gratuita

#### 2️⃣ **OpenAI** (PADRÃO - Produção)
- **Custo**: ~$0.0025/1k tokens (GPT-4o-mini)
- **Rate Limits**: 500 req/min, 200k tokens/min
- **Modelos**:
  - GPT-4o (melhor qualidade)
  - GPT-4 Turbo
  - GPT-3.5 Turbo (mais barato)
  - DALL-E 3 (geração de imagens)
  - GPT-4 Vision (análise de imagens)
  - Whisper (transcrição)
  - TTS (text-to-speech)
- **Uso**: Produção, alta qualidade, multi-modal

#### 3️⃣ **DeepInfra** (AVANÇADO - Multi-modal)
- **Custo**: ~$0.0006/1k tokens (Llama 3.1)
- **Rate Limits**: 100 req/min, 50k tokens/min
- **Modelos**: 100+ modelos (Llama, DeepSeek, Qwen, Mistral, Stable Diffusion)
- **Features**: Embeddings, multi-modal, OCR, video analysis
- **Uso**: Casos avançados, embeddings para RAG

### **Controle de Ativação**

Cada provider é **controlado individualmente** por variáveis de ambiente:

```bash
# .env.local
ACTIVE_AI_GROQ="true"       # ✅ Ativa Groq
ACTIVE_AI_OPENAI="false"    # ❌ Desativa OpenAI
ACTIVE_AI_DEEPINFRA="false" # ❌ Desativa DeepInfra
```

**Validação automática**: APIs validam se provider está ativo E tem API key configurada antes de processar.

---

## 🎯 **5 CASOS DE USO**

### **1. Chat Conversacional**
- **Hook**: `useAIChat()`
- **API**: `/api/ai/chat`
- **Tecnologia**: Vercel AI SDK (`useChat`)
- **Features**: Streaming, histórico de mensagens, multi-provider
- **Exemplo de Uso**:
  - Assistente virtual
  - Chatbot de suporte
  - Q&A com contexto

### **2. Completion (Prompts Únicos)**
- **Hook**: `useAICompletion()`
- **API**: `/api/ai/completion`
- **Tecnologia**: Vercel AI SDK (`generateText`)
- **Features**: Resposta única, system prompt customizado, temperatura configurável
- **Exemplo de Uso**:
  - Gerar criativos de anúncios
  - Criar slogans/copies
  - Resumir textos
  - Tradução
  - Gerar ideias de conteúdo

### **3. Image (Geração/Análise)**
- **Hook**: `useAIImage()`
- **API**: `/api/ai/image`
- **Tecnologia**: OpenAI Images API + GPT-4 Vision
- **Operações**:
  - `generate`: Texto → Imagem (DALL-E 3)
  - `analyze`: Imagem → Texto (GPT-4 Vision)
  - `edit`: Edição com máscaras (em breve)
- **Exemplo de Uso**:
  - Criar criativos visuais
  - Gerar ilustrações
  - Analisar produtos em fotos
  - Extrair texto (OCR)
  - Comparar imagens

### **4. Audio (Transcrição/TTS)**
- **Hook**: `useAIAudio()`
- **API**: `/api/ai/audio`
- **Tecnologia**: Whisper (Groq/OpenAI) + TTS (OpenAI)
- **Operações**:
  - `transcribe`: Áudio → Texto (Whisper - **GRATUITO via Groq!**)
  - `translate`: Áudio → Texto em inglês
  - `speak`: Texto → Áudio (TTS)
- **Exemplo de Uso**:
  - Transcrever reuniões/podcasts
  - Legendar vídeos
  - Criar audiobooks/narração
  - Assistente de voz

### **5. Vision (Multi-modal)**
- **Hook**: `useAIVision()`
- **API**: `/api/ai/vision`
- **Tecnologia**: GPT-4 Vision
- **Features**: Streaming, múltiplas imagens por mensagem, texto + imagens
- **Exemplo de Uso**:
  - "Compare estas 3 fotos de produtos"
  - "Analise estas capturas de tela"
  - "Encontre diferenças entre imagens"
  - "Leia o texto destas imagens"

---

## 📁 **ARQUIVOS PRINCIPAIS**

```
src/
├── app/api/ai/
│   ├── chat/route.ts        # ✅ Chat conversacional
│   ├── completion/route.ts  # ✅ Prompts únicos
│   ├── image/route.ts       # ✅ Geração/análise de imagens
│   ├── audio/route.ts       # ✅ Transcrição/TTS
│   └── vision/route.ts      # ✅ Multi-modal
│
├── hooks/use-ai/
│   ├── use-ai-chat.ts       # Hook para chat
│   ├── use-ai-completion.ts # Hook para completion
│   ├── use-ai-image.ts      # Hook para images
│   ├── use-ai-audio.ts      # Hook para audio
│   ├── use-ai-vision.ts     # Hook para vision
│   ├── index.ts             # Barrel file
│   └── README.md            # 📚 Documentação completa
│
├── lib/
│   └── ai.ts                # Configuração de providers + helpers
│
└── types/
    └── ai.ts                # 180+ linhas de types TypeScript
```

---

## 🛠️ **HELPERS ÚTEIS**

### **Validação de Providers**

```typescript
import { canUseProvider, isProviderActive, isProviderConfigured } from '@/lib/ai';

// Validar se provider pode ser usado (ativo + configurado)
const validation = canUseProvider('groq');
if (!validation.canUse) {
  console.error(validation.error);
}

// Verificar apenas se está ativo
const active = isProviderActive('openai'); // true/false

// Verificar apenas se tem API key
const configured = isProviderConfigured('deepinfra'); // true/false
```

### **Validação de Arquivos**

```typescript
import { validateImageFile, validateAudioFile, fileToBase64 } from '@/lib/ai';

// Validar imagem (4MB max, png/jpg/webp/gif)
const imageValidation = validateImageFile(file);
if (!imageValidation.valid) {
  console.error(imageValidation.error);
}

// Validar áudio (25MB max, mp3/wav/m4a/webm/ogg/flac)
const audioValidation = validateAudioFile(file);

// Converter File para base64
const base64 = await fileToBase64(file);
```

### **Estimativa de Custos**

```typescript
import { estimateCost, rateLimits } from '@/lib/ai';

// Estimar custo de uma operação
const cost = estimateCost('openai', 1000, 500); // input tokens, output tokens
console.log(`Custo estimado: $${cost.toFixed(6)}`);

// Verificar rate limits
console.log('Groq:', rateLimits.groq.requestsPerMinute); // 30
```

### **Criação de Prompts**

```typescript
import { createSystemPrompt, prepareCompletionPrompt } from '@/lib/ai';

// System prompt pré-definido
const systemPrompt = createSystemPrompt('developer');
// "Você é um desenvolvedor experiente que fornece código limpo..."

// Preparar prompt com system prompt
const fullPrompt = prepareCompletionPrompt(
  'Crie função para validar CPF',
  'Você é um desenvolvedor Python sênior'
);
```

---

## 🎨 **EXEMPLOS PRÁTICOS**

### **1. Criativo de Anúncio**

```typescript
import { useAICompletion } from '@/hooks/use-ai';

const { complete } = useAICompletion({
  provider: 'groq', // GRATUITO!
  systemPrompt: 'Você é um copywriter criativo especializado em anúncios digitais.'
});

const ad = await complete(
  'Crie um anúncio chamativo para: Cafeteria moderna com grãos especiais. ' +
  'Inclua: título impactante, descrição curta (max 100 chars) e CTA.'
);

console.log(ad);
// Título: ☕ Desperte Seus Sentidos
// Descrição: Grãos raros, sabor único. Experiência premium a cada gole.
// CTA: Prove a Diferença →
```

### **2. Transcrever Reunião (GRATUITO!)**

```typescript
import { useAIAudio } from '@/hooks/use-ai';

const { execute } = useAIAudio({
  provider: 'groq' // ✅ Whisper gratuito!
});

const transcription = await execute({
  operation: 'transcribe',
  audio: meetingRecording,
  language: 'pt',
  timestamp: true // Incluir timestamps
});

console.log(transcription.text);
// Transcrição completa...

transcription.segments?.forEach(segment => {
  console.log(`[${segment.start}s - ${segment.end}s] ${segment.text}`);
});
```

### **3. Analisar Múltiplas Imagens**

```typescript
import { useAIVision } from '@/hooks/use-ai';

const { sendMessage, response } = useAIVision({
  provider: 'openai'
});

await sendMessage([
  { 
    type: 'text', 
    text: 'Compare estas 3 fotos de produtos e me diga qual tem maior apelo visual para venda online' 
  },
  { type: 'image', file: product1Photo },
  { type: 'image', file: product2Photo },
  { type: 'image', file: product3Photo }
]);

console.log(response);
// Análise detalhada comparando os produtos...
```

### **4. Gerar Ilustração**

```typescript
import { useAIImage } from '@/hooks/use-ai';

const { execute } = useAIImage({
  provider: 'openai'
});

const result = await execute({
  operation: 'generate',
  prompt: 'Ilustração minimalista de um programador feliz trabalhando com código, ' +
          'estilo flat design, cores vibrantes azul e laranja, fundo branco',
  size: '1024x1024',
  quality: 'hd'
});

console.log(result.urls); // ['https://...']
console.log(result.revised_prompt); // Prompt revisado pelo DALL-E
```

### **5. Workflow Completo: Áudio → Texto → Modificado → TTS**

```typescript
import { useAIAudio, useAICompletion } from '@/hooks/use-ai';

// 1. Transcrever áudio (GRATUITO!)
const { execute: transcribe } = useAIAudio({ provider: 'groq' });
const transcription = await transcribe({
  operation: 'transcribe',
  audio: audioFile,
  language: 'pt'
});

// 2. Modificar texto
const { complete } = useAICompletion({ provider: 'groq' });
const modified = await complete(
  `Reescreva este texto de forma mais formal e profissional: ${transcription.text}`
);

// 3. Converter para áudio novamente
const { execute: speak } = useAIAudio({ provider: 'openai' });
const audio = await speak({
  operation: 'speak',
  text: modified,
  voice: 'nova',
  speed: 1.0
});

// 4. Tocar áudio final
const audioElement = new Audio(audio.audioUrl);
audioElement.play();
```

---

## 💰 **CUSTOS E RATE LIMITS**

### **Groq (Gratuito)**
- **Custo**: $0
- **Rate Limits**: 30 requests/min, 14.400 tokens/min
- **Quando usar**: Desenvolvimento, testes, transcrição de áudio

### **OpenAI**
- **Custo (GPT-4o-mini)**: $0.0025/1k tokens
- **Custo (DALL-E 3)**: $0.040/imagem (1024x1024)
- **Custo (TTS)**: $0.015/1k caracteres
- **Custo (Whisper)**: $0.006/minuto
- **Rate Limits**: 500 requests/min (Tier 1)
- **Quando usar**: Produção, alta qualidade, multi-modal

### **DeepInfra**
- **Custo (Llama 3.1)**: $0.0006/1k tokens
- **Rate Limits**: 100 requests/min
- **Quando usar**: Casos avançados, embeddings, RAG

---

## 🔒 **SEGURANÇA**

### **Validações Automáticas**
- ✅ API keys nunca expostas no client
- ✅ Validação de providers ativos antes de processar
- ✅ Validação de tipos de arquivo (imagem: 4MB, áudio: 25MB)
- ✅ Rate limiting por provider
- ✅ Error handling consistente em todas as APIs

### **Boas Práticas**
```typescript
// ❌ NUNCA exponha API keys no client
const OPENAI_KEY = 'sk-proj-...'; // ERRADO!

// ✅ Sempre use server-side (API routes)
// src/app/api/ai/chat/route.ts
const apiKey = process.env.OPENAI_API_KEY; // ✅ CORRETO
```

---

## ❓ **FAQ**

**Q: Como adicionar novo provider?**
1. Adicionar provider no `src/lib/ai.ts`:
   ```typescript
   import { createNewProvider } from '@ai-sdk/new-provider';
   const newProvider = createNewProvider({ apiKey: process.env.NEW_API_KEY });
   ```
2. Adicionar ao type `AIProvider` em `src/types/ai.ts`
3. Atualizar funções de validação em `src/lib/ai.ts`
4. Adicionar variável `ACTIVE_AI_NEWPROVIDER` no `.env.local`

**Q: Como escolher qual provider usar?**
- **Groq**: Desenvolvimento, testes, transcrição (GRATUITO!)
- **OpenAI**: Produção, melhor qualidade, multi-modal
- **DeepInfra**: Casos avançados, embeddings, custo baixo

**Q: Por que minha transcrição está falhando?**
- Verifique se arquivo é menor que 25MB
- Verifique formato: mp3, wav, m4a, webm, ogg, flac
- Confirme `GROQ_API_KEY` no `.env.local`
- Confirme `ACTIVE_AI_GROQ="true"` no `.env.local`

**Q: Como usar IA em server components?**
```typescript
// src/app/server-page/page.tsx
import { generateText } from 'ai';
import { defaultModels } from '@/lib/ai';

export default async function ServerPage() {
  const result = await generateText({
    model: defaultModels.free, // Groq
    prompt: 'Gere uma lista de 5 ideias de posts'
  });

  return <div>{result.text}</div>;
}
```

**Q: Como implementar streaming no frontend?**
O `useAIChat` já faz streaming automaticamente. Para outros casos:
```typescript
// Usar readableStreamToText do Vercel AI SDK
import { streamText } from 'ai';
const result = streamText({ model, prompt });

// No client:
const response = await fetch('/api/ai/completion');
const reader = response.body?.getReader();
// Processar chunks...
```

**Q: Como limitar uso de IA por plano (Stripe)?**
```typescript
// src/app/api/ai/chat/route.ts
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

const { userId } = await auth();
const user = await prisma.user.findUnique({
  where: { clerk_id: userId! },
  include: {
    subscriptions: {
      where: { status: { in: ['active', 'trialing'] } },
      include: { price: { include: { plan: true } } }
    }
  }
});

const plan = user?.subscriptions[0]?.price.plan;

// Limitar por level
if (plan?.level < 2 && provider === 'openai') {
  return Response.json(
    { error: 'OpenAI disponível apenas para planos Pro+' },
    { status: 403 }
  );
}
```

---

## 🚀 **PRÓXIMAS FEATURES**

Roadmap do sistema de IA:

- [ ] Cache de respostas (Redis)
- [ ] Retry automático em erros
- [ ] Fallback entre providers
- [ ] Embeddings para RAG (Retrieval-Augmented Generation)
- [ ] Fine-tuning de modelos
- [ ] Image edit com máscaras (DALL-E)
- [ ] Análise de vídeos (DeepInfra)
- [ ] Speech-to-Speech (áudio → áudio)
- [ ] Dashboard de uso e custos
- [ ] Rate limiting por usuário/plano

---

**✅ Sistema completo de IA implementado!**

**Documentação adicional:**
- **Guia rápido**: [GUIA-RAPIDO-IA.md](./GUIA-RAPIDO-IA.md)
- **Documentação completa**: [src/hooks/use-ai/README.md](./src/hooks/use-ai/README.md)
- **Exemplos práticos**: `/examples/ai`
