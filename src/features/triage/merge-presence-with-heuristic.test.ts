import { describe, it, expect } from 'vitest';
import { DefaultDensityPayload } from '@/features/planner';
import { DensityPresenceProbe } from './density-presence-probe.schema';
import { mergePresenceWithHeuristic } from './merge-presence-with-heuristic';

describe('PBI-ARCH-JEV-004: mergePresenceWithHeuristic', () => {
  it('CA-1: con sonda toda a true y heurística con group_size: 4 y time_window, conserva ambos y valida esquema', () => {
    const prior: Partial<DefaultDensityPayload> = {};
    const heuristic: DefaultDensityPayload = {
      time_window: '3 horas',
      group_size: 4,
      vibe: 'tranquilo',
      constraints: ['sin prisas'],
      districts: ['Eixample'],
      language: 'es',
    };
    const probe: DensityPresenceProbe = {
      has_time_window: true,
      has_group_size: true,
      has_vibe: true,
      has_constraints: true,
    };

    const merged = mergePresenceWithHeuristic({ prior, heuristic, probe });

    expect(merged.time_window).toBe('3 horas');
    expect(merged.group_size).toBe(4);
    expect(merged.vibe).toBe('tranquilo');
    expect(merged.constraints).toEqual(['sin prisas']);
    expect(merged.districts).toEqual(['Eixample']);
  });

  it('CA-2: con has_group_size: false y prior.group_size: 2, mantiene 2 aunque la heurística proponga 5', () => {
    const prior: Partial<DefaultDensityPayload> = {
      group_size: 2,
    };
    const heuristic: DefaultDensityPayload = {
      group_size: 5,
      constraints: [],
      districts: [],
      language: 'es',
    };
    const probe: DensityPresenceProbe = {
      has_time_window: false,
      has_group_size: false,
      has_vibe: false,
      has_constraints: false,
    };

    const merged = mergePresenceWithHeuristic({ prior, heuristic, probe });

    expect(merged.group_size).toBe(2);
  });

  it('CA-3: con has_vibe: true, heurística sin vibra y prior.vibe: cultural, mantiene cultural', () => {
    const prior: Partial<DefaultDensityPayload> = {
      vibe: 'cultural',
    };
    const heuristic: DefaultDensityPayload = {
      vibe: undefined,
      constraints: [],
      districts: [],
      language: 'es',
    };
    const probe: DensityPresenceProbe = {
      has_time_window: false,
      has_group_size: false,
      has_vibe: true,
      has_constraints: false,
    };

    const merged = mergePresenceWithHeuristic({ prior, heuristic, probe });

    expect(merged.vibe).toBe('cultural');
  });

  it('debe descartar time_window nuevo si has_time_window es false y retener prior', () => {
    const prior: Partial<DefaultDensityPayload> = {
      time_window: 'mañana 2 horas',
    };
    const heuristic: DefaultDensityPayload = {
      time_window: 'hoy 5 horas',
      constraints: [],
      districts: [],
      language: 'es',
    };
    const probe: DensityPresenceProbe = {
      has_time_window: false,
      has_group_size: false,
      has_vibe: false,
      has_constraints: false,
    };

    const merged = mergePresenceWithHeuristic({ prior, heuristic, probe });

    expect(merged.time_window).toBe('mañana 2 horas');
  });

  it('debe mantener constraints previas si has_constraints es false', () => {
    const prior: Partial<DefaultDensityPayload> = {
      constraints: ['accesible'],
    };
    const heuristic: DefaultDensityPayload = {
      constraints: ['económico'],
      districts: [],
      language: 'es',
    };
    const probe: DensityPresenceProbe = {
      has_time_window: false,
      has_group_size: false,
      has_vibe: false,
      has_constraints: false,
    };

    const merged = mergePresenceWithHeuristic({ prior, heuristic, probe });

    expect(merged.constraints).toEqual(['accesible']);
  });
});
