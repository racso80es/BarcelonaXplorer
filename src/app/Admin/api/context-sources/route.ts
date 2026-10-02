import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ContextAdminService } from '@/features/context-sources/context-admin.service';
import { StateMachineEventSchema } from '@/features/context-sources/context-source.types';

export const runtime = 'nodejs';

const TransitionRequestSchema = z.object({
  sourceId: z.string().min(1),
  event: StateMachineEventSchema,
  endpoint: z.string().url().optional(),
});

let serviceInstance: ContextAdminService | null = null;

export function getAdminService(): ContextAdminService {
  if (!serviceInstance) {
    serviceInstance = new ContextAdminService();
  }
  return serviceInstance;
}

export function setAdminServiceForTesting(service: ContextAdminService | null): void {
  serviceInstance = service;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const parseRes = TransitionRequestSchema.safeParse(rawBody);

    if (!parseRes.success) {
      return NextResponse.json(
        {
          success: false,
          exitCode: 400,
          errors: parseRes.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
          feedback: 'Payload de transición inválido',
        },
        { status: 400 }
      );
    }

    const { sourceId, event, endpoint } = parseRes.data;
    const service = getAdminService();
    const envelope = await service.transitionSource(sourceId, event, 'HUMAN', { endpoint });

    const httpStatus = envelope.success
      ? 200
      : envelope.exitCode >= 400 && envelope.exitCode <= 599
        ? envelope.exitCode
        : 500;

    return NextResponse.json(envelope, { status: httpStatus });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        exitCode: 500,
        errors: [err instanceof Error ? err.message : String(err)],
        feedback: 'Error inesperado procesando la transición',
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  const service = getAdminService();
  const sources = await service.listSources();
  return NextResponse.json({ success: true, exitCode: 0, result: sources });
}
