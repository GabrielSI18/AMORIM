'use client'

import { Bell, Search, User } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'

interface AdminHeaderProps {
  sidebarCollapsed?: boolean
}

export function AdminHeader({ sidebarCollapsed = false }: AdminHeaderProps) {
  const { user } = useUser()

  return (
    <header 
      className={`fixed top-0 right-0 z-30 h-16 bg-[#101622] border-b border-[#324467] transition-all duration-300 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#92a4c9]" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#192233] border border-[#324467] text-white placeholder:text-[#92a4c9] focus:outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-[#192233] text-[#92a4c9] hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-4 border-l border-[#324467]">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-[#92a4c9]">Super Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#192233] border-2 border-[#324467] overflow-hidden">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#92a4c9]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
