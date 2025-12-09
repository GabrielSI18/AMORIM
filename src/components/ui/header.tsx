'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container-custom">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-90 transition-all duration-200">
            <Image 
              src="/amorim-logo.png" 
              alt="Amorim Turismo" 
              width={160} 
              height={40}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === '/' ? 'text-primary font-bold' : 'text-muted-foreground'
              )}
            >
              Início
            </Link>
            <Link
              href="/pacotes"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === '/pacotes' ? 'text-primary font-bold' : 'text-muted-foreground'
              )}
            >
              Pacotes
            </Link>
            <Link
              href="/afiliados"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === '/afiliados' ? 'text-primary font-bold' : 'text-muted-foreground'
              )}
            >
              Seja um Afiliado
            </Link>
            <Link
              href="/contato"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === '/contato' ? 'text-primary font-bold' : 'text-muted-foreground'
              )}
            >
              Contato
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
            </Link>
            <Link href="/pacotes">
              <button className="bg-primary text-primary-foreground h-12 px-6 rounded-lg font-bold hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md">
                Ver Pacotes
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
