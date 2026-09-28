import { SupportedLanguage } from './supported-language.vo';

export interface UiDictionary {
  readonly thermalMeter: {
    readonly title: string;
    readonly operational: string;
    readonly saturated: string;
    readonly thresholdMet: string;
    readonly thresholdNeeded: string;
    readonly missingVariablePrefix: string;
    readonly forgeRoute: string;
    readonly forging: string;
  };
  readonly pickpocket: {
    readonly badgePrefix: string;
    readonly levels: {
      readonly LOW: string;
      readonly MEDIUM: string;
      readonly HIGH: string;
      readonly EXTREME: string;
    };
  };
  readonly categories: {
    readonly CULTURAL: string;
    readonly GASTRONOMIC: string;
    readonly LOGISTICS: string;
    readonly ARCHITECTURAL: string;
    readonly PANORAMIC: string;
    readonly GENERAL: string;
  };
  readonly hybridCanvas: {
    readonly itineraryTitle: string;
    readonly stopsCount: string;
    readonly modifyTime: string;
    readonly adjustTimeNotice: string;
    readonly save: string;
    readonly cancel: string;
    readonly close: string;
    readonly antiTrapShieldTitle: string;
    readonly priorityAccessNotice: string;
    readonly secureEntrance: string;
    readonly optionSelected: string;
    readonly selectOption: string;
    readonly safeOperationalRouteBanner: string;
    readonly sGradeBanner: string;
    readonly transitTipPrefix: string;
    readonly recommendedAlternativesTitle: string;
    readonly availableOptionsTitle: string;
    readonly verifiedVia: string;
    readonly defaultProvider: string;
    readonly expandOptions: string;
    readonly collapseOptions: string;
  };
  readonly affiliates: {
    readonly theForkDefaultCta: string;
    readonly cabifyDefaultCta: string;
    readonly freeNowDefaultCta: string;
    readonly tiqetsDefaultCta: string;
    readonly civitatisDefaultCta: string;
  };
  readonly chat: {
    readonly inputPlaceholder: string;
    readonly sendButton: string;
    readonly ignitingGreeting: string;
  };
  readonly orchestrator: {
    readonly awaitingInput: string;
    readonly orchestratingStatus: string;
    readonly routeForgedSuccess: string;
    readonly invalidTriageResponse: string;
    readonly communicationError: string;
    readonly timeUpdatedNotice: string;
    readonly timeUpdateError: string;
    readonly cannotForgeRoute: string;
    readonly closeNotification: string;
    readonly sparkMatrixSaturated: string;
    readonly sparkCasualDialogue: string;
    readonly sparkOutOfScope: string;
    readonly sparkIncompleteMatrixPrefix: string;
    readonly sparkCriticalVariablePrefix: string;
    readonly defaultBounceMessage: string;
    readonly defaultDialogueMessage: string;
    readonly defaultRepromptMessage: string;
    readonly defaultClaudicationMessage: string;
    readonly defaultForceDispatchPrompt: string;
  };
}

export const UI_DICTIONARY: Readonly<Record<SupportedLanguage, UiDictionary>> = {
  es: {
    thermalMeter: {
      title: 'Medidor Térmico de Ruta',
      operational: 'Operativo',
      saturated: 'Saturado',
      thresholdMet: 'Itinerario Listo',
      thresholdNeeded: 'Se requiere umbral',
      missingVariablePrefix: 'Falta definir',
      forgeRoute: 'Forjar Ruta Inmediata',
      forging: 'Forjando...',
    },
    pickpocket: {
      badgePrefix: 'Carteristas',
      levels: {
        LOW: 'Bajo',
        MEDIUM: 'Medio',
        HIGH: 'Alto',
        EXTREME: 'Extremo',
      },
    },
    categories: {
      CULTURAL: 'Cultural',
      GASTRONOMIC: 'Gastronómico',
      LOGISTICS: 'Logística',
      ARCHITECTURAL: 'Arquitectura',
      PANORAMIC: 'Panorámica',
      GENERAL: 'General',
    },
    hybridCanvas: {
      itineraryTitle: 'Itinerario Táctico',
      stopsCount: 'paradas planificadas',
      modifyTime: 'Modificar',
      adjustTimeNotice: 'Ajustar hora (se recalcularán los eventos posteriores):',
      save: 'Guardar',
      cancel: 'Cancelar',
      close: 'Cerrar lienzo',
      antiTrapShieldTitle: 'Escudo Anti-Trampas',
      priorityAccessNotice: 'Aforo crítico de alta congestión. Acceso prioritario:',
      secureEntrance: 'Asegurar Entrada',
      optionSelected: 'Opción activa',
      selectOption: 'Elegir esta opción',
      safeOperationalRouteBanner: 'Ruta Operativa Segura. Completa tu perfil para desbloquear alternativas gastronómicas hiperlocales y pases de acceso prioritario.',
      sGradeBanner: 'Modo S+ Grade: Escudo de Supervivencia & Curaduría Hiperlocal Activos',
      transitTipPrefix: 'Tip de tránsito',
      recommendedAlternativesTitle: 'Alternativas Locales Recomendadas (Sin Trampas):',
      availableOptionsTitle: 'Opciones Disponibles:',
      verifiedVia: 'Verificado vía',
      defaultProvider: 'Proveedor',
      expandOptions: 'Expandir opciones',
      collapseOptions: 'Colapsar opciones',
    },
    affiliates: {
      theForkDefaultCta: 'Reservar mesa en TheFork',
      cabifyDefaultCta: 'Pedir Cabify con descuento',
      freeNowDefaultCta: 'Pedir taxi en FreeNow',
      tiqetsDefaultCta: 'Comprar ticket en Tiqets',
      civitatisDefaultCta: 'Ver tour en Civitatis',
    },
    chat: {
      inputPlaceholder: 'Indica tus preferencias (ej. 2 horas en Born con tapas)...',
      sendButton: 'Enviar',
      ignitingGreeting: 'Analizando condiciones en Barcelona...',
    },
    orchestrator: {
      awaitingInput: '[ SISTEMA EN ESPERA DE INPUT TÁCTICO ]',
      orchestratingStatus: 'Asimilando entropía y trazando ruta...',
      routeForgedSuccess: 'Ruta táctica forjada con éxito.',
      invalidTriageResponse: 'Respuesta de triaje inválida. La aduana rechazó el contrato de datos.',
      communicationError: 'Error de comunicación táctica. Proceda con precaución manual.',
      timeUpdatedNotice: '⏱️ Horario actualizado. Eventos posteriores recalculados automáticamente.',
      timeUpdateError: 'Error al recalcular horario.',
      cannotForgeRoute: 'No se pudo forjar la ruta.',
      closeNotification: 'Cerrar notificación',
      sparkMatrixSaturated: 'Matriz saturada (>= 60%). Itinerario forjado internamente.',
      sparkCasualDialogue: 'Interacción casual interceptada. Modo empático activo.',
      sparkOutOfScope: 'Petición fuera de perímetro geográfico.',
      sparkIncompleteMatrixPrefix: 'Matriz incompleta',
      sparkCriticalVariablePrefix: 'Variable crítica',
      defaultBounceMessage: 'Destino fuera del perímetro de Barcelona.',
      defaultDialogueMessage: '¡Me alegra charlar contigo! Disfruta con calma de Barcelona.',
      defaultRepromptMessage: '¿Podrías especificar los horarios o tiempo disponible?',
      defaultClaudicationMessage: 'El motor de rutas no está disponible temporalmente. Inténtalo más tarde.',
      defaultForceDispatchPrompt: 'Por favor, forja la ruta táctica inmediata con el contexto actual.',
    },
  },
  en: {
    thermalMeter: {
      title: 'Thermal Route Meter',
      operational: 'Operational',
      saturated: 'Saturated',
      thresholdMet: 'Itinerary Ready',
      thresholdNeeded: 'Threshold required',
      missingVariablePrefix: 'Missing',
      forgeRoute: 'Forge Route Now',
      forging: 'Forging...',
    },
    pickpocket: {
      badgePrefix: 'Pickpockets',
      levels: {
        LOW: 'Low',
        MEDIUM: 'Medium',
        HIGH: 'High',
        EXTREME: 'Extreme',
      },
    },
    categories: {
      CULTURAL: 'Cultural',
      GASTRONOMIC: 'Gastronomy',
      LOGISTICS: 'Logistics',
      ARCHITECTURAL: 'Architecture',
      PANORAMIC: 'Scenic View',
      GENERAL: 'General',
    },
    hybridCanvas: {
      itineraryTitle: 'Tactical Itinerary',
      stopsCount: 'planned stops',
      modifyTime: 'Edit',
      adjustTimeNotice: 'Adjust time (subsequent stops will recalculate):',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close canvas',
      antiTrapShieldTitle: 'Anti-Trap Shield',
      priorityAccessNotice: 'Critical high-congestion spot. Priority access:',
      secureEntrance: 'Secure Ticket',
      optionSelected: 'Active option',
      selectOption: 'Choose this option',
      safeOperationalRouteBanner: 'Safe Operational Route. Complete your profile to unlock hyperlocal gastronomy alternatives and priority access passes.',
      sGradeBanner: 'S+ Grade Mode: Survival Shield & Hyperlocal Curation Active',
      transitTipPrefix: 'Transit tip',
      recommendedAlternativesTitle: 'Recommended Local Alternatives (Trap-Free):',
      availableOptionsTitle: 'Available Options:',
      verifiedVia: 'Verified via',
      defaultProvider: 'Provider',
      expandOptions: 'Expand options',
      collapseOptions: 'Collapse options',
    },
    affiliates: {
      theForkDefaultCta: 'Book table on TheFork',
      cabifyDefaultCta: 'Request discounted Cabify',
      freeNowDefaultCta: 'Request taxi on FreeNow',
      tiqetsDefaultCta: 'Get ticket on Tiqets',
      civitatisDefaultCta: 'View tour on Civitatis',
    },
    chat: {
      inputPlaceholder: 'Enter your preferences (e.g. 2 hours in Born with tapas)...',
      sendButton: 'Send',
      ignitingGreeting: 'Scanning Barcelona conditions...',
    },
    orchestrator: {
      awaitingInput: '[ SYSTEM AWAITING TACTICAL INPUT ]',
      orchestratingStatus: 'Assimilating entropy and plotting route...',
      routeForgedSuccess: 'Tactical route forged successfully.',
      invalidTriageResponse: 'Invalid triage response. Customs rejected data contract.',
      communicationError: 'Tactical communication error. Proceed with manual caution.',
      timeUpdatedNotice: '⏱️ Schedule updated. Subsequent events recalculated automatically.',
      timeUpdateError: 'Error recalculating schedule.',
      cannotForgeRoute: 'Could not forge route.',
      closeNotification: 'Close notification',
      sparkMatrixSaturated: 'Matrix saturated (>= 60%). Itinerary forged internally.',
      sparkCasualDialogue: 'Casual interaction intercepted. Empathetic mode active.',
      sparkOutOfScope: 'Request outside geographic perimeter.',
      sparkIncompleteMatrixPrefix: 'Incomplete matrix',
      sparkCriticalVariablePrefix: 'Critical variable',
      defaultBounceMessage: 'Destination outside Barcelona perimeter.',
      defaultDialogueMessage: 'Glad to chat with you! Enjoy Barcelona at your own pace.',
      defaultRepromptMessage: 'Could you specify the times or available schedule?',
      defaultClaudicationMessage: 'The routing engine is temporarily unavailable. Please try again later.',
      defaultForceDispatchPrompt: 'Please forge the immediate tactical route with current context.',
    },
  },
  fr: {
    thermalMeter: {
      title: 'Thermomètre de Route',
      operational: 'Opérationnel',
      saturated: 'Saturé',
      thresholdMet: 'Itinéraire Prêt',
      thresholdNeeded: 'Seuil requis',
      missingVariablePrefix: 'À définir',
      forgeRoute: "Forger l'itinéraire",
      forging: 'Forgeage...',
    },
    pickpocket: {
      badgePrefix: 'Pickpockets',
      levels: {
        LOW: 'Faible',
        MEDIUM: 'Moyen',
        HIGH: 'Élevé',
        EXTREME: 'Extrême',
      },
    },
    categories: {
      CULTURAL: 'Culturel',
      GASTRONOMIC: 'Gastronomique',
      LOGISTICS: 'Logistique',
      ARCHITECTURAL: 'Architecture',
      PANORAMIC: 'Panoramique',
      GENERAL: 'Général',
    },
    hybridCanvas: {
      itineraryTitle: 'Itinéraire Tactique',
      stopsCount: 'étapes planifiées',
      modifyTime: 'Modifier',
      adjustTimeNotice: "Ajuster l'horaire (les étapes suivantes seront recalculées) :",
      save: 'Enregistrer',
      cancel: 'Annuler',
      close: 'Fermer',
      antiTrapShieldTitle: 'Bouclier Anti-Pièges',
      priorityAccessNotice: 'Affluence critique. Accès prioritaire :',
      secureEntrance: 'Réserver Billet',
      optionSelected: 'Option active',
      selectOption: 'Choisir cette option',
      safeOperationalRouteBanner: 'Itinéraire Opérationnel Sûr. Complétez votre profil pour débloquer des alternatives gastronomiques hyperlocales et des accès prioritaires.',
      sGradeBanner: 'Mode S+ Grade : Bouclier de Survie & Recommandations Hyperlocales Actifs',
      transitTipPrefix: 'Conseil de transit',
      recommendedAlternativesTitle: 'Alternatives Locales Recommandées (Sans Pièges) :',
      availableOptionsTitle: 'Options Disponibles :',
      verifiedVia: 'Vérifié via',
      defaultProvider: 'Fournisseur',
      expandOptions: 'Développer les options',
      collapseOptions: 'Réduire les options',
    },
    affiliates: {
      theForkDefaultCta: 'Réserver table sur TheFork',
      cabifyDefaultCta: 'Commander Cabify avec réduction',
      freeNowDefaultCta: 'Commander taxi sur FreeNow',
      tiqetsDefaultCta: 'Acheter billet sur Tiqets',
      civitatisDefaultCta: 'Voir tour sur Civitatis',
    },
    chat: {
      inputPlaceholder: 'Indiquez vos préférences (ex. 2 heures à Born avec tapas)...',
      sendButton: 'Envoyer',
      ignitingGreeting: 'Analyse des conditions à Barcelone...',
    },
    orchestrator: {
      awaitingInput: "[ SYSTÈME EN ATTENTE D'ENTRÉE TACTIQUE ]",
      orchestratingStatus: "Assimilation de l'entropie et tracé de l'itinéraire...",
      routeForgedSuccess: 'Itinéraire tactique forgé avec succès.',
      invalidTriageResponse: 'Réponse de tri invalide. La douane a rejeté le contrat de données.',
      communicationError: 'Erreur de communication tactique. Procédez avec précaution manuelle.',
      timeUpdatedNotice: '⏱️ Horaire mis à jour. Événements suivants recalculés automatiquement.',
      timeUpdateError: "Erreur lors du recalcul de l'horaire.",
      cannotForgeRoute: "Impossible de forger l'itinéraire.",
      closeNotification: 'Fermer la notification',
      sparkMatrixSaturated: 'Matrice saturée (>= 60%). Itinéraire forgé en interne.',
      sparkCasualDialogue: 'Interaction informelle interceptée. Mode empathique actif.',
      sparkOutOfScope: 'Demande hors du périmètre géographique.',
      sparkIncompleteMatrixPrefix: 'Matrice incomplète',
      sparkCriticalVariablePrefix: 'Variable critique',
      defaultBounceMessage: 'Destination hors du périmètre de Barcelone.',
      defaultDialogueMessage: "Ravi d'échanger avec vous ! Profitez sereinement de Barcelone.",
      defaultRepromptMessage: 'Pourriez-vous préciser vos horaires ou le temps disponible ?',
      defaultClaudicationMessage: "Le moteur d'itinéraires est temporairement indisponible. Veuillez réessayer plus tard.",
      defaultForceDispatchPrompt: "Veuillez forger l'itinéraire tactique immédiat avec le contexte actuel.",
    },
  },
  de: {
    thermalMeter: {
      title: 'Thermische Routenmessung',
      operational: 'Betriebsbereit',
      saturated: 'Gesättigt',
      thresholdMet: 'Route Bereit',
      thresholdNeeded: 'Schwelle erforderlich',
      missingVariablePrefix: 'Fehlt noch',
      forgeRoute: 'Route sofort schmieden',
      forging: 'Wird geschmiedet...',
    },
    pickpocket: {
      badgePrefix: 'Taschendiebe',
      levels: {
        LOW: 'Niedrig',
        MEDIUM: 'Mittel',
        HIGH: 'Hoch',
        EXTREME: 'Extrem',
      },
    },
    categories: {
      CULTURAL: 'Kulturell',
      GASTRONOMIC: 'Gastronomie',
      LOGISTICS: 'Logistik',
      ARCHITECTURAL: 'Architektur',
      PANORAMIC: 'Panoramablick',
      GENERAL: 'Allgemein',
    },
    hybridCanvas: {
      itineraryTitle: 'Taktische Route',
      stopsCount: 'geplante Stationen',
      modifyTime: 'Bearbeiten',
      adjustTimeNotice: 'Uhrzeit anpassen (nachfolgende Stationen werden neu berechnet):',
      save: 'Speichern',
      cancel: 'Abbrechen',
      close: 'Schließen',
      antiTrapShieldTitle: 'Anti-Fallen-Schutz',
      priorityAccessNotice: 'Kritische Überlastung. Bevorzugter Einlass:',
      secureEntrance: 'Ticket Sichern',
      optionSelected: 'Aktive Option',
      selectOption: 'Diese Option wählen',
      safeOperationalRouteBanner: 'Sichere Betriebsroute. Vervollständigen Sie Ihr Profil, um hyperlokale Gastronomie-Alternativen und bevorzugte Einlasstickets freizuschalten.',
      sGradeBanner: 'S+ Grade Modus: Überlebensschutz & Hyperlokale Kuration Aktiv',
      transitTipPrefix: 'Transit-Tipp',
      recommendedAlternativesTitle: 'Empfohlene Lokale Alternativen (Ohne Fallen):',
      availableOptionsTitle: 'Verfügbare Optionen:',
      verifiedVia: 'Verifiziert über',
      defaultProvider: 'Anbieter',
      expandOptions: 'Optionen erweitern',
      collapseOptions: 'Optionen einklappen',
    },
    affiliates: {
      theForkDefaultCta: 'Tisch auf TheFork reservieren',
      cabifyDefaultCta: 'Cabify mit Rabatt buchen',
      freeNowDefaultCta: 'Taxi auf FreeNow rufen',
      tiqetsDefaultCta: 'Ticket bei Tiqets kaufen',
      civitatisDefaultCta: 'Tour bei Civitatis ansehen',
    },
    chat: {
      inputPlaceholder: 'Präferenzen eingeben (z. B. 2 Stunden im Born mit Tapas)...',
      sendButton: 'Senden',
      ignitingGreeting: 'Bedingungen in Barcelona werden analysiert...',
    },
    orchestrator: {
      awaitingInput: '[ SYSTEM WARTET AUF TAKTISCHE EINGABE ]',
      orchestratingStatus: 'Entropie wird assimiliert und Route geplant...',
      routeForgedSuccess: 'Taktische Route erfolgreich geschmiedet.',
      invalidTriageResponse: 'Ungültige Triage-Antwort. Datenvertrag abgelehnt.',
      communicationError: 'Taktischer Kommunikationsfehler. Manuelle Vorsicht geboten.',
      timeUpdatedNotice: '⏱️ Zeitplan aktualisiert. Nachfolgende Ereignisse automatisch neu berechnet.',
      timeUpdateError: 'Fehler bei der Neuberechnung des Zeitplans.',
      cannotForgeRoute: 'Route konnte nicht geschmiedet werden.',
      closeNotification: 'Benachrichtigung schließen',
      sparkMatrixSaturated: 'Matrix gesättigt (>= 60%). Route intern geschmiedet.',
      sparkCasualDialogue: 'Freundlicher Dialog abgefangen. Empathischer Modus aktiv.',
      sparkOutOfScope: 'Anfrage außerhalb des geografischen Perimeters.',
      sparkIncompleteMatrixPrefix: 'Unvollständige Matrix',
      sparkCriticalVariablePrefix: 'Kritische Variable',
      defaultBounceMessage: 'Ziel außerhalb des Perimeters von Barcelona.',
      defaultDialogueMessage: 'Freut mich, mit Ihnen zu sprechen! Genießen Sie Barcelona in Ruhe.',
      defaultRepromptMessage: 'Könnten Sie Zeiten oder verfügbare Dauer angeben?',
      defaultClaudicationMessage: 'Das Routing-System ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.',
      defaultForceDispatchPrompt: 'Bitte schmieden Sie sofort die taktische Route mit dem aktuellen Kontext.',
    },
  },
  it: {
    thermalMeter: {
      title: 'Misuratore Termico della Rotta',
      operational: 'Operativo',
      saturated: 'Saturato',
      thresholdMet: 'Itinerario Pronto',
      thresholdNeeded: 'Soglia richiesta',
      missingVariablePrefix: 'Mancante',
      forgeRoute: 'Forgia itinerario ora',
      forging: 'Forgiatura...',
    },
    pickpocket: {
      badgePrefix: 'Borseggiatori',
      levels: {
        LOW: 'Basso',
        MEDIUM: 'Medio',
        HIGH: 'Alto',
        EXTREME: 'Estremo',
      },
    },
    categories: {
      CULTURAL: 'Culturale',
      GASTRONOMIC: 'Gastronomico',
      LOGISTICS: 'Logistica',
      ARCHITECTURAL: 'Architettura',
      PANORAMIC: 'Panoramica',
      GENERAL: 'Generale',
    },
    hybridCanvas: {
      itineraryTitle: 'Itinerario Tattico',
      stopsCount: 'tappe pianificate',
      modifyTime: 'Modifica',
      adjustTimeNotice: 'Modifica orario (le tappe successive verranno ricalcolate):',
      save: 'Salva',
      cancel: 'Annulla',
      close: 'Chiudi',
      antiTrapShieldTitle: 'Scudo Anti-Trappole',
      priorityAccessNotice: 'Affluenza critica. Accesso prioritario:',
      secureEntrance: 'Assicura Biglietto',
      optionSelected: 'Opzione attiva',
      selectOption: 'Scegli questa opzione',
      safeOperationalRouteBanner: 'Rotta Operativa Sicura. Completa il tuo profilo per sbloccare alternative gastronomiche iperlocali e pass di accesso prioritario.',
      sGradeBanner: 'Modalità S+ Grade: Scudo di Sopravvivenza & Curatela Iperlocale Attivi',
      transitTipPrefix: 'Consiglio di transito',
      recommendedAlternativesTitle: 'Alternative Locali Consigliate (Senza Trappole):',
      availableOptionsTitle: 'Opzioni Disponibili:',
      verifiedVia: 'Verificato tramite',
      defaultProvider: 'Fornitore',
      expandOptions: 'Espandi opzioni',
      collapseOptions: 'Comprimi opzioni',
    },
    affiliates: {
      theForkDefaultCta: 'Prenota tavolo su TheFork',
      cabifyDefaultCta: 'Richiedi Cabify con sconto',
      freeNowDefaultCta: 'Richiedi taxi su FreeNow',
      tiqetsDefaultCta: 'Acquista biglietto su Tiqets',
      civitatisDefaultCta: 'Vedi tour su Civitatis',
    },
    chat: {
      inputPlaceholder: 'Inserisci preferenze (es. 2 ore nel Born con tapas)...',
      sendButton: 'Invia',
      ignitingGreeting: 'Analisi delle condizioni a Barcellona...',
    },
    orchestrator: {
      awaitingInput: '[ SISTEMA IN ATTESA DI INPUT TATTICO ]',
      orchestratingStatus: 'Assimilando entropia e tracciando rotta...',
      routeForgedSuccess: 'Rotta tattica forgiata con successo.',
      invalidTriageResponse: 'Risposta di triage non valida. Dogana ha rifiutato il contratto dati.',
      communicationError: 'Errore di comunicazione tattica. Procedere con cautela manuale.',
      timeUpdatedNotice: '⏱️ Orario aggiornato. Eventi successivi ricalcolati automaticamente.',
      timeUpdateError: "Errore nel ricalcolo dell'orario.",
      cannotForgeRoute: 'Impossibile forgiare la rotta.',
      closeNotification: 'Chiudi notifica',
      sparkMatrixSaturated: 'Matrice saturata (>= 60%). Itinerario forgiato internamente.',
      sparkCasualDialogue: 'Interazione informale intercettata. Modalità empatica attiva.',
      sparkOutOfScope: 'Richiesta fuori dal perimetro geografico.',
      sparkIncompleteMatrixPrefix: 'Matrice incompleta',
      sparkCriticalVariablePrefix: 'Variabile critica',
      defaultBounceMessage: 'Destinazione fuori dal perimetro di Barcellona.',
      defaultDialogueMessage: 'Piacere di parlare con te! Goditi Barcellona con calma.',
      defaultRepromptMessage: 'Potresti specificare gli orari o il tempo a disposizione?',
      defaultClaudicationMessage: 'Il motore di rotte non è momentaneamente disponibile. Riprova più tardi.',
      defaultForceDispatchPrompt: 'Per favore, forgia la rotta tattica immediata con il contesto attuale.',
    },
  },
  ca: {
    thermalMeter: {
      title: 'Mesurador Tèrmic de Ruta',
      operational: 'Operatiu',
      saturated: 'Saturat',
      thresholdMet: 'Itinerari Llest',
      thresholdNeeded: 'Es requereix llindar',
      missingVariablePrefix: 'Manca definir',
      forgeRoute: 'Forjar ruta immediata',
      forging: 'Forjant...',
    },
    pickpocket: {
      badgePrefix: 'Carteristes',
      levels: {
        LOW: 'Baix',
        MEDIUM: 'Mitjà',
        HIGH: 'Alt',
        EXTREME: 'Extrem',
      },
    },
    categories: {
      CULTURAL: 'Cultural',
      GASTRONOMIC: 'Gastronòmic',
      LOGISTICS: 'Logística',
      ARCHITECTURAL: 'Arquitectura',
      PANORAMIC: 'Panoràmica',
      GENERAL: 'General',
    },
    hybridCanvas: {
      itineraryTitle: 'Itinerari Tàctic',
      stopsCount: 'parades planificades',
      modifyTime: 'Modificar',
      adjustTimeNotice: 'Ajustar hora (es recalcularan els esdeveniments posteriors):',
      save: 'Desar',
      cancel: 'Cancel·lar',
      close: 'Tancar',
      antiTrapShieldTitle: 'Escut Anti-Trampes',
      priorityAccessNotice: "Aforament crític d'alta congestió. Accés prioritari:",
      secureEntrance: 'Assegurar Entrada',
      optionSelected: 'Opció activa',
      selectOption: 'Triar aquesta opció',
      safeOperationalRouteBanner: 'Ruta Operativa Segura. Completa el teu perfil per desbloquejar alternatives gastronòmiques hiperlocals i passis d\'accés prioritari.',
      sGradeBanner: 'Mode S+ Grade: Escut de Supervivència & Curadoria Hiperlocal Actius',
      transitTipPrefix: 'Consell de trànsit',
      recommendedAlternativesTitle: 'Alternatives Locals Recomanades (Sense Trampes):',
      availableOptionsTitle: 'Opcions Disponibles:',
      verifiedVia: 'Verificat via',
      defaultProvider: 'Proveïdor',
      expandOptions: 'Expandir opcions',
      collapseOptions: 'Col·lapsar opcions',
    },
    affiliates: {
      theForkDefaultCta: 'Reservar taula a TheFork',
      cabifyDefaultCta: 'Demanar Cabify amb descompte',
      freeNowDefaultCta: 'Demanar taxi a FreeNow',
      tiqetsDefaultCta: 'Comprar tiquet a Tiqets',
      civitatisDefaultCta: 'Veure tour a Civitatis',
    },
    chat: {
      inputPlaceholder: 'Indica les teves preferències (ex. 2 hores al Born amb tapes)...',
      sendButton: 'Enviar',
      ignitingGreeting: 'Analitzant condicions a Barcelona...',
    },
    orchestrator: {
      awaitingInput: "[ SISTEMA EN ESPERA D'INPUT TÀCTIC ]",
      orchestratingStatus: 'Assimilant entropia i traçant ruta...',
      routeForgedSuccess: 'Ruta tàctica forjada amb èxit.',
      invalidTriageResponse: 'Resposta de triatge invàlida. La duana ha rebutjat el contracte de dades.',
      communicationError: 'Error de comunicació tàctica. Procediu amb precaució manual.',
      timeUpdatedNotice: '⏱️ Horari actualitzat. Esdeveniments posteriors recalculats automàticament.',
      timeUpdateError: "Error en recalcular l'horari.",
      cannotForgeRoute: "No s'ha pogut forjar la ruta.",
      closeNotification: 'Tancar notificació',
      sparkMatrixSaturated: 'Matriu saturada (>= 60%). Itinerari forjat internament.',
      sparkCasualDialogue: 'Interacció casual interceptada. Mode empàtic actiu.',
      sparkOutOfScope: 'Petició fora del perímetre geogràfic.',
      sparkIncompleteMatrixPrefix: 'Matriu incompleta',
      sparkCriticalVariablePrefix: 'Variable crítica',
      defaultBounceMessage: 'Destinació fora del perímetre de Barcelona.',
      defaultDialogueMessage: 'Em fa feliç xerrar amb tu! Gaudeix amb calma de Barcelona.',
      defaultRepromptMessage: 'Podries especificar els horaris o temps disponible?',
      defaultClaudicationMessage: 'El motor de rutes no està disponible temporalment. Torna-ho a provar més tard.',
      defaultForceDispatchPrompt: 'Si us plau, forja la ruta tàctica immediata amb el context actual.',
    },
  },
};

/**
 * Obtiene el diccionario UI canónico con fallback seguro a castellano.
 */
export function getUiDictionary(lang?: SupportedLanguage | null): UiDictionary {
  if (!lang || !(lang in UI_DICTIONARY)) {
    return UI_DICTIONARY.es;
  }
  return UI_DICTIONARY[lang];
}
