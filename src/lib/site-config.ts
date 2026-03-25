import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'

export type SiteConfig = {
  id: string
  site_name: string
  site_description: string | null
  phone_primary: string
  phone_secondary: string | null
  whatsapp_number: string
  email: string
  email_affiliates: string | null
  address_street: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  instagram_url: string | null
  facebook_url: string | null
  maps_embed_url: string | null
  maps_link: string | null
  meta_pixel_id: string | null
}

/**
 * Busca configurações do site (singleton) com cache de 5 minutos.
 * Revalida automaticamente — alterações no admin refletem em até 5 min.
 */
export const getSiteConfig = unstable_cache(
  async (): Promise<SiteConfig> => {
    const config = await prisma.siteConfig.findUnique({
      where: { id: 'default' },
    })

    if (!config) {
      // Fallback se o seed não foi executado
      return {
        id: 'default',
        site_name: 'Amorim Turismo',
        site_description: null,
        phone_primary: '(31) 98886-2079',
        phone_secondary: null,
        whatsapp_number: '5531988862079',
        email: 'amorimturismo@ymai.com',
        email_affiliates: 'afiliados@amorimturismo.com.br',
        address_street: 'Rua Manaus, 48 - Bairro Amazonas',
        address_city: 'Contagem',
        address_state: 'MG',
        address_zip: '32240-080',
        instagram_url: null,
        facebook_url: null,
        maps_embed_url: null,
        maps_link: null,
        meta_pixel_id: null,
      }
    }

    return config
  },
  ['site-config'],
  { revalidate: 300, tags: ['site-config'] }
)

/** Endereço formatado completo */
export function formatAddress(config: SiteConfig): string {
  const parts = [config.address_street]
  if (config.address_city && config.address_state) {
    parts.push(`${config.address_city} - ${config.address_state}`)
  }
  return parts.filter(Boolean).join(', ')
}

/** Link tel: formatado */
export function telLink(config: SiteConfig): string {
  return `tel:+${config.whatsapp_number}`
}

/** Link wa.me formatado */
export function whatsappLink(config: SiteConfig, message?: string): string {
  const base = `https://wa.me/${config.whatsapp_number}`
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`
  }
  return base
}
