'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, X, Loader2, Plus, Upload, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell, AdminGuard } from '@/components/dashboard';

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

interface EditBusPageProps {
  params: Promise<{ busId: string }>;
}

export default function EditBusPage({ params }: EditBusPageProps) {
  return (
    <AdminGuard>
      <EditBusContent params={params} />
    </AdminGuard>
  );
}

function EditBusContent({ params }: EditBusPageProps) {
  const router = useRouter();
  const [busId, setBusId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  
  // Form state
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [seats, setSeats] = useState('');
  const [floors, setFloors] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    params.then(p => setBusId(p.busId));
  }, [params]);

  useEffect(() => {
    if (busId) {
      loadBus();
    }
  }, [busId]);

  const loadBus = async () => {
    try {
      const response = await fetch(`/api/fleet/${busId}`);
      if (!response.ok) throw new Error('Ônibus não encontrado');
      const data = await response.json();
      const bus: BusData = data.data;
      
      setModel(bus.model);
      setYear(bus.year.toString());
      setPlate(formatPlate(bus.plate));
      setSeats(bus.seats.toString());
      setFloors(bus.floors.toString());
      setPhotos(bus.photos || []);
      setIsActive(bus.isActive);
    } catch (error) {
      console.error('Erro ao carregar ônibus:', error);
      toast.error('Ônibus não encontrado');
      router.push('/dashboard/frota');
    } finally {
      setIsLoading(false);
    }
  };

  // Formatar placa
  const formatPlate = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
  };

  // Adicionar foto por URL
  const handleAddPhotoUrl = () => {
    if (!photoUrl.trim()) {
      toast.error('Informe a URL da imagem');
      return;
    }

    try {
      new URL(photoUrl);
    } catch {
      toast.error('URL inválida');
      return;
    }

    if (photos.length >= 5) {
      toast.error('Máximo de 5 fotos permitidas');
      return;
    }

    setPhotos(prev => [...prev, photoUrl.trim()]);
    setPhotoUrl('');
    setShowUrlInput(false);
    toast.success('Foto adicionada!');
  };

  // Upload de foto
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 5) {
      toast.error('Máximo de 5 fotos permitidas');
      return;
    }

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error('Apenas imagens são permitidas');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error('Imagem muito grande (máx. 5MB)');
          continue;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setPhotos(prev => [...prev, dataUrl]);
        };
        reader.readAsDataURL(file);
      }
      
      toast.success('Foto(s) adicionada(s) com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao adicionar foto');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Remover foto
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!model.trim()) {
      toast.error('Informe o modelo do ônibus');
      return;
    }
    if (!year || parseInt(year) < 1990 || parseInt(year) > new Date().getFullYear() + 1) {
      toast.error('Informe um ano válido');
      return;
    }
    if (!plate.trim() || plate.replace(/[^A-Z0-9]/g, '').length < 7) {
      toast.error('Informe uma placa válida');
      return;
    }
    if (!seats || parseInt(seats) < 1) {
      toast.error('Informe a quantidade de assentos');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/fleet/${busId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          year: parseInt(year),
          plate: plate.replace(/[^A-Z0-9]/g, ''),
          seats: parseInt(seats),
          floors: parseInt(floors),
          photos,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar ônibus');
      }

      toast.success('Ônibus atualizado com sucesso!');
      router.push('/dashboard/frota');
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      toast.error(error.message || 'Erro ao atualizar ônibus');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell title="Carregando...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Editar Ônibus">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/frota"
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Ônibus</h1>
            <p className="text-gray-500 dark:text-[#A0A0A0]">Atualize as informações do veículo</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fotos */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333] p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Fotos do Veículo</h2>
            <p className="text-sm text-gray-500 dark:text-[#A0A0A0] mb-4">
              Adicione até 5 fotos do ônibus (interior e exterior)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-[#333]">
                  <Image
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-[#444] hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-[#A0A0A0]" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
                      <span className="text-xs text-gray-500 dark:text-[#A0A0A0] mt-1">Arquivo</span>
                    </>
                  )}
                </label>
              )}

              {photos.length < 5 && !showUrlInput && (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-[#444] hover:border-primary/50 flex flex-col items-center justify-center transition-colors"
                >
                  <LinkIcon className="w-5 h-5 text-gray-500 dark:text-[#A0A0A0]" />
                  <span className="text-xs text-gray-500 dark:text-[#A0A0A0] mt-1">URL</span>
                </button>
              )}
            </div>

            {showUrlInput && (
              <div className="mt-4 flex gap-2">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Cole a URL da imagem aqui..."
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => { setShowUrlInput(false); setPhotoUrl(''); }}
                  className="px-3 py-2 text-gray-500 dark:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Dados do Veículo */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333] p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Dados do Veículo</h2>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Modelo *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: Marcopolo Paradiso 1800 DD"
                className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Ano *
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Placa *
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(formatPlate(e.target.value))}
                  placeholder="ABC-1234"
                  maxLength={8}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono uppercase"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Quantidade de Assentos *
                </label>
                <input
                  type="number"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Quantidade de Andares
                </label>
                <select
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="1">1 andar</option>
                  <option value="2">2 andares (Double Decker)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333] p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Status</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-gray-200 dark:border-[#333] text-primary focus:ring-primary"
              />
              <span className="text-gray-900 dark:text-white">Ônibus ativo</span>
            </label>
            <p className="text-sm text-gray-500 dark:text-[#A0A0A0] mt-2">
              Ônibus inativos não aparecem na seleção de pacotes
            </p>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Alterações
            </button>
            <Link
              href="/dashboard/frota"
              className="px-6 py-3 border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-center text-gray-700 dark:text-gray-300"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
