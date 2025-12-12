/**
 * SEO Utilities
 * 
 * Helpers para metadata e structured data (JSON-LD)
 */

import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://amorimturismo.com.br';
const SITE_NAME = 'Amorim Turismo';

/**
 * Configuração base de metadata
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE_NAME} - Viaje com Conforto e Segurança`,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Descubra destinos incríveis com nossos pacotes de viagem personalizados. Ônibus modernos, roteiros especiais e preços acessíveis para toda família.',
  keywords: ['turismo', 'pacotes de viagem', 'excursões', 'ônibus turístico', 'viagens em grupo', 'Belo Horizonte', 'Minas Gerais'],
  authors: [{ name: 'Amorim Turismo' }],
  creator: 'Amorim Turismo',
  publisher: 'Amorim Turismo',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Viaje com Conforto e Segurança`,
    description: 'Descubra destinos incríveis com nossos pacotes de viagem personalizados',
    images: [
      {
        url: `${BASE_URL}/amorim-logo.png`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Viaje com Conforto e Segurança`,
    description: 'Descubra destinos incríveis com nossos pacotes de viagem personalizados',
    images: [`${BASE_URL}/amorim-logo.png`],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

/**
 * Gera metadata para uma página específica
 */
export function generatePageMetadata({
  title,
  description,
  path = '',
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${BASE_URL}${path}`;
  
  return {
    title,
    description,
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url,
    },
    twitter: {
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * JSON-LD Schema: Organization
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Projeto base SaaS moderno com stack completa',
    foundingDate: '2025',
    founders: [
      {
        '@type': 'Person',
        name: 'Exaltius',
      },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'suporte@base2025.com',
    },
    sameAs: [
      // Adicionar redes sociais quando disponíveis
      // 'https://twitter.com/base2025',
      // 'https://github.com/base2025',
    ],
  };
}

/**
 * JSON-LD Schema: WebSite (para search box)
 */
export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: 'Projeto base SaaS moderno',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * JSON-LD Schema: SoftwareApplication (para o produto SaaS)
 */
export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'BRL',
      lowPrice: '0',
      highPrice: '299',
      offerCount: '4',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '100',
    },
  };
}

/**
 * Componente para injetar JSON-LD no head
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
