import Image from 'next/image'
import { AlertCircle } from 'lucide-react'

/**
 * Passeios opcionais do pacote.
 *
 * Atração que o cliente pode fazer no destino mas que NÃO está no preço —
 * ex.: o Hot Park, que fica em Rio Quente e é de outro grupo. Fica num bloco
 * separado e com aviso, para ninguém entender que o ingresso está incluso.
 */

export interface OptionalTour {
  title: string
  description?: string
  image?: string
  note?: string
}

export function OptionalTours({ tours }: { tours: OptionalTour[] }) {
  if (!tours?.length) return null

  return (
    <section className="bg-card rounded-xl p-6 shadow-card">
      <div className="flex items-start gap-2 mb-1">
        <h2 className="text-2xl font-bold">Passeios opcionais</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Não estão inclusos no valor do pacote. O ingresso e o transporte até o local são pagos à parte.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {tours.map((tour) => (
          <article key={tour.title} className="rounded-xl border border-border overflow-hidden bg-background">
            {tour.image && (
              <div className="relative w-full aspect-video bg-muted">
                <Image src={tour.image} alt={tour.title} fill unoptimized className="object-cover" />
                <span className="absolute top-2 left-2 rounded-full bg-yellow-500/90 px-2.5 py-0.5 text-xs font-semibold text-yellow-950">
                  Não incluso
                </span>
              </div>
            )}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold">{tour.title}</h3>
              {tour.description && <p className="text-sm text-muted-foreground">{tour.description}</p>}
              {tour.note && (
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {tour.note}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
