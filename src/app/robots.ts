import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://amorimturismo.com.br';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/api/', '/sign-in', '/sign-up', '/reserva/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
