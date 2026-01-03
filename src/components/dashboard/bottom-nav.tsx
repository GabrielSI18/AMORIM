'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUserRole } from '@/hooks/use-user-role'
import { LayoutDashboard, Bus, Users, UserCircle, Map, Handshake } from 'lucide-react'

// Itens de navegação com flag de admin-only
const allNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
  { href: '/dashboard/pacotes', icon: Bus, label: 'Viagens', adminOnly: true },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes', adminOnly: true },
  { href: '/pacotes', icon: Map, label: 'Pacotes', adminOnly: false, userOnly: true },
  { href: '/dashboard/parceiro', icon: Handshake, label: 'Parceiro', adminOnly: false, userOnly: true },
  { href: '/dashboard/perfil', icon: UserCircle, label: 'Perfil', adminOnly: false },
]

export function BottomNav() {
  const pathname = usePathname()
  const { isAdmin, isLoading } = useUserRole()

  // Durante o loading, mostra itens neutros (que aparecem para todos)
  const navItems = allNavItems.filter(item => {
    // Durante loading, mostra apenas itens que não são específicos de role
    if (isLoading) {
      return !item.adminOnly && !item.userOnly
    }
    // Se é admin-only e usuário não é admin, não mostra
    if (item.adminOnly && !isAdmin) return false
    // Se é user-only (ex: link para pacotes público) e usuário é admin, não mostra
    if (item.userOnly && isAdmin) return false
    return true
  })

  // Se ainda está carregando, não renderiza nada para evitar flash
  if (isLoading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1E1E1E] border-t border-gray-200 dark:border-gray-700 p-2 flex justify-around z-50 overflow-hidden lg:hidden">
        <div className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0">
          <LayoutDashboard className="w-6 h-6 text-gray-300 dark:text-gray-600" />
          <span className="text-xs font-medium text-gray-300 dark:text-gray-600">Dashboard</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0">
          <UserCircle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
          <span className="text-xs font-medium text-gray-300 dark:text-gray-600">Perfil</span>
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1E1E1E] border-t border-gray-200 dark:border-gray-700 p-2 flex justify-around z-50 overflow-hidden lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-colors ${
              isActive ? 'text-[#D93636]' : 'text-gray-500 dark:text-[#A0A0A0] hover:text-gray-700 dark:hover:text-[#E0E0E0]'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
