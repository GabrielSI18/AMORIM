/**
 * API Route para testar envio de emails
 *
 * POST /api/test/email
 * Body: { type: 'welcome' | 'payment_success' | 'payment_failed' | 'subscription_canceled' | 'trial_ending' }
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
  sendEmailWithTemplate,
} from '@/lib/email';
import { TrialEndingEmail } from '@/lib/email-templates';

export async function POST(req: NextRequest) {
  try {
    // Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

      case 'payment_success':
        result = await sendPaymentSuccessEmail({
          to: userEmail,
          userName,
          planName: 'Plano Pro',
          amount: 'R$ 79,00',
          invoiceUrl: `${appUrl}/dashboard/billing`,
        });
        break;

      case 'payment_failed':
        result = await sendPaymentFailedEmail({
          to: userEmail,
          userName,
          planName: 'Plano Pro',
          amount: 'R$ 79,00',
          updatePaymentUrl: `${appUrl}/dashboard/billing`,
        });
        break;

      case 'subscription_canceled':
        result = await sendSubscriptionCanceledEmail({
          to: userEmail,
          userName,
          planName: 'Plano Pro',
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        });
        break;

      case 'trial_ending':
        result = await sendEmailWithTemplate({
          to: userEmail,
          subject: 'Seu período de teste está acabando',
          template: TrialEndingEmail({
            userName,
            daysLeft: 3,
            planName: 'Plano Pro',
            upgradeUrl: `${appUrl}/pricing`,
          }),
        });
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
