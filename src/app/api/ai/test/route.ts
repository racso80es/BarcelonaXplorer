import { NextResponse } from 'next/server';
import { GeminiClient } from '@/infrastructure/ai/gemini-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const aiClient = new GeminiClient();
    const text = await aiClient.generateText('Responde con una frase corta sobre Barcelona.');
    return NextResponse.json({ ok: true, text });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
