'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Bus, Upload, X, Loader2, Plus, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell, AdminGuard } from '@/components/dashboard';

export default function NovoBusPage() {
  return (
    <AdminGuard>
      <NovoBusContent />
    </AdminGuard>
  );
}

function NovoBusContent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  
  // Form state
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [plate, setPlate] = useState('');
  const [seats, setSeats] = useState('44');
  const [floors, setFloors] = useState('1');
  const [photos, setPhotos] = useState<string[]>([]);

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

    // Validar se é uma URL válida
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
        // Validar tipo
        if (!file.type.startsWith('image/')) {
          toast.error('Apenas imagens são permitidas');
          continue;
        }

        // Validar tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Imagem muito grande (máx. 5MB)');
          continue;
        }

        // Converter para base64 e salvar como data URL (alternativa temporária)
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
      // Limpar input
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

    // Validações
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
      const response = await fetch('/api/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          year: parseInt(year),
          plate: plate.replace(/[^A-Z0-9]/g, ''),
          seats: parseInt(seats),
          floors: parseInt(floors),
          photos,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar ônibus');
      }

      toast.success('Ônibus cadastrado com sucesso!');
      router.push('/dashboard/frota');
    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      toast.error(error.message || 'Erro ao cadastrar ônibus');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell title="Novo Ônibus">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/frota"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-muted-foreground">Cadastre um novo veículo na frota</p>
          </div>
        </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fotos */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Fotos do Veículo</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione até 5 fotos do ônibus (interior e exterior)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Fotos existentes */}
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
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
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Botão de adicionar arquivo */}
            {photos.length < 5 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Arquivo</span>
                  </>
                )}
              </label>
            )}

            {/* Botão de adicionar por URL */}
            {photos.length < 5 && !showUrlInput && (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center transition-colors"
              >
                <LinkIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">URL</span>
              </button>
            )}
          </div>

          {/* Input de URL */}
          {showUrlInput && (
            <div className="mt-4 flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Cole a URL da imagem aqui..."
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => { setShowUrlInput(false); setPhotoUrl(''); }}
                className="px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Dados do Veículo */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Dados do Veículo</h2>

          {/* Modelo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Modelo *
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ex: Marcopolo Paradiso 1800 DD"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          {/* Ano e Placa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Ano *
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="1990"
                max={new Date().getFullYear() + 1}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Placa *
              </label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(formatPlate(e.target.value))}
                placeholder="ABC-1234"
                maxLength={8}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono uppercase"
                required
              />
            </div>
          </div>

          {/* Assentos e Andares */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Quantidade de Assentos *
              </label>
              <input
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Quantidade de Andares
              </label>
              <select
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="1">1 andar</option>
                <option value="2">2 andares (Double Decker)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/frota"
            className="flex-1 py-3 text-center border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Bus className="w-5 h-5" />
                Cadastrar Ônibus
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </DashboardShell>
  );
}
