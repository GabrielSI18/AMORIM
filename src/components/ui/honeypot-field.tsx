'use client'

/**
 * Campo-isca contra robôs de spam.
 *
 * Fica escondido da pessoa (fora da tela, sem foco e invisível para leitores
 * de tela), então quem preenche é robô que varre o HTML. A API descarta o
 * envio quando esse campo vem preenchido.
 */

interface HoneypotFieldProps {
  value: string
  onChange: (value: string) => void
  name?: string
}

export function HoneypotField({ value, onChange, name = 'website' }: HoneypotFieldProps) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
      <label htmlFor={`hp-${name}`}>Não preencha este campo</label>
      <input
        id={`hp-${name}`}
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  )
}
