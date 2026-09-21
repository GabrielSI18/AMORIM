/**
 * API Route para testar envio de emails
 *
 * POST /api/test/email
 * Body: { type: 'welcome' }
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';
import { emailLimiter, rateLimitExceededResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Rate limit — endpoint de teste, mas qualquer user logado podia disparar
    // emails para si em loop (transformava a app em ferramenta de spam e
    // estourava quota da AWS SES).
    const limit = emailLimiter(`test-email:${userId}`);
    if (!limit.success) return rateLimitExceededResponse(limit);

    // Check if email is enabled
    if (process.env.ACTIVE_EMAIL !== 'true') {
      return NextResponse.json(
        { error: 'Email desabilitado. Configure ACTIVE_EMAIL=true no .env.local' },
        { status: 400 }
      );
    }

    // Get user data
    const user = await currentUser();
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { error: 'Usuário sem email configurado' },
        { status: 400 }
      );
    }

    const userEmail = user.emailAddresses[0].emailAddress;
    const userName = user.firstName || 'Usuário';

    // Get email type
    const body = await req.json();
    const { type } = body;

    // Variable to store result
    let result;

    // Send email based on type
    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail({ to: userEmail, userName });
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de email inválido: ${type}` },
          { status: 400 }
        );
    }

    // Check if email was actually sent
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao enviar email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email "${type}" enviado para ${userEmail}`,
    });
  } catch (error) {
    console.error('[Email Test] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao enviar email' },
      { status: 500 }
    );
  }
}
