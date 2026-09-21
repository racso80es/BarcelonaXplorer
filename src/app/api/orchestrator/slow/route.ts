import { NextRequest } from 'next/server';
import { GeminiClient } from '@/infrastructure/ai/gemini-client';

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

    const aiClient = new GeminiClient();
    
    // We get the domain entity back
    const tacticalRoute = await aiClient.generateTacticalRoute(prompt);

    return new Response(JSON.stringify({ response: tacticalRoute }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Slow API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process slow AI resolution' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
