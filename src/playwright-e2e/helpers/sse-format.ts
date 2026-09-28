/**
 * Codificación SSE alineada con src/features/planner/stream-consumer.ts
 */

export type StreamEventPayload = {
  type: string;
  data: Record<string, unknown>;
};

export function formatSseBlock(event: StreamEventPayload): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function buildOrchestratorStreamBody(
  route: {
    id: string;
    summary: string;
    thermalState?: 'operational' | 'saturated';
    waypoints: Array<Record<string, unknown>>;
  },
): string {
  const timestamp = new Date().toISOString();
  const blocks: string[] = [];

  blocks.push(
    formatSseBlock({
      type: 'meta_init',
      data: {
        id: route.id,
        summary: route.summary,
        totalEstimatedWaypoints: route.waypoints.length,
        timestamp,
      },
    }),
  );

  for (const waypoint of route.waypoints) {
    blocks.push(
      formatSseBlock({
        type: 'stop_emitted',
        data: waypoint,
      }),
    );
  }

  blocks.push(
    formatSseBlock({
      type: 'stream_complete',
      data: route,
    }),
  );

  return blocks.join('');
}
