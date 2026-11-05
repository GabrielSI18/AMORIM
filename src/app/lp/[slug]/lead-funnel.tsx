'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, MessageCircle, Minus, Plus } from 'lucide-react'
import { HoneypotField } from '@/components/ui/honeypot-field'
import { whatsappLink } from '@/lib/whatsapp'

export interface FunnelPackage {
  id: string
  slug: string
  title: string
  destination: string
  price: number
  priceChild1113: number | null
  priceChild610: number | null
  departureDateIso: string | null
  departureLabel: string | null
  returnLabel: string | null
  periodLabel: string | null
  departureTime: string | null
  departureLocation: string
  maxInstallments: number
  availableSeats: number | null
}

type Etapa = 'datas' | 'embarque' | 'pessoas' | 'pagamento' | 'contato' | 'enviado' | 'fora'
type Pagamento = 'pix' | 'cartao' | 'indeciso'

const ORDEM: Etapa[] = ['datas', 'embarque', 'pessoas', 'pagamento', 'contato']

const PAGAMENTO_LABEL: Record<Pagamento, string> = {
  pix: 'PIX',
  cartao: 'Cartão de crédito parcelado',
  indeciso: 'Ainda vou decidir',
}

const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/** Parâmetros do anúncio (utm_*, fbclid) para saber de onde veio cada lead */
function origemDoAnuncio(): string {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  const partes = ['utm_source', 'utm_campaign', 'utm_content']
    .map((k) => (params.get(k) ? `${k.replace('utm_', '')}=${params.get(k)}` : null))
    .filter(Boolean)
  if (params.get('fbclid')) partes.push('fbclid')
  return partes.join(', ')
}

interface ContadorProps {
  rotulo: string
  detalhe: string
  valor: number
  min?: number
  onChange: (v: number) => void
}

function Contador({ rotulo, detalhe, valor, min = 0, onChange }: ContadorProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-base font-semibold">{rotulo}</p>
        <p className="text-sm text-[var(--lp-tinta-suave)]">{detalhe}</p>
      </div>
      <div className="flex flex-none items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, valor - 1))}
          disabled={valor <= min}
          aria-label={`Tirar um: ${rotulo}`}
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--lp-linha)] bg-[var(--lp-cartao)] text-[var(--lp-azul)] transition-colors hover:bg-[var(--lp-fundo)] active:bg-[var(--lp-linha)] disabled:opacity-40"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <span className="w-6 text-center text-lg font-bold tabular-nums" aria-live="polite">
          {valor}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, valor + 1))}
          aria-label={`Colocar mais um: ${rotulo}`}
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--lp-linha)] bg-[var(--lp-cartao)] text-[var(--lp-azul)] transition-colors hover:bg-[var(--lp-fundo)] active:bg-[var(--lp-linha)]"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

function Opcao({
  children,
  onClick,
  selecionada = false,
}: {
  children: React.ReactNode
  onClick: () => void
  selecionada?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selecionada}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-4 text-left text-base font-semibold transition-colors ${
        selecionada
          ? 'border-[var(--lp-azul)] bg-[var(--lp-azul)] text-white'
          : 'border-[var(--lp-linha)] bg-[var(--lp-cartao)] text-[var(--lp-tinta)] hover:border-[var(--lp-azul)] active:bg-[var(--lp-fundo)]'
      }`}
    >
      <span>{children}</span>
      {selecionada && <Check className="h-5 w-5 flex-none" aria-hidden />}
    </button>
  )
}

export function LeadFunnel({ pkg, whatsappNumber }: { pkg: FunnelPackage; whatsappNumber: string }) {
  const [etapa, setEtapa] = useState<Etapa>('datas')
  // a primeira pergunta aparece parada; só as seguintes entram com animação
  const [interagiu, setInteragiu] = useState(false)
  const irPara = (proxima: Etapa) => {
    setInteragiu(true)
    setEtapa(proxima)
  }
  const anima = interagiu ? 'lp-etapa ' : ''
  const [motivoFora, setMotivoFora] = useState<'datas' | 'embarque' | null>(null)
  const [adultos, setAdultos] = useState(1)
  const [criancas1113, setCriancas1113] = useState(0)
  const [criancas610, setCriancas610] = useState(0)
  const [colo, setColo] = useState(0)
  const [pagamento, setPagamento] = useState<Pagamento | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [isca, setIsca] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [linkFinal, setLinkFinal] = useState<string | null>(null)

  useEffect(() => {
    window.fbq?.('track', 'ViewContent', { content_name: pkg.title })
  }, [pkg.title])

  const pagantes = adultos + criancas1113 + criancas610
  const total =
    adultos * pkg.price +
    criancas1113 * (pkg.priceChild1113 ?? pkg.price) +
    criancas610 * (pkg.priceChild610 ?? pkg.price)
  const parcela = pkg.maxInstallments > 1 ? total / pkg.maxInstallments : null
  const semVagaSuficiente = pkg.availableSeats !== null && pagantes > pkg.availableSeats

  const resumoPessoas = useMemo(() => {
    const partes = [`${adultos} adulto${adultos > 1 ? 's' : ''}`]
    if (criancas1113) partes.push(`${criancas1113} criança${criancas1113 > 1 ? 's' : ''} de 11 a 13 anos`)
    if (criancas610) partes.push(`${criancas610} criança${criancas610 > 1 ? 's' : ''} de 6 a 10 anos`)
    if (colo) partes.push(`${colo} criança${colo > 1 ? 's' : ''} de até 5 anos no colo`)
    return partes.join(', ')
  }, [adultos, criancas1113, criancas610, colo])

  const passo = ORDEM.indexOf(etapa)

  function voltar() {
    if (passo > 0) irPara(ORDEM[passo - 1])
  }

  function sair(motivo: 'datas' | 'embarque') {
    setMotivoFora(motivo)
    irPara('fora')
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    const digitos = telefone.replace(/\D/g, '')
    if (nome.trim().length < 2) return setErro('Escreva seu nome.')
    if (digitos.length < 10 || digitos.length > 11) return setErro('Confira o WhatsApp, com DDD.')

    const mensagem = [
      `Olá! Vi o anúncio de ${pkg.destination}${pkg.periodLabel ? ` (${pkg.periodLabel})` : ''} e quero reservar.`,
      '',
      `Nome: ${nome.trim()}`,
      `Quem vai: ${resumoPessoas}`,
      `Valor que vi no site: ${brl(total)}`,
      `Pagamento: ${pagamento ? PAGAMENTO_LABEL[pagamento] : 'a combinar'}`,
      `Embarque: ${pkg.departureLocation}${pkg.departureTime ? `, às ${pkg.departureTime}` : ''}`,
    ].join('\n')

    const destino = whatsappLink(whatsappNumber, mensagem)
    if (!destino) return setErro('Não deu para abrir o WhatsApp agora. Tente de novo.')

    setEnviando(true)
    try {
      // Salva o interessado antes de sair da página: se ele não mandar a
      // mensagem, a equipe ainda tem nome, telefone e o que ele respondeu.
      const origem = origemDoAnuncio()
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          name: nome.trim(),
          phone: digitos,
          subject: `Anúncio: ${pkg.title}`,
          message: origem ? `${mensagem}\n\nOrigem do anúncio: ${origem}` : mensagem,
          destination: pkg.title,
          departureDate: pkg.departureDateIso ?? undefined,
          passengersCount: pagantes + colo,
          website: isca,
        }),
      })
    } catch {
      // sem rede para salvar: o WhatsApp é o que importa, segue mesmo assim
    }

    window.fbq?.('track', 'Lead', { content_name: pkg.title, value: total / 100, currency: 'BRL' })
    setLinkFinal(destino)
    irPara('enviado')
    setEnviando(false)
    window.location.href = destino
  }

  return (
    <div className="rounded-2xl border border-[var(--lp-linha)] bg-[var(--lp-cartao)] p-5 shadow-sm md:p-6">
      {passo >= 0 && (
        <div className="mb-5 flex items-center gap-3">
          {passo > 0 ? (
            <button
              type="button"
              onClick={voltar}
              className="grid h-9 w-9 flex-none place-items-center rounded-full text-[var(--lp-azul)] transition-colors hover:bg-[var(--lp-fundo)]"
              aria-label="Voltar uma pergunta"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
          <div
            className="flex flex-1 gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={ORDEM.length}
            aria-valuenow={passo + 1}
            aria-label={`Pergunta ${passo + 1} de ${ORDEM.length}`}
          >
            {ORDEM.map((e, i) => (
              <span
                key={e}
                className={`h-1.5 flex-1 rounded-full ${i <= passo ? 'bg-[var(--lp-azul)]' : 'bg-[var(--lp-linha)]'}`}
              />
            ))}
          </div>
          <span className="flex-none text-sm text-[var(--lp-tinta-suave)]">
            {passo + 1} de {ORDEM.length}
          </span>
        </div>
      )}

      {etapa === 'datas' && (
        <div className={`${anima}space-y-3`}>
          <h2 className="lp-titulo text-xl font-bold">Você consegue viajar nessas datas?</h2>
          <p className="text-base text-[var(--lp-tinta-suave)]">
            Saída {pkg.departureLabel} e volta {pkg.returnLabel}.
          </p>
          <div className="space-y-2 pt-1">
            <Opcao onClick={() => irPara('embarque')}>Sim, consigo ir</Opcao>
            <Opcao onClick={() => sair('datas')}>Não nessas datas</Opcao>
          </div>
        </div>
      )}

      {etapa === 'embarque' && (
        <div className={`${anima}space-y-3`}>
          <h2 className="lp-titulo text-xl font-bold">O embarque é em {pkg.departureLocation}</h2>
          <p className="text-base text-[var(--lp-tinta-suave)]">
            {pkg.departureTime ? `Às ${pkg.departureTime} do dia da saída.` : 'No dia da saída.'} Dá para você chegar até lá?
          </p>
          <div className="space-y-2 pt-1">
            <Opcao onClick={() => irPara('pessoas')}>Sim, consigo embarcar</Opcao>
            <Opcao onClick={() => sair('embarque')}>Não consigo</Opcao>
          </div>
        </div>
      )}

      {etapa === 'pessoas' && (
        <div className={anima}>
          <h2 className="lp-titulo text-xl font-bold">Quem vai com você?</h2>
          <div className="mt-2 divide-y divide-[var(--lp-linha)]">
            <Contador rotulo="Adultos" detalhe={`${brl(pkg.price)} cada`} valor={adultos} min={1} onChange={setAdultos} />
            {pkg.priceChild1113 && (
              <Contador
                rotulo="De 11 a 13 anos"
                detalhe={`${brl(pkg.priceChild1113)} cada`}
                valor={criancas1113}
                onChange={setCriancas1113}
              />
            )}
            {pkg.priceChild610 && (
              <Contador
                rotulo="De 6 a 10 anos"
                detalhe={`${brl(pkg.priceChild610)} cada`}
                valor={criancas610}
                onChange={setCriancas610}
              />
            )}
            <Contador rotulo="Até 5 anos" detalhe="No colo, não paga" valor={colo} onChange={setColo} />
          </div>

          <div className="mt-4 rounded-xl bg-[var(--lp-fundo)] p-4">
            <p className="text-sm text-[var(--lp-tinta-suave)]">Total para o seu grupo</p>
            <p className="text-3xl font-extrabold tabular-nums text-[var(--lp-azul)]">{brl(total)}</p>
            {parcela && (
              <p className="text-base text-[var(--lp-tinta)]">
                ou {pkg.maxInstallments}x de {brl(parcela)} sem juros
              </p>
            )}
          </div>

          {semVagaSuficiente && (
            <p className="mt-3 text-sm font-semibold text-[var(--lp-alerta)]" role="alert">
              Restam {pkg.availableSeats} lugares nesta saída. Diminua o grupo ou fale com a equipe.
            </p>
          )}

          <button
            type="button"
            onClick={() => irPara('pagamento')}
            disabled={semVagaSuficiente}
            className="mt-4 w-full rounded-xl bg-[var(--lp-azul)] px-5 py-4 text-base font-bold text-white transition-colors hover:bg-[var(--lp-azul-escuro)] active:bg-[var(--lp-azul-escuro)] disabled:opacity-50"
          >
            Continuar com esse valor
          </button>
        </div>
      )}

      {etapa === 'pagamento' && (
        <div className={`${anima}space-y-3`}>
          <h2 className="lp-titulo text-xl font-bold">Como você prefere pagar?</h2>
          <div className="space-y-2 pt-1">
            {(Object.keys(PAGAMENTO_LABEL) as Pagamento[]).map((opcao) => (
              <Opcao
                key={opcao}
                selecionada={pagamento === opcao}
                onClick={() => {
                  setPagamento(opcao)
                  irPara('contato')
                }}
              >
                {opcao === 'cartao' ? `Cartão em até ${pkg.maxInstallments}x sem juros` : PAGAMENTO_LABEL[opcao]}
              </Opcao>
            ))}
          </div>
        </div>
      )}

      {etapa === 'contato' && (
        <form className={`${anima}space-y-4`} onSubmit={enviar} noValidate>
          <div>
            <h2 className="lp-titulo text-xl font-bold">Pronto. Para quem a gente fala?</h2>
            <p className="mt-1 text-base text-[var(--lp-tinta-suave)]">
              {resumoPessoas}, {brl(total)}.
            </p>
          </div>

          <div>
            <label htmlFor="lp-nome" className="text-sm font-semibold">
              Seu nome
            </label>
            <input
              id="lp-nome"
              type="text"
              autoComplete="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-[var(--lp-linha)] bg-[var(--lp-cartao)] px-4 py-3 text-base hover:border-[var(--lp-tinta-suave)] focus:border-[var(--lp-azul)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="lp-telefone" className="text-sm font-semibold">
              Seu WhatsApp, com DDD
            </label>
            <input
              id="lp-telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(31) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-[var(--lp-linha)] bg-[var(--lp-cartao)] px-4 py-3 text-base hover:border-[var(--lp-tinta-suave)] focus:border-[var(--lp-azul)] focus:outline-none"
            />
          </div>

          <HoneypotField value={isca} onChange={setIsca} />

          {erro && (
            <p className="text-sm font-semibold text-[var(--lp-alerta)]" role="alert">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--lp-verde)] px-5 py-4 text-base font-bold text-white transition-colors hover:bg-[var(--lp-verde-escuro)] active:bg-[var(--lp-verde-escuro)] disabled:opacity-60"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            {enviando ? 'Abrindo o WhatsApp' : 'Falar com a Amorim no WhatsApp'}
          </button>
          <p className="text-center text-sm text-[var(--lp-tinta-suave)]">
            A mensagem já vai escrita com o que você respondeu.
          </p>
        </form>
      )}

      {etapa === 'enviado' && (
        <div className={`${anima}space-y-3 text-center`}>
          <h2 className="lp-titulo text-xl font-bold">Abrindo o WhatsApp</h2>
          <p className="text-base text-[var(--lp-tinta-suave)]">Se ele não abriu sozinho, toque no botão.</p>
          {linkFinal && (
            <a
              href={linkFinal}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--lp-verde)] px-5 py-4 text-base font-bold text-white transition-colors hover:bg-[var(--lp-verde-escuro)]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Abrir o WhatsApp
            </a>
          )}
        </div>
      )}

      {etapa === 'fora' && (
        <div className={`${anima}space-y-3`}>
          <h2 className="lp-titulo text-xl font-bold">
            {motivoFora === 'datas' ? 'Essa saída é só nessas datas' : `O embarque é só em ${pkg.departureLocation}`}
          </h2>
          <p className="text-base text-[var(--lp-tinta-suave)]">
            A Amorim tem outras viagens saindo ao longo do ano. Veja se alguma encaixa para você.
          </p>
          <Link
            href="/pacotes"
            className="flex w-full items-center justify-center rounded-xl bg-[var(--lp-azul)] px-5 py-4 text-base font-bold text-white transition-colors hover:bg-[var(--lp-azul-escuro)]"
          >
            Ver as outras viagens
          </Link>
          <button
            type="button"
            onClick={() => irPara('datas')}
            className="w-full rounded-xl px-5 py-3 text-base font-semibold text-[var(--lp-azul)] transition-colors hover:bg-[var(--lp-fundo)]"
          >
            Respondi errado, voltar
          </button>
        </div>
      )}
    </div>
  )
}
