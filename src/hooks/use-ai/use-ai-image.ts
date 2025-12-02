'use client';

import { useState } from 'react';
import type { AIProvider, ImageOperation, ImageResult } from '@/types/ai';

/**
 * Hook para Geração/Análise de Imagens
 * 
 * ✅ Casos de uso:
 * - Gerar criativos visuais
 * - Criar ilustrações
 * - Analisar produtos em fotos
 * - Extrair texto (OCR)
 * - Misturar/editar imagens
 * 
 * @example Generate
 * ```tsx
 * 'use client';
 * 
 * import { useAIImage } from '@/hooks/use-ai';
 * 
 * export default function ImageGenPage() {
 *   const { execute, result, isLoading } = useAIImage({
 *     provider: 'openai'
 *   });
 * 
 *   const handleGenerate = async () => {
 *     const images = await execute({
 *       operation: 'generate',
 *       prompt: 'Um gato astronauta no espaço',
 *       size: '1024x1024',
 *     });
 *     console.log(images.urls);
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleGenerate} disabled={isLoading}>
 *         Gerar Imagem
 *       </button>
 *       {result?.urls?.map(url => (
 *         <img key={url} src={url} alt="Gerado" />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example Analyze
 * ```tsx
 * const { execute } = useAIImage();
 * 
 * const handleAnalyze = async (file: File) => {
 *   const analysis = await execute({
 *     operation: 'analyze',
 *     image: file,
 *     prompt: 'Descreva esta imagem em detalhes',
 *   });
 *   console.log(analysis.text);
 * };
 * ```
 */

interface UseAIImageOptions {
  /**
   * Provider de IA
   * - 'openai': DALL-E 3, GPT-4 Vision
   * - 'deepinfra': Stable Diffusion, LLaVA
   */
  provider?: AIProvider;
  
  /**
   * Modelo específico (opcional)
   */
  model?: string;
}

export function useAIImage(options?: UseAIImageOptions) {
  const { provider = 'openai', model } = options || {};
  
  const [result, setResult] = useState<ImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = async (params: {
    operation: ImageOperation;
    prompt?: string;
    image?: File | string;
    mask?: File | string;
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    n?: number;
  }): Promise<ImageResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('operation', params.operation);
      formData.append('provider', provider);
      if (model) formData.append('model', model);
      
      // Adicionar campos específicos
      if (params.prompt) formData.append('prompt', params.prompt);
      if (params.size) formData.append('size', params.size);
      if (params.quality) formData.append('quality', params.quality);
      if (params.n) formData.append('n', params.n.toString());
      
      // Adicionar arquivos
      if (params.image instanceof File) {
        formData.append('image', params.image);
      } else if (typeof params.image === 'string') {
        formData.append('imageUrl', params.image);
      }
      
      if (params.mask instanceof File) {
        formData.append('mask', params.mask);
      }
      
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar imagem');
      }
      
      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    result,
    isLoading,
    error,
    execute,
    clearResult: () => setResult(null),
  };
}
