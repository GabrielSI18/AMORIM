import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Criar sua conta</h1>
          <p className="text-muted-foreground">
            Comece grátis agora mesmo
          </p>
        </div>
        
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'glass shadow-2xl',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: 'transition-smooth hover:scale-105',
              formButtonPrimary: 
                'bg-primary hover:bg-primary/90 transition-smooth',
              footerActionLink: 'text-primary hover:text-primary/80',
            },
          }}
        />
      </div>
    </div>
  )
}
