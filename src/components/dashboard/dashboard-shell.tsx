'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'
import { UserMenu } from './user-menu'
import { BottomNav } from './bottom-nav'

interface DashboardShellProps {
  children: React.ReactNode
  title: string
  userName?: string
  userEmail?: string
  action?: React.ReactNode
}

export function DashboardShell({
  children,
  title,
  userName,
  userEmail,
  action,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#121212] font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Top App Bar */}
      <header className="flex items-center justify-between p-4 pb-2 sticky top-0 z-10 bg-[#121212]">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center justify-center size-12 rounded-lg hover:bg-[#1E1E1E] transition-colors"
        >
          <Menu className="w-6 h-6 text-[#E0E0E0]" />
        </button>
        <h1 className="text-lg font-bold text-[#E0E0E0] tracking-tight">
          {title}
        </h1>
        {action ? action : <UserMenu />}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 p-4 pb-24">{children}</main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
