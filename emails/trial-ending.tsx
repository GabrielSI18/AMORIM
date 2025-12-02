/**
 * Trial Ending Email Template
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
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
  borderLeft: '4px solid #f59e0b',
};

// Props
interface TrialEndingEmailProps {
  userName?: string;
  daysRemaining?: number;
  trialEndDate?: string;
}

// Template
export default function TrialEndingEmail({
  userName = 'Usuário',
  daysRemaining = 3,
  trialEndDate = '31/12/2025',
}: TrialEndingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`Seu trial termina em ${daysRemaining} dias - ${APP_NAME}`}
      </Preview>
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
            <Section style={highlight}>
              <Text style={{ ...paragraph, margin: '0', color: '#92400e' }}>
                <strong>
                  Restam apenas {daysRemaining} dias do seu período de teste!
                </strong>
                <br />O trial termina em {trialEndDate}.
              </Text>
            </Section>
            <Text style={paragraph}>
              Esperamos que você esteja aproveitando o {APP_NAME}! Para
              continuar tendo acesso a todas as funcionalidades após o fim do
              trial, escolha um plano:
            </Text>
            <Button style={button} href={`${APP_URL}/pricing`}>
              Ver Planos e Preços
            </Button>
            <Hr style={hr} />
            <Text style={paragraph}>
              Se tiver qualquer dúvida sobre os planos ou precisar de mais tempo
              para avaliar, é só nos avisar!
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
