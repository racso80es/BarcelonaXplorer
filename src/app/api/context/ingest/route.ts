import { NextRequest, NextResponse } from 'next/server';
import { constantTimeEqual } from '@/features/auth';
import { PrismaTelemetryRepository } from '@/features/telemetry/server';
import { LanceDbVectorAdapter } from '@/features/cognitive-memory/server';
import { GeminiEmbeddingAdapter } from '@/features/ai-engine/gemini-embedding.adapter';
import { PrismaContextSourceRepository } from '@/features/context-sources/prisma-context-source.repository';
import { IngestContextUseCase } from '@/features/context-sources/ingest-context.use-case';
import { ContextAdapterRegistry } from '@/features/context-sources/context-source-adapter.port';

import { SocrataContextAdapter } from '@/features/context-sources/adapters/socrata-context.adapter';
import { SparqlContextAdapter } from '@/features/context-sources/adapters/sparql-context.adapter';
import { RssContextAdapter } from '@/features/context-sources/adapters/rss-context.adapter';
import { IcalContextAdapter } from '@/features/context-sources/adapters/ical-context.adapter';
import { ApiRestContextAdapter } from '@/features/context-sources/adapters/api-rest-context.adapter';
import { JsonLdContextAdapter } from '@/features/context-sources/adapters/json-ld.adapter';

export const runtime = 'nodejs';

export const defaultContextAdapters: ContextAdapterRegistry = {
  SOCRATA: new SocrataContextAdapter(),
  SPARQL: new SparqlContextAdapter(),
  RSS: new RssContextAdapter(),
  ICAL: new IcalContextAdapter(),
  API_REST: new ApiRestContextAdapter(),
  JSON_LD: new JsonLdContextAdapter(),
};

export function createIngestUseCase(
  adapters: ContextAdapterRegistry = defaultContextAdapters
): IngestContextUseCase {
  const sourceRepo = new PrismaContextSourceRepository();
  const vectorStore = new LanceDbVectorAdapter();
  const embeddingPort = new GeminiEmbeddingAdapter();
  const telemetryRepo = new PrismaTelemetryRepository();
  return new IngestContextUseCase(sourceRepo, adapters, vectorStore, embeddingPort, telemetryRepo);
}

let activeUseCase: IngestContextUseCase | null = null;

export function getIngestUseCase(): IngestContextUseCase {
  if (!activeUseCase) {
    activeUseCase = createIngestUseCase();
  }
  return activeUseCase;
}

export function setIngestUseCaseForTesting(useCase: IngestContextUseCase | null): void {
  activeUseCase = useCase;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret) {
    const authHeader = request.headers.get('authorization');
    const cronSecretHeader = request.headers.get('x-cron-secret');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const providedSecret = bearerToken || cronSecretHeader;

    if (!providedSecret || !(await constantTimeEqual(providedSecret, expectedSecret))) {
      return NextResponse.json(
        { error: 'No autorizado: Token de mantenimiento inválido o ausente.' },
        { status: 401 },
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seguridad Fail-Closed: CRON_SECRET no está configurada en producción.' },
      { status: 401 },
    );
  }

  const useCase = getIngestUseCase();
  const envelope = await useCase.execute();

  const httpStatus = envelope.success
    ? 200
    : envelope.exitCode >= 400 && envelope.exitCode <= 599
      ? envelope.exitCode
      : 500;

  return NextResponse.json(envelope, {
    status: httpStatus,
  });
}
