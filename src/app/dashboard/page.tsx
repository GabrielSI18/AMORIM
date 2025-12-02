import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/ui/header'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container-custom">
          
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">
              Olá, {user.firstName || 'Usuário'}! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              Bem-vindo ao seu dashboard
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard
              title="Projetos"
              value="0"
              description="Nenhum projeto criado ainda"
              icon="📁"
            />
            <StatCard
              title="Usuários"
              value="1"
              description="Você está logado"
              icon="👤"
            />
            <StatCard
              title="Status"
              value="Ativo"
              description="Sistema funcionando"
              icon="✅"
            />
          </div>

          {/* User Info Card */}
          <div className="glass p-8 rounded-xl">
            <h2 className="text-2xl font-semibold mb-6">Suas Informações</h2>
            
            <div className="grid gap-6">
              <InfoRow label="ID do Clerk" value={user.id} />
              <InfoRow 
                label="Email" 
                value={user.emailAddresses[0]?.emailAddress || 'N/A'} 
              />
              <InfoRow 
                label="Nome" 
                value={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'} 
              />
              <InfoRow 
                label="Criado em" 
                value={new Date(user.createdAt).toLocaleDateString('pt-BR')} 
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-12 p-6 bg-primary/10 border border-primary/20 rounded-xl">
            <h3 className="text-lg font-semibold mb-2 text-primary">
              🎉 Parabéns!
            </h3>
            <p className="text-foreground/80">
              Sua autenticação está funcionando perfeitamente. O usuário foi criado no Clerk 
              e agora você pode sincronizá-lo com o banco de dados via webhook.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: string
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <div className="glass p-6 rounded-xl hover:shadow-xl transition-smooth">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-muted-foreground text-sm mb-1">{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span className="text-muted-foreground font-medium w-32">{label}:</span>
      <span className="font-mono text-sm bg-muted px-3 py-1.5 rounded">{value}</span>
    </div>
  )
}
