'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-smooth">
            <Image 
              src="/amorim-logo.png" 
              alt="Amorim Turismo" 
              width={180} 
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center spacing-lg">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-smooth hover:text-primary",
                pathname === '/' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              Início
            </Link>
            <Link
              href="/pacotes"
              className={cn(
                "text-sm font-medium transition-smooth hover:text-primary",
                pathname === '/pacotes' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              Pacotes
            </Link>
            <Link
              href="/afiliados"
              className={cn(
                "text-sm font-medium transition-smooth hover:text-primary",
                pathname === '/afiliados' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              Seja um Afiliado
            </Link>
            <Link
              href="#contato"
              className="text-sm font-medium transition-smooth hover:text-primary text-muted-foreground"
            >
              Contato
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="flex items-center spacing-md">
            <Link href="/sign-in">
              <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-smooth">
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
            </Link>
            <Link href="/pacotes">
              <button className="bg-accent text-accent-foreground px-6 py-2 rounded-lg font-semibold hover:bg-accent/90 transition-smooth">
                Ver Pacotes
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
