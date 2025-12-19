'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Moon, Sun, Menu, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export function Header() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const isDarkMode = resolvedTheme === 'dark'

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/amorim-logo.png"
              alt="Amorim Turismo"
              width={156}
              height={62}
              className="h-[52px] w-auto object-contain"
              priority
            />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pacotes" className="text-muted-foreground hover:text-foreground transition font-medium">
              Pacotes
            </Link>
            <Link href="/afiliados" className="text-muted-foreground hover:text-foreground transition font-medium">
              Afiliados
            </Link>
            <Link href="/sobre" className="text-muted-foreground hover:text-foreground transition font-medium">
              Sobre
            </Link>
            <Link href="/faq" className="text-muted-foreground hover:text-foreground transition font-medium">
              FAQ
            </Link>
            <Link href="/contato" className="text-muted-foreground hover:text-foreground transition font-medium">
              Contato
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-full h-10 w-10 text-muted-foreground hover:bg-muted transition-colors"
            >
              {mounted && (isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
            </button>

            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9"
                  }
                }}
              />
            </SignedIn>

            <SignedOut>
              <Link 
                href="/sign-in"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Entrar
              </Link>
            </SignedOut>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center rounded-full h-10 w-10 text-muted-foreground hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              <Link 
                href="/pacotes" 
                className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pacotes
              </Link>
              <Link 
                href="/afiliados" 
                className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Afiliados
              </Link>
              <Link 
                href="/sobre" 
                className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sobre
              </Link>
              <Link 
                href="/faq" 
                className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link 
                href="/contato" 
                className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contato
              </Link>
              <SignedOut>
                <Link 
                  href="/sign-in"
                  className="mx-4 mt-2 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-center hover:bg-primary/90 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Entrar
                </Link>
              </SignedOut>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
