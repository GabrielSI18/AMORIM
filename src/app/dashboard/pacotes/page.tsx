'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import type { Package, Category, Destination } from '@/types';

export default function DashboardPackagesPage() {
  const { userId } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pkgRes, catRes, destRes] = await Promise.all([
        fetch('/api/packages?status=all'),
        fetch('/api/categories'),
        fetch('/api/destinations'),
      ]);

      const [pkgData, catData, destData] = await Promise.all([
        pkgRes.json(),
        catRes.json(),
        destRes.json(),
      ]);

      setPackages(pkgData.data || []);
      setCategories(catData.data || []);
      setDestinations(destData.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este pacote?')) return;

    try {
      const res = await fetch(`/api/packages?id=${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        toast.success('Pacote removido com sucesso');
        loadData();
      } else {
        toast.error('Erro ao remover pacote');
      }
    } catch (error) {
      console.error('Erro ao remover:', error);
      toast.error('Erro ao remover pacote');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      sold_out: 'bg-red-100 text-red-800',
      canceled: 'bg-yellow-100 text-yellow-800',
    };

    const labels: Record<string, string> = {
      draft: 'Rascunho',
      published: 'Publicado',
      sold_out: 'Esgotado',
      canceled: 'Cancelado',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Gestão de Pacotes</h1>
            <p className="text-muted-foreground mt-2">
              Cadastre e gerencie os pacotes de viagem
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPackage(null);
              setShowForm(true);
            }}
            className="bg-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-smooth flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Novo Pacote
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-2">Total de Pacotes</p>
            <p className="text-3xl font-bold">{packages.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-2">Publicados</p>
            <p className="text-3xl font-bold text-green-600">
              {packages.filter(p => p.status === 'published').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-2">Rascunhos</p>
            <p className="text-3xl font-bold text-gray-600">
              {packages.filter(p => p.status === 'draft').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-2">Vagas Totais</p>
            <p className="text-3xl font-bold text-primary">
              {packages.reduce((acc, p) => acc + p.availableSeats, 0)}
            </p>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Pacote</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Destino</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Categoria</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Preço</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Vagas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      Carregando...
                    </td>
                  </tr>
                ) : packages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhum pacote cadastrado. Clique em "Novo Pacote" para começar.
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-muted/50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{pkg.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {pkg.durationDays} {pkg.durationDays === 1 ? 'dia' : 'dias'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {pkg.destination?.city}, {pkg.destination?.state}
                      </td>
                      <td className="px-6 py-4">
                        {pkg.category?.name}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">R$ {(pkg.price / 100).toFixed(2)}</p>
                        {pkg.originalPrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            R$ {(pkg.originalPrice / 100).toFixed(2)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {pkg.availableSeats}/{pkg.totalSeats}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(pkg.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => window.open(`/pacotes/${pkg.slug}`, '_blank')}
                            className="p-2 hover:bg-muted rounded-lg transition"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPackage(pkg);
                              setShowForm(true);
                            }}
                            className="p-2 hover:bg-muted rounded-lg transition"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition"
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de formulário (placeholder - implementar depois) */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingPackage ? 'Editar Pacote' : 'Novo Pacote'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <p className="text-muted-foreground">
                Formulário de criação/edição será implementado aqui.
              </p>
              {/* TODO: Implementar formulário completo */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
