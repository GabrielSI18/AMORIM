import Script from 'next/script'

/**
 * Pixel do Meta só nas páginas de anúncio, e só quando o ID existe.
 *
 * Com o pixel, o Meta Ads otimiza a campanha para "Lead" (quem terminou o
 * filtro e foi para o WhatsApp) em vez de clique — que é justamente o que
 * separa curioso de comprador. Sem NEXT_PUBLIC_META_PIXEL_ID nada é carregado.
 */
export function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  if (!pixelId || !/^\d{6,20}$/.test(pixelId)) return null

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');fbq('track','PageView');`}
    </Script>
  )
}
