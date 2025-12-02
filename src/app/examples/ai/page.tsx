'use client';

/**
 * Página de Demonstração - Sistema de IA
 * 
 * Exemplos práticos de todos os 5 casos de uso:
 * 1. Chat conversacional
 * 2. Completion (prompts únicos)
 * 3. Image (geração/análise)
 * 4. Audio (transcrição/TTS)
 * 5. Vision (multi-modal)
 */

import { useState } from 'react';
import { useAIChat } from '@/hooks/use-ai/use-ai-chat';
import { useAICompletion } from '@/hooks/use-ai/use-ai-completion';
import { useAIImage } from '@/hooks/use-ai/use-ai-image';
import { useAIAudio } from '@/hooks/use-ai/use-ai-audio';
import { useAIVision } from '@/hooks/use-ai/use-ai-vision';
/* eslint-disable @next/next/no-img-element */

export default function AIExamplesPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'completion' | 'image' | 'audio' | 'vision'>('chat');

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-6">Sistema de IA - Exemplos</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {['chat', 'completion', 'image', 'audio', 'vision'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'chat' && <ChatExample />}
        {activeTab === 'completion' && <CompletionExample />}
        {activeTab === 'image' && <ImageExample />}
        {activeTab === 'audio' && <AudioExample />}
        {activeTab === 'vision' && <VisionExample />}
      </div>
    </div>
  );
}

// ============================================
// 1. CHAT CONVERSACIONAL
// ============================================

function ChatExample() {
  const [provider, setProvider] = useState<'groq' | 'openai' | 'deepinfra'>('groq');
  const chat = useAIChat({
    provider,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">💬 Chat Conversacional</h2>
          <p className="text-gray-600">
            Converse com IA mantendo histórico de mensagens
          </p>
        </div>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as typeof provider)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="groq">Groq (Gratuito)</option>
          <option value="openai">OpenAI</option>
          <option value="deepinfra">DeepInfra</option>
        </select>
      </div>

      <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
        {chat.messages.map((message) => {
          const textContent = message.parts
            .filter(part => part.type === 'text')
            .map(part => 'text' in part ? part.text : '')
            .join(' ');
            
          return (
            <div
              key={message.id}
              className={`mb-4 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white border'
                }`}
              >
                {textContent}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
        if (input.value.trim()) {
          chat.sendMessage({ role: 'user', parts: [{ type: 'text', text: input.value }] });
          input.value = '';
        }
      }} className="flex gap-2">
        <input
          name="message"
          placeholder="Digite sua mensagem..."
          disabled={chat.status === 'streaming'}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button
          type="submit"
          disabled={chat.status === 'streaming'}
          className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
        >
          {chat.status === 'streaming' ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}

// ============================================
// 2. COMPLETION (PROMPTS ÚNICOS)
// ============================================

function CompletionExample() {
  const [provider, setProvider] = useState<'groq' | 'openai' | 'deepinfra'>('groq');
  const [prompt, setPrompt] = useState('');
  const { complete, text, isLoading } = useAICompletion({
    provider,
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    await complete(prompt);
  };

  const examples = [
    'Crie um slogan para uma cafeteria moderna',
    'Resuma este conceito: Machine Learning',
    'Gere 5 ideias de posts para Instagram',
    'Traduza para inglês: Olá, como vai?',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">✨ Completion / Prompts Únicos</h2>
          <p className="text-gray-600">
            Geração de texto único sem contexto conversacional
          </p>
        </div>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as typeof provider)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="groq">Groq (Gratuito)</option>
          <option value="openai">OpenAI</option>
          <option value="deepinfra">DeepInfra</option>
        </select>
      </div>

      {/* Exemplos rápidos */}
      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setPrompt(ex)}
            className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100"
          >
            {ex}
          </button>
        ))}
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Digite seu prompt..."
          rows={3}
          disabled={isLoading}
          className="w-full px-4 py-2 border rounded-lg resize-none"
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Gerando...' : 'Gerar'}
        </button>
      </form>

      {text && (
        <div className="p-4 bg-gray-50 border rounded-lg">
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// 3. IMAGE (GERAÇÃO/ANÁLISE)
// ============================================

function ImageExample() {
  const [provider, setProvider] = useState<'groq' | 'openai' | 'deepinfra'>('openai');
  const [operation, setOperation] = useState<'generate' | 'analyze'>('generate');
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { execute, result, isLoading } = useAIImage({
    provider,
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (operation === 'generate') {
      await execute({
        operation: 'generate',
        prompt,
        size: '1024x1024',
        n: 1,
      });
    } else if (selectedFile) {
      await execute({
        operation: 'analyze',
        image: selectedFile,
        prompt: prompt || 'Descreva esta imagem em detalhes',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🎨 Image (Geração/Análise)</h2>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as typeof provider)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="groq" disabled>Groq (Sem suporte a imagem)</option>
          <option value="openai">OpenAI (DALL-E)</option>
          <option value="deepinfra">DeepInfra (Flux)</option>
        </select>
      </div>

      {/* Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setOperation('generate')}
          className={`px-4 py-2 rounded-lg ${
            operation === 'generate'
              ? 'bg-primary text-white'
              : 'border hover:bg-gray-100'
          }`}
        >
          Gerar Imagem
        </button>
        <button
          onClick={() => setOperation('analyze')}
          className={`px-4 py-2 rounded-lg ${
            operation === 'analyze'
              ? 'bg-primary text-white'
              : 'border hover:bg-gray-100'
          }`}
        >
          Analisar Imagem
        </button>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        {operation === 'analyze' && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        )}

        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            operation === 'generate'
              ? 'Descreva a imagem que deseja gerar...'
              : 'O que deseja saber sobre a imagem?'
          }
          disabled={isLoading}
          className="w-full px-4 py-2 border rounded-lg"
        />

        <button
          type="submit"
          disabled={isLoading || (operation === 'analyze' && !selectedFile)}
          className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Processando...' : operation === 'generate' ? 'Gerar' : 'Analisar'}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          {'urls' in result && result.urls.map((url: string) => (
            <img key={url} src={url} alt="Generated" className="w-full rounded-lg" />
          ))}
          {'text' in result && (
            <div className="p-4 bg-gray-50 border rounded-lg">
              <p>{result.text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 4. AUDIO (TRANSCRIÇÃO/TTS)
// ============================================

function AudioExample() {
  const [provider, setProvider] = useState<'groq' | 'openai' | 'deepinfra'>('groq');
  const [operation, setOperation] = useState<'transcribe' | 'speak'>('transcribe');
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { execute, result, isLoading } = useAIAudio({
    provider,
  });

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();

    if (operation === 'transcribe' && selectedFile) {
      await execute({
        operation: 'transcribe',
        audio: selectedFile,
        language: 'pt',
        timestamp: true,
      });
    } else if (operation === 'speak' && text.trim()) {
      await execute({
        operation: 'speak',
        text,
        voice: 'nova',
        speed: 1.0,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🎙️ Audio (Transcrição/TTS)</h2>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as typeof provider)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="groq">Groq (Whisper grátis)</option>
          <option value="openai">OpenAI</option>
          <option value="deepinfra" disabled>DeepInfra (Sem suporte)</option>
        </select>
      </div>

      {/* Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setOperation('transcribe')}
          className={`px-4 py-2 rounded-lg ${
            operation === 'transcribe'
              ? 'bg-primary text-white'
              : 'border hover:bg-gray-100'
          }`}
        >
          Transcrever Áudio (Gratuito!)
        </button>
        <button
          onClick={() => setOperation('speak')}
          className={`px-4 py-2 rounded-lg ${
            operation === 'speak'
              ? 'bg-primary text-white'
              : 'border hover:bg-gray-100'
          }`}
        >
          Text-to-Speech
        </button>
      </div>

      <form onSubmit={handleProcess} className="space-y-4">
        {operation === 'transcribe' ? (
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite o texto para converter em áudio..."
            rows={3}
            disabled={isLoading}
            className="w-full px-4 py-2 border rounded-lg resize-none"
          />
        )}

        <button
          type="submit"
          disabled={
            isLoading ||
            (operation === 'transcribe' && !selectedFile) ||
            (operation === 'speak' && !text.trim())
          }
          className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Processando...' : operation === 'transcribe' ? 'Transcrever' : 'Gerar Áudio'}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          {'text' in result && (
            <div className="p-4 bg-gray-50 border rounded-lg">
              <p className="whitespace-pre-wrap">{result.text}</p>
            </div>
          )}
          {'audioUrl' in result && (
            <audio controls src={result.audioUrl} className="w-full" />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 5. VISION (MULTI-MODAL)
// ============================================

function VisionExample() {
  const [provider, setProvider] = useState<'groq' | 'openai' | 'deepinfra'>('openai');
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const { sendMessage, response, isLoading } = useAIVision({
    provider,
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || images.length === 0) return;

    const content = [
      { type: 'text' as const, text },
      ...images.map((img) => ({ type: 'image' as const, file: img })),
    ];

    await sendMessage(content);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">👁️ Vision (Multi-modal)</h2>
          <p className="text-gray-600">
            Envie texto + múltiplas imagens simultaneamente
          </p>
        </div>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as typeof provider)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="groq" disabled>Groq (Sem suporte)</option>
          <option value="openai">OpenAI (GPT-4o)</option>
          <option value="deepinfra">DeepInfra (Llama Vision)</option>
        </select>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImages(Array.from(e.target.files || []))}
          className="w-full"
        />

        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Preview ${i}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="O que deseja saber sobre estas imagens?"
          rows={3}
          disabled={isLoading}
          className="w-full px-4 py-2 border rounded-lg resize-none"
        />

        <button
          type="submit"
          disabled={isLoading || !text.trim() || images.length === 0}
          className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Analisando...' : 'Analisar'}
        </button>
      </form>

      {response && (
        <div className="p-4 bg-gray-50 border rounded-lg">
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
}
