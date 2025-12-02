import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toCamelCase } from '@/lib/case-transform';

/**
 * GET /api/categories
 * Lista todas as categorias ativas
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: toCamelCase(categories) });
  } catch (error) {
    console.error('[API] GET /api/categories error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
}
