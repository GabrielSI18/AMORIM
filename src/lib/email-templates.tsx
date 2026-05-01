/**
 * Email Templates - React Email
 * 
 * Templates de email transacionais usando React Email
 * Preview: npx react-email dev
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// ============================================
// Configuração
// ============================================

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Amorim Turismo';
const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://amorimturismo.com.br';
const LOGO_URL = `${APP_URL}/amorim-logo.png`;

// ============================================
// Estilos Base
// ============================================

const main: React.CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
};

const box: React.CSSProperties = {
  padding: '0 48px',
};

const hr: React.CSSProperties = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const paragraph: React.CSSProperties = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const button: React.CSSProperties = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const footer: React.CSSProperties = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};

const heading: React.CSSProperties = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 20px',
};

const highlight: React.CSSProperties = {
  backgroundColor: '#f4f7fa',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

// ============================================
// Template: Welcome Email
// ============================================

interface WelcomeEmailProps {
  userName: string;
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bem-vindo ao {APP_NAME}! Sua jornada começa agora.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={LOGO_URL}
              width="48"
              height="48"
              alt={APP_NAME}
              style={{ margin: '0 auto 20px' }}
            />
            <Heading style={heading}>Bem-vindo ao {APP_NAME}! 🎉</Heading>
            <Text style={paragraph}>Olá {userName},</Text>
            <Text style={paragraph}>
              Estamos muito felizes em ter você conosco! Sua conta foi criada com
              sucesso e você já pode começar a explorar todas as funcionalidades.
            </Text>
            <Text style={paragraph}>
              Para começar, acesse seu dashboard e configure seu perfil:
            </Text>
            <Button style={button} href={`${APP_URL}/dashboard`}>
              Acessar Dashboard
            </Button>
            <Hr style={hr} />
            <Text style={paragraph}>
              Se tiver qualquer dúvida, não hesite em nos contatar. Estamos aqui
              para ajudar!
            </Text>
            <Text style={footer}>
              — Equipe {APP_NAME}
              <br />
              <Link href={APP_URL} style={{ color: '#2563eb' }}>
                {APP_URL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================
// Template: Payment Success
// ============================================

interface PaymentSuccessEmailProps {
  userName: string;
  planName: string;
  amount: string;
  invoiceUrl?: string;
}

export function PaymentSuccessEmail({
  userName,
  planName,
  amount,
  invoiceUrl,
}: PaymentSuccessEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Pagamento confirmado - {planName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={LOGO_URL}
              width="48"
              height="48"
              alt={APP_NAME}
              style={{ margin: '0 auto 20px' }}
            />
            <Heading style={heading}>Pagamento Confirmado ✅</Heading>
            <Text style={paragraph}>Olá {userName},</Text>
            <Text style={paragraph}>
              Seu pagamento foi processado com sucesso! Aqui estão os detalhes:
            </Text>
            <Section style={highlight}>
              <Text style={{ ...paragraph, margin: '0' }}>
                <strong>Plano:</strong> {planName}
                <br />
                <strong>Valor:</strong> {amount}
              </Text>
            </Section>
            <Text style={paragraph}>
              Você já pode aproveitar todos os benefícios do seu plano.
            </Text>
            {invoiceUrl && (
              <Button style={button} href={invoiceUrl}>
                Ver Fatura
              </Button>
            )}
            <Hr style={hr} />
            <Text style={footer}>
              — Equipe {APP_NAME}
              <br />
              <Link href={APP_URL} style={{ color: '#2563eb' }}>
                {APP_URL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================
// Template: Payment Failed
// ============================================

interface PaymentFailedEmailProps {
  userName: string;
  planName: string;
  amount: string;
  updatePaymentUrl: string;
}

export function PaymentFailedEmail({
  userName,
  planName,
  amount,
  updatePaymentUrl,
}: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Problema com seu pagamento - ação necessária</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={LOGO_URL}
              width="48"
              height="48"
              alt={APP_NAME}
              style={{ margin: '0 auto 20px' }}
            />
            <Heading style={heading}>Problema com Pagamento ⚠️</Heading>
            <Text style={paragraph}>Olá {userName},</Text>
            <Text style={paragraph}>
              Infelizmente, não conseguimos processar seu último pagamento.
              Para evitar a interrupção do seu serviço, por favor atualize suas
              informações de pagamento.
            </Text>
            <Section style={highlight}>
              <Text style={{ ...paragraph, margin: '0' }}>
                <strong>Plano:</strong> {planName}
                <br />
                <strong>Valor:</strong> {amount}
              </Text>
            </Section>
            <Button style={{ ...button, backgroundColor: '#dc2626' }} href={updatePaymentUrl}>
              Atualizar Pagamento
            </Button>
            <Hr style={hr} />
            <Text style={paragraph}>
              Se você já atualizou seu método de pagamento, pode ignorar este
              email. Caso tenha dúvidas, entre em contato conosco.
            </Text>
            <Text style={footer}>
              — Equipe {APP_NAME}
              <br />
              <Link href={APP_URL} style={{ color: '#2563eb' }}>
                {APP_URL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================
// Template: Subscription Canceled
// ============================================

interface SubscriptionCanceledEmailProps {
  userName: string;
  planName: string;
  endDate: string;
}

export function SubscriptionCanceledEmail({
  userName,
  planName,
  endDate,
}: SubscriptionCanceledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sua assinatura foi cancelada</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={LOGO_URL}
              width="48"
              height="48"
              alt={APP_NAME}
              style={{ margin: '0 auto 20px' }}
            />
            <Heading style={heading}>Assinatura Cancelada</Heading>
            <Text style={paragraph}>Olá {userName},</Text>
            <Text style={paragraph}>
              Sua assinatura do plano <strong>{planName}</strong> foi cancelada
              conforme solicitado.
            </Text>
            <Section style={highlight}>
              <Text style={{ ...paragraph, margin: '0' }}>
                Você ainda terá acesso até: <strong>{endDate}</strong>
              </Text>
            </Section>
            <Text style={paragraph}>
              Sentiremos sua falta! Se mudar de ideia, você pode reativar sua
              assinatura a qualquer momento.
            </Text>
            <Button style={button} href={`${APP_URL}/pricing`}>
              Ver Planos
            </Button>
            <Hr style={hr} />
            <Text style={paragraph}>
              Se você cancelou por engano ou tem algum feedback, adoraríamos
              ouvir de você.
            </Text>
            <Text style={footer}>
              — Equipe {APP_NAME}
              <br />
              <Link href={APP_URL} style={{ color: '#2563eb' }}>
                {APP_URL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================
// Template: Trial Ending
// ============================================

interface TrialEndingEmailProps {
  userName: string;
  planName: string;
  daysLeft: number;
  upgradeUrl: string;
}

export function TrialEndingEmail({
  userName,
  planName,
  daysLeft,
  upgradeUrl,
}: TrialEndingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Seu trial termina em ${daysLeft} dias`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={LOGO_URL}
              width="48"
              height="48"
              alt={APP_NAME}
              style={{ margin: '0 auto 20px' }}
            />
            <Heading style={heading}>Seu Trial Está Acabando ⏰</Heading>
            <Text style={paragraph}>Olá {userName},</Text>
            <Text style={paragraph}>
              Seu período de teste do plano <strong>{planName}</strong> termina
              em <strong>{daysLeft} dias</strong>.
            </Text>
            <Text style={paragraph}>
              Para continuar aproveitando todos os recursos, faça upgrade agora
              e não perca nenhuma funcionalidade!
            </Text>
            <Button style={button} href={upgradeUrl}>
              Fazer Upgrade
            </Button>
            <Hr style={hr} />
            <Text style={paragraph}>
              Tem dúvidas sobre qual plano escolher? Responda este email que
              teremos prazer em ajudar.
            </Text>
            <Text style={footer}>
              — Equipe {APP_NAME}
              <br />
              <Link href={APP_URL} style={{ color: '#2563eb' }}>
                {APP_URL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================
// Template: Affiliate Approved
// ============================================

interface AffiliateApprovedEmailProps {
  affiliateName: string;
  code: string;
  commissionRate: number;
  affiliateLink: string;
  panelUrl: string;
}

export function AffiliateApprovedEmail({
  affiliateName,
  code,
  commissionRate,
  affiliateLink,
  panelUrl,
}: AffiliateApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Seu cadastro de afiliado foi aprovado! Comece a vender agora.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={LOGO_URL}
              width="120"
              height="48"
              alt={APP_NAME}
              style={{ margin: '0 auto 20px', objectFit: 'contain' }}
            />
            <Heading style={heading}>Bem-vindo(a) à equipe! 🎉</Heading>
            <Text style={paragraph}>Olá {affiliateName.split(' ')[0]},</Text>
            <Text style={paragraph}>
              Seu cadastro como afiliado(a) da <strong>{APP_NAME}</strong> foi
              <strong> aprovado</strong>. Agora você pode começar a indicar nossos pacotes
              de viagem e ganhar comissão por cada venda confirmada.
            </Text>

            <Section style={highlight}>
              <Text style={{ ...paragraph, margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>
                Seu código de afiliado
              </Text>
              <Text style={{ ...paragraph, margin: '0 0 16px', fontSize: '24px', fontWeight: '700', letterSpacing: '2px', color: '#1A2E40' }}>
                {code}
              </Text>
              <Text style={{ ...paragraph, margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>
                Sua comissão
              </Text>
              <Text style={{ ...paragraph, margin: '0', fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>
                {commissionRate}% por venda confirmada
              </Text>
            </Section>

            <Text style={paragraph}>
              Use seu link personalizado para que cada compra realizada por ele seja
              atribuída a você automaticamente:
            </Text>

            <Section style={{ ...highlight, backgroundColor: '#eff6ff' }}>
              <Text style={{ ...paragraph, margin: '0', fontSize: '14px', wordBreak: 'break-all', color: '#1d4ed8' }}>
                {affiliateLink}
              </Text>
            </Section>

            <Button style={{ ...button, backgroundColor: '#003c71' }} href={panelUrl}>
              Acessar Painel do Parceiro
            </Button>

            <Hr style={hr} />
            <Text style={paragraph}>
              No painel você acompanha em tempo real cada venda atribuída ao seu link,
              comissões pendentes e pagamentos realizados.
            </Text>
            <Text style={footer}>
              — Equipe {APP_NAME}
              <br />
              <Link href={APP_URL} style={{ color: '#003c71' }}>
                {APP_URL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================
// Template: Affiliate New Sale
// ============================================

interface AffiliateNewSaleEmailProps {
  affiliateName: string;
  packageTitle: string;
  saleAmount: string;
  commissionAmount: string;
  panelUrl: string;
}

export function AffiliateNewSaleEmail({
  affiliateName,
  packageTitle,
  saleAmount,
  commissionAmount,
  panelUrl,
}: AffiliateNewSaleEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nova venda atribuída a você — comissão de {commissionAmount}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={LOGO_URL}
              width="120"
              height="48"
              alt={APP_NAME}
              style={{ margin: '0 auto 20px', objectFit: 'contain' }}
            />
            <Heading style={heading}>Nova venda no seu link! 🎯</Heading>
            <Text style={paragraph}>Olá {affiliateName.split(' ')[0]},</Text>
            <Text style={paragraph}>
              Acabamos de registrar uma nova reserva atribuída ao seu código de afiliado.
              Parabéns!
            </Text>

            <Section style={highlight}>
              <Text style={{ ...paragraph, margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>
                Pacote
              </Text>
              <Text style={{ ...paragraph, margin: '0 0 16px', fontWeight: '600', color: '#1A2E40' }}>
                {packageTitle}
              </Text>
              <Text style={{ ...paragraph, margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>
                Valor da venda
              </Text>
              <Text style={{ ...paragraph, margin: '0 0 16px', fontWeight: '600' }}>
                {saleAmount}
              </Text>
              <Text style={{ ...paragraph, margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>
                Sua comissão
              </Text>
              <Text style={{ ...paragraph, margin: '0', fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                {commissionAmount}
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>Status:</strong> aguardando confirmação do pagamento da reserva.
              Assim que o cliente concluir a viagem, sua comissão será aprovada e
              processada via PIX.
            </Text>

            <Button style={{ ...button, backgroundColor: '#003c71' }} href={panelUrl}>
              Ver no Painel
            </Button>

            <Hr style={hr} />
            <Text style={paragraph}>
              Continue divulgando! Quanto mais vendas pelo seu link, maior a sua receita.
            </Text>
            <Text style={footer}>
              — Equipe {APP_NAME}
              <br />
              <Link href={APP_URL} style={{ color: '#003c71' }}>
                {APP_URL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================
// Template: Affiliate Commission Paid
// ============================================

interface AffiliateCommissionPaidEmailProps {
  affiliateName: string;
  packageTitle: string;
  commissionAmount: string;
  paidAt: string;
  panelUrl: string;
}

export function AffiliateCommissionPaidEmail({
  affiliateName,
  packageTitle,
  commissionAmount,
  paidAt,
  panelUrl,
}: AffiliateCommissionPaidEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sua comissão de {commissionAmount} foi paga! 💸</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={LOGO_URL}
              width="120"
              height="48"
              alt={APP_NAME}
              style={{ margin: '0 auto 20px', objectFit: 'contain' }}
            />
            <Heading style={heading}>Comissão paga! 💸</Heading>
            <Text style={paragraph}>Olá {affiliateName.split(' ')[0]},</Text>
            <Text style={paragraph}>
              Sua comissão referente à venda do pacote <strong>{packageTitle}</strong> foi
              processada e paga via PIX.
            </Text>

            <Section style={highlight}>
              <Text style={{ ...paragraph, margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>
                Valor pago
              </Text>
              <Text style={{ ...paragraph, margin: '0 0 16px', fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>
                {commissionAmount}
              </Text>
              <Text style={{ ...paragraph, margin: '0 0 8px', fontSize: '14px', color: '#6b7280' }}>
                Data do pagamento
              </Text>
              <Text style={{ ...paragraph, margin: '0', fontWeight: '600' }}>
                {paidAt}
              </Text>
            </Section>

            <Text style={paragraph}>
              Verifique sua chave PIX cadastrada — o valor deve cair em poucos minutos.
              Em caso de divergência, fale conosco respondendo este email.
            </Text>

            <Button style={{ ...button, backgroundColor: '#003c71' }} href={panelUrl}>
              Ver Histórico no Painel
            </Button>

            <Hr style={hr} />
            <Text style={paragraph}>
              Obrigado por fazer parte da nossa rede de parceiros. Continue indicando!
            </Text>
            <Text style={footer}>
              — Equipe {APP_NAME}
              <br />
              <Link href={APP_URL} style={{ color: '#003c71' }}>
                {APP_URL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
