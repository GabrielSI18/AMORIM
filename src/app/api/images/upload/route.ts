import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadFile } from '@/actions/storage';

/**
 * POST /api/images/upload
 * Upload de imagem para o storage
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Apenas imagens são permitidas' },
        { status: 400 }
      );
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Imagem muito grande (máx. 5MB)' },
        { status: 400 }
      );
    }

    // Criar novo FormData para a action
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const result = await uploadFile(uploadFormData, {
      folder,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxSize: 5 * 1024 * 1024,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao fazer upload' },
        { status: 500 }
      );
    }

    // Retornar informações do arquivo (inclui URL pública se disponível)
    return NextResponse.json({
      url: result.file?.publicUrl ?? undefined,
      path: result.file?.path,
      name: result.file?.name,
      size: result.file?.size,
    });
  } catch (error) {
    console.error('[API] POST /api/images/upload error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
