import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { generalApiLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';
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
        bus: true,
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

/**
 * PUT /api/packages/[packageId]
 * Atualiza pacote existente (apenas admin/equipe)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    const { packageId } = await params;
    const body = await req.json();

    // Verificar se pacote existe
    const existingPackage = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 });
    }

    // Atualizar slug se título mudou
    let slug = existingPackage.slug;
    if (body.title && body.title !== existingPackage.title) {
      slug = body.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Verificar duplicidade
      const slugExists = await prisma.package.findFirst({
        where: {
          slug,
          id: { not: packageId },
        },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: {
        title: body.title,
        slug,
        description: body.description || null,
        short_description: body.short_description || null,
        destination: body.destination || null,
        bus_id: body.bus_id || null,
        price: body.price,
        original_price: body.original_price || null,
        price_child_6_10: body.price_child_6_10 || null,
        price_child_11_13: body.price_child_11_13 || null,
        duration_days: body.duration_days || null,
        departure_location: body.departure_location || null,
        departure_time: body.departure_time || null,
        return_time: body.return_time || null,
        departure_date: body.departure_date ? new Date(body.departure_date) : null,
        return_date: body.return_date ? new Date(body.return_date) : null,
        total_seats: body.total_seats || null,
        includes: body.includes || [],
        not_includes: body.not_includes || [],
        cover_image: body.cover_image || null,
        gallery_images: body.gallery_images || [],
        hotel_name: body.hotel_name || null,
        hotel_photos: body.hotel_photos || [],
        attractions: body.attractions || [],
        max_installments: body.max_installments || 10,
        status: body.status || 'draft',
        is_featured: body.is_featured || false,
      },
      include: {
        category: true,
        destination_rel: true,
        bus: true,
      },
    });

    return NextResponse.json({ data: toCamelCase(updatedPackage) });
  } catch (error) {
    console.error('[API] PUT /api/packages/[packageId] error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pacote' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/packages/[packageId]
 * Remove pacote (soft delete - marca como inativo)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { packageId } = await params;

    // Soft delete
    await prisma.package.update({
      where: { id: packageId },
      data: { is_active: false },
    });

    return NextResponse.json({ message: 'Pacote removido com sucesso' });
  } catch (error) {
    console.error('[API] DELETE /api/packages/[packageId] error:', error);
    return NextResponse.json(
      { error: 'Erro ao remover pacote' },
      { status: 500 }
    );
  }
}
