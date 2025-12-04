'use client'

import { useState, useRef, useEffect } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { User, LogOut, Settings, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { signOut } = useClerk()
  const { user } = useUser()

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center size-10 rounded-full bg-[#1E1E1E] text-[#E0E0E0] hover:bg-[#2a2a2a] transition-colors overflow-hidden"
      >
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-56 bg-[#1E1E1E] border border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-gray-700">
            <p className="text-[#E0E0E0] font-semibold truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[#A0A0A0] text-sm truncate">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Link
              href="/dashboard/perfil"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-[#E0E0E0] transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">Meu Perfil</span>
            </Link>
            <Link
              href="/dashboard/configuracoes"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-[#E0E0E0] transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Configurações</span>
            </Link>
            <Link
              href="/ajuda"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#A0A0A0] hover:bg-[#2a2a2a] hover:text-[#E0E0E0] transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Ajuda</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[#D93636] hover:bg-[#D93636]/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sair da conta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
