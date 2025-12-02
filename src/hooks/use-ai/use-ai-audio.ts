'use client';

import { useState } from 'react';
import type { AIProvider, AudioOperation, AudioResult } from '@/types/ai';

/**
 * Hook para Transcrição e Síntese de Áudio
 * 
 * ✅ Casos de uso:
 * - Transcrever reuniões/podcasts (GRATUITO via Groq!)
 * - Legendar vídeos
 * - Criar audiobooks/narração
 * - Assistente de voz
 * - Traduzir áudio para inglês
 * 
 * @example Transcribe
 * ```tsx
 * 'use client';
 * 
 * import { useAIAudio } from '@/hooks/use-ai';
 * 
 * export default function TranscribePage() {
 *   const { execute, result, isLoading } = useAIAudio({
 *     provider: 'groq' // GRATUITO!
 *   });
 * 
 *   const handleTranscribe = async (audioFile: File) => {
 *     const transcription = await execute({
 *       operation: 'transcribe',
 *       audio: audioFile,
 *       language: 'pt', // opcional
 *       timestamp: true, // incluir timestamps
 *     });
 *     console.log(transcription.text);
 *     console.log(transcription.segments); // com timestamps
 *   };
 * 
 *   return (
 *     <div>
 *       <input
 *         type="file"
 *         accept="audio/*"
 *         onChange={(e) => e.target.files?.[0] && handleTranscribe(e.target.files[0])}
 *       />
 *       {result && <p>{result.text}</p>}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example Speak (TTS)
 * ```tsx
 * const { execute } = useAIAudio({ provider: 'openai' });
 * 
 * const handleSpeak = async (text: string) => {
 *   const audio = await execute({
 *     operation: 'speak',
 *     text,
 *     voice: 'nova', // alloy, echo, fable, onyx, nova, shimmer
 *     speed: 1.0,
 *   });
 *   
 *   // Tocar áudio
 *   const audioElement = new Audio(audio.audioUrl);
 *   audioElement.play();
 * };
 * ```
 */

interface UseAIAudioOptions {
  /**
   * Provider de IA
   * - 'groq': Whisper GRATUITO (transcribe/translate)
   * - 'openai': Whisper + TTS (transcribe/translate/speak)
   */
  provider?: AIProvider;
  
  /**
   * Modelo específico (opcional)
   */
  model?: string;
}

export function useAIAudio(options?: UseAIAudioOptions) {
  const { provider = 'groq', model } = options || {};
  
  const [result, setResult] = useState<AudioResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = async (params: {
    operation: AudioOperation;
    audio?: File;
    text?: string;
    language?: string;
    timestamp?: boolean;
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    speed?: number;
  }): Promise<AudioResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('operation', params.operation);
      formData.append('provider', provider);
      if (model) formData.append('model', model);
      
      // Adicionar campos específicos
      if (params.audio) formData.append('audio', params.audio);
      if (params.text) formData.append('text', params.text);
      if (params.language) formData.append('language', params.language);
      if (params.timestamp) formData.append('timestamp', 'true');
      if (params.voice) formData.append('voice', params.voice);
      if (params.speed) formData.append('speed', params.speed.toString());
      
      const response = await fetch('/api/ai/audio', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar áudio');
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
