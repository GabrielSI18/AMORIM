'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Bell, Moon, Globe, ChevronRight, Store } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard'
import { useUserRole } from '@/hooks/use-user-role'

export default function ConfiguracoesPage() {
  const [notifications, setNotifications] = useState(true)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [language, setLanguage] = useState('pt-BR')
  const { isAdmin } = useUserRole()

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = mounted && resolvedTheme === 'dark'

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  return (
    <DashboardShell title="Configurações">
      <div className="space-y-6">
        {/* Dados que aparecem no site público (admin) */}
        {isAdmin && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] px-1">Site</h3>
            <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl">
              <Link
                href="/dashboard/configuracoes/site"
                className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#2A2A2A] flex items-center justify-center">
                    <Store className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-[#E0E0E0]">Dados do site</p>
                    <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">
                      Telefone, WhatsApp, e-mail, endereço, redes e mapa
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
              </Link>
            </div>
          </div>
        )}

        {/* Preferences Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] px-1">Preferências</h3>
          
          <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl divide-y divide-gray-200 dark:divide-[#333]">
            {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#2A2A2A] flex items-center justify-center">
                  <Bell className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-[#E0E0E0]">Notificações</p>
                  <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Receber alertas e atualizações</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-[#D93636]' : 'bg-gray-300 dark:bg-[#333]'
                }`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#2A2A2A] flex items-center justify-center">
                  <Moon className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-[#E0E0E0]">Modo escuro</p>
                  <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Tema da interface</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isDarkMode ? 'bg-[#D93636]' : 'bg-gray-300 dark:bg-[#333]'
                }`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#2A2A2A] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-[#E0E0E0]">Idioma</p>
                  <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Português (Brasil)</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Versão 1.0.0</p>
          <p className="text-xs text-gray-400 dark:text-[#666] mt-1">© {new Date().getFullYear()} Amorim Turismo</p>
        </div>
      </div>
    </DashboardShell>
  )
}
