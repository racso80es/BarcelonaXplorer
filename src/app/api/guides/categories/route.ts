import { NextResponse } from 'next/server';
import {
  ListActiveCategoriesUseCase,
  PrismaTemplateCategoryRepository,
} from '@/features/guide-templates';

export const runtime = 'nodejs';

/**
 * GET /api/guides/categories
 * Retorna el catálogo de categorías activas para menús y triaje.
 */
export async function GET() {
  const categoryRepo = new PrismaTemplateCategoryRepository();
  const useCase = new ListActiveCategoriesUseCase(categoryRepo);

  const envelope = await useCase.execute();

  const status = envelope.success ? 200 : envelope.exitCode || 500;

  return NextResponse.json(envelope, {
    status,
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
