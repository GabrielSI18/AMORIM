'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function SignUpPage() {
  const { signUp, setActive } = useSignUp()
  const router = useRouter()
  
  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp) return
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    
    setIsLoading(true)
    setError('')

    try {
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
        unsafeMetadata: {
          phone,
          cpf,
          birthDate,
        },
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp) return
    
    setIsLoading(true)
    setError('')

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Código inválido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (!signUp) return
    await signUp.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  }

  const handleAppleSignUp = async () => {
    if (!signUp) return
    await signUp.authenticateWithRedirect({
      strategy: 'oauth_apple',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f7f7]">
        <header className="flex items-center justify-center p-4 border-b border-[#e0e0e0] bg-white">
          <button
            onClick={() => setPendingVerification(false)}
            className="absolute left-4 text-[#333333] flex size-10 items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Image
            src="/amorim-logo.png"
            alt="Amorim Turismo"
            width={60}
            height={60}
            className="object-contain"
            priority
          />
        </header>

        <main className="flex-grow px-4 pt-8">
          <h1 className="text-[#333333] text-[32px] font-bold text-center pb-6">
            Verifique seu email
          </h1>
          <p className="text-[#888888] text-base text-center pb-6">
            Enviamos um código para {emailAddress}
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <label className="flex flex-col w-full">
              <p className="text-[#333333] text-base font-medium pb-2">
                Código de verificação
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digite o código de 6 dígitos"
                className="w-full h-14 px-4 rounded-lg border border-[#e0e0e0] bg-white text-[#333333] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#D92E2E]/50"
                required
              />
            </label>

            {error && (
              <p className="text-[#D92E2E] text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-lg bg-[#D92E2E] text-white font-bold text-base transition-all disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : 'Verificar Email'}
            </button>
          </form>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f7]">
      <header className="relative flex items-center justify-center p-4 border-b border-[#e0e0e0] bg-white">
        <button
          onClick={() => router.push('/sign-in')}
          className="absolute left-4 text-[#333333] flex size-10 items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Image
          src="/amorim-logo.png"
          alt="Amorim Turismo"
          width={100}
          height={100}
          className="object-contain"
          priority
        />
      </header>

      <main className="flex-grow px-4 pt-8">
        <h1 className="text-[#333333] text-[32px] font-bold text-center pb-6">
          Crie sua conta
        </h1>

        {/* Botões de login social */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={handleAppleSignUp}
            className="flex items-center justify-center gap-2 h-14 rounded-lg border border-[#e0e0e0] bg-white hover:bg-[#f0f0f0] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-[#333333] font-medium text-base">Apple</span>
          </button>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="flex items-center justify-center gap-2 h-14 rounded-lg border border-[#e0e0e0] bg-white hover:bg-[#f0f0f0] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-[#333333] font-medium text-base">Google</span>
          </button>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[#e0e0e0]"></div>
          <span className="text-[#888888] text-sm">ou</span>
          <div className="flex-1 h-px bg-[#e0e0e0]"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col w-full">
            <p className="text-[#333333] text-base font-medium pb-2">Nome Completo</p>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full h-14 px-4 rounded-lg border border-[#e0e0e0] bg-white text-[#333333] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#D92E2E]/50"
              required
            />
          </label>

          <label className="flex flex-col w-full">
            <p className="text-[#333333] text-base font-medium pb-2">E-mail</p>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="seuemail@dominio.com"
              className="w-full h-14 px-4 rounded-lg border border-[#e0e0e0] bg-white text-[#333333] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#D92E2E]/50"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col w-full">
              <p className="text-[#333333] text-base font-medium pb-2">CPF</p>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full h-14 px-3 rounded-lg border border-[#e0e0e0] bg-white text-[#333333] text-sm placeholder:text-[#888888] placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#D92E2E]/50"
              />
            </label>
            <label className="flex flex-col w-full">
              <p className="text-[#333333] text-base font-medium pb-2">Telefone</p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full h-14 px-3 rounded-lg border border-[#e0e0e0] bg-white text-[#333333] text-sm placeholder:text-[#888888] placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#D92E2E]/50"
              />
            </label>
          </div>

          <label className="flex flex-col w-full">
            <p className="text-[#333333] text-base font-medium pb-2">Data de Nascimento</p>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full h-14 px-4 rounded-lg border border-[#e0e0e0] bg-white text-[#333333] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#D92E2E]/50"
            />
          </label>

          <label className="flex flex-col w-full relative">
            <p className="text-[#333333] text-base font-medium pb-2">Senha</p>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha"
              className="w-full h-14 px-4 pr-12 rounded-lg border border-[#e0e0e0] bg-white text-[#333333] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#D92E2E]/50"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[52px] text-[#888888]"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </label>

          <label className="flex flex-col w-full relative">
            <p className="text-[#333333] text-base font-medium pb-2">Confirmar Senha</p>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua senha"
              className="w-full h-14 px-4 pr-12 rounded-lg border border-[#e0e0e0] bg-white text-[#333333] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#D92E2E]/50"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-[52px] text-[#888888]"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </label>

          {error && <p className="text-[#D92E2E] text-sm font-medium">{error}</p>}

          <div className="pt-4 pb-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-lg bg-[#D92E2E] text-white font-bold text-base transition-all disabled:opacity-50"
            >
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>

        <div className="text-center pb-8">
          <p className="text-sm text-[#333333]">
            Já tem uma conta?{' '}
            <a href="/sign-in" className="font-bold text-[#0A3A66]">
              Faça login
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
