'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

declare global {
  interface Window {
    __metaPixelPath?: string
  }
}

// Painel e login não entram: equipe navegando no admin sujaria o público de
// remarketing com gente que não é cliente.
const FORA_DO_PIXEL = /^\/(dashboard|sign-in|sign-up|sso-callback)(\/|$)/

/**
 * Pixel do Meta no site inteiro (conjunto de dados BMB SOLUÇÕES), só quando o
 * ID existe. Serve o remarketing de visitantes e as campanhas de Lead das /lp.
 *
 * O Next troca de página sem recarregar, então o PageView das páginas
 * seguintes sai daqui, no efeito de mudança de rota; o da primeira página sai
 * do próprio script de carga.
 */
export function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const pathname = usePathname() || '/'
  const ativo = !!pixelId && /^\d{6,20}$/.test(pixelId) && !FORA_DO_PIXEL.test(pathname)

  useEffect(() => {
    if (!ativo || !window.fbq || window.__metaPixelPath === pathname) return
    window.__metaPixelPath = pathname
    window.fbq('track', 'PageView')
  }, [ativo, pathname])

  if (!ativo) return null

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');window.__metaPixelPath=location.pathname;fbq('track','PageView');`}
    </Script>
  )
}
