'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Eye, Package, MapPin, Calendar, Users, Bus, Star } from 'lucide-react'
import { DashboardShell, AdminGuard } from '@/components/dashboard'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Image from 'next/image'
import type { Package as PackageType, Category, Destination } from '@/types'

// Formatador de moeda
const formatPrice = (priceInCents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceInCents / 100)
}

// Formatador de data
const formatDate = (date: Date | string | undefined) => {
  if (!date) return null
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function DashboardPackagesPage() {
  return (
    <AdminGuard>
      <PackagesContent />
    </AdminGuard>
  )
}

function PackagesContent() {
  const router = useRouter()
  const { userId } = useAuth()
  const [packages, setPackages] = useState<PackageType[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Estado do modal de confirmação
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; packageId: string | null; packageName: string }>({
    isOpen: false,
    packageId: null,
    packageName: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDelete = async (id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, packageId: id, packageName: name })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.packageId) return
    
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/packages?id=${deleteConfirm.packageId}`, { method: 'DELETE' })

      if (res.ok) {
        toast.success('Pacote removido com sucesso')
        loadData()
      } else {
        toast.error('Erro ao remover pacote')
      }
    } catch (error) {
      console.error('Erro ao remover:', error)
      toast.error('Erro ao remover pacote')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm({ isOpen: false, packageId: null, packageName: '' })
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
          <p className="text-gray-500 dark:text-[#A0A0A0]">
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
          <p className="text-gray-500 dark:text-[#A0A0A0]">
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
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4">
          <p className="text-sm text-gray-500 dark:text-[#A0A0A0] mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-[#E0E0E0]">{packages.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4">
          <p className="text-sm text-gray-500 dark:text-[#A0A0A0] mb-1">Publicados</p>
          <p className="text-2xl font-bold text-green-400">
            {packages.filter((p) => p.status === 'published').length}
          </p>
        </div>
      </div>

      {/* Lista de Pacotes */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 text-center">
            <p className="text-gray-500 dark:text-[#A0A0A0]">Carregando...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 text-center">
            <Package className="w-12 h-12 text-gray-500 dark:text-[#A0A0A0] mx-auto mb-3" />
            <p className="text-gray-500 dark:text-[#A0A0A0]">Nenhum pacote cadastrado.</p>
            <p className="text-gray-500 dark:text-[#A0A0A0] text-sm">
              Clique em "Novo" para comecar.
            </p>
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 flex gap-4"
            >
              {/* Imagem de capa */}
              {pkg.coverImage ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={pkg.coverImage}
                    alt={pkg.title}
                    fill
                    className="object-cover"
                  />
                  {pkg.isFeatured && (
                    <div className="absolute top-1 right-1 bg-yellow-500 rounded-full p-1">
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-gray-500 dark:text-[#A0A0A0]" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-[#E0E0E0] truncate">
                      {pkg.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-[#A0A0A0]">
                      {(pkg.destination || (pkg as any).destinationText) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {pkg.destination?.city 
                              ? `${pkg.destination.city}${pkg.destination.state ? `, ${pkg.destination.state}` : ''}`
                              : (pkg as any).destinationText}
                          </span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        {pkg.durationDays} dias
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(pkg.status)}
                  </div>
                </div>

                {/* Detalhes extras */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-[#A0A0A0]">
                  {pkg.departureDate && (
                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded">
                      <Calendar className="w-3 h-3" />
                      Saída: {formatDate(pkg.departureDate)}
                    </span>
                  )}
                  {pkg.totalSeats && (
                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded">
                      <Users className="w-3 h-3" />
                      {pkg.availableSeats ?? pkg.totalSeats}/{pkg.totalSeats} vagas
                    </span>
                  )}
                  {(pkg as any).bus && (
                    <span className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded">
                      <Bus className="w-3 h-3" />
                      {(pkg as any).bus.model}
                    </span>
                  )}
                </div>

                {/* Preço e ações */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                      <span className="text-xs text-gray-500 dark:text-[#A0A0A0] line-through">
                        {formatPrice(pkg.originalPrice)}
                      </span>
                    )}
                    <span className="text-[#D93636] font-bold text-lg">
                      {formatPrice(pkg.price)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => window.open(`/pacotes/${pkg.slug}`, '_blank')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-[#A0A0A0] hover:text-gray-900 dark:hover:text-[#E0E0E0] rounded-lg transition"
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/pacotes/${pkg.id}/editar`)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-[#A0A0A0] hover:text-gray-900 dark:hover:text-[#E0E0E0] rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id, pkg.title)}
                      className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, packageId: null, packageName: '' })}
        onConfirm={confirmDelete}
        title="Remover pacote"
        description={`Tem certeza que deseja remover o pacote "${deleteConfirm.packageName}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </DashboardShell>
  )
}
