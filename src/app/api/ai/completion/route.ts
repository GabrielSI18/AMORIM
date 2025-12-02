import { generateText } from 'ai';
import { defaultModels, canUseProvider, prepareCompletionPrompt } from '@/lib/ai';
import type { AIProvider } from '@/types/ai';
import { chatLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/ai/completion
 * 
 * ✅ Geração de texto único (sem histórico)
 * 
 * Rate limit: 30 requests/minuto
 * 
 * Endpoint para prompts únicos sem contexto conversacional
 * Ideal para: criativos de anúncios, resumos, tradução, geração de conteúdo
 * 
 * Casos de uso:
 * - "Crie um anúncio para produto X"
 * - "Resuma este texto"
 * - "Gere 5 ideias de posts"
 * - "Traduza para inglês"
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/ai/completion', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     prompt: 'Crie um slogan para uma cafeteria moderna',
 *     provider: 'groq',
 *     systemPrompt: 'Você é um copywriter criativo' // opcional
 *   })
 * });
 * 
 * const data = await response.json();
 * console.log(data.text); // Slogan gerado
 * ```
 */
export async function POST(req: Request) {
  try {
    // Rate limiting
    const { userId } = await auth();
    const identifier = userId || req.headers.get('x-forwarded-for') || 'anonymous';
    
    const rateLimitResult = chatLimiter(identifier);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    console.log('\n🚀 [AI Completion] Nova requisição');
    
    const body = await req.json();
    console.log('📦 [AI Completion] Body recebido:', JSON.stringify({
      promptLength: body.prompt?.length,
      provider: body.provider,
      model: body.model,
      hasSystemPrompt: !!body.systemPrompt,
      temperature: body.temperature,
    }));
    
    const { 
      prompt,
      provider = 'groq',
      model,
      systemPrompt,
      temperature = 0.7,
    }: {
      prompt: string;
      provider?: AIProvider;
      model?: string;
      systemPrompt?: string;
      temperature?: number;
    } = body;

    console.log('📋 [AI Completion] Parâmetros finais:', { provider, model, temperature });

    // Validação básica
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error('❌ [AI Completion] Prompt inválido');
      return Response.json(
        { error: 'Campo "prompt" é obrigatório e não pode estar vazio' },
        { status: 400 }
      );
    }

    console.log('🔍 [AI Completion] Iniciando validação do provider...');
    // Validar provider
    const validation = canUseProvider(provider);
    console.log('✅ [AI Completion] Resultado da validação:', validation);
    
    if (!validation.canUse) {
      console.error('❌ [AI Completion] Provider não pode ser usado:', validation.error);
      return Response.json(
        { 
          error: validation.error,
          code: 'PROVIDER_NOT_CONFIGURED',
          provider,
        },
        { status: 403 }
      );
    }

    // Preparar prompt
    const preparedPrompt = prepareCompletionPrompt(prompt, systemPrompt);
    console.log('📝 [AI Completion] Prompt preparado (length):', preparedPrompt.length);

    // Selecionar modelo
    const selectedModel = model 
      ? model
      : (provider === 'groq' ? defaultModels.free
        : provider === 'deepinfra' ? defaultModels.advanced
        : defaultModels.standard);

    console.log('🤖 [AI Completion] Modelo selecionado:', selectedModel);
    console.log('💬 [AI Completion] Gerando texto...');

    // Gerar texto (ignora maxTokens por enquanto - API não suporta diretamente)
    const result = await generateText({
      model: selectedModel,
      prompt: preparedPrompt,
      temperature,
    });

    console.log('✅ [AI Completion] Texto gerado com sucesso!');
    console.log('📊 [AI Completion] Usage:', result.usage);

    return Response.json({
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    });
  } catch (error) {
    console.error('❌ [AI Completion] Erro:', error);
    
    return Response.json(
      { error: 'Erro ao gerar texto' },
      { status: 500 }
    );
  }
}
