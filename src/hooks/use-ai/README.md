# Sistema de IA - Base2025

Sistema modular completo para interações com IA em **5 casos de uso diferentes**.

---

## 📂 Arquitetura

```
src/
├── app/api/ai/          # API Routes
│   ├── chat/            # Chat conversacional
│   ├── completion/      # Prompts únicos
│   ├── image/           # Geração/análise de imagens
│   ├── audio/           # Transcrição/TTS
│   └── vision/          # Multi-modal (texto + imagens)
│
├── hooks/use-ai/        # Hooks React
│   ├── use-ai-chat.ts
│   ├── use-ai-completion.ts
│   ├── use-ai-image.ts
│   ├── use-ai-audio.ts
│   ├── use-ai-vision.ts
│   └── index.ts         # Barrel file
│
├── lib/ai.ts            # Helpers e configuração de providers
└── types/ai.ts          # TypeScript types
```

---

## 🎯 5 Casos de Uso

### 1️⃣ Chat Conversacional (`useAIChat`)

**Quando usar**: Conversas com histórico, assistentes virtuais, chatbots

**Exemplo**:
```tsx
import { useAIChat } from '@/hooks/use-ai';

function ChatPage() {
  const { messages, input, handleSubmit } = useAIChat({
    provider: 'groq' // GRATUITO!
  });

  return (
    <form onSubmit={handleSubmit}>
      {messages.map(msg => <div key={msg.id}>{msg.content}</div>)}
      <input value={input} onChange={(e) => setInput(e.target.value)} />
    </form>
  );
}
```

**API**: `POST /api/ai/chat`
- Streaming de respostas
- Histórico de mensagens
- Suporta 3 providers (groq, openai, deepinfra)

---

### 2️⃣ Completion / Prompts Únicos (`useAICompletion`)

**Quando usar**: Criativos de anúncios, slogans, resumos, traduções, ideias

**Exemplo**:
```tsx
import { useAICompletion } from '@/hooks/use-ai';

function CreativePage() {
  const { complete, text, isLoading } = useAICompletion({
    provider: 'groq'
  });

  const handleGenerate = async () => {
    const slogan = await complete('Crie um slogan para cafeteria moderna');
    console.log(slogan);
  };

  return (
    <>
      <button onClick={handleGenerate} disabled={isLoading}>
        Gerar Slogan
      </button>
      {text && <p>{text}</p>}
    </>
  );
}
```

**API**: `POST /api/ai/completion`
- Resposta única (sem streaming)
- Suporta system prompt customizado
- Temperatura configurável

---

### 3️⃣ Geração/Análise de Imagens (`useAIImage`)

**Quando usar**: Criar criativos visuais, analisar produtos, OCR, misturar imagens

**Operações**:
- `generate`: Texto → Imagem (DALL-E 3)
- `analyze`: Imagem → Texto (GPT-4 Vision)
- `edit`: Edição com máscaras (em breve)

**Exemplo - Generate**:
```tsx
import { useAIImage } from '@/hooks/use-ai';

function ImageGenPage() {
  const { execute, result } = useAIImage({ provider: 'openai' });

  const handleGenerate = async () => {
    const images = await execute({
      operation: 'generate',
      prompt: 'Gato astronauta no espaço',
      size: '1024x1024',
      n: 1
    });
    console.log(images.urls);
  };

  return (
    <>
      <button onClick={handleGenerate}>Gerar</button>
      {result?.urls?.map(url => <img key={url} src={url} />)}
    </>
  );
}
```

**Exemplo - Analyze**:
```tsx
const { execute } = useAIImage();

const handleAnalyze = async (file: File) => {
  const analysis = await execute({
    operation: 'analyze',
    image: file,
    prompt: 'Descreva esta imagem em detalhes'
  });
  console.log(analysis.text);
};
```

**API**: `POST /api/ai/image` (FormData)

---

### 4️⃣ Transcrição e TTS (`useAIAudio`)

**Quando usar**: Transcrever reuniões, legendar vídeos, criar audiobooks, assistente de voz

**Operações**:
- `transcribe`: Áudio → Texto (Whisper - **GRATUITO via Groq!**)
- `translate`: Áudio → Texto em inglês
- `speak`: Texto → Áudio (TTS - OpenAI)

**Exemplo - Transcribe**:
```tsx
import { useAIAudio } from '@/hooks/use-ai';

function TranscribePage() {
  const { execute, result } = useAIAudio({
    provider: 'groq' // GRATUITO!
  });

  const handleTranscribe = async (audioFile: File) => {
    const transcription = await execute({
      operation: 'transcribe',
      audio: audioFile,
      language: 'pt',
      timestamp: true // incluir timestamps
    });
    
    console.log(transcription.text);
    console.log(transcription.segments); // com timestamps
  };

  return <input type="file" accept="audio/*" onChange={...} />;
}
```

**Exemplo - TTS**:
```tsx
const { execute } = useAIAudio({ provider: 'openai' });

const handleSpeak = async (text: string) => {
  const audio = await execute({
    operation: 'speak',
    text,
    voice: 'nova',
    speed: 1.0
  });
  
  const audioElement = new Audio(audio.audioUrl);
  audioElement.play();
};
```

**API**: `POST /api/ai/audio` (FormData)

---

### 5️⃣ Multi-modal / Vision (`useAIVision`)

**Quando usar**: Analisar múltiplas imagens, comparar fotos, ler capturas de tela

**Exemplo**:
```tsx
import { useAIVision } from '@/hooks/use-ai';

function VisionPage() {
  const { sendMessage, response } = useAIVision({
    provider: 'openai'
  });

  const handleAnalyze = async (images: File[]) => {
    const content = [
      { type: 'text', text: 'Compare estas imagens e me diga qual produto vende mais' },
      ...images.map(img => ({ type: 'image', file: img }))
    ];
    
    await sendMessage(content);
  };

  return (
    <>
      <input type="file" accept="image/*" multiple onChange={...} />
      {response && <p>{response}</p>}
    </>
  );
}
```

**API**: `POST /api/ai/vision` (FormData)
- Streaming de respostas
- Múltiplas imagens por mensagem
- Suporta Files ou URLs

---

## 🔑 Providers

### 🆓 Groq (GRATUITO)
- **Modelos**: Llama 3.3, Mixtral, DeepSeek R1, Qwen
- **Audio**: Whisper Large V3 (transcrição/tradução)
- **Uso**: Desenvolvimento, testes, transcrição
- **Env**: `GROQ_API_KEY`, `ACTIVE_AI_GROQ="true"`

### 💳 OpenAI (PADRÃO)
- **Modelos**: GPT-4o, GPT-4, GPT-3.5-turbo
- **Image**: DALL-E 3, GPT-4 Vision
- **Audio**: Whisper, TTS
- **Uso**: Produção, alta qualidade
- **Env**: `OPENAI_API_KEY`, `ACTIVE_AI_OPENAI="true"`

### 🚀 DeepInfra (AVANÇADO)
- **Modelos**: 100+ modelos (Llama, DeepSeek, Qwen, Mistral)
- **Multi-modal**: Texto, Imagem, Vídeo, OCR
- **Uso**: Processamento avançado, embeddings
- **Env**: `DEEPINFRA_API_KEY`, `ACTIVE_AI_DEEPINFRA="true"`

---

## 📦 Instalação

Todos os pacotes já estão no `package.json`:

```bash
npm install ai @ai-sdk/react @ai-sdk/openai @ai-sdk/groq @ai-sdk/deepinfra
```

---

## 🔧 Configuração

### 1. Variáveis de Ambiente (`.env.local`)

```bash
# Groq (GRATUITO)
GROQ_API_KEY="gsk_..."
ACTIVE_AI_GROQ="true"

# OpenAI
OPENAI_API_KEY="sk-proj-..."
ACTIVE_AI_OPENAI="true"

# DeepInfra
DEEPINFRA_API_KEY="..."
ACTIVE_AI_DEEPINFRA="false"
```

### 2. Obter API Keys

- **Groq**: https://console.groq.com/keys (GRATUITO!)
- **OpenAI**: https://platform.openai.com/api-keys
- **DeepInfra**: https://deepinfra.com/dash/api_keys

---

## 🎨 Exemplos Práticos

### Exemplo 1: Criativo de Anúncio

```tsx
import { useAICompletion } from '@/hooks/use-ai';

function AdCreativePage() {
  const { complete } = useAICompletion({
    provider: 'groq',
    systemPrompt: 'Você é um copywriter criativo especializado em anúncios digitais.'
  });

  const createAd = async (product: string) => {
    const ad = await complete(
      `Crie um anúncio chamativo para: ${product}. 
       Inclua: título, descrição curta e CTA.`
    );
    console.log(ad);
  };
}
```

### Exemplo 2: Misturar Imagens com IA

```tsx
import { useAIVision } from '@/hooks/use-ai';

function ImageMixerPage() {
  const { sendMessage } = useAIVision();

  const mixImages = async (image1: File, image2: File) => {
    await sendMessage([
      { type: 'text', text: 'Analise estas duas imagens e sugira como podemos criar uma terceira imagem que combine elementos de ambas' },
      { type: 'image', file: image1 },
      { type: 'image', file: image2 }
    ]);
  };
}
```

### Exemplo 3: Transcrever Áudio Modificado

```tsx
import { useAIAudio, useAICompletion } from '@/hooks/use-ai';

function AudioProcessorPage() {
  const { execute: transcribe } = useAIAudio({ provider: 'groq' });
  const { complete } = useAICompletion();

  const processAudio = async (audioFile: File) => {
    // 1. Transcrever (GRATUITO)
    const transcription = await transcribe({
      operation: 'transcribe',
      audio: audioFile,
      language: 'pt'
    });

    // 2. Modificar texto
    const modified = await complete(
      `Reescreva este texto de forma mais formal: ${transcription.text}`
    );

    console.log('Original:', transcription.text);
    console.log('Modificado:', modified);
  };
}
```

---

## 📊 Rate Limits e Custos

### Groq (Gratuito)
- 30 requests/min
- 14.400 tokens/min
- **Custo**: $0 (gratuito!)

### OpenAI
- 500 requests/min (Tier 1)
- 200.000 tokens/min
- **Custo**: ~$0.0025/1k tokens (GPT-4o-mini)

### DeepInfra
- 100 requests/min
- 50.000 tokens/min
- **Custo**: ~$0.0006/1k tokens (Llama 3.1)

---

## 🧪 Testando

```bash
# Chat
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Olá!"}],"provider":"groq"}'

# Completion
curl -X POST http://localhost:3000/api/ai/completion \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Crie um slogan para cafeteria","provider":"groq"}'

# Image Analyze
curl -X POST http://localhost:3000/api/ai/image \
  -F "operation=analyze" \
  -F "image=@foto.jpg" \
  -F "prompt=Descreva esta imagem"

# Audio Transcribe
curl -X POST http://localhost:3000/api/ai/audio \
  -F "operation=transcribe" \
  -F "audio=@audio.mp3" \
  -F "provider=groq"
```

---

## 🔒 Segurança

- ✅ API keys nunca expostas no client
- ✅ Validação de providers ativos
- ✅ Validação de tipos de arquivo
- ✅ Rate limiting por provider
- ✅ Error handling consistente

---

## 🚀 Próximas Features

- [ ] Cache de respostas
- [ ] Retry automático em erros
- [ ] Fallback entre providers
- [ ] Embeddings para RAG
- [ ] Fine-tuning de modelos
- [ ] Image edit com máscaras

---

## 📚 Documentação Completa

- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **Groq**: https://console.groq.com/docs
- **OpenAI**: https://platform.openai.com/docs
- **DeepInfra**: https://deepinfra.com/docs
