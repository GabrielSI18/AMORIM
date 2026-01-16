import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Phone, Mail, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border">
      {/* Main Footer */}
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Sobre */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/amorim-logo.png"
              alt="Amorim Turismo"
              className="h-[52px] w-auto object-contain mb-4"
            />
            <p className="text-sm text-muted-foreground mb-4">
              Viaje com conforto e segurança. Descubra destinos incríveis com nossos pacotes exclusivos de turismo rodoviário.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/pacotes" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Pacotes de Viagem
                </Link>
              </li>
              <li>
                <Link href="/frota" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Nossa Frota
                </Link>
              </li>
              <li>
                <Link href="/afiliados" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Seja um Afiliado
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Perguntas Frequentes
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Políticas */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Políticas</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/termos" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/politicas" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/politicas#cancelamento" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Política de Cancelamento
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">(31) 99973-2079 / (31) 98886-2079</p>
                  <p className="text-xs text-muted-foreground">WhatsApp disponível</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">amorimturismo@ymai.com</p>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  São Paulo - SP<br />
                  Brasil
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} Amorim Turismo. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground">
              Desenvolvido com ❤️ para viajantes
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
