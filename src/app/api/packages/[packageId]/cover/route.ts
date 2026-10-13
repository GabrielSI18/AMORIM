import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/packages/[packageId]/cover
 *
 * Serve a imagem de capa do pacote como arquivo (as imagens ficam gravadas no
 * banco em base64). Usada na prévia do link (WhatsApp, redes sociais), que não
 * aceita `data:` URL.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    const pkg = await prisma.package.findFirst({
      where: { OR: [{ id: packageId }, { slug: packageId }] },
      select: { cover_image: true },
    });

    const cover = pkg?.cover_image;
    if (!cover) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 });
    }

    const match = cover.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      // Já é uma URL (storage externo): redireciona
      return NextResponse.redirect(cover);
    }

    const [, contentType, base64] = match;
    const bytes = Buffer.from(base64, 'base64');

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(bytes.length),
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('[API] GET /api/packages/[packageId]/cover error:', error);
    return NextResponse.json({ error: 'Erro ao buscar imagem' }, { status: 500 });
  }
}
