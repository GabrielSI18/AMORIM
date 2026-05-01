'use client'

import { Suspense } from 'react'
import { useAffiliateTracking } from '@/hooks/use-affiliate-tracking'

function AffiliateTrackerInner() {
  useAffiliateTracking()
  return null
}

/**
 * Captura `?ref=CODIGO` da URL em qualquer página pública e salva
 * cookie/localStorage por 30 dias para que a reserva subsequente
 * possa atribuir comissão ao afiliado.
 *
 * Suspense boundary é necessário porque `useSearchParams` (dentro do hook)
 * suspende durante prerender estático no Next.js.
 */
export function AffiliateTracker() {
  return (
    <Suspense fallback={null}>
      <AffiliateTrackerInner />
    </Suspense>
  )
}
