/**
 * Sitemap dinâmico
 *
 * Lista as páginas públicas + os pacotes que ainda estão em cartaz
 * (pacote encerrado sai do site, então também sai do sitemap).
 */

import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { notExpiredWhere } from '@/lib/package-expiration';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://amorimturismo.com.br';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = ([
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/pacotes`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/frota`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/fretamento`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/afiliados`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/sobre`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contato`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/politicas`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/termos`, changeFrequency: 'yearly', priority: 0.3 },
  ] as const).map((page) => ({ ...page, lastModified: new Date() }));

  let packagePages: MetadataRoute.Sitemap = [];
  try {
    const packages = await prisma.package.findMany({
      where: { is_active: true, status: 'published', ...notExpiredWhere() },
      select: { slug: true, updated_at: true },
    });
    packagePages = packages.map((pkg) => ({
      url: `${BASE_URL}/pacotes/${pkg.slug}`,
      lastModified: pkg.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    // Sitemap não pode quebrar por causa do banco
    console.error('[sitemap] erro ao listar pacotes:', error);
  }

  return [...staticPages, ...packagePages];
}
