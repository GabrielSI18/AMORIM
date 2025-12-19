'use client'

import { useState } from 'react'
import { Bell, Moon, Globe, CreditCard, Shield, HelpCircle, ChevronRight } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard'

export default function ConfiguracoesPage() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState('pt-BR')

  return (
    <DashboardShell title="Configurações">
      <div className="space-y-6">
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
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  darkMode ? 'bg-[#D93636]' : 'bg-gray-300 dark:bg-[#333]'
                }`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-0.5'
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

        {/* Account Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] px-1">Conta</h3>
          
          <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl divide-y divide-gray-200 dark:divide-[#333]">
            <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#2A2A2A] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-[#E0E0E0]">Pagamentos</p>
                  <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Métodos de pagamento e faturas</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
            </button>

            <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#2A2A2A] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-[#E0E0E0]">Privacidade</p>
                  <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Dados e permissões</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] px-1">Suporte</h3>
          
          <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl divide-y divide-gray-200 dark:divide-[#333]">
            <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#2A2A2A] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-[#E0E0E0]">Central de Ajuda</p>
                  <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">FAQ e tutoriais</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Versão 1.0.0</p>
          <p className="text-xs text-gray-400 dark:text-[#666] mt-1">© 2025 Amorim Viagens</p>
        </div>
      </div>
    </DashboardShell>
  )
}
