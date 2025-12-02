/**
 * @deprecated Arquivo legado - Use o novo sistema modular!
 * 
 * ⚠️ IMPORTANTE: Este arquivo foi substituído por um sistema completo.
 * 
 * ## Novo Sistema Modular
 * 
 * O sistema de IA foi refatorado para suportar **5 casos de uso**:
 * 
 * 1. **Chat** - Conversas com histórico
 * 2. **Completion** - Prompts únicos (criativos, resumos)
 * 3. **Image** - Geração e análise de imagens
 * 4. **Audio** - Transcrição e TTS
 * 5. **Vision** - Multi-modal (texto + imagens)
 * 
 * ## Como Migrar
 * 
 * ### Antes (arquivo legado):
 * ```typescript
 * import { useAI } from '@/hooks/use-ai';
 * const { messages } = useAI({ provider: 'groq' });
 * ```
 * 
 * ### Agora (novo sistema):
 * ```typescript
 * import { useAIChat } from '@/hooks/use-ai';
 * const { messages } = useAIChat({ provider: 'groq' });
 * ```
 * 
 * ## Imports Disponíveis
 * 
 * ```typescript
 * import {
 *   useAIChat,       // Chat conversacional
 *   useAICompletion, // Prompts únicos
 *   useAIImage,      // Geração/análise de imagens
 *   useAIAudio,      // Transcrição/TTS
 *   useAIVision      // Multi-modal
 * } from '@/hooks/use-ai';
 * ```
 * 
 * ## Documentação
 * 
 * - **Guia completo**: `src/hooks/use-ai/README.md`
 * - **Guia rápido**: `GUIA-RAPIDO-IA.md`
 * - **Exemplos práticos**: `/examples/ai`
 * 
 * ## Migração Automática
 * 
 * Para manter compatibilidade com código legado, este arquivo
 * exporta o `useAIChat` com alias `useAI`.
 */

// Alias para manter compatibilidade com código legado
export { useAIChat as useAI } from './use-ai/use-ai-chat';

// Re-exportar todos os hooks do novo sistema
export { useAIChat } from './use-ai/use-ai-chat';
export { useAICompletion } from './use-ai/use-ai-completion';
export { useAIImage } from './use-ai/use-ai-image';
export { useAIAudio } from './use-ai/use-ai-audio';
export { useAIVision } from './use-ai/use-ai-vision';

// Re-exportar types
export type {
  AIProvider,
  ChatMessage,
  CompletionOptions,
  ImageOptions,
  ImageResult,
  AudioOptions,
  AudioResult,
  VisionMessage,
} from '@/types/ai';
