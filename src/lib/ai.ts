import { openai } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { createDeepInfra } from '@ai-sdk/deepinfra';

/**
 * Configuração centralizada de providers de IA
 * 
 * 🎯 Estratégia de 3 Níveis:
 * 
 * 1. **Groq** (GRATUITO) 🆓
 *    - API gratuita com rate limits generosos
 *    - Modelos: Llama 3.3, Mixtral, DeepSeek R1, Qwen
 *    - Ideal para: Testes, desenvolvimento, experimentação
 *    - Browser search disponível (gpt-oss-20b/120b)
 *    - Transcrição de áudio (Whisper)
 * 
 * 2. **OpenAI** (PADRÃO) 💳
 *    - GPT-4o, GPT-4, GPT-3.5-turbo
 *    - Ideal para: Produção, respostas de alta qualidade
 *    - Melhor para: Chat, geração de texto, reasoning
 * 
 * 3. **DeepInfra** (AVANÇADO MULTI-MODAL) 🚀
 *    - 100+ modelos: Llama, DeepSeek, Qwen, Mistral
 *    - Multi-modal: Texto, Imagem, Vídeo, OCR
 *    - Ideal para: Processamento avançado, embeddings
 *    - Casos de uso: Text-to-image, image-to-text, video analysis
 */

// Inicializar providers
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const deepinfra = createDeepInfra({
  apiKey: process.env.DEEPINFRA_API_KEY,
});

// Exportar providers
export const providers = {
  groq,
  openai,
  deepinfra,
} as const;

// Modelos disponíveis por provider
export const models = {
  // 🆓 Groq (GRATUITO)
  groq: {
    llama33: groq('llama-3.3-70b-versatile'), // Llama 3.3 70B - Rápido e versátil
    llama31: groq('llama-3.1-8b-instant'), // Llama 3.1 8B - Ultra rápido
    mixtral: groq('mixtral-8x7b-32768'), // Mixtral 8x7B - 32k context
    deepseekR1: groq('deepseek-r1-distill-llama-70b'), // DeepSeek R1 - Reasoning avançado
    qwen: groq('qwen/qwen3-32b'), // Qwen 3 32B - Reasoning
    gptOss120b: groq('openai/gpt-oss-120b'), // GPT-OSS 120B - Browser search
    whisper: groq.transcription('whisper-large-v3'), // Transcrição de áudio
  },
  
  // 💳 OpenAI (PADRÃO)
  openai: {
    gpt4: openai('gpt-4-turbo'),
    gpt35: openai('gpt-3.5-turbo'),
    gpt4o: openai('gpt-4o'),
    gpt4oMini: openai('gpt-4o-mini'),
  },
  
  // 🚀 DeepInfra (AVANÇADO MULTI-MODAL)
  deepinfra: {
    llama31: deepinfra('meta-llama/Meta-Llama-3.1-70B-Instruct'), // Llama 3.1 70B
    qwen25: deepinfra('Qwen/Qwen2.5-72B-Instruct'), // Qwen 2.5 72B
    deepseekV3: deepinfra('deepseek-ai/DeepSeek-V3'), // DeepSeek V3
    // Multi-modal capabilities disponíveis via deepinfra.image() e deepinfra.textEmbedding()
  },
} as const;

// Modelos padrão por tier
export const defaultModels = {
  free: models.groq.llama33, // Groq gratuito
  standard: models.openai.gpt4oMini, // OpenAI rápido e barato
  advanced: models.deepinfra.llama31, // DeepInfra multi-modal
} as const;

// Modelo padrão global (Groq gratuito como padrão)
export const defaultModel = defaultModels.free;

/**
 * Verifica se um provider está ativo via ACTIVE_AI_<PROVIDER>
 */
export function isProviderActive(provider: 'groq' | 'openai' | 'deepinfra'): boolean {
  const activeFlags = {
    groq: process.env.ACTIVE_AI_GROQ,
    openai: process.env.ACTIVE_AI_OPENAI,
    deepinfra: process.env.ACTIVE_AI_DEEPINFRA,
  };
  
  return activeFlags[provider] === 'true';
}

/**
 * Valida se a API key do provider está configurada
 */
export function isProviderConfigured(provider: 'groq' | 'openai' | 'deepinfra'): boolean {
  const keys = {
    groq: process.env.GROQ_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    deepinfra: process.env.DEEPINFRA_API_KEY,
  };
  
  return !!keys[provider] && keys[provider] !== 'gsk_...' && keys[provider] !== 'sk-proj-...' && keys[provider] !== '...';
}

/**
 * Valida se provider pode ser usado (ativo E configurado)
 */
export function canUseProvider(provider: 'groq' | 'openai' | 'deepinfra'): { 
  canUse: boolean; 
  error?: string; 
} {
  console.log('🔍 [AI] Validando provider:', provider);
  
  const isActive = isProviderActive(provider);
  console.log(`🔍 [AI] Provider "${provider}" ativo?`, isActive);
  console.log(`🔍 [AI] ACTIVE_AI_${provider.toUpperCase()}:`, process.env[`ACTIVE_AI_${provider.toUpperCase()}` as keyof typeof process.env]);
  
  if (!isActive) {
    const error = `Provider "${provider}" está desabilitado. Ative setando ACTIVE_AI_${provider.toUpperCase()}="true" no .env.local`;
    console.error('❌ [AI]', error);
    return {
      canUse: false,
      error,
    };
  }
  
  const isConfigured = isProviderConfigured(provider);
  console.log(`🔍 [AI] Provider "${provider}" configurado?`, isConfigured);
  
  const apiKeys = {
    groq: process.env.GROQ_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    deepinfra: process.env.DEEPINFRA_API_KEY,
  };
  
  const currentKey = apiKeys[provider];
  console.log(`🔍 [AI] ${provider.toUpperCase()}_API_KEY existe?`, !!currentKey);
  console.log(`🔍 [AI] ${provider.toUpperCase()}_API_KEY primeiros chars:`, currentKey?.substring(0, 10) || 'undefined');
  
  if (!isConfigured) {
    const urls = {
      groq: 'https://console.groq.com/keys',
      openai: 'https://platform.openai.com/api-keys',
      deepinfra: 'https://deepinfra.com/dash/api_keys',
    };
    
    const envVars = {
      groq: 'GROQ_API_KEY',
      openai: 'OPENAI_API_KEY',
      deepinfra: 'DEEPINFRA_API_KEY',
    };
    
    const error = `Provider "${provider}" não possui API key configurada. Configure ${envVars[provider]} no .env.local. Obtenha em: ${urls[provider]}`;
    console.error('❌ [AI]', error);
    return {
      canUse: false,
      error,
    };
  }
  
  console.log('✅ [AI] Provider pode ser usado!');
  return { canUse: true };
}

// Configurações padrão para geração de texto
export const defaultSettings = {
  temperature: 0.7, // Criatividade (0-2)
  maxTokens: 1000, // Tokens máximos na resposta
  topP: 1, // Nucleus sampling
  frequencyPenalty: 0, // Penalidade para repetição
  presencePenalty: 0, // Penalidade para novos tópicos
};

/**
 * Helper para criar prompts consistentes
 */
export function createSystemPrompt(role: string): string {
  const basePrompts = {
    assistant: 'Você é um assistente útil e amigável.',
    developer: 'Você é um desenvolvedor experiente que fornece código limpo e bem documentado.',
    analyst: 'Você é um analista de dados que fornece insights acionáveis.',
  };

  return basePrompts[role as keyof typeof basePrompts] || basePrompts.assistant;
}

// ============================================
// HELPERS PARA COMPLETION
// ============================================

/**
 * Valida e prepara prompt para completion
 */
export function prepareCompletionPrompt(prompt: string, systemPrompt?: string): string {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt não pode estar vazio');
  }
  
  if (systemPrompt) {
    return `${systemPrompt}\n\n${prompt}`;
  }
  
  return prompt;
}

// ============================================
// HELPERS PARA IMAGE
// ============================================

/**
 * Valida arquivo de imagem
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 4 * 1024 * 1024; // 4MB
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não suportado. Use: ${allowedTypes.join(', ')}`,
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`,
    };
  }
  
  return { valid: true };
}

/**
 * Converte File para base64 (útil para alguns providers)
 * Funciona tanto no navegador quanto no servidor
 */
export async function fileToBase64(file: File): Promise<string> {
  // No servidor (Node.js) - usar Buffer
  if (typeof window === 'undefined') {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    return `data:${file.type};base64,${base64}`;
  }
  
  // No navegador - usar FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================
// HELPERS PARA AUDIO
// ============================================

/**
 * Valida arquivo de áudio
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 25 * 1024 * 1024; // 25MB (limite Whisper)
  const allowedTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 
    'audio/m4a', 'audio/ogg', 'audio/flac'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não suportado. Use: mp3, wav, m4a, webm, ogg, flac`,
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`,
    };
  }
  
  return { valid: true };
}

/**
 * Detecta idioma do áudio (helper básico)
 */
export function detectAudioLanguage(filename: string): string | undefined {
  const patterns: Record<string, RegExp> = {
    pt: /\b(pt|portugues|portuguese|brasil|brazil)\b/i,
    en: /\b(en|english|ingles)\b/i,
    es: /\b(es|espanol|spanish)\b/i,
    fr: /\b(fr|francais|french)\b/i,
  };
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(filename)) {
      return lang;
    }
  }
  
  return undefined;
}

// ============================================
// HELPERS PARA VISION
// ============================================

/**
 * Prepara conteúdo multi-modal para API
 */
export async function prepareVisionContent(
  content: Array<{ type: 'text' | 'image'; text?: string; imageUrl?: string; file?: File }>
): Promise<Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>> {
  const prepared = [];
  
  for (const item of content) {
    if (item.type === 'text' && item.text) {
      prepared.push({
        type: 'text' as const,
        text: item.text,
      });
    } else if (item.type === 'image') {
      let url = item.imageUrl;
      
      // Se for File, converter para base64
      if (item.file) {
        url = await fileToBase64(item.file);
      }
      
      if (url) {
        prepared.push({
          type: 'image_url' as const,
          image_url: { url },
        });
      }
    }
  }
  
  return prepared;
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * Rate limits conhecidos por provider
 */
export const rateLimits = {
  groq: {
    requestsPerMinute: 30, // Tier gratuito
    tokensPerMinute: 14400,
  },
  openai: {
    requestsPerMinute: 500, // Tier 1
    tokensPerMinute: 200000,
  },
  deepinfra: {
    requestsPerMinute: 100,
    tokensPerMinute: 50000,
  },
} as const;

/**
 * Estima custo de uma operação (simplificado)
 */
export function estimateCost(
  provider: 'groq' | 'openai' | 'deepinfra',
  inputTokens: number,
  outputTokens: number
): number {
  const costs = {
    groq: { input: 0, output: 0 }, // Gratuito
    openai: { input: 0.0000025, output: 0.00001 }, // GPT-4o-mini
    deepinfra: { input: 0.0000006, output: 0.0000006 }, // Llama 3.1
  };
  
  const cost = costs[provider];
  return (inputTokens * cost.input) + (outputTokens * cost.output);
}
