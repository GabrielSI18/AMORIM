'use client';

import { useState } from 'react';
import type { AIProvider } from '@/types/ai';

/**
 * Hook para Chat Multi-modal (Texto + Imagens)
 * 
 * ✅ Casos de uso:
 * - "Compare estas 3 fotos de produtos"
 * - "Analise estas capturas de tela"
 * - "Encontre diferenças entre estas imagens"
 * - "O que você vê nestas fotos?"
 * - "Leia o texto destas imagens"
 * 
 * @example
 * ```tsx
 * 'use client';
 * 
 * import { useAIVision } from '@/hooks/use-ai';
 * 
 * export default function VisionPage() {
 *   const { sendMessage, response, isLoading } = useAIVision({
 *     provider: 'openai'
 *   });
 * 
 *   const handleAnalyze = async (images: File[]) => {
 *     const content = [
 *       { type: 'text', text: 'Compare estas imagens e me diga qual produto vende mais' },
 *       ...images.map(img => ({ type: 'image', file: img }))
 *     ];
 *     
 *     await sendMessage(content);
 *   };
 * 
 *   return (
 *     <div>
 *       <input
 *         type="file"
 *         accept="image/*"
 *         multiple
 *         onChange={(e) => handleAnalyze(Array.from(e.target.files || []))}
 *       />
 *       {response && <p>{response}</p>}
 *     </div>
 *   );
 * }
 * ```
 */

interface UseAIVisionOptions {
  /**
   * Provider de IA
   * - 'openai': GPT-4 Vision (recomendado)
   * - 'deepinfra': LLaVA, modelos multi-modais
   */
  provider?: AIProvider;
  
  /**
   * Modelo específico (opcional)
   */
  model?: string;
}

type VisionContent = Array<{
  type: 'text' | 'image';
  text?: string;
  file?: File;
  imageUrl?: string;
}>;

export function useAIVision(options?: UseAIVisionOptions) {
  const { provider = 'openai', model } = options || {};
  
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const sendMessage = async (content: VisionContent): Promise<string> => {
    setIsLoading(true);
    setError(null);
    setResponse('');
    
    try {
      const formData = new FormData();
      formData.append('provider', provider);
      if (model) formData.append('model', model);
      
      // Preparar conteúdo
      const messageContent = content.map((item, index) => {
        if (item.type === 'text') {
          return { type: 'text', text: item.text };
        } else if (item.type === 'image') {
          // Se for File, adicionar ao FormData
          if (item.file) {
            formData.append(`image_${index}`, item.file);
            return { type: 'image' };
          }
          // Se for URL, passar direto
          return { type: 'image', imageUrl: item.imageUrl };
        }
        return null;
      }).filter(Boolean);
      
      // Adicionar mensagem
      formData.append('message', JSON.stringify({
        role: 'user',
        content: messageContent,
      }));
      
      const res = await fetch('/api/ai/vision', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao processar vision');
      }
      
      // Processar stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          fullText += chunk;
          setResponse(fullText);
        }
      }
      
      return fullText;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    response,
    isLoading,
    error,
    sendMessage,
    clearResponse: () => setResponse(''),
  };
}
