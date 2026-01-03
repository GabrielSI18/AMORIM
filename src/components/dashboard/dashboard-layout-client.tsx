'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'
import { UserMenu } from './user-menu'
import { BottomNav } from './bottom-nav'

// Context para o título e action da página
interface DashboardContextValue {
  setTitle: (title: string) => void
  setAction: (action: React.ReactNode) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function useDashboardHeader() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardHeader must be used within DashboardLayoutClient')
  }
  return context
}

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userName?: string
  userEmail?: string
}

const SIDEBAR_COLLAPSED_KEY = 'dashboard-sidebar-collapsed'

// Mapeamento de rotas para títulos
const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/pacotes': 'Pacotes',
  '/dashboard/pacotes/novo': 'Novo Pacote',
  '/dashboard/frota': 'Frota',
  '/dashboard/clientes': 'Clientes',
  '/dashboard/afiliados': 'Afiliados',
  '/dashboard/contatos': 'Contatos',
  '/dashboard/relatorios': 'Relatórios',
  '/dashboard/perfil': 'Perfil',
  '/dashboard/configuracoes': 'Configurações',
  '/dashboard/parceiro': 'Parceiro Amorim',
  '/dashboard/billing': 'Assinatura',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (routeTitles[pathname]) {
    return routeTitles[pathname]
  }
  
  // Check for dynamic routes (e.g., /dashboard/pacotes/[id]/editar)
  if (pathname.includes('/dashboard/pacotes/') && pathname.includes('/editar')) {
    return 'Editar Pacote'
  }
  if (pathname.includes('/dashboard/pacotes/')) {
    return 'Detalhes do Pacote'
  }
  if (pathname.includes('/dashboard/afiliados/')) {
    return 'Detalhes do Afiliado'
  }
  
  // Default
  return 'Dashboard'
}

export function DashboardLayoutClient({
  children,
  userName,
  userEmail,
}: DashboardLayoutClientProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [title, setTitle] = useState(() => getPageTitle(pathname))
  const [action, setAction] = useState<React.ReactNode>(null)
  
  // Update title when pathname changes
  useEffect(() => {
    setTitle(getPageTitle(pathname))
    setAction(null) // Reset action on navigation
  }, [pathname])
  
  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true')
    }
  }, [])
  
  const handleToggleCollapse = () => {
    const newValue = !sidebarCollapsed
    setSidebarCollapsed(newValue)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue))
  }

  return (
    <DashboardContext.Provider value={{ setTitle, setAction }}>
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#121212] font-sans">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userName={userName}
          userEmail={userEmail}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Main wrapper - offset for desktop sidebar */}
        <div className={`lg:transition-all lg:duration-300 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
          {/* Top App Bar */}
          <header className="flex items-center justify-between p-4 pb-2 sticky top-0 z-10 bg-[#f8f9fa] dark:bg-[#121212]">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center size-12 rounded-lg hover:bg-gray-200 dark:hover:bg-[#1E1E1E] transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6 text-[#333333] dark:text-[#E0E0E0]" />
            </button>
            {/* Desktop spacer */}
            <div className="hidden lg:block w-12" />
            
            <h1 className="text-lg font-bold text-[#333333] dark:text-[#E0E0E0] tracking-tight">
              {title}
            </h1>
            {action ? action : <UserMenu />}
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col gap-6 p-4 pb-24 lg:pb-8">{children}</main>
        </div>

        {/* Bottom Navigation - Mobile only */}
        <BottomNav />
      </div>
    </DashboardContext.Provider>
  )
}
