import { NextRequest } from 'next/server';
import { GenerateFastRadarUseCase } from '@/application/use-cases/generate-fast-radar.use-case';
import { GroqFastAiAdapter } from '@/infrastructure/ai/groq/groq-fast-ai.adapter';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adapter = new GroqFastAiAdapter();
    const useCase = new GenerateFastRadarUseCase(adapter);

    const stream = await useCase.execute({
      intention: prompt,
      localTime: new Date().toISOString(),
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Fast API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process fast radar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
