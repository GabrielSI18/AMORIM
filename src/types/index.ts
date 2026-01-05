// Global types and interfaces

export interface User {
  id: string
  clerkId: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

// ==========================================
// TURISMO - Types
// ==========================================

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Destination {
  id: string
  name: string
  slug: string
  city: string
  state: string
  country: string
  description?: string
  imageUrl?: string
  latitude?: number
  longitude?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Package {
  id: string
  title: string
  slug: string
  description: string
  shortDescription?: string
  categoryId: string
  category?: Category
  destinationId: string
  destination?: Destination
  destinationText?: string | null // Campo texto livre para destino
  
  // Detalhes
  price: number // em centavos
  originalPrice?: number
  priceChild610?: number | null // Preço criança 6-10 anos (centavos)
  priceChild1113?: number | null // Preço criança 11-13 anos (centavos)
  durationDays: number
  departureLocation: string
  departureTime?: string
  returnTime?: string | null // Horário de retorno
  departureDate?: Date
  returnDate?: Date
  
  // Hospedagem
  hotelName?: string | null
  hotelPhotos?: string[]
  
  // Atrações
  attractions?: string[]
  
  // Parcelamento
  maxInstallments?: number
  
  // Disponibilidade
  availableSeats: number
  totalSeats: number
  minParticipants: number
  
  // Features
  includes: string[]
  notIncludes: string[]
  itinerary?: Record<string, unknown>
  
  // Imagens
  coverImage: string
  galleryImages: string[]
  
  // Status
  status: 'draft' | 'published' | 'sold_out' | 'canceled'
  isFeatured: boolean
  isActive: boolean
  
  // Metadata
  viewsCount: number
  bookingsCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Booking {
  id: string
  packageId: string
  package?: Package
  userId?: string
  
  // Cliente
  customerName: string
  customerEmail: string
  customerPhone: string
  customerCpf?: string
  
  // Reserva
  numPassengers: number
  totalAmount: number // em centavos
  
  // Status
  status: 'pending' | 'confirmed' | 'paid' | 'canceled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  paymentMethod?: 'pix' | 'credit_card' | 'bank_slip'
  
  // Pagamento
  stripePaymentId?: string
  paidAt?: Date
  
  // Notas
  notes?: string
  customerNotes?: string
  
  createdAt: Date
  updatedAt: Date
}

// DTOs para APIs
export interface CreatePackageDto {
  title: string
  description: string
  shortDescription?: string
  categoryId: string
  destinationId: string
  price: number
  originalPrice?: number
  durationDays: number
  departureLocation: string
  departureTime?: string
  departureDate?: string
  returnDate?: string
  availableSeats: number
  totalSeats: number
  minParticipants?: number
  includes: string[]
  notIncludes?: string[]
  itinerary?: Record<string, unknown>
  coverImage: string
  galleryImages?: string[]
  isFeatured?: boolean
}

export interface CreateBookingDto {
  packageId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerCpf?: string
  numPassengers: number
  customerNotes?: string
  affiliateCode?: string // Código de afiliado (opcional)
}

export interface PackageFilters {
  category?: string
  destination?: string
  minPrice?: number
  maxPrice?: number
  minDuration?: number
  maxDuration?: number
  status?: string
  isFeatured?: boolean
  search?: string
}

