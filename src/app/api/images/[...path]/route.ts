import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy para imagens do Unsplash
 * Rota: /api/images/[...path]
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const imagePath = path.join('/');
    
    // Extrair query da imagem (ex: buzios-hero.jpg -> buzios brazil beach)
    const queries: Record<string, string> = {
      'packages/fim-de-semana-em-buzios-hero': 'buzios,brazil,beach,paradise',
      'packages/cidades-historicas-de-minas-hero': 'ouro,preto,colonial,church,brazil',
      'packages/aventura-serra-mantiqueira-hero': 'monte,verde,mountains,nature,brazil',
      'packages/rio-de-janeiro-completo-hero': 'rio,janeiro,christ,redeemer,sugarloaf',
      'packages/sao-paulo-cultura-gastronomia-hero': 'sao,paulo,skyline,paulista,avenue',
      'packages/romaria-aparecida-hero': 'aparecida,basilica,sanctuary,church,brazil',
    };

    const fileKey = imagePath.replace(/\.[^/.]+$/, ''); // Remove extensão
    const query = queries[fileKey] || 'brazil,travel,tourism';

    console.log(`[Image Proxy] Path: ${imagePath}, Query: ${query}`);

    // Usar Unsplash Source
    const unsplashUrl = `https://source.unsplash.com/1200x800/?${query}`;

    // Fetch da imagem
    const response = await fetch(unsplashUrl);
    
    if (!response.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache por 24h
      },
    });
  } catch (error) {
    console.error('[API] Image proxy error:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
