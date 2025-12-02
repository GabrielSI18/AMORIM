'use client';

import { useChat as useVercelChat } from '@ai-sdk/react';
import type { AIProvider } from '@/types/ai';

/**
 * Hook para Chat Conversacional com IA
 * 
 * ✅ Casos de uso:
 * - Assistente virtual
 * - Chatbot de suporte
 * - Conversas com contexto/histórico
 * 
 * @example
 * ```tsx
 * 'use client';
 * 
 * import { useAIChat } from '@/hooks/use-ai';
 * 
 * export default function ChatPage() {
 *   const { messages, input, setInput, handleSubmit, isLoading } = useAIChat({
 *     provider: 'groq' // Gratuito!
 *   });
 * 
 *   return (
 *     <div>
 *       {messages.map(message => (
 *         <div key={message.id}>
 *           {message.role}: {message.content}
 *         </div>
 *       ))}
 *       
 *       <form onSubmit={handleSubmit}>
 *         <input value={input} onChange={(e) => setInput(e.target.value)} />
 *         <button type="submit" disabled={isLoading}>Enviar</button>
 *       </form>
 *     </div>
 *   );
 * }
 * ```
 */

interface UseAIChatOptions {
  /**
   * Provider de IA
   * - 'groq': Gratuito (Llama, Mixtral) - PADRÃO
   * - 'openai': GPT-4o, GPT-4
   * - 'deepinfra': Multi-modal
   */
  provider?: AIProvider;
  
  /**
   * Modelo específico (opcional)
   */
  model?: string;
  
  /**
   * Mensagens iniciais
   */
  initialMessages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export function useAIChat(options?: UseAIChatOptions) {
  const { provider = 'groq', model } = options || {};
  
  const chat = useVercelChat({
    // @ts-expect-error - fetch customizado para injetar provider e model
    fetch: async (_input: RequestInfo | URL, init?: RequestInit) => {
      // Injetar provider e model no body
      const body = init?.body ? JSON.parse(init.body as string) : {};
      return fetch('/api/ai/chat', {
        ...init,
        body: JSON.stringify({
          ...body,
          provider,
          model,
        }),
      });
    },
  });
  
  return chat;
}
