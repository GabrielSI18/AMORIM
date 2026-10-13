import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generalApiLimiter, enforceRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/affiliates/validate?code=ABC123
 *
 * Diz apenas se o código de indicação existe e está ativo, para o cliente ver
 * na hora se digitou certo (antes, código errado passava em silêncio e o
 * parceiro perdia a comissão sem ninguém saber).
 *
 * Público de propósito, mas devolve só o primeiro nome do parceiro — nada de
 * e-mail, telefone, CPF ou comissão.
 */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    'anonymous';
  const limited = await enforceRateLimit('AFFILIATE_LIMITER', `affiliate-validate:${ip}`, generalApiLimiter);
  if (limited) return limited;

  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ valid: false, reason: 'missing' }, { status: 400 });
  }

  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { code },
      select: { name: true, status: true },
    });

    if (!affiliate) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    if ((affiliate.status || '').toLowerCase() !== 'active') {
      return NextResponse.json({ valid: false, reason: 'inactive' });
    }

    return NextResponse.json({
      valid: true,
      firstName: affiliate.name.split(' ')[0] || null,
    });
  } catch (error) {
    console.error('[API] GET /api/affiliates/validate error:', error);
    return NextResponse.json({ error: 'Erro ao validar código' }, { status: 500 });
  }
}
