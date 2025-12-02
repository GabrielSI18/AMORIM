import { canUseProvider, validateImageFile } from '@/lib/ai';
import type { AIProvider, ImageOperation } from '@/types/ai';
import { imageLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/ai/image
 * 
 * ✅ Geração e Análise de Imagens
 * 
 * Rate limit: 5 requests/minuto (operação cara)
 * 
 * Suporta 3 operações:
 * 1. **generate**: Criar imagens a partir de texto (DALL-E, Stable Diffusion)
 * 2. **analyze**: Analisar imagens com IA (GPT-4 Vision, LLaVA)
 * 3. **edit**: Editar imagens com máscaras (DALL-E Edit)
 * 
 * Casos de uso:
 * - Gerar criativos de anúncios
 * - Criar ilustrações
 * - Analisar produtos em fotos
 * - Extrair texto de imagens (OCR)
 * - Misturar/editar imagens
 * 
 * @example Generate
 * ```typescript
 * const formData = new FormData();
 * formData.append('operation', 'generate');
 * formData.append('prompt', 'Um gato astronauta no espaço');
 * formData.append('provider', 'openai');
 * 
 * const response = await fetch('/api/ai/image', {
 *   method: 'POST',
 *   body: formData
 * });
 * const data = await response.json();
 * console.log(data.urls); // URLs das imagens geradas
 * ```
 * 
 * @example Analyze
 * ```typescript
 * const formData = new FormData();
 * formData.append('operation', 'analyze');
 * formData.append('image', fileInput.files[0]);
 * formData.append('prompt', 'O que você vê nesta imagem?');
 * 
 * const response = await fetch('/api/ai/image', {
 *   method: 'POST',
 *   body: formData
 * });
 * const data = await response.json();
 * console.log(data.text); // Análise da imagem
 * ```
 */
export async function POST(req: Request) {
  try {
    // Rate limiting - operação cara, limite restrito
    const { userId } = await auth();
    const identifier = userId || req.headers.get('x-forwarded-for') || 'anonymous';
    
    const rateLimitResult = imageLimiter(identifier);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const formData = await req.formData();
    
    const operation = formData.get('operation') as ImageOperation;
    const provider = (formData.get('provider') as AIProvider) || 'openai';
    
    // Validação básica
    if (!operation || !['generate', 'analyze', 'edit'].includes(operation)) {
      return Response.json(
        { error: 'Campo "operation" inválido. Use: generate, analyze ou edit' },
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
      case 'generate':
        return await handleGenerate(formData, provider);
      
      case 'analyze':
        return await handleAnalyze(formData, provider);
      
      case 'edit':
        return await handleEdit(formData, provider);
      
      default:
        return Response.json(
          { error: 'Operação não suportada' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ [AI Image] Erro:', error);
    
    return Response.json(
      { error: 'Erro ao processar imagem' },
      { status: 500 }
    );
  }
}

/**
 * Gera imagens a partir de prompt
 */
async function handleGenerate(formData: FormData, provider: AIProvider) {
  const prompt = formData.get('prompt') as string;
  const size = (formData.get('size') as string) || '1024x1024';
  const n = parseInt(formData.get('n') as string) || 1;
  
  console.log('\n🎨 [AI Image] Generate solicitado');
  console.log('📦 [AI Image] Params:', { prompt: prompt?.substring(0, 50), size, n, provider });
  
  if (!prompt) {
    return Response.json(
      { error: 'Campo "prompt" é obrigatório para generate' },
      { status: 400 }
    );
  }

  // Validar provider suportado
  if (provider !== 'openai' && provider !== 'deepinfra') {
    return Response.json(
      { error: `Geração de imagens não suportada com provider "${provider}". Use "openai" ou "deepinfra"` },
      { status: 400 }
    );
  }

  console.log(`🔧 [AI Image] Usando provider: ${provider}`);

  // OpenAI - DALL-E 3
  if (provider === 'openai') {
    console.log('🤖 [AI Image] Gerando com DALL-E 3...');
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n,
        size,
        quality: 'standard',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [AI Image] OpenAI error:', error);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [AI Image] Imagem gerada com sucesso!');
    
    return Response.json({
      urls: data.data.map((item: { url: string }) => item.url),
      revised_prompt: data.data[0]?.revised_prompt,
    });
  }

  // DeepInfra - Flux (black-forest-labs/FLUX-1-schnell)
  if (provider === 'deepinfra') {
    console.log('🤖 [AI Image] Gerando com Flux (DeepInfra)...');
    
    const response = await fetch('https://api.deepinfra.com/v1/inference/black-forest-labs/FLUX-1-schnell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        width: parseInt(size.split('x')[0]),
        height: parseInt(size.split('x')[1]),
        num_inference_steps: 4, // Schnell é rápido (4 steps)
        guidance_scale: 0, // Schnell não usa guidance
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [AI Image] DeepInfra error:', error);
      throw new Error(`DeepInfra API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [AI Image] Imagem gerada com sucesso!');
    console.log('📊 [AI Image] Estrutura da resposta:', Object.keys(data));
    console.log('📊 [AI Image] Tipo de imagem:', typeof data.images);
    console.log('📊 [AI Image] Primeiros chars:', data.images?.[0]?.substring(0, 50));
    
    // DeepInfra pode retornar URL ou base64
    let imageUrl: string;
    
    if (data.images && data.images[0]) {
      const imageData = data.images[0];
      
      // Se já for uma URL (http/https)
      if (imageData.startsWith('http')) {
        imageUrl = imageData;
      }
      // Se for base64 (pode começar com data: ou não)
      else if (imageData.startsWith('data:')) {
        imageUrl = imageData;
      }
      // Se for base64 sem prefixo
      else {
        imageUrl = `data:image/png;base64,${imageData}`;
      }
      
      console.log('🖼️ [AI Image] URL final (primeiros 100 chars):', imageUrl.substring(0, 100));
      
      return Response.json({
        urls: [imageUrl],
      });
    }
    
    // Fallback se não encontrar formato esperado
    console.error('❌ [AI Image] Formato de resposta inesperado:', data);
    throw new Error('Formato de resposta inesperado do DeepInfra');
  }
}

/**
 * Analisa imagem com IA
 */
async function handleAnalyze(formData: FormData, provider: AIProvider) {
  const image = formData.get('image') as File;
  const prompt = formData.get('prompt') as string || 'Descreva esta imagem em detalhes.';
  
  console.log('\n👁️ [AI Image] Analyze solicitado');
  console.log('📦 [AI Image] Params:', { 
    fileName: image?.name, 
    fileSize: image?.size,
    prompt: prompt?.substring(0, 50),
    provider 
  });
  
  if (!image) {
    return Response.json(
      { error: 'Campo "image" é obrigatório para analyze' },
      { status: 400 }
    );
  }

  // Validar arquivo
  const validation = validateImageFile(image);
  if (!validation.valid) {
    console.error('❌ [AI Image] Arquivo inválido:', validation.error);
    return Response.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  console.log('🔧 [AI Image] Convertendo para base64...');
  // Converter para base64
  const { fileToBase64 } = await import('@/lib/ai');
  const base64 = await fileToBase64(image);
  console.log('✅ [AI Image] Base64 gerado (length):', base64.length);

  // Usar Vision API apropriada
  const { generateText } = await import('ai');
  
  if (provider === 'openai') {
    console.log('🤖 [AI Image] Analisando com GPT-4o Vision...');
    const { openai } = await import('@ai-sdk/openai');
    
    const result = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: base64 },
          ],
        },
      ],
    });

    console.log('✅ [AI Image] Análise concluída!');
    return Response.json({
      text: result.text,
      usage: result.usage,
    });
  }
  
  if (provider === 'deepinfra') {
    console.log('🤖 [AI Image] Analisando com Llama Vision (DeepInfra)...');
    const { deepinfra } = await import('@ai-sdk/deepinfra');
    
    const result = await generateText({
      model: deepinfra('meta-llama/Llama-3.2-90B-Vision-Instruct'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: base64 },
          ],
        },
      ],
    });

    console.log('✅ [AI Image] Análise concluída!');
    return Response.json({
      text: result.text,
      usage: result.usage,
    });
  }
  
  // Groq não suporta vision
  return Response.json(
    { error: `Análise de imagens não suportada com provider "${provider}". Use "openai" ou "deepinfra"` },
    { status: 400 }
  );
}

/**
 * Edita imagem com máscara
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleEdit(_formData: FormData, _provider: AIProvider) {
  return Response.json(
    { error: 'Edição de imagens não implementada ainda. Use "generate" ou "analyze".' },
    { status: 501 }
  );
}
