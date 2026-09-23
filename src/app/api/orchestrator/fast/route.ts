import { NextRequest } from 'next/server';
import { GenerateFastRadarUseCase } from '@/application/use-cases/generate-fast-radar.use-case';
import { GroqFastAiAdapter } from '@/infrastructure/ai/groq/groq-fast-ai.adapter';
import { ValidateGeographicScopeUseCase } from '@/application/use-cases/validate-geographic-scope.use-case';
import { HeuristicGeographicDecisionEngine } from '@/infrastructure/ai/rules/heuristic-geographic-decision-engine';
import { GroqGeographicBounceGenerator } from '@/infrastructure/ai/groq/groq-geographic-bounce-generator';
import { PrismaTelemetryRepository } from '@/infrastructure/repositories/prisma-telemetry.repository';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const telemetryRepo = new PrismaTelemetryRepository();

    // 1. Aduana Universal: Triaje Geográfico Perimetral (HU-PERIM-GEO-001)
    const decisionEngine = new HeuristicGeographicDecisionEngine();
    const bounceGenerator = new GroqGeographicBounceGenerator(undefined, telemetryRepo);
    const geoUseCase = new ValidateGeographicScopeUseCase(
      decisionEngine,
      bounceGenerator,
      telemetryRepo,
    );

    const geoOutcome = await geoUseCase.execute({ prompt });

    if (geoOutcome.status === 'REJECTED_OUT_OF_SCOPE') {
      return new Response(
        JSON.stringify({
          status: 'REJECTED_OUT_OF_SCOPE',
          error: geoOutcome.bounceMessage,
          rejectedEntity: geoOutcome.rejectedEntity,
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // 2. Inferencia Rápida: Contexto Enriquecido con Barcelona
    const adapter = new GroqFastAiAdapter(undefined, telemetryRepo);
    const useCase = new GenerateFastRadarUseCase(adapter);

    const stream = await useCase.execute({
      intention: geoOutcome.enrichedPrompt,
      localTime: new Date().toISOString(),
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.error('Fast API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process fast radar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
