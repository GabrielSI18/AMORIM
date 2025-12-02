import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { defaultModels, defaultSettings } from '@/lib/ai';
import { chatLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/chat
 * 
 * Endpoint para chat com streaming de respostas
 * Suporta 3 providers: groq (gratuito - padrão), openai, deepinfra (avançado)
 * 
 * Validações:
 * - Verifica se provider está ativo (ACTIVE_AI_<PROVIDER>)
 * - Verifica se API key está configurada
 * - Rate limiting: 30 requests/minuto por usuário
 * 
 * Body:
 * {
 *   messages: UIMessage[] // Histórico de mensagens
 *   provider?: 'groq' | 'openai' | 'deepinfra' // Provider (padrão: groq)
 * }
 */
export async function POST(req: Request) {
  try {
    // Rate limiting - usa IP se não autenticado
    const { userId } = await auth();
    const identifier = userId || req.headers.get('x-forwarded-for') || 'anonymous';
    
    const rateLimitResult = chatLimiter(identifier);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { 
      messages, 
      provider = 'groq',
    }: { 
      messages: UIMessage[];
      provider?: 'groq' | 'openai' | 'deepinfra';
    } = await req.json();

    // Validação básica
    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Campo "messages" é obrigatório e deve ser um array' },
        { status: 400 }
      );
    }

    // Validar se provider pode ser usado
    const { canUseProvider } = await import('@/lib/ai');
    const validation = canUseProvider(provider);
    
    if (!validation.canUse) {
      return Response.json(
        { error: validation.error },
        { status: 403 }
      );
    }

    // Selecionar modelo baseado no provider
    const selectedModel = provider === 'groq' ? defaultModels.free
      : provider === 'deepinfra' ? defaultModels.advanced
      : defaultModels.standard;

    // Gera resposta com streaming
    const result = streamText({
      model: selectedModel,
      messages: convertToModelMessages(messages),
      temperature: defaultSettings.temperature,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('❌ Erro no chat:', error);
    
    return Response.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    );
  }
}
