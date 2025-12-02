import { canUseProvider, validateAudioFile } from '@/lib/ai';
import type { AIProvider, AudioOperation } from '@/types/ai';

/**
 * POST /api/ai/audio
 * 
 * ✅ Transcrição e Síntese de Áudio
 * 
 * Suporta 3 operações:
 * 1. **transcribe**: Áudio → Texto (Whisper - GRATUITO via Groq)
 * 2. **translate**: Áudio → Texto traduzido para inglês
 * 3. **speak**: Texto → Áudio (TTS - OpenAI)
 * 
 * Casos de uso:
 * - Transcrever reuniões/podcasts
 * - Legendar vídeos automaticamente
 * - Criar audiobooks/narração
 * - Assistente de voz
 * 
 * @example Transcribe
 * ```typescript
 * const formData = new FormData();
 * formData.append('operation', 'transcribe');
 * formData.append('audio', audioFile);
 * formData.append('provider', 'groq'); // GRATUITO!
 * formData.append('language', 'pt'); // opcional
 * 
 * const response = await fetch('/api/ai/audio', {
 *   method: 'POST',
 *   body: formData
 * });
 * const data = await response.json();
 * console.log(data.text); // Transcrição completa
 * console.log(data.segments); // Timestamps (se solicitado)
 * ```
 * 
 * @example Speak (TTS)
 * ```typescript
 * const formData = new FormData();
 * formData.append('operation', 'speak');
 * formData.append('text', 'Olá, como posso ajudar?');
 * formData.append('provider', 'openai');
 * formData.append('voice', 'nova'); // alloy, echo, fable, onyx, nova, shimmer
 * 
 * const response = await fetch('/api/ai/audio', {
 *   method: 'POST',
 *   body: formData
 * });
 * const data = await response.json();
 * console.log(data.audioUrl); // URL do áudio gerado
 * ```
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const operation = formData.get('operation') as AudioOperation;
    const provider = (formData.get('provider') as AIProvider) || 'groq';
    
    // Validação básica
    if (!operation || !['transcribe', 'translate', 'speak'].includes(operation)) {
      return Response.json(
        { error: 'Campo "operation" inválido. Use: transcribe, translate ou speak' },
        { status: 400 }
      );
    }

    // Validar provider
    const validation = canUseProvider(provider);
    if (!validation.canUse) {
      return Response.json(
        { error: validation.error },
        { status: 403 }
      );
    }

    // Processar cada operação
    switch (operation) {
      case 'transcribe':
        return await handleTranscribe(formData, provider);
      
      case 'translate':
        return await handleTranslate(formData, provider);
      
      case 'speak':
        return await handleSpeak(formData, provider);
      
      default:
        return Response.json(
          { error: 'Operação não suportada' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ [AI Audio] Erro:', error);
    
    return Response.json(
      { error: 'Erro ao processar áudio' },
      { status: 500 }
    );
  }
}

/**
 * Transcreve áudio para texto (Whisper)
 * ✅ GRATUITO via Groq!
 */
async function handleTranscribe(formData: FormData, provider: AIProvider) {
  const audio = formData.get('audio') as File;
  const language = formData.get('language') as string | null;
  const timestamp = formData.get('timestamp') === 'true';
  
  if (!audio) {
    return Response.json(
      { error: 'Campo "audio" é obrigatório para transcribe' },
      { status: 400 }
    );
  }

  // Validar arquivo
  const validation = validateAudioFile(audio);
  if (!validation.valid) {
    return Response.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // Groq tem Whisper gratuito!
  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    
    const transcriptionFormData = new FormData();
    transcriptionFormData.append('file', audio);
    transcriptionFormData.append('model', 'whisper-large-v3');
    if (language) transcriptionFormData.append('language', language);
    if (timestamp) transcriptionFormData.append('response_format', 'verbose_json');
    
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: transcriptionFormData,
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return Response.json({
      text: data.text,
      segments: timestamp ? data.segments : undefined,
      language: data.language,
    });
  }

  // OpenAI também suporta Whisper
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    
    const transcriptionFormData = new FormData();
    transcriptionFormData.append('file', audio);
    transcriptionFormData.append('model', 'whisper-1');
    if (language) transcriptionFormData.append('language', language);
    if (timestamp) transcriptionFormData.append('response_format', 'verbose_json');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: transcriptionFormData,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return Response.json({
      text: data.text,
      segments: timestamp ? data.segments : undefined,
      language: data.language,
    });
  }

  return Response.json(
    { error: 'Transcrição disponível apenas com Groq (gratuito) ou OpenAI' },
    { status: 400 }
  );
}

/**
 * Traduz áudio para inglês
 */
async function handleTranslate(formData: FormData, provider: AIProvider) {
  const audio = formData.get('audio') as File;
  
  if (!audio) {
    return Response.json(
      { error: 'Campo "audio" é obrigatório para translate' },
      { status: 400 }
    );
  }

  // Validar arquivo
  const validation = validateAudioFile(audio);
  if (!validation.valid) {
    return Response.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // Groq e OpenAI suportam tradução via Whisper
  const apiKey = provider === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  const apiUrl = provider === 'groq' 
    ? 'https://api.groq.com/openai/v1/audio/translations'
    : 'https://api.openai.com/v1/audio/translations';
  const model = provider === 'groq' ? 'whisper-large-v3' : 'whisper-1';
  
  const translationFormData = new FormData();
  translationFormData.append('file', audio);
  translationFormData.append('model', model);
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: translationFormData,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return Response.json({
    text: data.text,
    targetLanguage: 'en',
  });
}

/**
 * Converte texto em áudio (TTS)
 * Apenas OpenAI suporta por enquanto
 */
async function handleSpeak(formData: FormData, provider: AIProvider) {
  const text = formData.get('text') as string;
  const voice = (formData.get('voice') as string) || 'nova';
  const speed = parseFloat(formData.get('speed') as string) || 1.0;
  
  if (!text) {
    return Response.json(
      { error: 'Campo "text" é obrigatório para speak' },
      { status: 400 }
    );
  }

  // Apenas OpenAI suporta TTS
  if (provider !== 'openai') {
    return Response.json(
      { error: 'TTS (speak) disponível apenas com provider "openai"' },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      speed,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  // Retornar áudio como blob
  const audioBuffer = await response.arrayBuffer();
  
  // Converter para base64 para retornar via JSON
  const base64 = Buffer.from(audioBuffer).toString('base64');
  const audioUrl = `data:audio/mpeg;base64,${base64}`;
  
  return Response.json({
    audioUrl,
  });
}
