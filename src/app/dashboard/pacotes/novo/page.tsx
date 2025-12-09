'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { ArrowLeft, Save, ImagePlus, Plus, X, Calendar, MapPin, Clock, Users, DollarSign } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard'
import { FileUpload } from '@/components/ui/file-upload'

// Formatadores
const formatCurrency = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  
  // Converte para centavos e formata
  const cents = parseInt(numbers)
  const reais = cents / 100
  
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const parseCurrencyToNumber = (value: string): number => {
  // Remove pontos e troca vírgula por ponto
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

export default function NovoPacotePage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    destination: '',
    price: '',
    original_price: '',
    duration_days: '',
    departure_location: '',
    departure_time: '',
    departure_date: '',
    return_date: '',
    total_seats: '',
    includes: [''],
    not_includes: [''],
    images: [] as string[],
    status: 'draft',
    is_featured: false,
  })

  // Função para calcular data de retorno baseada na partida + duração
  const calculateReturnDate = (departureDate: string, durationDays: string): string => {
    if (!departureDate) return ''
    
    const departure = new Date(departureDate)
    const days = parseInt(durationDays) || 1 // Se não tem duração, assume 1 dia
    
    departure.setDate(departure.getDate() + days - 1) // -1 porque o dia de partida conta
    
    return departure.toISOString().split('T')[0]
  }

  // Handler para campos de preço formatados
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const formatted = formatCurrency(value)
    setFormData(prev => ({ ...prev, [name]: formatted }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: value }
        
        // Auto-calcular data de retorno quando mudar data de partida ou duração
        if (name === 'departure_date' && value) {
          updated.return_date = calculateReturnDate(value, prev.duration_days)
        } else if (name === 'duration_days' && prev.departure_date) {
          updated.return_date = calculateReturnDate(prev.departure_date, value)
        }
        
        return updated
      })
    }
  }

  const handleArrayChange = (field: 'includes' | 'not_includes', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'includes' | 'not_includes') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'includes' | 'not_includes', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.destination || !formData.price) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsLoading(true)

    try {
      // Parse dos preços formatados para centavos
      const priceInReais = parseCurrencyToNumber(formData.price)
      const originalPriceInReais = formData.original_price ? parseCurrencyToNumber(formData.original_price) : null

      const payload = {
        title: formData.title,
        description: formData.description,
        short_description: formData.short_description,
        destination: formData.destination,
        price: Math.round(priceInReais * 100), // Converter para centavos
        original_price: originalPriceInReais ? Math.round(originalPriceInReais * 100) : null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        departure_location: formData.departure_location,
        departure_time: formData.departure_time,
        departure_date: formData.departure_date || null,
        return_date: formData.return_date || null,
        total_seats: formData.total_seats ? parseInt(formData.total_seats) : null,
        available_seats: formData.total_seats ? parseInt(formData.total_seats) : null, // Começa com todas as vagas disponíveis
        includes: formData.includes.filter(i => i.trim() !== ''),
        not_includes: formData.not_includes.filter(i => i.trim() !== ''),
        images: formData.images,
        cover_image: formData.images[0] || null, // Primeira imagem como capa
        status: formData.status,
        is_featured: formData.is_featured,
      }

      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success('Pacote criado com sucesso!')
        router.push('/dashboard/pacotes')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao criar pacote')
      }
    } catch (error) {
      console.error('Erro ao criar pacote:', error)
      toast.error('Erro ao criar pacote')
    } finally {
      setIsLoading(false)
    }
  }

  if (!userId) {
    return (
      <DashboardShell title="Novo Pacote">
        <div className="flex items-center justify-center py-12">
          <p className="text-[#A0A0A0]">Você precisa estar logado para acessar esta página.</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell title="Novo Pacote">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#A0A0A0]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#E0E0E0]">Criar Novo Pacote</h1>
          <p className="text-sm text-[#A0A0A0]">Preencha as informações do pacote de viagem</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#E0E0E0] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#D93636]" />
            Informações Básicas
          </h2>

          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
              Título do Pacote *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Réveillon em Copacabana 2025"
              className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
              Descrição Curta
            </label>
            <input
              type="text"
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              placeholder="Resumo do pacote (exibido nos cards)"
              className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
              Descrição Completa
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrição detalhada do pacote..."
              rows={4}
              className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
              Destino *
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="Ex: Rio de Janeiro, RJ"
              className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
              required
            />
          </div>
        </div>

        {/* Preço e Duração */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#E0E0E0] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#D93636]" />
            Preço e Duração
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Preço (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]">R$</span>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handlePriceChange}
                  placeholder="0,00"
                  className="w-full pl-12 pr-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Preço Original (R$)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]">R$</span>
                <input
                  type="text"
                  name="original_price"
                  value={formData.original_price}
                  onChange={handlePriceChange}
                  placeholder="Preço sem desconto"
                  className="w-full pl-12 pr-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Duração (dias)
              </label>
              <input
                type="number"
                name="duration_days"
                value={formData.duration_days}
                onChange={handleChange}
                placeholder="Ex: 5"
                min="1"
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
              />
            </div>
          </div>
        </div>

        {/* Partida */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#E0E0E0] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D93636]" />
            Partida e Retorno
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Local de Partida
              </label>
              <input
                type="text"
                name="departure_location"
                value={formData.departure_location}
                onChange={handleChange}
                placeholder="Ex: Belo Horizonte, MG"
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Horário de Partida
              </label>
              <input
                type="time"
                name="departure_time"
                value={formData.departure_time}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Data de Partida
              </label>
              <input
                type="date"
                name="departure_date"
                value={formData.departure_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Data de Retorno
              </label>
              <input
                type="date"
                name="return_date"
                value={formData.return_date}
                onChange={handleChange}
                min={formData.departure_date || undefined}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
              />
              {formData.departure_date && formData.duration_days && (
                <p className="text-xs text-[#666] mt-1">
                  Calculado automaticamente ({formData.duration_days} dias)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Vagas */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#E0E0E0] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D93636]" />
            Vagas
          </h2>

          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
              Total de Vagas (assentos do ônibus)
            </label>
            <input
              type="number"
              name="total_seats"
              value={formData.total_seats}
              onChange={handleChange}
              placeholder="Ex: 44"
              min="1"
              className="w-full max-w-xs px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
            />
            <p className="text-xs text-[#666] mt-1">
              As vagas disponíveis serão calculadas automaticamente conforme as vendas.
            </p>
          </div>
        </div>

        {/* O que inclui */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#E0E0E0]">O que inclui</h2>
          
          {formData.includes.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange('includes', index, e.target.value)}
                placeholder="Ex: Transporte em ônibus executivo"
                className="flex-1 px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
              />
              {formData.includes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('includes', index)}
                  className="p-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={() => addArrayItem('includes')}
            className="flex items-center gap-2 text-[#D93636] hover:text-[#c42f2f] transition"
          >
            <Plus className="w-4 h-4" />
            Adicionar item
          </button>
        </div>

        {/* O que não inclui */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#E0E0E0]">O que não inclui</h2>
          
          {formData.not_includes.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange('not_includes', index, e.target.value)}
                placeholder="Ex: Alimentação"
                className="flex-1 px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
              />
              {formData.not_includes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('not_includes', index)}
                  className="p-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={() => addArrayItem('not_includes')}
            className="flex items-center gap-2 text-[#D93636] hover:text-[#c42f2f] transition"
          >
            <Plus className="w-4 h-4" />
            Adicionar item
          </button>
        </div>

        {/* Imagens */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#E0E0E0] flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-[#D93636]" />
            Imagens
            <span className="text-sm font-normal text-[#A0A0A0]">
              ({formData.images.length}/20)
            </span>
          </h2>

          {/* Grid de imagens já adicionadas */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {formData.images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-[#444]"
                  />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-[#D93636] text-white text-xs rounded">
                      Capa
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index)
                      }))
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload de novas imagens */}
          {formData.images.length < 20 && (
            <FileUpload
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              folder="packages"
              multiple
              showPreview={false}
              placeholder="Arraste imagens ou clique para selecionar"
              description={`Tamanho recomendado: 1200x630px (16:9). Formatos: JPG, PNG, WebP. Máximo: 5MB por imagem. Restantes: ${20 - formData.images.length}`}
              onUploadComplete={(file) => {
                const imageUrl = file.publicUrl || file.path
                setFormData(prev => {
                  if (prev.images.length >= 20) {
                    toast.error('Limite de 20 imagens atingido')
                    return prev
                  }
                  return { ...prev, images: [...prev.images, imageUrl] }
                })
              }}
              onError={(error) => {
                toast.error(error)
              }}
            />
          )}

          {formData.images.length >= 20 && (
            <p className="text-sm text-yellow-500">
              Limite máximo de 20 imagens atingido. Remova alguma para adicionar novas.
            </p>
          )}

          {formData.images.length > 0 && (
            <p className="text-sm text-[#A0A0A0]">
              A primeira imagem será usada como capa do pacote.
            </p>
          )}
        </div>

        {/* Status e Destaque */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#E0E0E0]">Configurações</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#444] rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="w-5 h-5 rounded border-[#444] bg-[#2A2A2A] text-[#D93636] focus:ring-[#D93636]"
              />
              <label htmlFor="is_featured" className="text-[#E0E0E0]">
                Destacar na página inicial
              </label>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-4 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-[#2A2A2A] text-[#A0A0A0] rounded-lg font-semibold hover:bg-[#333] transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-[#D93636] text-white rounded-lg font-semibold hover:bg-[#c42f2f] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Criar Pacote
              </>
            )}
          </button>
        </div>
      </form>
    </DashboardShell>
  )
}
