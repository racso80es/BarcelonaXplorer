import {
  createErrorEnvelope,
  createSuccessEnvelope,
  OperationEnvelope,
} from '@/shared/operation-envelope';
import { TelemetryRepositoryPort, TelemetryEntry } from '@/features/telemetry';
import { IaGatewayClient, UnsupportedCapabilityError } from '@/features/ai-engine/ia-gateway/ia-gateway.client';
import { IContextSourceRepository } from './context-source.repository.port';
import { ContextSourceCategory, ContextSourceType } from './context-source.types';

export interface MaintainContextOptions {
  maxProposals?: number;
}

export interface ProposalSummary {
  sourceTag: string;
  displayName: string;
  endpoint: string;
  supersedesSourceTag: string | null;
  type: ContextSourceType;
  category: ContextSourceCategory;
}

export interface MaintainContextReport {
  degradedChecked: number;
  proposalsCreated: number;
  groundingUnavailable: boolean;
  proposals: ProposalSummary[];
  durationMs: number;
}

export class MaintainContextUseCase {
  constructor(
    private readonly sourceRepository: IContextSourceRepository,
    private readonly iaGatewayClient: IaGatewayClient,
    private readonly telemetryRepo?: TelemetryRepositoryPort,
    private readonly fetchFn: typeof fetch = fetch,
    private readonly options: MaintainContextOptions = {}
  ) {}

  async execute(): Promise<OperationEnvelope<MaintainContextReport>> {
    const startTime = Date.now();
    const maxProposals = this.options.maxProposals ?? 5;
    let proposalsCreated = 0;
    let groundingUnavailable = false;
    const proposals: ProposalSummary[] = [];

    try {
      const allSources = await this.sourceRepository.findAll();
      const existingEndpoints = new Set(
        allSources.map((s) => s.endpoint.toLowerCase().replace(/\/+$/, ''))
      );
      const existingTags = new Set(allSources.map((s) => s.sourceTag.toLowerCase()));

      // 1. Diagnosticar fuentes DEGRADED (CA-1, CA-2)
      const degradedSources = await this.sourceRepository.findByStatus('DEGRADED');
      const degradedChecked = degradedSources.length;

      for (const source of degradedSources) {
        if (proposalsCreated >= maxProposals) break;

        let resolvedByDeterministicProbe = false;

        // 1.1 Sonda determinista: HEAD / redirects / robots.txt (CA-1)
        try {
          let probeResponse = await this.fetchFn(source.endpoint, {
            method: 'HEAD',
            redirect: 'follow',
          });

          // Si el servidor prohíbe HEAD (405), intentar GET ligero
          if (probeResponse.status === 405) {
            probeResponse = await this.fetchFn(source.endpoint, {
              method: 'GET',
              redirect: 'follow',
            });
          }

          const finalUrl = probeResponse.url;
          const normalizedOriginal = source.endpoint.toLowerCase().replace(/\/+$/, '');
          const normalizedFinal = finalUrl ? finalUrl.toLowerCase().replace(/\/+$/, '') : '';

          if (
            probeResponse.ok &&
            normalizedFinal &&
            normalizedFinal !== normalizedOriginal &&
            !existingEndpoints.has(normalizedFinal)
          ) {
            // Comprobación de cortesía: robots.txt del nuevo dominio
            let robotsOk = true;
            try {
              const robotsUrl = new URL('/robots.txt', finalUrl).toString();
              const robotsRes = await this.fetchFn(robotsUrl, { method: 'GET' });
              // Si robots.txt responde 403 / disallow explícito se consideraría bloqueado, pero si responde 200 o 404 está accesible
              if (robotsRes.status === 403) {
                robotsOk = false;
              }
            } catch {
              // Si falla robots.txt asumimos permisividad por defecto
              robotsOk = true;
            }

            if (robotsOk) {
              const proposalTag = this.generateProposalTag(source.sourceTag, existingTags);
              const proposal: ProposalSummary = {
                sourceTag: proposalTag,
                displayName: `${source.displayName} (Redirección Detectada)`,
                endpoint: finalUrl,
                supersedesSourceTag: source.sourceTag,
                type: source.type,
                category: source.category,
              };

              const created = await this.sourceRepository.create({
                sourceTag: proposal.sourceTag,
                displayName: proposal.displayName,
                endpoint: proposal.endpoint,
                type: proposal.type,
                category: proposal.category,
                status: 'PENDING_APPROVAL',
                failedAttempts: 0,
                proposedBy: 'ARGOS',
                supersedesSourceTag: proposal.supersedesSourceTag,
              });

              if (created.success) {
                proposals.push(proposal);
                existingEndpoints.add(normalizedFinal);
                existingTags.add(proposalTag.toLowerCase());
                proposalsCreated++;
                resolvedByDeterministicProbe = true;
              }
            }
          }
        } catch {
          // La sonda determinista falló (ej. DNS caído, timeout) -> continuamos a hipótesis con grounding
          resolvedByDeterministicProbe = false;
        }

        // 1.2 Hipótesis con Grounding solo si la sonda determinista no resolvió (CA-2, CA-5)
        if (!resolvedByDeterministicProbe && proposalsCreated < maxProposals && !groundingUnavailable) {
          try {
            const prompt = `La fuente de contexto '${source.displayName}' con endpoint '${source.endpoint}' en Barcelona está caída o devuelve error. ¿Existe una nueva URL oficial, portal de datos abiertos o feed alternativo para este servicio en Barcelona? Devuelve información fidedigna.`;

            const grounded = await this.iaGatewayClient.generateWithGrounding(prompt, {
              systemInstruction:
                'Eres Argos, la sonda de gobernanza de contexto de BarcelonaXplorer. Identifica endpoints oficiales actualizados para fuentes culturales y cívicas en Barcelona.',
            });

            // Anti-alucinación estricta (CA-5): la URL propuesta DEBE provenir de groundingSources
            for (const gs of grounded.groundingSources) {
              if (proposalsCreated >= maxProposals) break;
              const uri = gs.uri;
              if (!uri || !uri.startsWith('http')) continue;
              const normUri = uri.toLowerCase().replace(/\/+$/, '');

              if (!existingEndpoints.has(normUri)) {
                const proposalTag = this.generateProposalTag(source.sourceTag, existingTags);
                const proposal: ProposalSummary = {
                  sourceTag: proposalTag,
                  displayName: gs.title
                    ? `${gs.title.slice(0, 100)} (Vía Argos)`
                    : `${source.displayName} (Alternativa Grounded)`,
                  endpoint: uri,
                  supersedesSourceTag: source.sourceTag,
                  type: source.type,
                  category: source.category,
                };

                const created = await this.sourceRepository.create({
                  sourceTag: proposal.sourceTag,
                  displayName: proposal.displayName,
                  endpoint: proposal.endpoint,
                  type: proposal.type,
                  category: proposal.category,
                  status: 'PENDING_APPROVAL',
                  failedAttempts: 0,
                  proposedBy: 'ARGOS',
                  supersedesSourceTag: proposal.supersedesSourceTag,
                });

                if (created.success) {
                  proposals.push(proposal);
                  existingEndpoints.add(normUri);
                  existingTags.add(proposalTag.toLowerCase());
                  proposalsCreated++;
                  break; // Una propuesta por fuente degradada
                }
              }
            }
          } catch (llmErr) {
            if (
              llmErr instanceof UnsupportedCapabilityError ||
              (llmErr instanceof Error && llmErr.message.includes('UNSUPPORTED_CAPABILITY'))
            ) {
              // Fail-closed determinista (PBI-CTX-002, CA-2): registrar advertencia y omitir sin reintentar con otro proveedor
              groundingUnavailable = true;
              if (this.telemetryRepo) {
                await this.telemetryRepo.log(
                  new TelemetryEntry(
                    'WARN',
                    'SYSTEM',
                    '[Argos Mantenimiento] Capacidad de Grounding no disponible en el proveedor actual; omitiendo inferencia asistida.',
                    { error: llmErr instanceof Error ? llmErr.message : String(llmErr) }
                  )
                );
              }
            }
          }
        }
      }

      // 2. Exploración de Nuevas Fuentes si hay cupo restante (CA-3, CA-5, CA-6)
      if (proposalsCreated < maxProposals && !groundingUnavailable) {
        try {
          const explorePrompt =
            'Busca agendas culturales públicas, portales oficiales de datos abiertos, feeds RSS y calendarios iCal de eventos en la ciudad de Barcelona (España).';

          const exploreGrounded = await this.iaGatewayClient.generateWithGrounding(explorePrompt, {
            systemInstruction:
              'Eres Argos. Tu objetivo es descubrir fuentes de eventos y contexto hiperlocal fidedignas circunscritas a Barcelona.',
          });

          // Anti-alucinación: solo aceptar URLs de groundingSources
          for (const gs of exploreGrounded.groundingSources) {
            if (proposalsCreated >= maxProposals) break;
            const uri = gs.uri;
            if (!uri || !uri.startsWith('http')) continue;
            const normUri = uri.toLowerCase().replace(/\/+$/, '');

            if (!existingEndpoints.has(normUri)) {
              // Deducción heurística del tipo de fuente
              let detectedType: ContextSourceType = 'API_REST';
              if (normUri.includes('socrata') || normUri.includes('opendata-ajuntament')) {
                detectedType = 'SOCRATA';
              } else if (normUri.includes('.ics') || normUri.includes('ical')) {
                detectedType = 'ICAL';
              } else if (normUri.includes('rss') || normUri.includes('feed')) {
                detectedType = 'RSS';
              } else if (normUri.includes('sparql') || normUri.includes('wikidata')) {
                detectedType = 'SPARQL';
              } else {
                detectedType = 'JSON_LD';
              }

              const baseTag = (gs.title || 'bcn-explora')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .slice(0, 24);
              const proposalTag = this.generateProposalTag(baseTag, existingTags);

              const proposal: ProposalSummary = {
                sourceTag: proposalTag,
                displayName: gs.title ? gs.title.slice(0, 150) : `Nueva Fuente: ${proposalTag}`,
                endpoint: uri,
                supersedesSourceTag: null,
                type: detectedType,
                category: 'EVENT',
              };

              const created = await this.sourceRepository.create({
                sourceTag: proposal.sourceTag,
                displayName: proposal.displayName,
                endpoint: proposal.endpoint,
                type: proposal.type,
                category: proposal.category,
                status: 'PENDING_APPROVAL',
                failedAttempts: 0,
                proposedBy: 'ARGOS',
                supersedesSourceTag: null,
              });

              if (created.success) {
                proposals.push(proposal);
                existingEndpoints.add(normUri);
                existingTags.add(proposalTag.toLowerCase());
                proposalsCreated++;
              }
            }
          }
        } catch (exploreErr) {
          if (
            exploreErr instanceof UnsupportedCapabilityError ||
            (exploreErr instanceof Error && exploreErr.message.includes('UNSUPPORTED_CAPABILITY'))
          ) {
            groundingUnavailable = true;
          }
        }
      }

      const durationMs = Date.now() - startTime;
      const report: MaintainContextReport = {
        degradedChecked,
        proposalsCreated,
        groundingUnavailable,
        proposals,
        durationMs,
      };

      // 3. Telemetría de la Ejecución (CA-8)
      if (this.telemetryRepo) {
        await this.telemetryRepo.log(
          new TelemetryEntry(
            'INFO',
            'SYSTEM',
            `[Argos Mantenimiento] Ejecución finalizada: ${degradedChecked} degradadas inspeccionadas, ${proposalsCreated} propuestas registradas, groundingUnavailable=${groundingUnavailable}`,
            {
              eventType: 'ARGOS_MAINTENANCE_RUN',
              degradedChecked,
              proposalsCreated,
              groundingUnavailable,
              durationMs,
            },
            200,
            durationMs
          )
        );
      }

      return createSuccessEnvelope(report);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (this.telemetryRepo) {
        await this.telemetryRepo.log(
          new TelemetryEntry(
            'ERROR',
            'SYSTEM',
            `[Argos Mantenimiento] Error crítico: ${errorMsg}`,
            { error: errorMsg },
            500,
            durationMs
          )
        );
      }

      return createErrorEnvelope([errorMsg], 500, 'Error crítico en sonda Argos');
    }
  }

  private generateProposalTag(base: string, existing: Set<string>): string {
    const cleanBase = base.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    let candidate = `${cleanBase}-argos`;
    let counter = 1;
    while (existing.has(candidate.toLowerCase())) {
      candidate = `${cleanBase}-argos-${counter++}`;
    }
    return candidate;
  }
}
