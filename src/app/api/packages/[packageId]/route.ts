import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toCamelCase } from '@/lib/case-transform';

interface RouteParams {
  params: Promise<{
    packageId: string;
  }>;
}

/**
 * GET /api/packages/[packageId]
 * Busca um pacote específico por ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { packageId } = await params;

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        category: true,
        destination_rel: true,
      },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: 'Pacote não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: toCamelCase(pkg) });
  } catch (error) {
    console.error('[API] GET /api/packages/[packageId] error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pacote' },
      { status: 500 }
    );
  }
}
