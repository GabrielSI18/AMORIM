import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { generalApiLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';
import { toCamelCase, toSnakeCase } from '@/lib/case-transform';
import type { PackageFilters } from '@/types';

/**
 * GET /api/packages
 * Lista pacotes com filtros opcionais
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Filtros
    const filters: PackageFilters = {
      category: searchParams.get('category') || undefined,
      destination: searchParams.get('destination') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      minDuration: searchParams.get('minDuration') ? Number(searchParams.get('minDuration')) : undefined,
      maxDuration: searchParams.get('maxDuration') ? Number(searchParams.get('maxDuration')) : undefined,
      status: searchParams.get('status') || 'published',
      isFeatured: searchParams.get('featured') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
    };

    // Construir where clause
    const where: any = {
      is_active: true,
      status: filters.status,
    };

    if (filters.category) where.category_id = filters.category;
    if (filters.destination) where.destination_id = filters.destination;
    if (filters.isFeatured !== undefined) where.is_featured = filters.isFeatured;
    
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }
    
    if (filters.minDuration || filters.maxDuration) {
      where.duration_days = {};
      if (filters.minDuration) where.duration_days.gte = filters.minDuration;
      if (filters.maxDuration) where.duration_days.lte = filters.maxDuration;
    }
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        category: true,
        destination: true,
      },
      orderBy: [
        { is_featured: 'desc' },
        { created_at: 'desc' },
      ],
    });

    return NextResponse.json({ data: toCamelCase(packages) });
  } catch (error) {
    console.error('[API] GET /api/packages error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pacotes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/packages
 * Cria novo pacote (apenas admin/equipe)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = generalApiLimiter(userId);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const body = await req.json();

    // Validação básica
    if (!body.title || !body.category_id || !body.destination_id || !body.price) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Gerar slug
    const slug = body.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const package_ = await prisma.package.create({
      data: {
        title: body.title,
        slug,
        description: body.description,
        short_description: body.short_description,
        category_id: body.category_id,
        destination_id: body.destination_id,
        price: body.price,
        original_price: body.original_price,
        duration_days: body.duration_days,
        departure_location: body.departure_location,
        departure_time: body.departure_time,
        departure_date: body.departure_date ? new Date(body.departure_date) : null,
        return_date: body.return_date ? new Date(body.return_date) : null,
        available_seats: body.available_seats,
        total_seats: body.total_seats,
        min_participants: body.min_participants || 10,
        includes: body.includes || [],
        not_includes: body.not_includes || [],
        itinerary: body.itinerary || null,
        cover_image: body.cover_image,
        gallery_images: body.gallery_images || [],
        status: body.status || 'draft',
        is_featured: body.is_featured || false,
      },
      include: {
        category: true,
        destination: true,
      },
    });

    return NextResponse.json({ data: toCamelCase(package_) }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/packages error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pacote' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/packages
 * Atualiza pacote existente (apenas admin/equipe)
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do pacote é obrigatório' }, { status: 400 });
    }

    // Atualizar slug se título mudou
    if (data.title) {
      data.slug = data.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Converter datas
    if (data.departure_date) data.departure_date = new Date(data.departure_date);
    if (data.return_date) data.return_date = new Date(data.return_date);

    const package_ = await prisma.package.update({
      where: { id },
      data,
      include: {
        category: true,
        destination: true,
      },
    });

    return NextResponse.json({ data: toCamelCase(package_) });
  } catch (error) {
    console.error('[API] PUT /api/packages error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pacote' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/packages
 * Deleta pacote (soft delete - marca como inativo)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do pacote é obrigatório' }, { status: 400 });
    }

    // Soft delete
    await prisma.package.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({ message: 'Pacote removido com sucesso' });
  } catch (error) {
    console.error('[API] DELETE /api/packages error:', error);
    return NextResponse.json(
      { error: 'Erro ao remover pacote' },
      { status: 500 }
    );
  }
}
