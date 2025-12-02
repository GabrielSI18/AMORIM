/**
 * Sistema de IA - Base2025
 * 
 * Sistema modular para interações com IA em 5 casos de uso:
 * 
 * 1. **Chat** - Conversas com histórico
 * 2. **Completion** - Prompts únicos (criativos, resumos)
 * 3. **Image** - Geração e análise de imagens
 * 4. **Audio** - Transcrição e TTS
 * 5. **Vision** - Multi-modal (texto + imagens)
 * 
 * @example Imports
 * ```typescript
 * import { 
 *   useAIChat,      // Chat conversacional
 *   useAICompletion, // Prompts únicos
 *   useAIImage,     // Geração/análise de imagens
 *   useAIAudio,     // Transcrição/TTS
 *   useAIVision     // Multi-modal
 * } from '@/hooks/use-ai';
 * ```
 */

// Hooks
export { useAIChat } from './use-ai-chat';
export { useAICompletion } from './use-ai-completion';
export { useAIImage } from './use-ai-image';
export { useAIAudio } from './use-ai-audio';
export { useAIVision } from './use-ai-vision';

// Types
export type {
  AIProvider,
  
  // Chat
  ChatMessage,
  ChatOptions,
  ChatResponse,
  
  // Completion
  CompletionOptions,
  CompletionResponse,
  
  // Image
  ImageOperation,
  ImageGenerateOptions,
  ImageAnalyzeOptions,
  ImageEditOptions,
  ImageOptions,
  ImageGenerateResult,
  ImageAnalyzeResult,
  ImageEditResult,
  ImageResult,
  ImageResponse,
  
  // Audio
  AudioOperation,
  AudioTranscribeOptions,
  AudioTranslateOptions,
  AudioSpeakOptions,
  AudioOptions,
  AudioTranscribeResult,
  AudioTranslateResult,
  AudioSpeakResult,
  AudioResult,
  AudioResponse,
  
  // Vision
  VisionMessage,
  VisionOptions,
  VisionResponse,
} from '@/types/ai';

/**
 * Guia Rápido de Uso
 * 
 * ## 1. Chat Conversacional
 * ```typescript
 * const { messages, input, handleSubmit } = useAIChat({ provider: 'groq' });
 * ```
 * 
 * ## 2. Prompt Único
 * ```typescript
 * const { complete } = useAICompletion({ provider: 'groq' });
 * const text = await complete('Crie um slogan para cafeteria');
 * ```
 * 
 * ## 3. Geração de Imagens
 * ```typescript
 * const { execute } = useAIImage({ provider: 'openai' });
 * const result = await execute({
 *   operation: 'generate',
 *   prompt: 'Gato astronauta',
 *   size: '1024x1024'
 * });
 * ```
 * 
 * ## 4. Transcrição de Áudio (GRATUITO!)
 * ```typescript
 * const { execute } = useAIAudio({ provider: 'groq' });
 * const result = await execute({
 *   operation: 'transcribe',
 *   audio: audioFile,
 *   language: 'pt'
 * });
 * ```
 * 
 * ## 5. Análise Multi-modal
 * ```typescript
 * const { sendMessage } = useAIVision({ provider: 'openai' });
 * await sendMessage([
 *   { type: 'text', text: 'Compare estas imagens' },
 *   { type: 'image', file: image1 },
 *   { type: 'image', file: image2 }
 * ]);
 * ```
 */
