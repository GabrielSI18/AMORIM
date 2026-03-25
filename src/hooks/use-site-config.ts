import { useEffect, useState } from 'react'
import type { SiteConfig } from '@/lib/site-config'

const FALLBACK: SiteConfig = {
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

let cachedConfig: SiteConfig | null = null

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(cachedConfig || FALLBACK)

  useEffect(() => {
    if (cachedConfig) return
    fetch('/api/site-config')
      .then(res => res.json())
      .then((data: SiteConfig) => {
        cachedConfig = data
        setConfig(data)
      })
      .catch(() => {})
  }, [])

  return config
}
