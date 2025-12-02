/**
 * Sitemap Generator
 * 
 * Gera sitemap dinâmico para SEO
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://base2025.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // TODO: Adicionar páginas dinâmicas do banco se necessário
  // Exemplo: posts de blog, produtos, etc.
  // const posts = await prisma.post.findMany({ where: { published: true } });
  // const dynamicPages = posts.map((post) => ({
  //   url: `${BASE_URL}/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }));

  return [
    ...staticPages,
    // ...dynamicPages,
  ];
}
