export interface WaypointWithTimeSpan {
  id: string;
  timeSpan?: {
    start: string;
    end?: string;
  };
  [key: string]: unknown;
}

export class ChronologicalPropagator {
  private static readonly DEFAULT_DURATION_MINUTES = 60;
  private static readonly MINIMUM_TRANSITION_GAP_MINUTES = 15;
  private static readonly MAX_DAY_MINUTES = 23 * 60 + 59; // 23:59

  /**
   * Convierte cadena HH:MM a minutos totales del día.
   */
  public static timeToMinutes(timeStr: string): number {
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Formato de hora inválido: '${timeStr}'. Se esperaba HH:MM.`);
    }
    return hours * 60 + minutes;
  }

  /**
   * Convierte minutos totales del día a formato canónico HH:MM.
   */
  public static minutesToTime(totalMinutes: number): string {
    const clamped = Math.max(0, Math.min(this.MAX_DAY_MINUTES, Math.round(totalMinutes)));
    const hours = Math.floor(clamped / 60);
    const minutes = clamped % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Propaga determinísticamente el desplazamiento temporal de un nodo hacia todos los nodos posteriores.
   *
   * @param waypoints Lista ordenada cronológicamente de waypoints.
   * @param targetId Identificador del nodo editado.
   * @param newStartTime Nueva hora de inicio en formato HH:MM.
   * @param newEndTime Nueva hora de finalización en formato HH:MM (opcional).
   * @returns Nueva lista inmutable con los tiempos recalculados.
   */
  public static propagate<T extends WaypointWithTimeSpan>(
    waypoints: readonly T[],
    targetId: string,
    newStartTime: string,
    newEndTime?: string,
  ): T[] {
    const targetIndex = waypoints.findIndex((wp) => wp.id === targetId);
    if (targetIndex === -1) {
      throw new Error(`Waypoint con id '${targetId}' no encontrado en el itinerario.`);
    }

    const targetNewStartMins = this.timeToMinutes(newStartTime);
    let targetNewEndMins: number;

    if (newEndTime) {
      targetNewEndMins = this.timeToMinutes(newEndTime);
      if (targetNewEndMins <= targetNewStartMins) {
        throw new Error(
          `Hora de fin (${newEndTime}) no puede ser anterior o igual a hora de inicio (${newStartTime}).`,
        );
      }
    } else {
      // Si no se provee fin, preservar duración original o usar default 60m
      const oldWp = waypoints[targetIndex];
      const oldDuration =
        oldWp.timeSpan && oldWp.timeSpan.end
          ? this.timeToMinutes(oldWp.timeSpan.end) - this.timeToMinutes(oldWp.timeSpan.start)
          : this.DEFAULT_DURATION_MINUTES;
      targetNewEndMins = targetNewStartMins + Math.max(15, oldDuration);
    }

    const updatedWaypoints = waypoints.map((wp) => ({ ...wp }));

    // 1. Actualizar el nodo target
    updatedWaypoints[targetIndex] = {
      ...updatedWaypoints[targetIndex],
      timeSpan: {
        start: this.minutesToTime(targetNewStartMins),
        end: this.minutesToTime(targetNewEndMins),
      },
    };

    // 2. Propagar hacia los nodos posteriores (targetIndex + 1 .. fin)
    for (let i = targetIndex + 1; i < updatedWaypoints.length; i++) {
      const prevWp = updatedWaypoints[i - 1];
      const currentWp = updatedWaypoints[i];

      const prevEndMins = this.timeToMinutes(prevWp.timeSpan!.end ?? prevWp.timeSpan!.start);

      // Duración del nodo actual
      let currentDuration = this.DEFAULT_DURATION_MINUTES;
      if (currentWp.timeSpan) {
        const oldStart = this.timeToMinutes(currentWp.timeSpan.start);
        const oldEnd = currentWp.timeSpan.end
          ? this.timeToMinutes(currentWp.timeSpan.end)
          : oldStart + this.DEFAULT_DURATION_MINUTES;
        currentDuration = Math.max(15, oldEnd - oldStart);
      }

      // Intervalo de transición (Gap) entre el nodo anterior original y este
      let gap = this.MINIMUM_TRANSITION_GAP_MINUTES;
      const originalPrev = waypoints[i - 1];
      const originalCurr = waypoints[i];
      if (originalPrev?.timeSpan?.end && originalCurr?.timeSpan?.start) {
        const origGap =
          this.timeToMinutes(originalCurr.timeSpan.start) -
          this.timeToMinutes(originalPrev.timeSpan.end);
        if (origGap > 0) {
          gap = origGap;
        }
      }

      // El nuevo inicio debe respetar al menos el fin del anterior + gap de transición
      const calculatedStartMins = prevEndMins + gap;
      const calculatedEndMins = calculatedStartMins + currentDuration;

      updatedWaypoints[i] = {
        ...currentWp,
        timeSpan: {
          start: this.minutesToTime(calculatedStartMins),
          end: this.minutesToTime(calculatedEndMins),
        },
      };
    }

    return updatedWaypoints;
  }
}
