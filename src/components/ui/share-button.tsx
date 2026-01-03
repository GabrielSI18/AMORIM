'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Facebook, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  title: string;
  description?: string;
  className?: string;
}

export function ShareButton({ title, description, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title,
      text: description || title,
      url,
    };

    // Tenta usar a API nativa de compartilhamento (mobile)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Usuário cancelou ou erro - continua para fallback
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: abre menu de opções
    setIsOpen(!isOpen);
  };

  const copyToClipboard = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  const shareWhatsApp = () => {
    const url = window.location.href;
    const text = encodeURIComponent(`${title}\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setIsOpen(false);
  };

  const shareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className={className || "inline-flex items-center justify-center gap-2 rounded-xl h-11 w-11 text-white hover:bg-white/20 transition-all"}
        aria-label="Compartilhar"
      >
        <Share2 className="h-5 w-5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="text-sm">{copied ? 'Copiado!' : 'Copiar link'}</span>
            </button>
            
            <button
              onClick={shareWhatsApp}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              <MessageCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">WhatsApp</span>
            </button>
            
            <button
              onClick={shareFacebook}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Facebook</span>
            </button>
            
            <button
              onClick={shareTwitter}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-sm">X (Twitter)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
