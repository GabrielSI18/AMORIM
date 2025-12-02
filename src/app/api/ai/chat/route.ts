import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { defaultModels, canUseProvider } from '@/lib/ai';
import type { AIProvider } from '@/types/ai';

/**
 * POST /api/ai/chat
 * 
 * ✅ Chat conversacional com histórico
 * 
 * Endpoint para chat com streaming de respostas usando Vercel AI SDK
 * Suporta 3 providers: groq (gratuito - padrão), openai, deepinfra (avançado)
 * 
 * Casos de uso:
 * - Assistente virtual
 * - Chatbot de suporte
 * - Conversas com contexto
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/ai/chat', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     messages: [
 *       { role: 'user', content: 'Olá!' }
 *     ],
 *     provider: 'groq' // opcional
 *   })
 * });
 * ```
 */
export async function POST(req: Request) {
  try {
    console.log('\n🚀 [AI Chat] Nova requisição');
    
    const body = await req.json();
    console.log('📦 [AI Chat] Body recebido:', JSON.stringify({
      messagesCount: body.messages?.length,
      provider: body.provider,
      model: body.model,
    }));
    
    const { 
      messages, 
      provider = 'groq',
      model,
    }: { 
      messages: UIMessage[];
      provider?: AIProvider;
      model?: string;
    } = body;

    console.log('📋 [AI Chat] Parâmetros finais:', { provider, model, messagesCount: messages?.length });

    // Validação básica
    if (!messages || !Array.isArray(messages)) {
      console.error('❌ [AI Chat] Messages inválido');
      return Response.json(
        { error: 'Campo "messages" é obrigatório e deve ser um array' },
        { status: 400 }
      );
    }

    console.log('🔍 [AI Chat] Iniciando validação do provider...');
    // Validar se provider pode ser usado
    const validation = canUseProvider(provider);
    console.log('✅ [AI Chat] Resultado da validação:', validation);
    
    if (!validation.canUse) {
      console.error('❌ [AI Chat] Provider não pode ser usado:', validation.error);
      return Response.json(
        { 
          error: validation.error,
          code: 'PROVIDER_NOT_CONFIGURED',
          provider,
        },
        { status: 403 }
      );
    }

    // Selecionar modelo
    const selectedModel = model 
      ? (provider === 'groq' && model.includes('groq.') ? model : model)
      : (provider === 'groq' ? defaultModels.free
        : provider === 'deepinfra' ? defaultModels.advanced
        : defaultModels.standard);

    console.log('🤖 [AI Chat] Modelo selecionado:', selectedModel);
    console.log('💬 [AI Chat] Iniciando streaming...');

    // Gera resposta com streaming
    const result = streamText({
      model: selectedModel,
      messages: convertToModelMessages(messages),
      temperature: 0.7,
    });
    
    console.log('✅ [AI Chat] Stream iniciado com sucesso!');

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('❌ [AI Chat] Erro:', error);
    
    return Response.json(
      { error: 'Erro ao processar chat' },
      { status: 500 }
    );
  }
}
