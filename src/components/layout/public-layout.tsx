'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Home as HomeIcon, Briefcase, Ticket, User, Moon, Sun } from 'lucide-react'

interface PublicLayoutProps {
  children: React.ReactNode
  currentPage?: 'inicio' | 'pacotes' | 'viagens' | 'perfil'
}

export function PublicLayout({ children, currentPage }: PublicLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <div className="relative min-h-screen bg-[#f8f9fa] dark:bg-[#121212]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/amorim-logo.png"
                alt="Amorim Turismo"
                width={100}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/pacotes" className="text-[#6c757d] dark:text-[#adb5bd] hover:text-[#004a80] dark:hover:text-white transition font-medium">
                Pacotes
              </Link>
              <Link href="/afiliados" className="text-[#6c757d] dark:text-[#adb5bd] hover:text-[#004a80] dark:hover:text-white transition font-medium">
                Afiliados
              </Link>
              <Link href="/sobre" className="text-[#6c757d] dark:text-[#adb5bd] hover:text-[#004a80] dark:hover:text-white transition font-medium">
                Sobre
              </Link>
              <Link href="/faq" className="text-[#6c757d] dark:text-[#adb5bd] hover:text-[#004a80] dark:hover:text-white transition font-medium">
                FAQ
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center rounded-full h-10 w-10 text-[#6c757d] dark:text-[#adb5bd] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="flex items-center justify-center rounded-full h-10 w-10 text-[#6c757d] dark:text-[#adb5bd] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <Link 
                href="/sign-in"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#004a80] text-white rounded-lg font-medium hover:bg-[#003a66] transition-colors"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-24">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-12 pb-28 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-[#212529] dark:text-[#f8f9fa]">Amorim Turismo</h3>
              <p className="text-sm text-[#6c757d] dark:text-[#adb5bd]">
                Viaje com conforto e segurança. Descubra destinos incríveis com nossos pacotes exclusivos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#212529] dark:text-[#f8f9fa]">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-[#6c757d] dark:text-[#adb5bd]">
                <li><Link href="/pacotes" className="hover:text-[#004a80] transition">Pacotes de Viagem</Link></li>
                <li><Link href="/afiliados" className="hover:text-[#004a80] transition">Seja um Afiliado</Link></li>
                <li><Link href="/sobre" className="hover:text-[#004a80] transition">Sobre Nós</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#212529] dark:text-[#f8f9fa]">Suporte</h4>
              <ul className="space-y-2 text-sm text-[#6c757d] dark:text-[#adb5bd]">
                <li><Link href="/faq" className="hover:text-[#004a80] transition">Perguntas Frequentes</Link></li>
                <li><Link href="/politicas" className="hover:text-[#004a80] transition">Políticas de Cancelamento</Link></li>
                <li><Link href="/termos" className="hover:text-[#004a80] transition">Termos de Uso</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#212529] dark:text-[#f8f9fa]">Contato</h4>
              <ul className="space-y-2 text-sm text-[#6c757d] dark:text-[#adb5bd]">
                <li>(31) 99999-9999</li>
                <li>contato@amorimturismo.com.br</li>
                <li>Belo Horizonte, MG</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-[#6c757d] dark:text-[#adb5bd]">
            <p>© 2025 Amorim Turismo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex h-20 items-center justify-around border-t border-[#e0e0e0]/50 dark:border-white/10 bg-[#F5F5F7] dark:bg-[#101622] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 ${currentPage === 'inicio' ? 'text-[#D92E2E]' : 'text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white'} transition-colors`}
        >
          <HomeIcon className="w-6 h-6" />
          <p className={`text-xs ${currentPage === 'inicio' ? 'font-bold' : 'font-medium'}`}>Início</p>
        </Link>
        <Link 
          href="/pacotes" 
          className={`flex flex-col items-center gap-1 ${currentPage === 'pacotes' ? 'text-[#D92E2E]' : 'text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white'} transition-colors`}
        >
          <Briefcase className="w-6 h-6" />
          <p className={`text-xs ${currentPage === 'pacotes' ? 'font-bold' : 'font-medium'}`}>Pacotes</p>
        </Link>
        <Link 
          href="/minhas-viagens" 
          className={`flex flex-col items-center gap-1 ${currentPage === 'viagens' ? 'text-[#D92E2E]' : 'text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white'} transition-colors`}
        >
          <Ticket className="w-6 h-6" />
          <p className={`text-xs ${currentPage === 'viagens' ? 'font-bold' : 'font-medium'}`}>Minhas Viagens</p>
        </Link>
        <Link 
          href="/dashboard/perfil" 
          className={`flex flex-col items-center gap-1 ${currentPage === 'perfil' ? 'text-[#D92E2E]' : 'text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white'} transition-colors`}
        >
          <User className="w-6 h-6" />
          <p className={`text-xs ${currentPage === 'perfil' ? 'font-bold' : 'font-medium'}`}>Perfil</p>
        </Link>
      </nav>
    </div>
  )
}
