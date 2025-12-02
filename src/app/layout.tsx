import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';
import { QueryProvider } from '@/lib/query-provider';
import { Toaster } from 'sonner';
import { baseMetadata, getOrganizationSchema, getWebsiteSchema, JsonLd } from '@/lib/seo';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = baseMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Verificar se Clerk está configurado
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk = clerkKey && clerkKey.startsWith('pk_');

  if (!hasClerk) {
    // Renderizar sem Clerk se não configurado
    return (
      <html lang="pt-BR">
        <head>
          <JsonLd data={getOrganizationSchema()} />
          <JsonLd data={getWebsiteSchema()} />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster 
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        <head>
          <JsonLd data={getOrganizationSchema()} />
          <JsonLd data={getWebsiteSchema()} />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster 
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
