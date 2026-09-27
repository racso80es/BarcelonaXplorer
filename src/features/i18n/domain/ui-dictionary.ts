import { SupportedLanguage } from './supported-language.vo';

export interface UiDictionary {
  readonly thermalMeter: {
    readonly title: string;
    readonly operational: string;
    readonly saturated: string;
    readonly thresholdMet: string;
    readonly thresholdNeeded: string;
    readonly missingVariablePrefix: string;
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
  },
  en: {
    thermalMeter: {
      title: 'Thermal Route Meter',
      operational: 'Operational',
      saturated: 'Saturated',
      thresholdMet: 'Itinerary Ready',
      thresholdNeeded: 'Threshold required',
      missingVariablePrefix: 'Missing',
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
  },
  fr: {
    thermalMeter: {
      title: 'Thermomètre de Route',
      operational: 'Opérationnel',
      saturated: 'Saturé',
      thresholdMet: 'Itinéraire Prêt',
      thresholdNeeded: 'Seuil requis',
      missingVariablePrefix: 'À définir',
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
  },
  de: {
    thermalMeter: {
      title: 'Thermische Routenmessung',
      operational: 'Betriebsbereit',
      saturated: 'Gesättigt',
      thresholdMet: 'Route Bereit',
      thresholdNeeded: 'Schwelle erforderlich',
      missingVariablePrefix: 'Fehlt noch',
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
  },
  it: {
    thermalMeter: {
      title: 'Misuratore Termico della Rotta',
      operational: 'Operativo',
      saturated: 'Saturato',
      thresholdMet: 'Itinerario Pronto',
      thresholdNeeded: 'Soglia richiesta',
      missingVariablePrefix: 'Mancante',
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
      adjustTimeNotice: "Modifica orario (le tappe successive verranno ricalcolate):",
      save: 'Salva',
      cancel: 'Annulla',
      close: 'Chiudi',
      antiTrapShieldTitle: 'Scudo Anti-Trappole',
      priorityAccessNotice: 'Affluenza critica. Accesso prioritario:',
      secureEntrance: 'Assicura Biglietto',
      optionSelected: 'Opzione attiva',
      selectOption: 'Scegli questa opzione',
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
  },
  ca: {
    thermalMeter: {
      title: 'Mesurador Tèrmic de Ruta',
      operational: 'Operatiu',
      saturated: 'Saturat',
      thresholdMet: 'Itinerari Llest',
      thresholdNeeded: 'Es requereix llindar',
      missingVariablePrefix: 'Manca definir',
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
