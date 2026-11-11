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

const SNIPPET_FBEVENTS = (pixelId: string) => `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');window.__metaPixelPath=location.pathname;fbq('track','PageView');`

/**
 * Conversão que acontece numa tela onde o pixel não carrega (o painel).
 * O cadastro de afiliado termina em /dashboard/parceiro, fora do pixel para não
 * sujar o remarketing; aqui o pixel é ligado só para enviar esse evento, sem
 * PageView e sem a captura automática de cliques.
 */
export function rastrearConversao(evento: string, params: Record<string, unknown> = {}, personalizado = false) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  if (typeof window === 'undefined' || !pixelId || !/^\d{6,20}$/.test(pixelId)) return
  if (!window.fbq) {
    const w = window as unknown as { fbq?: unknown; _fbq?: unknown }
    // mesmo carregador do snippet oficial, sem o PageView
    const fila: { (...a: unknown[]): void; queue: unknown[]; callMethod?: (...a: unknown[]) => void; push?: unknown; loaded?: boolean; version?: string } =
      Object.assign((...args: unknown[]) => { fila.callMethod ? fila.callMethod(...args) : fila.queue.push(args) }, { queue: [] as unknown[] })
    fila.push = fila; fila.loaded = true; fila.version = '2.0'
    w.fbq = fila; if (!w._fbq) w._fbq = fila
    const s = document.createElement('script')
    s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
    window.fbq!('set', 'autoConfig', false, pixelId)
    window.fbq!('init', pixelId)
  }
  window.fbq!(personalizado ? 'trackCustom' : 'track', evento, params)
}

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
      {SNIPPET_FBEVENTS(pixelId!)}
    </Script>
  )
}
