import { NextRequest } from 'next/server';
import { GeminiClient } from '@/infrastructure/ai/gemini-client';
import { PrismaTelemetryRepository } from '@/infrastructure/repositories/prisma-telemetry.repository';
import { GenerateTacticalRouteUseCase } from '@/application/use-cases/generate-tactical-route.use-case';

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

    const aiClient = new GeminiClient();
    const telemetryRepo = new PrismaTelemetryRepository();
    const useCase = new GenerateTacticalRouteUseCase(aiClient, telemetryRepo);

    // Ejecución de la Aduana Cognitiva
    const result = await useCase.execute({
      prompt,
      environment: {
        localTime: context?.localTime || new Date().toISOString(),
        weather: context?.weather,
        userLocation: context?.userLocation,
        constraints: context?.constraints,
      },
    });

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
