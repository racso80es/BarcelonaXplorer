import { NextResponse } from 'next/server';
import { GeminiClient } from '@/infrastructure/ai/gemini-client';
import { PrismaTelemetryRepository } from '@/infrastructure/repositories/prisma-telemetry.repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const telemetryRepo = new PrismaTelemetryRepository();
    const aiClient = new GeminiClient(telemetryRepo);
    const text = await aiClient.generateText('Responde con una frase corta sobre Barcelona.');
    return NextResponse.json({ ok: true, text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

