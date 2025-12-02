/**
 * Payment Success Email Template
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

// Configuração
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Base2025';
const APP_URL = process.env.NEXT_PUBLIC_URL || 'https://base2025.com';
const LOGO_URL = `${APP_URL}/logo.png`;

// Estilos
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

// Props
interface PaymentSuccessEmailProps {
  userName?: string;
  planName?: string;
  amount?: string;
  invoiceUrl?: string;
}

// Template
export default function PaymentSuccessEmail({
  userName = 'Usuário',
  planName = 'Pro',
  amount = 'R$ 49,90/mês',
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
