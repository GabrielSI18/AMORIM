'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Bus, Users, UserCircle } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/pacotes', icon: Bus, label: 'Viagens' },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes' },
  { href: '/dashboard/perfil', icon: UserCircle, label: 'Perfil' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-gray-700 p-2 flex justify-around z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-20 transition-colors ${
              isActive ? 'text-[#D93636]' : 'text-[#A0A0A0] hover:text-[#E0E0E0]'
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
