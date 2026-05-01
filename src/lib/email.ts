/**
 * Email Service - AWS SES
 * 
 * Serviço de email usando AWS SES com templates React Email
 * 
 * Configuração necessária no .env.local:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION (ex: us-east-1)
 * - EMAIL_FROM (ex: noreply@seudominio.com)
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  WelcomeEmail,
  PaymentSuccessEmail,
  PaymentFailedEmail,
  SubscriptionCanceledEmail,
  AffiliateApprovedEmail,
  AffiliateNewSaleEmail,
  AffiliateCommissionPaidEmail,
} from './email-templates';

// ============================================
// Configuração
// ============================================

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const DEFAULT_FROM = process.env.EMAIL_FROM || 'noreply@amorimturismo.com.br';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Amorim Turismo';

// ============================================
// Tipos
// ============================================

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// Função Principal
// ============================================

/**
 * Envia um email via AWS SES
 * 
 * @example
 * ```ts
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Bem-vindo!',
 *   html: '<h1>Olá!</h1>',
 * });
 * ```
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html, text, from = DEFAULT_FROM, replyTo } = options;

  // Verifica se Email está ativo
  if (process.env.ACTIVE_EMAIL !== 'true') {
    console.log('⚠️ [Email] Serviço de email desativado (ACTIVE_EMAIL != true). Email não enviado.');
    return { success: false, error: 'Serviço de email desativado' };
  }

  // Verifica se SES está configurado
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️ [Email] AWS SES não configurado. Email não enviado.');
    return { success: false, error: 'AWS SES não configurado' };
  }

  try {
    const toAddresses = Array.isArray(to) ? to : [to];

    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: toAddresses,
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
          ...(text && {
            Text: {
              Data: text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
      ...(replyTo && {
        ReplyToAddresses: [replyTo],
      }),
    });

    const response = await sesClient.send(command);

    console.log(`✅ [Email] Enviado para ${toAddresses.join(', ')}: ${subject}`);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    console.error('❌ [Email] Erro ao enviar:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// ============================================
// Helpers para Templates
// ============================================

/**
 * Converte componente React Email para HTML string
 */
export async function renderEmailTemplate(
  component: React.ReactElement
): Promise<string> {
  const { render } = await import('@react-email/components');
  return render(component);
}

/**
 * Envia email usando template React Email
 * 
 * @example
 * ```ts
 * import { WelcomeEmail } from '@/lib/email-templates';
 * 
 * await sendEmailWithTemplate({
 *   to: 'user@example.com',
 *   subject: 'Bem-vindo!',
 *   template: <WelcomeEmail userName="João" />,
 * });
 * ```
 */
export async function sendEmailWithTemplate(options: {
  to: string | string[];
  subject: string;
  template: React.ReactElement;
  from?: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const html = await renderEmailTemplate(options.template);

  return sendEmail({
    to: options.to,
    subject: options.subject,
    html,
    from: options.from,
    replyTo: options.replyTo,
  });
}

// ============================================
// Emails Pré-configurados
// ============================================

/**
 * Envia email de boas-vindas
 */
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
}): Promise<EmailResult> {
  return sendEmailWithTemplate({
    to: params.to,
    subject: `Bem-vindo ao ${APP_NAME}! 🎉`,
    template: WelcomeEmail({ userName: params.userName }),
  });
}

/**
 * Envia email de pagamento confirmado
 */
export async function sendPaymentSuccessEmail(params: {
  to: string;
  userName: string;
  planName: string;
  amount: string;
  invoiceUrl?: string;
}): Promise<EmailResult> {
  return sendEmailWithTemplate({
    to: params.to,
    subject: `Pagamento confirmado - ${APP_NAME}`,
    template: PaymentSuccessEmail(params),
  });
}

/**
 * Envia email de pagamento falhou
 */
export async function sendPaymentFailedEmail(params: {
  to: string;
  userName: string;
  planName: string;
  amount: string;
  updatePaymentUrl: string;
}): Promise<EmailResult> {
  return sendEmailWithTemplate({
    to: params.to,
    subject: `Problema com seu pagamento - ${APP_NAME}`,
    template: PaymentFailedEmail(params),
  });
}

/**
 * Envia email de assinatura cancelada
 */
export async function sendSubscriptionCanceledEmail(params: {
  to: string;
  userName: string;
  planName: string;
  endDate: string;
}): Promise<EmailResult> {
  return sendEmailWithTemplate({
    to: params.to,
    subject: `Sua assinatura foi cancelada - ${APP_NAME}`,
    template: SubscriptionCanceledEmail(params),
  });
}

// ============================================
// Emails de Afiliados
// ============================================

/**
 * Envia email quando o afiliado é aprovado pelo admin.
 * Inclui código de afiliado, link personalizado e taxa de comissão.
 */
export async function sendAffiliateApprovedEmail(params: {
  to: string;
  affiliateName: string;
  code: string;
  commissionRate: number;
  affiliateLink: string;
  panelUrl: string;
}): Promise<EmailResult> {
  return sendEmailWithTemplate({
    to: params.to,
    subject: `Cadastro aprovado! Bem-vindo ao programa de afiliados ${APP_NAME} 🎉`,
    template: AffiliateApprovedEmail({
      affiliateName: params.affiliateName,
      code: params.code,
      commissionRate: params.commissionRate,
      affiliateLink: params.affiliateLink,
      panelUrl: params.panelUrl,
    }),
  });
}

/**
 * Envia email quando uma nova venda é atribuída ao afiliado.
 * Disparado automaticamente após criação de Booking com affiliateCode válido.
 */
export async function sendAffiliateNewSaleEmail(params: {
  to: string;
  affiliateName: string;
  packageTitle: string;
  saleAmount: string;
  commissionAmount: string;
  panelUrl: string;
}): Promise<EmailResult> {
  return sendEmailWithTemplate({
    to: params.to,
    subject: `🎯 Nova venda no seu link! Comissão de ${params.commissionAmount}`,
    template: AffiliateNewSaleEmail({
      affiliateName: params.affiliateName,
      packageTitle: params.packageTitle,
      saleAmount: params.saleAmount,
      commissionAmount: params.commissionAmount,
      panelUrl: params.panelUrl,
    }),
  });
}

/**
 * Envia email quando a comissão do afiliado é paga.
 * Disparado quando admin marca AffiliateReferral como `paid`.
 */
export async function sendAffiliateCommissionPaidEmail(params: {
  to: string;
  affiliateName: string;
  packageTitle: string;
  commissionAmount: string;
  paidAt: string;
  panelUrl: string;
}): Promise<EmailResult> {
  return sendEmailWithTemplate({
    to: params.to,
    subject: `💸 Comissão de ${params.commissionAmount} paga - ${APP_NAME}`,
    template: AffiliateCommissionPaidEmail({
      affiliateName: params.affiliateName,
      packageTitle: params.packageTitle,
      commissionAmount: params.commissionAmount,
      paidAt: params.paidAt,
      panelUrl: params.panelUrl,
    }),
  });
}
