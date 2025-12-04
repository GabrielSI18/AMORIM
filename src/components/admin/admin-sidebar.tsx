'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  UserCheck, 
  Settings,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plane
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useClerk } from '@clerk/nextjs'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Pacotes',
    href: '/dashboard/pacotes',
    icon: Package,
  },
  {
    title: 'Clientes',
    href: '/dashboard/clientes',
    icon: Users,
  },
  {
    title: 'Afiliados',
    href: '/dashboard/afiliados',
    icon: UserCheck,
  },
  {
    title: 'Relatórios',
    href: '/dashboard/relatorios',
    icon: BarChart3,
  },
  {
    title: 'Configurações',
    href: '/dashboard/configuracoes',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { signOut } = useClerk()

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#101622] border-r border-[#324467] transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#324467]">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-[#2563eb]" />
            <span className="text-white font-bold text-lg">Amorim</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Plane className="w-8 h-8 text-[#2563eb]" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg hover:bg-[#192233] text-[#92a4c9] hover:text-white transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                isActive 
                  ? "bg-[#2563eb] text-white" 
                  : "text-[#92a4c9] hover:bg-[#192233] hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[#324467]">
        <button
          onClick={() => signOut({ redirectUrl: '/' })}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-[#92a4c9] hover:bg-red-500/10 hover:text-red-400 transition-all",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  )
}
