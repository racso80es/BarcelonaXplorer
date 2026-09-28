import { NextResponse } from 'next/server';
import {
  GetPublishedTemplateBySlugUseCase,
  PrismaGuideTemplateRepository,
} from '@/features/guide-templates/server';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{
    categorySlug: string;
    templateSlug: string;
  }>;
}

/**
 * GET /api/guides/[categorySlug]/[templateSlug]
 * Retorna el detalle jerárquico de una guía publicada.
 */
export async function GET(request: Request, context: RouteContext) {
  const { categorySlug, templateSlug } = await context.params;

  const templateRepo = new PrismaGuideTemplateRepository();
  const useCase = new GetPublishedTemplateBySlugUseCase(templateRepo);

  const envelope = await useCase.execute({
    categorySlug,
    templateSlug,
  });

  const status = envelope.success ? 200 : envelope.exitCode || 500;

  return NextResponse.json(envelope, {
    status,
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
