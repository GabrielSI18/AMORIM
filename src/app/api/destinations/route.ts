import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toCamelCase } from '@/lib/case-transform';

/**
 * GET /api/destinations
 * Lista todos os destinos ativos
 */
export async function GET() {
  try {
    const destinations = await prisma.destination.findMany({
      where: { is_active: true },
      orderBy: [
        { state: 'asc' },
        { city: 'asc' },
      ],
    });

    return NextResponse.json({ data: toCamelCase(destinations) });
  } catch (error) {
    console.error('[API] GET /api/destinations error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar destinos' },
      { status: 500 }
    );
  }
}
