'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { User, Mail, Phone, MapPin, Calendar, Edit2, LogOut, Shield } from 'lucide-react'
import Image from 'next/image'
import { DashboardShell } from '@/components/dashboard'

export default function PerfilPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  if (!isLoaded) {
    return (
      <DashboardShell title="Perfil">
        <div className="space-y-6 animate-pulse">
          <div className="flex flex-col items-center gap-4 p-6 bg-[#1E1E1E] rounded-xl">
            <div className="w-24 h-24 rounded-full bg-[#2A2A2A]" />
            <div className="h-6 w-32 bg-[#2A2A2A] rounded" />
            <div className="h-4 w-48 bg-[#2A2A2A] rounded" />
          </div>
        </div>
      </DashboardShell>
    )
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuário'
  const email = user?.emailAddresses[0]?.emailAddress || ''
  const phone = user?.phoneNumbers[0]?.phoneNumber || ''
  const createdAt = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) : ''

  return (
    <DashboardShell title="Perfil">
      <div className="space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center gap-4 p-6 bg-[#1E1E1E] border border-[#333] rounded-xl">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#2A2A2A] border-2 border-[#333] overflow-hidden">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={fullName}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#A0A0A0] text-3xl font-medium">
                  {fullName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-[#D93636] rounded-full text-white hover:bg-[#C52F2F] transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#E0E0E0]">{fullName}</h2>
            <p className="text-[#A0A0A0]">Cliente</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#E0E0E0] px-1">Informações</h3>
          
          <div className="bg-[#1E1E1E] border border-[#333] rounded-xl divide-y divide-[#333]">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#A0A0A0]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#A0A0A0]">Email</p>
                <p className="text-[#E0E0E0] truncate">{email}</p>
              </div>
            </div>

            {phone && (
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#A0A0A0]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#A0A0A0]">Telefone</p>
                  <p className="text-[#E0E0E0]">{phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#A0A0A0]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#A0A0A0]">Membro desde</p>
                <p className="text-[#E0E0E0]">{createdAt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#E0E0E0] px-1">Conta</h3>
          
          <div className="bg-[#1E1E1E] border border-[#333] rounded-xl divide-y divide-[#333]">
            <button className="flex items-center gap-4 p-4 w-full text-left hover:bg-[#2A2A2A] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                <User className="w-5 h-5 text-[#A0A0A0]" />
              </div>
              <div className="flex-1">
                <p className="text-[#E0E0E0]">Editar perfil</p>
                <p className="text-sm text-[#A0A0A0]">Alterar nome, foto e informações</p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-4 w-full text-left hover:bg-[#2A2A2A] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#A0A0A0]" />
              </div>
              <div className="flex-1">
                <p className="text-[#E0E0E0]">Segurança</p>
                <p className="text-sm text-[#A0A0A0]">Senha e autenticação</p>
              </div>
            </button>

            <button 
              onClick={() => signOut({ redirectUrl: '/' })}
              className="flex items-center gap-4 p-4 w-full text-left hover:bg-[#2A2A2A] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-red-400">Sair da conta</p>
                <p className="text-sm text-[#A0A0A0]">Encerrar sessão</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
