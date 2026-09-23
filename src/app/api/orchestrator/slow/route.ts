import { NextRequest } from 'next/server';
import { GeminiClient } from '@/infrastructure/ai/gemini-client';
import { PrismaTelemetryRepository } from '@/infrastructure/repositories/prisma-telemetry.repository';
import { GenerateTacticalRouteUseCase } from '@/application/use-cases/generate-tactical-route.use-case';
import { ValidateGeographicScopeUseCase } from '@/application/use-cases/validate-geographic-scope.use-case';
import { HeuristicGeographicDecisionEngine } from '@/infrastructure/ai/rules/heuristic-geographic-decision-engine';
import { GroqGeographicBounceGenerator } from '@/infrastructure/ai/groq/groq-geographic-bounce-generator';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    const context = body?.context;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const telemetryRepo = new PrismaTelemetryRepository();

    // 1. Aduana Universal: Triaje y Anclaje Geográfico (HU-PERIM-GEO-001)
    const decisionEngine = new HeuristicGeographicDecisionEngine();
    const bounceGenerator = new GroqGeographicBounceGenerator();
    const geoUseCase = new ValidateGeographicScopeUseCase(
      decisionEngine,
      bounceGenerator,
      telemetryRepo,
    );

    const geoOutcome = await geoUseCase.execute({ prompt });

    // Bloqueo Out-of-Scope (Filtro de Eficiencia: no invocar a Gemini ni a LanceDB)
    if (geoOutcome.status === 'REJECTED_OUT_OF_SCOPE') {
      return new Response(
        JSON.stringify({
          status: 'REJECTED_OUT_OF_SCOPE',
          error: geoOutcome.bounceMessage,
          response: geoOutcome.bounceMessage,
          rejectedEntity: geoOutcome.rejectedEntity,
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // 2. Orquestador Pesado: Se inyecta el prompt enriquecido (Inyección Silenciosa / Fricción Cero)
    const aiClient = new GeminiClient();
    const routeUseCase = new GenerateTacticalRouteUseCase(aiClient, telemetryRepo);

    const result = await routeUseCase.execute({
      prompt: geoOutcome.enrichedPrompt,
      environment: {
        localTime: context?.localTime || new Date().toISOString(),
        weather: context?.weather,
        userLocation: context?.userLocation,
        constraints: context?.constraints,
      },
    });

    if (result === 'No se pudo forjar la ruta.') {
      return new Response(
        JSON.stringify({ response: result, error: 'No se pudo forjar la ruta.' }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ response: result }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: unknown) {
    console.error('Slow API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process slow AI resolution' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
