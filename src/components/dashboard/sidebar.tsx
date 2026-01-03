'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { useUserRole } from '@/hooks/use-user-role'
import {
  X,
  LayoutDashboard,
  Bus,
  Truck,
  Users,
  Handshake,
  MessageSquare,
  Settings,
  BarChart3,
  LogOut,
  ChevronRight,
  UserCircle,
  Map,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
  userEmail?: string
  // Desktop props
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

// Itens de menu com flag de admin-only e userOnly
const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
  { href: '/dashboard/pacotes', icon: Bus, label: 'Pacotes de Viagem', adminOnly: true },
  { href: '/dashboard/frota', icon: Truck, label: 'Frota', adminOnly: true },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes', adminOnly: true },
  { href: '/dashboard/afiliados', icon: Handshake, label: 'Afiliados', adminOnly: true },
  { href: '/dashboard/contatos', icon: MessageSquare, label: 'Contatos', adminOnly: true },
  { href: '/dashboard/relatorios', icon: BarChart3, label: 'Relatórios', adminOnly: true },
  { href: '/pacotes', icon: Map, label: 'Ver Viagens', adminOnly: false, userOnly: true },
  { href: '/dashboard/parceiro', icon: Handshake, label: 'Parceiro Amorim', adminOnly: false, userOnly: true },
  { href: '/dashboard/perfil', icon: UserCircle, label: 'Meu Perfil', adminOnly: false },
  { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações', adminOnly: false },
]

export function Sidebar({ 
  isOpen, 
  onClose, 
  userName, 
  userEmail,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { isAdmin, isLoading } = useUserRole()

  // Filtrar itens de menu baseado na role
  // Enquanto carrega, mostra apenas itens não-exclusivos (dashboard, perfil, config)
  const visibleMenuItems = menuItems.filter(item => {
    // Enquanto está carregando, só mostra itens que aparecem para todos
    if (isLoading) {
      return !item.adminOnly && !(item as any).userOnly
    }
    // Se é admin-only e usuário não é admin, não mostra
    if (item.adminOnly && !isAdmin) return false
    // Se é userOnly e usuário é admin, não mostra (admin tem seu próprio menu de afiliados)
    if ((item as any).userOnly && isAdmin) return false
    return true
  })

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-[#1E1E1E] z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D93636] flex items-center justify-center text-white font-bold">
              {userName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#333333] dark:text-[#E0E0E0] font-semibold truncate">
                {userName || 'Admin'}
              </p>
              <p className="text-gray-500 dark:text-[#A0A0A0] text-xs truncate">
                {userEmail || ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 flex flex-col gap-1">
          {visibleMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#D93636] text-white'
                    : 'text-gray-600 dark:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-[#E0E0E0]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[#D93636] hover:bg-red-50 dark:hover:bg-[#D93636]/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar - Always visible */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-full bg-white dark:bg-[#1E1E1E] z-30 flex-col border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center p-4 border-b border-gray-200 dark:border-gray-700 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          {!isCollapsed && (
            <>
              <div className="w-10 h-10 rounded-full bg-[#D93636] flex items-center justify-center text-white font-bold flex-shrink-0">
                {userName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#333333] dark:text-[#E0E0E0] font-semibold truncate text-sm">
                  {userName || 'Admin'}
                </p>
                <p className="text-gray-500 dark:text-[#A0A0A0] text-xs truncate">
                  {userEmail || ''}
                </p>
              </div>
            </>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-full bg-[#D93636] flex items-center justify-center text-white font-bold">
              {userName?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#D93636] text-white'
                    : 'text-gray-600 dark:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-[#E0E0E0]'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 font-medium text-sm">{item.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
          {/* Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 dark:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <>
                <PanelLeftClose className="w-5 h-5" />
                <span className="font-medium text-sm">Recolher menu</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[#D93636] hover:bg-red-50 dark:hover:bg-[#D93636]/10 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Sair da conta' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium text-sm">Sair da conta</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
