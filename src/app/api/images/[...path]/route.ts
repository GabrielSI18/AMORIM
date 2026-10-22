import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * GET /api/images/<caminho-no-bucket>
 *
 * Serve as imagens guardadas no Cloudflare R2 (bucket privado). Antes esta
 * rota era um proxy do Unsplash vindo do template — buscava foto aleatória de
 * banco de imagem a cada acesso.
 *
 * Guardar a imagem no R2 e só o caminho no banco evita o problema atual das
 * fotos em base64 dentro do Postgres (a listagem de pacotes chegava a 9 MB
 * por requisição e o mapa de assentos chegou a cair por excesso de memória).
 */

const ALLOWED_PREFIXES = ['packages/', 'fleet/', 'site/', 'uploads/'];

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 não configurado');
  }

  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const key = path.join('/');

    // Só pastas conhecidas, e nada de subir de diretório
    if (key.includes('..') || !ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      return new NextResponse('Not found', { status: 404 });
    }

    const extension = key.split('.').pop()?.toLowerCase() || '';
    const contentType = CONTENT_TYPES[extension];
    if (!contentType) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Cache na borda: sem isso toda visita ia até o R2 (~350 ms por foto)
    const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
    const cacheKey = new Request(_req.url);
    const cached = await cache?.match(cacheKey);
    if (cached) return cached as unknown as NextResponse;

    const bucket = process.env.R2_BUCKET_NAME || 'amorim-storage';
    let result;
    try {
      result = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
      // Miniatura ainda não gerada: cai para a imagem original
      const semSufixo = key.replace(/-sm(\.[a-z]+)$/, '$1');
      if (semSufixo === key) throw error;
      result = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: semSufixo }));
    }

    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) {
      return new NextResponse('Not found', { status: 404 });
    }

    const response = new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': result.ContentType || contentType,
        'Content-Length': String(bytes.length),
        // Nome do arquivo não muda de conteúdo: pode cachear por muito tempo
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

    if (cache) {
      const ctx = getCloudflareContext().ctx;
      const guardar = cache.put(cacheKey, response.clone() as unknown as Response);
      if (ctx?.waitUntil) ctx.waitUntil(guardar);
      else await guardar;
    }

    return response;
  } catch (error) {
    const code = (error as { name?: string })?.name;
    if (code === 'NoSuchKey' || code === 'NotFound') {
      return new NextResponse('Not found', { status: 404 });
    }
    console.error('[API] GET /api/images error:', error);
    return new NextResponse('Erro ao buscar imagem', { status: 500 });
  }
}
