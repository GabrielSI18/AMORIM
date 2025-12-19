import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verify admin
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { role: true },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        referrals: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 });
    }

    // Get user data if user_id exists
    let userData = null;
    if (affiliate.user_id) {
      const affiliateUser = await prisma.user.findUnique({
        where: { id: affiliate.user_id },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      });
      userData = affiliateUser;
    }

    return NextResponse.json({ 
      affiliate: {
        ...affiliate,
        user: userData,
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verify admin
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { role: true },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate status
    const validStatuses = ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (body.status) {
      updateData.status = body.status;
    }
    
    if (typeof body.commission_rate === 'number') {
      if (body.commission_rate < 0 || body.commission_rate > 100) {
        return NextResponse.json({ error: 'Taxa de comissão inválida' }, { status: 400 });
      }
      updateData.commission_rate = body.commission_rate;
    }

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: updateData,
    });

    // Get user data if user_id exists
    let userData = null;
    if (affiliate.user_id) {
      const affiliateUser = await prisma.user.findUnique({
        where: { id: affiliate.user_id },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      });
      userData = affiliateUser;
    }

    return NextResponse.json({ 
      affiliate: {
        ...affiliate,
        user: userData,
      }
    });
  } catch (error) {
    console.error('Error updating affiliate:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verify admin
    const user = await prisma.user.findUnique({
      where: { clerk_id: userId },
      select: { role: true },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;

    // Check if affiliate has referrals
    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { referrals: true },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 });
    }

    if (affiliate._count.referrals > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir afiliado com indicações' },
        { status: 400 }
      );
    }

    await prisma.affiliate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting affiliate:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
