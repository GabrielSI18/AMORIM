'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Eye, Package } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard'
import type { Package as PackageType, Category, Destination } from '@/types'

export default function DashboardPackagesPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [packages, setPackages] = useState<PackageType[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [pkgRes, catRes, destRes] = await Promise.all([
        fetch('/api/packages?status=all'),
        fetch('/api/categories'),
        fetch('/api/destinations'),
      ])

      const [pkgData, catData, destData] = await Promise.all([
        pkgRes.json(),
        catRes.json(),
        destRes.json(),
      ])

      setPackages(pkgData.data || [])
      setCategories(catData.data || [])
      setDestinations(destData.data || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este pacote?')) return

    try {
      const res = await fetch(`/api/packages?id=${id}`, { method: 'DELETE' })

      if (res.ok) {
        toast.success('Pacote removido com sucesso')
        loadData()
      } else {
        toast.error('Erro ao remover pacote')
      }
    } catch (error) {
      console.error('Erro ao remover:', error)
      toast.error('Erro ao remover pacote')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-400',
      published: 'bg-green-500/20 text-green-400',
      sold_out: 'bg-red-500/20 text-red-400',
      canceled: 'bg-yellow-500/20 text-yellow-400',
    }

    const labels: Record<string, string> = {
      draft: 'Rascunho',
      published: 'Publicado',
      sold_out: 'Esgotado',
      canceled: 'Cancelado',
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}
      >
        {labels[status] || status}
      </span>
    )
  }

  if (!userId) {
    return (
      <DashboardShell title="Pacotes">
        <div className="flex items-center justify-center py-12">
          <p className="text-[#A0A0A0]">
            Voce precisa estar logado para acessar esta pagina.
          </p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell title="Pacotes de Viagem">
      {/* Header com botão */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#A0A0A0]">
            Cadastre e gerencie os pacotes de viagem
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/pacotes/novo')}
          className="bg-[#D93636] text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-[#c42f2f] transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Novo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1E1E1E] rounded-xl p-4">
          <p className="text-sm text-[#A0A0A0] mb-1">Total</p>
          <p className="text-2xl font-bold text-[#E0E0E0]">{packages.length}</p>
        </div>
        <div className="bg-[#1E1E1E] rounded-xl p-4">
          <p className="text-sm text-[#A0A0A0] mb-1">Publicados</p>
          <p className="text-2xl font-bold text-green-400">
            {packages.filter((p) => p.status === 'published').length}
          </p>
        </div>
      </div>

      {/* Lista de Pacotes */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="bg-[#1E1E1E] rounded-xl p-6 text-center">
            <p className="text-[#A0A0A0]">Carregando...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-[#1E1E1E] rounded-xl p-6 text-center">
            <Package className="w-12 h-12 text-[#A0A0A0] mx-auto mb-3" />
            <p className="text-[#A0A0A0]">Nenhum pacote cadastrado.</p>
            <p className="text-[#A0A0A0] text-sm">
              Clique em "Novo" para comecar.
            </p>
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-[#1E1E1E] rounded-xl p-4 flex items-center gap-4"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#E0E0E0] truncate">
                  {pkg.title}
                </p>
                <p className="text-sm text-[#A0A0A0]">
                  {pkg.destination?.city} • {pkg.durationDays} dias
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[#D93636] font-bold">
                    R$ {(pkg.price / 100).toFixed(2)}
                  </span>
                  {getStatusBadge(pkg.status)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => window.open(`/pacotes/${pkg.slug}`, '_blank')}
                  className="p-2 hover:bg-[#2a2a2a] text-[#A0A0A0] hover:text-[#E0E0E0] rounded-lg transition"
                  title="Visualizar"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push(`/dashboard/pacotes/${pkg.id}/editar`)}
                  className="p-2 hover:bg-[#2a2a2a] text-[#A0A0A0] hover:text-[#E0E0E0] rounded-lg transition"
                  title="Editar"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition"
                  title="Remover"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  )
}
