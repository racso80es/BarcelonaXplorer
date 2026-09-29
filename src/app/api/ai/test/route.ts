import { NextResponse } from 'next/server';
import { IaGatewayClient } from '@/features/ai-engine/server';
import { PrismaTelemetryRepository } from '@/features/telemetry/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const telemetryRepo = new PrismaTelemetryRepository();
    const aiClient = new IaGatewayClient(undefined, telemetryRepo);
    const text = await aiClient.generateText('Responde con una frase corta sobre Barcelona.');
    return NextResponse.json({ ok: true, text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

