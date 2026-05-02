import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/actions/storage';
import { requireAdminApi } from '@/lib/api-auth';

/**
 * POST /api/images/upload (admin-only)
 * Upload de imagem para o storage. Antes aceitava `folder` direto do
 * client (qualquer prefixo no bucket) e qualquer user logado podia
 * subir. Agora exige admin e o folder vem de uma whitelist.
 */
const ALLOWED_FOLDERS = new Set([
  'packages',
  'fleet',
  'site',
  'avatars',
  'uploads',
]);

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function sanitizeFolder(input: string | null): string {
  if (!input) return 'uploads';
  // Strip path traversal e separators; aceita só [a-z0-9-]
  const cleaned = input.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return ALLOWED_FOLDERS.has(cleaned) ? cleaned : 'uploads';
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const rawFolder = formData.get('folder');
    const folder = sanitizeFolder(typeof rawFolder === 'string' ? rawFolder : null);

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tipo
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de imagem não permitido' },
        { status: 400 }
      );
    }

    // Validar tamanho
    if (file.size > MAX_SIZE_BYTES) {
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
      allowedTypes: ALLOWED_MIME,
      maxSize: MAX_SIZE_BYTES,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao fazer upload' },
        { status: 500 }
      );
    }

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
