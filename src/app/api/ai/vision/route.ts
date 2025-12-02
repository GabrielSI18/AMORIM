import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { canUseProvider } from '@/lib/ai';
import type { AIProvider } from '@/types/ai';

/**
 * POST /api/ai/vision
 * 
 * ✅ Chat Multi-modal (Texto + Imagens)
 * 
 * Endpoint para conversas com suporte a imagens
 * Permite enviar texto e imagens simultaneamente
 * 
 * Casos de uso:
 * - "Analise estas 3 fotos e me diga qual produto vende mais"
 * - "Compare estas imagens e encontre diferenças"
 * - "Leia o texto destas capturas de tela"
 * - "O que você vê nestas fotos?"
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('provider', 'openai');
 * 
 * // Mensagem com texto + imagens
 * const message = {
 *   role: 'user',
 *   content: [
 *     { type: 'text', text: 'Compare estas duas imagens' },
 *     { type: 'image', file: image1 },
 *     { type: 'image', file: image2 }
 *   ]
 * };
 * 
 * formData.append('message', JSON.stringify(message));
 * formData.append('image_0', image1);
 * formData.append('image_1', image2);
 * 
 * const response = await fetch('/api/ai/vision', {
 *   method: 'POST',
 *   body: formData
 * });
 * ```
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const provider = (formData.get('provider') as AIProvider) || 'openai';
    const messageData = formData.get('message');
    
    // Validação básica
    if (!messageData) {
      return Response.json(
        { error: 'Campo "message" é obrigatório' },
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

    // Vision só funciona com OpenAI/DeepInfra por enquanto
    if (provider === 'groq') {
      return Response.json(
        { error: 'Vision não disponível com Groq. Use "openai" ou "deepinfra"' },
        { status: 400 }
      );
    }

    // Parse message
    const message = JSON.parse(messageData as string);
    
    if (!message.content || !Array.isArray(message.content)) {
      return Response.json(
        { error: 'Message.content deve ser um array' },
        { status: 400 }
      );
    }

    // Processar conteúdo (converter Files para base64)
    const processedContent = [];
    
    for (let i = 0; i < message.content.length; i++) {
      const item = message.content[i];
      
      if (item.type === 'text') {
        processedContent.push({
          type: 'text' as const,
          text: item.text,
        });
      } else if (item.type === 'image') {
        // Verificar se há arquivo enviado
        const imageFile = formData.get(`image_${i}`) as File | null;
        
        if (imageFile) {
          // Validar arquivo
          const { validateImageFile, fileToBase64 } = await import('@/lib/ai');
          const validation = validateImageFile(imageFile);
          
          if (!validation.valid) {
            return Response.json(
              { error: `Imagem ${i}: ${validation.error}` },
              { status: 400 }
            );
          }
          
          // Converter para base64
          const base64 = await fileToBase64(imageFile);
          
          processedContent.push({
            type: 'image' as const,
            image: base64,
          });
        } else if (item.imageUrl) {
          // URL já fornecida
          processedContent.push({
            type: 'image' as const,
            image: item.imageUrl,
          });
        }
      }
    }

    // Gerar resposta com streaming
    const result = streamText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: message.role || 'user',
          content: processedContent,
        },
      ],
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('❌ [AI Vision] Erro:', error);
    
    return Response.json(
      { error: 'Erro ao processar vision' },
      { status: 500 }
    );
  }
}
