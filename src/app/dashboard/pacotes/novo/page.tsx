'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { ArrowLeft, Save, ImagePlus, Plus, X, Calendar, MapPin, Clock, Users, DollarSign, Bus, Upload, Loader2 } from 'lucide-react'
import { DashboardShell, AdminGuard } from '@/components/dashboard'
import Image from 'next/image'

interface BusData {
  id: string;
  model: string;
  year: number;
  plate: string;
  seats: number;
  floors: number;
  photos: string[];
  isActive: boolean;
}

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
  return (
    <AdminGuard>
      <NovoPacoteContent />
    </AdminGuard>
  )
}

function NovoPacoteContent() {
  const router = useRouter()
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [buses, setBuses] = useState<BusData[]>([])
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const hotelInputRef = useRef<HTMLInputElement>(null)
  
  // Carregar ônibus disponíveis
  useEffect(() => {
    const loadBuses = async () => {
      try {
        const response = await fetch('/api/fleet?active=true')
        if (response.ok) {
          const data = await response.json()
          setBuses(data.data)
        }
      } catch (error) {
        console.error('Erro ao carregar frota:', error)
      }
    }
    loadBuses()
  }, [])
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    destination: '',
    price: '',
    original_price: '',
    price_child_6_10: '',
    price_child_11_13: '',
    duration_days: '',
    departure_location: '',
    departure_time: '',
    return_time: '',
    departure_date: '',
    return_date: '',
    total_seats: '',
    includes: [''],
    not_includes: [''],
    cover_image: '',
    gallery_images: [] as string[],
    hotel_name: '',
    hotel_photos: [] as string[],
    attractions: [''],
    max_installments: '10',
    status: 'draft',
    is_featured: false,
    bus_id: '',
  })

  // Função para calcular data de retorno baseada na partida + duração
  const calculateReturnDate = (departureDate: string, durationDays: string): string => {
    if (!departureDate) return ''
    
    const departure = new Date(departureDate)
    const days = parseInt(durationDays) || 1 // Se não tem duração, assume 1 dia
    
    departure.setDate(departure.getDate() + days - 1) // -1 porque o dia de partida conta
    
    return departure.toISOString().split('T')[0]
  }

  // Handler para seleção de ônibus
  const handleBusChange = (busId: string) => {
    const bus = buses.find(b => b.id === busId) || null
    setSelectedBus(bus)
    setFormData(prev => ({
      ...prev,
      bus_id: busId,
      // Auto-preencher total_seats com assentos do ônibus
      total_seats: bus ? bus.seats.toString() : prev.total_seats,
    }))
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

  const handleArrayChange = (field: 'includes' | 'not_includes' | 'attractions', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'includes' | 'not_includes' | 'attractions') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'includes' | 'not_includes' | 'attractions', index: number) => {
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
      const priceChild6_10InReais = formData.price_child_6_10 ? parseCurrencyToNumber(formData.price_child_6_10) : null
      const priceChild11_13InReais = formData.price_child_11_13 ? parseCurrencyToNumber(formData.price_child_11_13) : null

      const payload = {
        title: formData.title,
        description: formData.description,
        short_description: formData.short_description,
        destination: formData.destination,
        price: Math.round(priceInReais * 100), // Converter para centavos
        original_price: originalPriceInReais ? Math.round(originalPriceInReais * 100) : null,
        price_child_6_10: priceChild6_10InReais ? Math.round(priceChild6_10InReais * 100) : null,
        price_child_11_13: priceChild11_13InReais ? Math.round(priceChild11_13InReais * 100) : null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        departure_location: formData.departure_location,
        departure_time: formData.departure_time,
        return_time: formData.return_time || null,
        departure_date: formData.departure_date || null,
        return_date: formData.return_date || null,
        total_seats: formData.total_seats ? parseInt(formData.total_seats) : null,
        available_seats: formData.total_seats ? parseInt(formData.total_seats) : null, // Começa com todas as vagas disponíveis
        includes: formData.includes.filter(i => i.trim() !== ''),
        not_includes: formData.not_includes.filter(i => i.trim() !== ''),
        cover_image: formData.cover_image || null,
        gallery_images: formData.gallery_images,
        hotel_name: formData.hotel_name || null,
        hotel_photos: formData.hotel_photos,
        attractions: formData.attractions.filter(a => a.trim() !== ''),
        max_installments: formData.max_installments ? parseInt(formData.max_installments) : 10,
        status: formData.status,
        is_featured: formData.is_featured,
        bus_id: formData.bus_id || null,
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
          <p className="text-gray-500 dark:text-[#A0A0A0]">Você precisa estar logado para acessar esta página.</p>
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
          className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#E0E0E0]">Criar Novo Pacote</h1>
          <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">Preencha as informações do pacote de viagem</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#D93636]" />
            Informações Básicas
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
              Título do Pacote *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Réveillon em Copacabana 2025"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
              Descrição Curta
            </label>
            <input
              type="text"
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              placeholder="Resumo do pacote (exibido nos cards)"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
              Descrição Completa
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrição detalhada do pacote..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
              Destino *
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="Ex: Rio de Janeiro, RJ"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
              required
            />
          </div>
        </div>

        {/* Preço e Duração */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#D93636]" />
            Preço e Duração
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                Preço Adulto (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#A0A0A0]">R$</span>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handlePriceChange}
                  placeholder="0,00"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                Preço Original (R$)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#A0A0A0]">R$</span>
                <input
                  type="text"
                  name="original_price"
                  value={formData.original_price}
                  onChange={handlePriceChange}
                  placeholder="Preço sem desconto"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                Duração (dias)
              </label>
              <input
                type="number"
                name="duration_days"
                value={formData.duration_days}
                onChange={handleChange}
                placeholder="Ex: 5"
                min="1"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
              />
            </div>
          </div>

          {/* Preços para Crianças */}
          <div className="border-t border-gray-200 dark:border-[#333] pt-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-3">Preços para Crianças</h3>
            <p className="text-xs text-gray-400 dark:text-[#666] mb-3">💡 Crianças de 0 a 5 anos são gratuitas</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                  Criança 6 a 10 anos (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#A0A0A0]">R$</span>
                  <input
                    type="text"
                    name="price_child_6_10"
                    value={formData.price_child_6_10}
                    onChange={handlePriceChange}
                    placeholder="0,00"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                  Criança 11 a 13 anos (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[#A0A0A0]">R$</span>
                  <input
                    type="text"
                    name="price_child_11_13"
                    value={formData.price_child_11_13}
                    onChange={handlePriceChange}
                    placeholder="0,00"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Parcelamento */}
          <div className="border-t border-gray-200 dark:border-[#333] pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-1">
                  Parcelamento Máximo
                </label>
                <p className="text-xs text-gray-400 dark:text-[#666]">Número máximo de parcelas no cartão de crédito</p>
              </div>
              <select
                name="max_installments"
                value={formData.max_installments}
                onChange={handleChange}
                className="px-4 py-2 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
              >
                <option value="1">À vista</option>
                <option value="2">2x</option>
                <option value="3">3x</option>
                <option value="4">4x</option>
                <option value="5">5x</option>
                <option value="6">6x</option>
                <option value="10">10x</option>
                <option value="12">12x</option>
              </select>
            </div>
          </div>
        </div>

        {/* Partida */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D93636]" />
            Partida e Retorno
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                Local de Partida
              </label>
              <input
                type="text"
                name="departure_location"
                value={formData.departure_location}
                onChange={handleChange}
                placeholder="Ex: Belo Horizonte, MG"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                Horário de Partida
              </label>
              <input
                type="time"
                name="departure_time"
                value={formData.departure_time}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                Data de Partida
              </label>
              <input
                type="date"
                name="departure_date"
                value={formData.departure_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                Data de Retorno
              </label>
              <input
                type="date"
                name="return_date"
                value={formData.return_date}
                onChange={handleChange}
                min={formData.departure_date || undefined}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
              />
              {formData.departure_date && formData.duration_days && (
                <p className="text-xs text-gray-400 dark:text-[#666] mt-1">
                  Calculado automaticamente ({formData.duration_days} dias)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                Horário de Retorno
              </label>
              <input
                type="time"
                name="return_time"
                value={formData.return_time}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
              />
              <p className="text-xs text-gray-400 dark:text-[#666] mt-1">
                Horário previsto para retorno/checkout
              </p>
            </div>
          </div>
        </div>

        {/* Ônibus da Frota */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] flex items-center gap-2">
            <Bus className="w-5 h-5 text-[#D93636]" />
            Ônibus da Frota
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
              Selecione o Ônibus
            </label>
            <select
              value={formData.bus_id}
              onChange={(e) => handleBusChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
            >
              <option value="">Selecione um ônibus...</option>
              {buses.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.model} - {bus.plate} ({bus.seats} assentos)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 dark:text-[#666] mt-1">
              O ônibus selecionado será exibido na página de reserva.
            </p>
          </div>

          {/* Preview do ônibus selecionado */}
          {selectedBus && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-[#2A2A2A] rounded-lg border border-gray-300 dark:border-[#444]">
              <div className="flex gap-4">
                {/* Foto do ônibus */}
                <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#333] flex-shrink-0">
                  {selectedBus.photos && selectedBus.photos.length > 0 ? (
                    <Image
                      src={selectedBus.photos[0]}
                      alt={selectedBus.model}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Bus className="w-8 h-8 text-gray-400 dark:text-[#666]" />
                    </div>
                  )}
                </div>
                
                {/* Info do ônibus */}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-[#E0E0E0]">{selectedBus.model}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-[#A0A0A0]">
                    <span>Ano: {selectedBus.year}</span>
                    <span>Placa: {selectedBus.plate}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D93636]/20 text-[#D93636] text-xs rounded">
                      {selectedBus.seats} assentos
                    </span>
                    {selectedBus.floors > 1 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                        Double Decker
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {buses.length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-[#A0A0A0]">
              <p className="text-sm">Nenhum ônibus cadastrado na frota.</p>
              <a 
                href="/dashboard/frota/novo" 
                className="text-[#D93636] hover:underline text-sm mt-1 inline-block"
              >
                Cadastrar um ônibus
              </a>
            </div>
          )}
        </div>

        {/* Vagas */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D93636]" />
            Vagas
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
              Total de Vagas (assentos do ônibus)
            </label>
            <input
              type="number"
              name="total_seats"
              value={formData.total_seats}
              onChange={handleChange}
              placeholder="Ex: 44"
              min="1"
              className="w-full max-w-xs px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
            />
            <p className="text-xs text-gray-400 dark:text-[#666] mt-1">
              {selectedBus 
                ? `Preenchido automaticamente com base no ônibus selecionado (${selectedBus.seats} assentos).`
                : 'As vagas disponíveis serão calculadas automaticamente conforme as vendas.'}
            </p>
          </div>
        </div>

        {/* O que inclui */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0]">O que inclui</h2>
          
          {formData.includes.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange('includes', index, e.target.value)}
                placeholder="Ex: Transporte em ônibus executivo"
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
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
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0]">O que não inclui</h2>
          
          {formData.not_includes.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange('not_includes', index, e.target.value)}
                placeholder="Ex: Alimentação"
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
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

        {/* Imagem de Capa */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-[#D93636]" />
            Imagem de Capa
            <span className="text-xs font-normal text-gray-500 dark:text-[#A0A0A0] ml-2">
              (Principal do pacote)
            </span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">
            Esta imagem aparece como destaque nos cards e no topo da página do pacote.
          </p>

          {formData.cover_image ? (
            <div className="relative inline-block">
              <img
                src={formData.cover_image}
                alt="Imagem de capa"
                className="w-full max-w-md h-56 object-cover rounded-lg border border-gray-300 dark:border-[#444]"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  if (!file.type.startsWith('image/')) {
                    toast.error('Apenas imagens são permitidas')
                    return
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('Imagem muito grande (máx. 5MB)')
                    return
                  }

                  setIsUploading(true)
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    const dataUrl = event.target?.result as string
                    setFormData(prev => ({ ...prev, cover_image: dataUrl }))
                    setIsUploading(false)
                    toast.success('Imagem de capa adicionada!')
                  }
                  reader.readAsDataURL(file)
                  e.target.value = ''
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploading}
                className="w-full max-w-md py-12 border-2 border-dashed border-gray-300 dark:border-[#444] rounded-xl hover:border-[#D93636]/50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-10 h-10 text-gray-500 dark:text-[#A0A0A0] animate-spin" />
                ) : (
                  <Upload className="w-10 h-10 text-gray-500 dark:text-[#A0A0A0]" />
                )}
                <span className="text-sm text-gray-500 dark:text-[#A0A0A0]">
                  {isUploading ? 'Processando...' : 'Clique para selecionar a imagem de capa'}
                </span>
                <span className="text-xs text-gray-500 dark:text-[#A0A0A0]">
                  Tamanho recomendado: 1200x630px (16:9)
                </span>
              </button>
            </>
          )}
        </div>

        {/* Galeria de Imagens */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-[#D93636]" />
            Galeria de Imagens
            <span className="text-sm font-normal text-gray-500 dark:text-[#A0A0A0]">
              ({formData.gallery_images.length}/10)
            </span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#A0A0A0]">
            Adicione fotos da hospedagem, pontos turísticos, ônibus e outros destaques da viagem.
          </p>

          {/* Grid de imagens da galeria */}
          {formData.gallery_images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {formData.gallery_images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Galeria ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-[#444]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        gallery_images: prev.gallery_images.filter((_, i) => i !== index)
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
          {formData.gallery_images.length < 10 && (
            <>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = e.target.files
                  if (!files || files.length === 0) return

                  if (formData.gallery_images.length + files.length > 10) {
                    toast.error('Máximo de 10 imagens na galeria')
                    return
                  }

                  setIsUploading(true)

                  try {
                    for (const file of Array.from(files)) {
                      if (!file.type.startsWith('image/')) {
                        toast.error('Apenas imagens são permitidas')
                        continue
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('Imagem muito grande (máx. 5MB)')
                        continue
                      }

                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const dataUrl = event.target?.result as string
                        setFormData(prev => ({
                          ...prev,
                          gallery_images: [...prev.gallery_images, dataUrl]
                        }))
                      }
                      reader.readAsDataURL(file)
                    }
                    toast.success('Imagem(ns) adicionada(s)!')
                  } catch (error) {
                    console.error('Erro no upload:', error)
                    toast.error('Erro ao adicionar imagem')
                  } finally {
                    setIsUploading(false)
                    e.target.value = ''
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-[#444] rounded-xl hover:border-[#D93636]/50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-gray-500 dark:text-[#A0A0A0] animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-500 dark:text-[#A0A0A0]" />
                )}
                <span className="text-sm text-gray-500 dark:text-[#A0A0A0]">
                  {isUploading ? 'Processando...' : 'Clique para adicionar imagens à galeria'}
                </span>
                <span className="text-xs text-gray-500 dark:text-[#A0A0A0]">
                  Formatos: JPG, PNG, WebP. Máximo: 5MB por imagem. Restantes: {10 - formData.gallery_images.length}
                </span>
              </button>
            </>
          )}

          {formData.gallery_images.length >= 10 && (
            <p className="text-sm text-yellow-500">
              Limite máximo de 10 imagens na galeria atingido.
            </p>
          )}
        </div>

        {/* Hospedagem / Hotel */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] flex items-center gap-2">
            <svg className="w-5 h-5 text-[#D93636]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Hospedagem
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
              Nome do Hotel
            </label>
            <input
              type="text"
              name="hotel_name"
              value={formData.hotel_name}
              onChange={handleChange}
              placeholder="Ex: Hotel Villas DiRoma"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
            />
          </div>

          {/* Fotos do Hotel */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
              Fotos do Hotel ({formData.hotel_photos.length}/5)
            </label>
            
            {formData.hotel_photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                {formData.hotel_photos.map((imageUrl, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-50 dark:bg-[#2A2A2A]">
                    <Image src={imageUrl} alt={`Hotel ${index + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        hotel_photos: prev.hotel_photos.filter((_, i) => i !== index)
                      }))}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.hotel_photos.length < 5 && (
              <>
                <input
                  ref={hotelInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (formData.hotel_photos.length + files.length > 5) {
                      toast.error('Máximo de 5 fotos do hotel')
                      return
                    }
                    
                    setIsUploading(true)
                    
                    files.forEach(file => {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error(`Arquivo ${file.name} muito grande (máx. 5MB)`)
                        return
                      }
                      
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const dataUrl = event.target?.result as string
                        setFormData(prev => ({
                          ...prev,
                          hotel_photos: [...prev.hotel_photos, dataUrl]
                        }))
                      }
                      reader.readAsDataURL(file)
                    })
                    
                    setIsUploading(false)
                    if (hotelInputRef.current) hotelInputRef.current.value = ''
                  }}
                />
                <button
                  type="button"
                  onClick={() => hotelInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-[#444] rounded-lg hover:border-[#D93636] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-gray-500 dark:text-[#A0A0A0] animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-gray-500 dark:text-[#A0A0A0]" />
                  )}
                  <span className="text-sm text-gray-500 dark:text-[#A0A0A0]">
                    {isUploading ? 'Enviando...' : 'Adicionar fotos do hotel'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Atrações Incluídas */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0] flex items-center gap-2">
            <svg className="w-5 h-5 text-[#D93636]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Atrações Incluídas
          </h2>
          <p className="text-sm text-gray-400 dark:text-[#666]">
            Parques, passeios e atrações com acesso liberado no pacote
          </p>

          <div className="space-y-2">
            {formData.attractions.map((attraction, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={attraction}
                  onChange={(e) => handleArrayChange('attractions', index, e.target.value)}
                  placeholder="Ex: Di Roma Acqua Park"
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-[#D93636] transition"
                />
                {formData.attractions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('attractions', index)}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] text-gray-400 dark:text-[#666] hover:text-red-400 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('attractions')}
              className="flex items-center gap-2 text-sm text-[#D93636] hover:text-[#ff4a4a] transition"
            >
              <Plus className="w-4 h-4" />
              Adicionar atração
            </button>
          </div>
        </div>

        {/* Status e Destaque */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0]">Configurações</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-[#A0A0A0] mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-300 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] focus:outline-none focus:border-[#D93636] transition"
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
                className="w-5 h-5 rounded border-gray-300 dark:border-[#444] bg-gray-50 dark:bg-[#2A2A2A] text-[#D93636] focus:ring-[#D93636]"
              />
              <label htmlFor="is_featured" className="text-gray-900 dark:text-[#E0E0E0]">
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
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-[#2A2A2A] text-gray-600 dark:text-[#A0A0A0] rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-[#333] transition"
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
