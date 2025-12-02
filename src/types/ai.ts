/**
 * Types para Sistema de IA
 * 
 * Definições de tipos para todos os casos de uso de IA:
 * - Chat conversacional
 * - Completion (prompts únicos)
 * - Image (geração/análise)
 * - Audio (transcrição/TTS)
 * - Vision (multi-modal)
 */

// ============================================
// PROVIDERS
// ============================================

export type AIProvider = 'groq' | 'openai' | 'deepinfra';

export interface ProviderValidation {
  canUse: boolean;
  error?: string;
}

// ============================================
// CHAT
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export interface ChatOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatResponse {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: Error;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

// ============================================
// COMPLETION (Prompts Únicos)
// ============================================

export interface CompletionOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface CompletionResponse {
  text: string;
  isLoading: boolean;
  error?: Error;
  complete: (prompt: string) => Promise<string>;
}

// ============================================
// IMAGE
// ============================================

export type ImageOperation = 'generate' | 'analyze' | 'edit';

export interface ImageGenerateOptions {
  operation: 'generate';
  prompt: string;
  provider?: AIProvider;
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number; // Número de imagens
}

export interface ImageAnalyzeOptions {
  operation: 'analyze';
  image: File | string; // File ou URL
  prompt?: string; // Pergunta sobre a imagem
  provider?: AIProvider;
  model?: string;
}

export interface ImageEditOptions {
  operation: 'edit';
  image: File | string; // Imagem original
  mask?: File | string; // Máscara (opcional)
  prompt: string; // Instrução de edição
  provider?: AIProvider;
  model?: string;
}

export type ImageOptions = ImageGenerateOptions | ImageAnalyzeOptions | ImageEditOptions;

export interface ImageGenerateResult {
  urls: string[];
  revised_prompt?: string;
}

export interface ImageAnalyzeResult {
  text: string;
  confidence?: number;
}

export interface ImageEditResult {
  url: string;
}

export type ImageResult = ImageGenerateResult | ImageAnalyzeResult | ImageEditResult;

export interface ImageResponse {
  result: ImageResult | null;
  isLoading: boolean;
  error?: Error;
  execute: (options: ImageOptions) => Promise<ImageResult>;
}

// ============================================
// AUDIO
// ============================================

export type AudioOperation = 'transcribe' | 'translate' | 'speak';

export interface AudioTranscribeOptions {
  operation: 'transcribe';
  audio: File; // Arquivo de áudio
  provider?: AIProvider;
  model?: string;
  language?: string; // ISO 639-1 (pt, en, es, etc)
  timestamp?: boolean; // Incluir timestamps
}

export interface AudioTranslateOptions {
  operation: 'translate';
  audio: File; // Arquivo de áudio
  provider?: AIProvider;
  model?: string;
  targetLanguage?: string; // Idioma de destino
}

export interface AudioSpeakOptions {
  operation: 'speak';
  text: string;
  provider?: AIProvider;
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 - 4.0
}

export type AudioOptions = AudioTranscribeOptions | AudioTranslateOptions | AudioSpeakOptions;

export interface AudioTranscribeResult {
  text: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  language?: string;
}

export interface AudioTranslateResult {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface AudioSpeakResult {
  audioUrl: string;
  duration?: number;
}

export type AudioResult = AudioTranscribeResult | AudioTranslateResult | AudioSpeakResult;

export interface AudioResponse {
  result: AudioResult | null;
  isLoading: boolean;
  error?: Error;
  execute: (options: AudioOptions) => Promise<AudioResult>;
}

// ============================================
// VISION (Multi-modal)
// ============================================

export interface VisionMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    imageUrl?: string;
  }>;
}

export interface VisionOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface VisionResponse {
  messages: VisionMessage[];
  isLoading: boolean;
  error?: Error;
  sendMessage: (content: VisionMessage['content']) => Promise<void>;
  clearMessages: () => void;
}

// ============================================
// HELPERS
// ============================================

/**
 * Configuração de rate limits por provider
 */
export interface RateLimits {
  groq: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  openai: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  deepinfra: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

/**
 * Custo estimado por provider
 */
export interface CostEstimate {
  provider: AIProvider;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number; // Em USD
}
