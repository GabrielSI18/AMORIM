'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft, Moon, Sun, Mail } from 'lucide-react'

export default function SignInPage() {
  const { signIn, setActive } = useSignIn()
  const router = useRouter()
  
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [usePhoneLogin, setUsePhoneLogin] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Estado para verificação de email (segundo fator)
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  const [emailCode, setEmailCode] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return
    
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier,
        password,
      })

      console.log('Sign-in result:', result.status)

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        window.location.href = '/dashboard'
      } else if (result.status === 'needs_second_factor') {
        // Verificar se o segundo fator é por email
        const factors = result.supportedSecondFactors || []
        const emailFactor = factors.find((f: any) => f.strategy === 'email_code') as any
        
        if (emailFactor) {
          // Preparar verificação por email
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
          })
          setVerificationEmail(emailFactor.safeIdentifier || identifier)
          setNeedsEmailVerification(true)
        } else {
          setError('Método de verificação não suportado. Contate o suporte.')
        }
      } else {
        const sessionId = result.createdSessionId
        if (sessionId) {
          await setActive({ session: sessionId })
          window.location.href = '/dashboard'
        } else {
          setError('Login incompleto. Status: ' + result.status)
        }
      }
    } catch (err: any) {
      console.error('Sign-in error:', err)
      setError(err.errors?.[0]?.message || 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return
    
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: emailCode,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        window.location.href = '/dashboard'
      } else {
        setError('Verificação incompleta. Tente novamente.')
      }
    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.errors?.[0]?.message || 'Código inválido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!signIn) return
    
    try {
      await signIn.prepareSecondFactor({
        strategy: 'email_code',
      })
      setError('')
      alert('Código reenviado!')
    } catch (err: any) {
      setError('Erro ao reenviar código')
    }
  }

  const handleGoogleSignIn = async () => {
    if (!signIn) return
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  }

  const handleAppleSignIn = async () => {
    if (!signIn) return
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_apple',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] dark:bg-[#101622]">
      {/* Header */}
      <header className="relative flex items-center justify-center p-4 border-b border-[#e0e0e0]/50 dark:border-[#324467] bg-white dark:bg-[#101622]">
        <Link
          href="/"
          className="absolute left-4 text-[#1A2E40] dark:text-white flex size-10 items-center justify-center hover:bg-[#1A2E40]/10 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <Link href="/">
          <Image
            src="/amorim-logo.png"
            alt="Amorim Turismo"
            width={100}
            height={100}
            className="object-contain"
            priority
          />
        </Link>
        <button
          onClick={toggleTheme}
          className="absolute right-4 text-[#1A2E40] dark:text-white flex size-10 items-center justify-center hover:bg-[#1A2E40]/10 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-grow flex items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          {/* Headline */}
          <div className="w-full text-center">
            <h1 className="text-[#1A2E40] dark:text-white text-3xl font-bold tracking-tight">
              {needsEmailVerification ? 'Verifique seu e-mail' : 'Bem-vindo de volta!'}
            </h1>
            <p className="text-[#4F4F4F] dark:text-[#92a4c9] text-base font-normal leading-normal pt-2">
              {needsEmailVerification 
                ? `Enviamos um código para ${verificationEmail}`
                : 'Acesse sua conta para continuar'}
            </p>
          </div>

        {/* Formulário de verificação de email */}
        {needsEmailVerification ? (
          <form onSubmit={handleVerifyEmail} className="w-full flex flex-col gap-4">
            {/* Ícone de email */}
            <div className="flex justify-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#003c71]/10 dark:bg-[#2563eb]/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-[#003c71] dark:text-[#2563eb]" />
              </div>
            </div>

            {/* Campo de código */}
            <label className="flex flex-col w-full">
              <p className="text-[#333333] dark:text-white text-sm font-medium leading-normal pb-2">
                Código de verificação
              </p>
              <input
                type="text"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full h-14 px-4 rounded-lg border border-[#e0e0e0] dark:border-[#324467] bg-white dark:bg-[#192233] text-[#333333] dark:text-white placeholder:text-[#969696] dark:placeholder:text-[#92a4c9] focus:outline-none focus:border-[#003c71] dark:focus:border-[#0A3A66] focus:ring-2 focus:ring-[#003c71]/20 dark:focus:ring-[#0A3A66]/50 transition-all text-center text-2xl tracking-[0.5em] font-mono"
                required
                autoFocus
              />
            </label>

            {/* Error Message */}
            {error && (
              <p className="text-[#dc143c] text-sm font-medium text-center">{error}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || emailCode.length < 6}
              className="w-full h-14 rounded-lg bg-[#003c71] dark:bg-[#2563eb] text-white font-bold text-base shadow-sm hover:bg-[#003c71]/90 dark:hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#003c71] dark:focus:ring-[#2563eb] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : 'Verificar'}
            </button>

            {/* Resend code */}
            <div className="w-full text-center">
              <p className="text-[#969696] dark:text-[#92a4c9] text-sm">
                Não recebeu o código?{' '}
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="font-bold text-[#003c71] dark:text-[#0A3A66] hover:underline"
                >
                  Reenviar
                </button>
              </p>
            </div>

            {/* Back button */}
            <button
              type="button"
              onClick={() => {
                setNeedsEmailVerification(false)
                setEmailCode('')
                setError('')
              }}
              className="w-full text-center text-[#969696] dark:text-[#92a4c9] text-sm hover:text-[#333333] dark:hover:text-white transition-colors"
            >
              ← Voltar ao login
            </button>
          </form>
        ) : (
          <>
        {/* Social Buttons */}
        <div className="w-full grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAppleSignIn}
            className="flex items-center justify-center gap-2 h-14 rounded-lg border border-[#e0e0e0] dark:border-[#324467] bg-white dark:bg-[#192233] hover:bg-[#f0f0f0] dark:hover:bg-[#243044] transition-colors"
          >
            <svg className="w-5 h-5 text-[#1A2E40] dark:text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-[#1A2E40] dark:text-white font-medium text-sm">Apple</span>
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2 h-14 rounded-lg border border-[#e0e0e0] dark:border-[#324467] bg-white dark:bg-[#192233] hover:bg-[#f0f0f0] dark:hover:bg-[#243044] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-[#333333] dark:text-white font-medium text-sm">Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-4">
          <div className="flex-1 h-px bg-[#e0e0e0] dark:bg-[#324467]"></div>
          <span className="text-[#969696] dark:text-[#92a4c9] text-sm">ou</span>
          <div className="flex-1 h-px bg-[#e0e0e0] dark:bg-[#324467]"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* Email/CPF or Phone Field */}
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center pb-2">
              <p className="text-[#333333] dark:text-white text-sm font-medium leading-normal">
                {usePhoneLogin ? 'Telefone' : 'E-mail'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[#969696] dark:text-[#92a4c9] text-xs">
                  {usePhoneLogin ? 'Usar e-mail' : 'Usar telefone'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={usePhoneLogin}
                  onClick={() => {
                    setUsePhoneLogin(!usePhoneLogin)
                    setIdentifier('')
                  }}
                  className={`inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border shadow-xs transition-all outline-none ${
                    usePhoneLogin
                      ? 'bg-[#003c71] border-[#003c71]'
                      : 'bg-stone-300 border-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none block size-4 rounded-full bg-white ring-0 transition-transform ${
                      usePhoneLogin ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
            <input
              type={usePhoneLogin ? 'tel' : 'text'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={usePhoneLogin ? '(00) 00000-0000' : 'Digite seu e-mail'}
              className="w-full h-14 px-4 rounded-lg border border-[#e0e0e0] dark:border-[#324467] bg-white dark:bg-[#192233] text-[#333333] dark:text-white placeholder:text-[#969696] dark:placeholder:text-[#92a4c9] focus:outline-none focus:border-[#003c71] dark:focus:border-[#0A3A66] focus:ring-2 focus:ring-[#003c71]/20 dark:focus:ring-[#0A3A66]/50 transition-all"
              required
            />
          </div>

          {/* Password Field */}
          <label className="flex flex-col w-full">
            <div className="flex justify-between items-center pb-2">
              <p className="text-[#333333] dark:text-white text-sm font-medium leading-normal">
                Senha
              </p>
              <a
                href="/forgot-password"
                className="text-[#003c71] dark:text-[#0A3A66] text-sm font-medium hover:underline"
              >
                Esqueci minha senha
              </a>
            </div>
            <div className="flex w-full items-stretch">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="flex-1 h-14 px-4 rounded-l-lg border border-r-0 border-[#e0e0e0] dark:border-[#324467] bg-white dark:bg-[#192233] text-[#333333] dark:text-white placeholder:text-[#969696] dark:placeholder:text-[#92a4c9] focus:outline-none focus:border-[#003c71] dark:focus:border-[#0A3A66] focus:ring-2 focus:ring-[#003c71]/20 dark:focus:ring-[#0A3A66]/50 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center justify-center px-4 rounded-r-lg border border-l-0 border-[#e0e0e0] dark:border-[#324467] bg-white dark:bg-[#192233] text-[#969696] dark:text-[#92a4c9] hover:text-[#333333] dark:hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </label>

          {/* Error Message */}
          {error && (
            <p className="text-[#dc143c] text-sm font-medium">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-lg bg-[#003c71] dark:bg-[#2563eb] text-white font-bold text-base shadow-sm hover:bg-[#003c71]/90 dark:hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#003c71] dark:focus:ring-[#2563eb] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Sign up link */}
        <div className="w-full text-center">
          <p className="text-[#969696] dark:text-[#92a4c9] text-sm">
            Ainda não tem conta?{' '}
            <a
              href="/sign-up"
              className="font-bold text-[#003c71] dark:text-[#0A3A66] hover:underline"
            >
              Cadastre-se
            </a>
          </p>
        </div>
          </>
        )}
        </div>
      </main>
    </div>
  )
}
