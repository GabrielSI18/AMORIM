'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import {
  X,
  LayoutDashboard,
  Bus,
  Users,
  Handshake,
  Settings,
  BarChart3,
  LogOut,
  ChevronRight,
  UserCircle,
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
  userEmail?: string
}

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/pacotes', icon: Bus, label: 'Pacotes de Viagem' },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes' },
  { href: '/dashboard/afiliados', icon: Handshake, label: 'Afiliados' },
  { href: '/dashboard/relatorios', icon: BarChart3, label: 'Relatórios' },
  { href: '/dashboard/perfil', icon: UserCircle, label: 'Meu Perfil' },
  { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
]

export function Sidebar({ isOpen, onClose, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const { signOut } = useClerk()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#1E1E1E] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D93636] flex items-center justify-center text-white font-bold">
              {userName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#E0E0E0] font-semibold truncate">
                {userName || 'Admin'}
              </p>
              <p className="text-[#A0A0A0] text-xs truncate">
                {userEmail || ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-5 h-5 text-[#A0A0A0]" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 flex flex-col gap-1">
          {menuItems.map((item) => {
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
                    : 'text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-[#E0E0E0]'
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[#D93636] hover:bg-[#D93636]/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair da conta</span>
          </button>
        </div>
      </aside>
    </>
  )
}
