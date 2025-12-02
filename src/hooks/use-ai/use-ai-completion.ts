'use client';

import { useState } from 'react';
import type { AIProvider } from '@/types/ai';

/**
 * Hook para Completion (Prompts Únicos)
 * 
 * ✅ Casos de uso:
 * - Gerar criativos de anúncios
 * - Criar slogans/copies
 * - Resumir textos
 * - Tradução
 * - Geração de ideias
 * 
 * @example
 * ```tsx
 * 'use client';
 * 
 * import { useAICompletion } from '@/hooks/use-ai';
 * 
 * export default function CreativePage() {
 *   const { complete, text, isLoading } = useAICompletion({
 *     provider: 'groq' // Gratuito!
 *   });
 * 
 *   const handleGenerate = async () => {
 *     const result = await complete('Crie um slogan para cafeteria moderna');
 *     console.log(result); // Slogan gerado
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleGenerate} disabled={isLoading}>
 *         Gerar Slogan
 *       </button>
 *       {text && <p>{text}</p>}
 *     </div>
 *   );
 * }
 * ```
 */

interface UseAICompletionOptions {
  /**
   * Provider de IA
   */
  provider?: AIProvider;
  
  /**
   * Modelo específico (opcional)
   */
  model?: string;
  
  /**
   * System prompt customizado
   */
  systemPrompt?: string;
  
  /**
   * Temperatura (criatividade)
   * @default 0.7
   */
  temperature?: number;
}

export function useAICompletion(options?: UseAICompletionOptions) {
  const { provider = 'groq', model, systemPrompt, temperature = 0.7 } = options || {};
  
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const complete = async (prompt: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          provider,
          model,
          systemPrompt,
          temperature,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar texto');
      }
      
      const data = await response.json();
      setText(data.text);
      return data.text;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    text,
    isLoading,
    error,
    complete,
    clearText: () => setText(''),
  };
}
