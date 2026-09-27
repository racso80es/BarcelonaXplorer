# [ARQUITECTURA] Historia de Usuario 12: Internacionalización Reactiva Persistida y Soberanía de Idioma (S+ Grade)

- **Estatus:** Realizado (S+ Grade) — 4/4 PBIs certificados
- **Fecha de Revisión:** 2026-09-27
- **Autor:** Vértice Biológico & Arquitectura BarcelonaXplorer
- **Módulo:** Vertical Slice i18n (`src/features/i18n/`), Catálogo de Templates (`src/features/guide-templates/`), Aduana de Triaje (`src/features/triage/`) y Lienzo Orquestador (`src/app/orchestrator/`, `src/components/tactical/`)
- **Marco Normativo & Diseño:** [AGENTS.md (Protocolo de Acero S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/AGENTS.md) · [ADR-001 (Vertical Slicing)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [HU-9 (Catálogo Relacional de Templates)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%209%20%28Refinada%29:%20Arquitectura%20Relacional%20de%20Templates%20Tem%C3%A1ticos%20y%20Taxonom%C3%ADa%20Din%C3%A1mica.md) · [HU-10 (Gamificación y Escudo de Supervivencia)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2010:%20Gamificaci%C3%B3n%20Log%C3%ADstica%20y%20Escudo%20de%20Supervivencia%20%28Fase%20de%20Generaci%C3%B3n%29.md) · [Esquema Canónico Prisma](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma)

---

## Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Internacionalización Reactiva (i18n), Persistencia Relacional Satélite (MySQL / Prisma), Orquestación LLM Bajo Demanda (Gemini AI), Detección Lingüística en SLM y Soberanía Biológica.
- **Entorno:** Ecosistema BarcelonaXplorer (Next.js 16 App Router, MySQL 8 / Prisma ORM 5.22, Jev AI / Groq SLM, Gemini AI y React Client Components).
- **Entropía Asimilada (Filtros A, B y C - Erradicación de Alucinaciones, Trampas de Timeout y Fricciones de Contrato):**
  - *Filtro A (Lógica y Termodinámica - Desactivación de la Trampa del Timeout Síncrono):* Se erradica la vulnerabilidad de bucle infinito de "Cache Miss". Traducir un template completo con título, abstract y múltiples paradas con sabiduría local requiere estructurar un JSON extenso en Gemini que puede superar 3.5s bajo estrés de red. Si se aborta a los 3500ms y el hilo muere sin persistir, cada usuario subsecuente vuelve a disparar la llamada al LLM, consumiendo tokens inútilmente.  
    **Solución S+ Grade:** Se eleva la ventana síncrona a **8000ms** (acompañada de Skeleton Loaders en UI). Adicionalmente, se implementa el patrón **SingleFlight / In-Flight Deduping** (evitando solicitudes duplicadas concurrentes) y **Persistencia Asíncrona Resiliente (Fire-and-Persist)**: si la respuesta al cliente alcanza el límite de corte para proteger la fluidez visual, el servidor entrega de inmediato el contenido en castellano (`es`) pero la promesa en background no se destruye, culminando la traducción y el `INSERT` en MySQL para que el próximo usuario goce de Cache Hit instantáneo.
  - *Filtro A (Integridad de Contratos - Inyección Estricta de Whitelist en SLM y Defensa en Profundidad):* Para evitar que el SLM responda con nombres descriptivos (ej. `"English"`, `"en-US"`, `"inglés"`) y provoque que un parser estricto active el fallback forzado a Castellano ignorando la voluntad del explorador, se aplican dos capas de acero:
    1. **Acorralamiento de Salida del SLM:** El prompt de sistema y el esquema determinista Zod del SLM inyectan el enum estricto `z.enum(['es', 'en', 'fr', 'de', 'it', 'ca'])`, impidiendo la inferencia de strings libres.
    2. **Defensa en Profundidad en `SupportedLanguageVo.from()`:** El Value Object incorpora un mapa determinista de alias canónicos (ej. `"en-us"`, `"english"`, `"anglais"` $\to$ `"en"`), garantizando la asimilación correcta antes de evaluar la Whitelist.
  - *Filtro B (Alineación con el Esquema Relacional de Prisma):* Se descartan campos inventados (`price`) y se adopta la topología exacta ya forjada en [`src/prisma/schema.prisma`](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma) para las 3 entidades satélite con `onDelete: Cascade`:
    1. `TemplateCategoryTranslation` (`categoryId`, `language`, `name`, `description`).
    2. `GuideTemplateTranslation` (`templateId`, `language`, `title`, `abstract`).
    3. `TemplateItemTranslation` (`itemId`, `language`, `title`, `description`).
    Los metadatos tácticos JSON (`tacticalMetadata`) y de afiliación (`affiliateRefs`) mantienen su núcleo estructural inalterado, traduciéndose bajo demanda únicamente los textos legibles.
  - *Filtro C (Eficiencia Termodinámica - Cero Disonancia en UI y Aislamiento Perimetral):* Desacoplamiento absoluto de la renderización del cliente de las consultas a base de datos mediante un diccionario declarativo estático (`UI_DICTIONARY`). Los botones del medidor térmico, las alertas de carteristas y los enlaces CPA de afiliación mutan en tiempo real en el cliente sin re-renders costosos ni llamadas de red. [`src/middleware.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/middleware.ts) conserva su función perimetral ligera en Edge Runtime, dejando la orquestación del estado conversacional en la Aduana de Triaje.

---

## 1. Descripción General (INVEST)

**Como** turista internacional o explorador hiperlocal de Barcelona,  
**Quiero** que el sistema detecte de forma transparente mi idioma preferido al inicio, pero me otorgue la soberanía absoluta de cambiarlo en cualquier momento mediante lenguaje natural conversacional (ej. *"Háblame en inglés"* o formulando directamente mi consulta en alemán),  
**Para** interactuar con la plataforma sin fricción técnica ni barreras lingüísticas, asegurando que tanto la narrativa de las rutas como la interfaz visual (botones, medidor térmico, alertas tácticas y enlaces de afiliación) se adapten dinámicamente sin coste computacional por traducciones preventivas innecesarias ni bloqueos de latencia.

---

## 2. Justificación Arquitectónica y Principios de Forja

### 2.1. Ley de Economía Termodinámica (Axioma I - Traducción Reactiva vs Preventiva)
Traducir preventivamente todo el catálogo de guías de Barcelona a múltiples idiomas antes de que los usuarios las soliciten genera una asfixia termodinámica (desperdicio masivo de tokens LLM, almacenamiento innecesario y desincronización editorial).  
El sistema adopta el patrón **Paciente Cero (On-Demand Reactive Translation)**:
- **Idioma Maestro y Fallback Universal:** Castellano (`es`). Todo contenido curado editorialmente nace en español con coste cero de traducción.
- **Cache Hit (0 Tokens):** Si el usuario solicita un contenido en un idioma admitido y ya existe su traducción en las tablas satélite de MySQL (`*Translation`), se sirve en milisegundos directamente desde base de datos.
- **Cache Miss / Paciente Cero con SingleFlight:** Si es la primera vez que se solicita dicho contenido en ese idioma:
  1. Se verifica si ya hay una promesa en vuelo para esa tupla `(templateId, language)`. De ser así, se reutiliza el proceso en curso (Anti-Thundering Herd).
  2. Gemini traduce atómicamente el árbol textual en una ventana de **8000ms**.
  3. Prisma persiste inmediatamente en MySQL (`transaction` con `INSERT`) y se entrega al cliente. Todos los usuarios subsecuentes disfrutarán de un Cache Hit permanente.

### 2.2. Tolerancia Cero a la Inferencia y Value Objects (Axioma II)
Queda prohibido el manejo de strings primitivos no saneados para los idiomas. Se forja el Value Object inmutable `SupportedLanguageVo` respaldado por esquemas deterministas Zod:
- **Whitelist Innegociable:** Array canónico estricto: `['es', 'en', 'fr', 'de', 'it', 'ca']`.
- **Acorralamiento en SLM:** Contrato Zod estricto con `z.enum(SUPPORTED_LANGUAGES)`.
- **Normalización Defensiva:** Mapeo determinista de alias locales y códigos ISO compuestos a su clave canónica de 2 caracteres.
- **Fallback Determinista:** Si la entrada no pertenece a la Whitelist, el Value Object resuelve automáticamente a `es` (Castellano).

### 2.3. Soberanía Biológica vs Hardware Determinism (Axioma III)
La voluntad explícita del ser humano prevalece siempre sobre la configuración técnica de su dispositivo. Si un usuario viaja con un portátil configurado en alemán (`de-DE`) pero prefiere comunicarse en español o inglés, basta con indicarlo en el chat o cambiar de idioma orgánicamente en sus mensajes. El SLM de triaje detecta la mutación lingüística y reconfigura la sesión sin exigir recarga de página.

### 2.4. Resiliencia Fail-Soft y Ejecución Encapsulada (Axioma V)
Toda operación de traducción y orquestación lingüística retorna un sobre canónico tipado `OperationEnvelope<T>`. Si el proveedor LLM (Gemini) sufre un corte de servicio o latencia excesiva (> 8000ms) durante un Cache Miss:
1. El sistema no bloquea la experiencia del explorador: degrada elegantemente devolviendo de inmediato el contenido en castellano (`es`) con feedback semántico controlado.
2. Si el proceso de fondo sobrevive, persiste el resultado tardío para beneficiar a futuros usuarios sin penalizar al actual.

---

## 3. Contratos de Dominio y Esquema Relacional

### 3.1. Value Object de Dominio: `SupportedLanguageVo`
Ubicación canónica: [`src/features/i18n/domain/supported-language.vo.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/i18n/domain/supported-language.vo.ts).

```typescript
export const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'de', 'it', 'ca'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

/**
 * Diccionario de normalización determinista (Defensa en Profundidad)
 * Previene que variantes naturales o códigos compuestos con región rompan la Whitelist.
 */
const CANONICAL_LANGUAGE_ALIASES: Readonly<Record<string, SupportedLanguage>> = {
  // Español / Castellano
  es: 'es',
  spa: 'es',
  spanish: 'es',
  espanol: 'es',
  español: 'es',
  castellano: 'es',
  // Inglés
  en: 'en',
  eng: 'en',
  english: 'en',
  ingles: 'en',
  inglés: 'en',
  // Francés
  fr: 'fr',
  fra: 'fr',
  fre: 'fr',
  french: 'fr',
  francais: 'fr',
  français: 'fr',
  frances: 'fr',
  francés: 'fr',
  // Alemán
  de: 'de',
  deu: 'de',
  ger: 'de',
  german: 'de',
  deutsch: 'de',
  aleman: 'de',
  alemán: 'de',
  // Italiano
  it: 'it',
  ita: 'it',
  italian: 'it',
  italiano: 'it',
  // Catalán
  ca: 'ca',
  cat: 'ca',
  catalan: 'ca',
  catalán: 'ca',
  catala: 'ca',
  català: 'ca',
};

export class SupportedLanguageVo {
  private readonly _value: SupportedLanguage;

  private constructor(value: SupportedLanguage) {
    this._value = value;
  }

  public static from(raw?: string | null): SupportedLanguageVo {
    if (!raw || typeof raw !== 'string') {
      return new SupportedLanguageVo(DEFAULT_LANGUAGE);
    }

    const clean = raw.trim().toLowerCase();
    
    // 1. Coincidencia directa en alias naturales o canónicos
    if (clean in CANONICAL_LANGUAGE_ALIASES) {
      return new SupportedLanguageVo(CANONICAL_LANGUAGE_ALIASES[clean]);
    }

    // 2. Extracción de subtag primario en códigos compuestos (ej. "en-US", "fr_FR" -> "en", "fr")
    const primarySubtag = clean.split(/[-_]/)[0];
    if (primarySubtag in CANONICAL_LANGUAGE_ALIASES) {
      return new SupportedLanguageVo(CANONICAL_LANGUAGE_ALIASES[primarySubtag]);
    }

    // 3. Fallback Determinista innegociable
    return new SupportedLanguageVo(DEFAULT_LANGUAGE);
  }

  public get value(): SupportedLanguage {
    return this._value;
  }

  public isDefault(): boolean {
    return this._value === DEFAULT_LANGUAGE;
  }
}
```

### 3.2. Topología Relacional en Prisma (MySQL 8)
La persistencia de traducciones ya se encuentra debidamente normalizada en [`src/prisma/schema.prisma`](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma):

```prisma
// Traducciones reactivas de categorías (HU 9 / HU 12)
model TemplateCategoryTranslation {
  id          String           @id @default(cuid())
  categoryId  String           @map("category_id")
  category    TemplateCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  language    String           @db.VarChar(5) // ej. 'en', 'fr', 'de', 'it', 'ca'
  name        String           @db.VarChar(128)
  description String           @db.Text
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  @@unique([categoryId, language])
  @@index([language])
  @@map("template_category_translations")
}

// Traducciones reactivas de cabeceras de guía (HU 9 / HU 12)
model GuideTemplateTranslation {
  id          String        @id @default(cuid())
  templateId  String        @map("template_id")
  template    GuideTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  language    String        @db.VarChar(5)
  title       String        @db.VarChar(255)
  abstract    String        @db.Text
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  @@unique([templateId, language])
  @@index([language])
  @@map("guide_template_translations")
}

// Traducciones reactivas de paradas/nodos secuenciales (HU 9 / HU 12)
model TemplateItemTranslation {
  id          String       @id @default(cuid())
  itemId      String       @map("item_id")
  item        TemplateItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  language    String       @db.VarChar(5)
  title       String       @db.VarChar(255)
  description String       @db.Text
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  @@unique([itemId, language])
  @@index([language])
  @@map("template_item_translations")
}
```

---

## 4. Coreografía del Sistema y Flujos Operativos

### 4.1. Flujo A: Detección Inicial y Aduana Perimetral
1. **Petición Entrante:** El explorador accede a la plataforma. El middleware perimetral o el endpoint de ignición (`/api/triage/ignition`) lee la cabecera `Accept-Language` o la cookie `bx_lang`.
2. **Normalización por Value Object:** La entrada pasa por `SupportedLanguageVo.from(header)`. Si coincide con la Whitelist, se adopta; en caso contrario, se fija deterministamente en `es`.
3. **Persistencia Ligera:** Se emite la cookie `bx_lang` (SameSite=Lax, Path=/), anclada a la sesión `bx_session_id`.
4. **Saludo Contextual:** El SLM genera el saludo de bienvenida en el idioma detectado (`IgnitionOutcome.greeting`), utilizando las plantillas heurísticas correspondientes si se activa el fallback de contingencia.

### 4.2. Flujo B: Soberanía Biológica (Mutación Conversacional en Triaje)
1. **Entrada de Usuario:** El usuario envía un prompt en el chat (ej. *"Can you plan a 2-hour walk in Born?"* o *"A partir de ahora háblame en francés"*).
2. **Triaje Semántico Dual:**
   - Jev AI (`ITypedDecisionEngine`) extrae las variables logísticas de la Matriz de Densidad.
   - El SLM (`IConversationalSLMPort`) evalúa la intención lingüística con su salida constreñida estrictamente por `z.enum(SUPPORTED_LANGUAGES)`.
3. **Actualización de Estado Soberano:** Si se detecta un idioma válido diferente al actual:
   - Se actualiza el campo de idioma en la sesión multivuelta (`DensityMatrixRepositoryPort`).
   - El sobre `TriageOutcomeDto` incluye el metadato reactivo `_sys_lang: SupportedLanguage`.
4. **Respuesta Estructurada:** Si la matriz alcanza el umbral ($\ge 60\%$), Gemini genera la ruta dinámica directamente en el idioma soberano seleccionado.

### 4.3. Flujo C: Consulta de Catálogo y Paciente Cero con SingleFlight
1. **Solicitud de Template:** El cliente solicita una guía curada (ej. `slug: "imprescindibles-gotico"`) con `lang: "de"`.
2. **Evaluación de Idioma Maestro:** Si `lang === "es"`, se entregan directamente las entidades base (`GuideTemplate` + `TemplateItem[]`) con 0 consumo LLM.
3. **Verificación de Caché Relacional (Cache Hit):** Si `lang !== "es"`, se consulta si existen registros en `GuideTemplateTranslation` y `TemplateItemTranslation`. Si existen, se ensambla el DTO localizado y se retorna ($<40\text{ms}$).
4. **Paciente Cero (Cache Miss) con SingleFlight:**
   - Si no existen traducciones, se verifica si ya existe una promesa en ejecución en memoria para `templateId:lang`. De existir, la petición actual se engancha a dicha promesa, evitando llamadas redundantes a Gemini (Anti-Thundering Herd).
   - De ser el primer hilo, se activa el `TemplateTranslationService` con un timeout de **8000ms**.
   - Se invoca a Gemini mediante un esquema estructurado Zod para traducir exclusivamente `title`, `abstract` y los `items[].{title, description}`.
   - Prisma ejecuta un `transaction` insertando las traducciones en las tablas satélite.
   - Se retorna el contenido traducido al usuario. Los siguientes accesos serán Cache Hit instantáneo.
5. **Persistencia Asíncrona Resiliente (Fire-and-Persist):** Si la llamada síncrona supera los 8000ms o la UI solicita corte prematuro:
   - El servidor entrega de inmediato la versión en Castellano (`es`) al usuario con aviso semántico para no degradar su experiencia.
   - La tarea de fondo continúa su curso desacoplada, completando la inserción en MySQL para que el siguiente usuario cuente con la traducción persistida.

### 4.4. Flujo D: Sincronización Reactiva de UI (Sin Fracturas Visuales)
1. **Catálogo Declarativo de UI:** Se define una matriz inmutable de textos de interfaz en el cliente (`UI_DICTIONARY`), abarcando:
   - Botones del Medidor Térmico (`ThermalMeter`): *"Operativo"*, *"Saturado"*, etc.
   - Insignias de Alerta de Carteristas y Avisos del Escudo Anti-Trampas (`HybridCanvas`): niveles `LOW`, `MEDIUM`, `HIGH`, `EXTREME` y cabeceras de advertencia.
   - Llamadas a la Acción de Afiliación (ej. *"Reservar en TheFork"*, *"Pedir Cabify"*, *"Entradas Tiqets"*, *"Tours Civitatis"*).
   - Placeholders del cajón de interacción y estados de carga.
2. **Mutación Instantánea:** Al recibir el flag `_sys_lang` en la respuesta del orquestador, el estado de la PWA muta sincrónicamente todos los elementos estáticos al nuevo idioma, erradicando cualquier disonancia cognitiva sin peticiones adicionales al servidor.

---

## 5. Criterios de Aceptación (Verificación Empírica BDD)

### Escenario 1: Asignación Determinista de Fallback Maestro (Castellano)
- [x] **Dado** un navegador que envía una cabecera `Accept-Language` fuera de la Whitelist (ej. `ru-RU,ru;q=0.9` o `zh-CN`).
- [x] **Cuando** la petición cruza el perímetro de seguridad o el endpoint de ignición (`/api/triage/ignition`).
- [x] **Entonces** `SupportedLanguageVo` resuelve forzosamente `es` (Castellano).
- [x] **Y** se establece la cookie `bx_lang=es`.
- [x] **Y** el saludo de ignición y las sugerencias contextuales se emiten en castellano sin invocar traducciones LLM.

### Escenario 2: Cache Hit Relacional de Guía Curada (0 Tokens)
- [x] **Dado** un usuario navegando con idioma fijado en Inglés (`en`).
- [x] **Y** un template curado cuyas traducciones ya fueron consolidadas previamente en `GuideTemplateTranslation` y `TemplateItemTranslation`.
- [x] **Cuando** el usuario consulta el detalle de la guía.
- [x] **Entonces** el repositorio de templates resuelve la consulta mediante join relacional con las tablas satélite en MySQL.
- [x] **Y** la respuesta se despacha en $< 40\text{ ms}$ con consumo de 0 tokens de Gemini.

### Escenario 3: Traducción Reactiva Persistida Bajo Demanda (Paciente Cero)
- [x] **Dado** un usuario navegando con idioma Francés (`fr`).
- [x] **Y** un template curado que únicamente existe en idioma maestro (`es`) en la base de datos (Cache Miss).
- [x] **Cuando** el caso de uso `GetLocalizedTemplateBySlugUseCase` procesa la solicitud.
- [x] **Entonces** el servicio de traducción delega a Gemini la traducción estructurada en una ventana de hasta 8000ms.
- [x] **Y** las traducciones son persistidas inmediatamente en `GuideTemplateTranslation` y `TemplateItemTranslation` mediante Prisma.
- [x] **Y** las subsiguientes consultas para ese template en francés se resuelven como Cache Hit desde MySQL sin invocar a Gemini.

### Escenario 4: Soberanía Biológica e Interceptación por Lenguaje Natural
- [x] **Dado** un usuario cuya sesión técnica inició en Castellano (`es`).
- [x] **Cuando** el usuario introduce en el chat un prompt explícito como *"Please switch to English, I want to explore Gràcia"* o formula su solicitud directamente en inglés.
- [x] **Entonces** el triaje de la Aduana Universal intercepta el cambio lingüístico restringido estrictamente al enum de la Whitelist.
- [x] **Y** actualiza el idioma en la sesión activa multivuelta (`DensityMatrixRepositoryPort`) y refresca la cookie `bx_lang=en`.
- [x] **Y** el orquestador retorna el itinerario en inglés e inyecta `_sys_lang: "en"` en el DTO de respuesta.

### Escenario 5: Consistencia Absoluta de la Interfaz UI/UX (Zero Dissonance)
- [x] **Dado** un cambio de idioma consolidado a Francés (`fr`).
- [x] **Cuando** el cliente React (`OrchestratorPage` y `HybridCanvas`) recibe el sobre de respuesta con `_sys_lang: "fr"`.
- [x] **Entonces** todos los componentes visuales de control (botones del medidor térmico, niveles de alerta de carteristas, etiquetas de botones de reserva y avisos tácticos) mutan automáticamente al francés mediante el diccionario declarativo del cliente.
- [x] **Y** la interfaz permanece íntegra sin mezcla incongruente de idiomas en los textos estáticos.

### Escenario 6: Resiliencia Fail-Soft y Persistencia Asíncrona (Anti-Bucle de Cache Miss)
- [x] **Dado** un usuario solicitante de un idioma admitido (ej. Alemán `de`) en un template no traducido previamente.
- [x] **Cuando** el conector de Gemini agota el tiempo límite de 8000ms o devuelve un error HTTP transitorio.
- [x] **Entonces** el cliente recibe de inmediato la versión maestra en Castellano (`es`) encapsulada en un `OperationEnvelope` con advertencia semántica, evitando pantallas congeladas.
- [x] **Y** la tarea en background culmina el almacenamiento en MySQL si la respuesta de Gemini se concreta tardíamente, asegurando que el próximo usuario encuentre el Cache Hit y rompa el ciclo de reintentos fallidos.

---

## 6. Trazabilidad de PBIs (Secuencia de Forja S+)

1. **`PBI-I18N-CONTRACTS-001` — Realizado (S+ Grade):** [Esquemas Deterministas, Value Object y Diccionario UI](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Esquemas%20Deterministas,%20Value%20Objects%20y%20Diccionario%20Declarativo%20de%20UI%20(P1).md)
   - Forja de `SupportedLanguageVo`, `SupportedLanguageSchema`, alias canónicos y Whitelist en `src/features/i18n/domain/`.
   - Diccionario declarativo de cadenas de UI (`UI_DICTIONARY`) con tipado estricto por clave e idioma.
   - Pruebas unitarias colocadas (`supported-language.vo.test.ts`).

2. **`PBI-I18N-TEMPLATE-SERVICE-002` — Realizado (S+ Grade):** [Servicio de Localización Reactiva, SingleFlight y Persistencia Satélite Prisma](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Servicio%20de%20Localizaci%C3%B3n%20Reactiva,%20SingleFlight%20y%20Persistencia%20Sat%C3%A9lite%20Prisma%20(P1).md)
   - Puerto `ITemplateTranslationServicePort` y adaptador con cliente Gemini estructurado (timeout 8000ms).
   - Patrón SingleFlight en memoria para deduplicación de traducciones concurrentes.
   - Caso de uso `GetLocalizedTemplateUseCase` con patrón Paciente Cero (Cache Hit relacional / Cache Miss persistido en MySQL).
   - Política Fail-Soft con fallback maestro a Castellano y persistencia asíncrona de contingencia.
   - Tests de integración y unitarios colocados en `src/features/guide-templates/`.

3. **`PBI-I18N-TRIAGE-SOVEREIGNTY-003` — Realizado (S+ Grade):** [Aduana de Triaje, Soberanía Biológica y Cookie Perimetral](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Aduana%20de%20Triaje,%20Soberan%C3%ADa%20Biol%C3%B3gica%20y%20Cookie%20Perimetral%20(P1).md)
   - Inyección del enum cerrado `z.enum(SUPPORTED_LANGUAGES)` en el prompt y esquema del SLM.
   - Detección lingüística en `ContextualIgnitionUseCase` y extracción de intención en `TriageInputUseCase`.
   - Inyección de `_sys_lang` en `TriageOutcomeDtoSchema`.
   - Gobernanza de estado en `DensityMatrixRepositoryPort` y emisión de cookie `bx_lang`.
   - Tests de triaje con mutación conversacional de idioma.

4. **`PBI-I18N-UI-SYNC-004` — Realizado (S+ Grade):** [Sincronización Reactiva de UI en HybridCanvas, ThermalMeter y Orchestrator](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Sincronizaci%C3%B3n%20Reactiva%20de%20UI%20en%20HybridCanvas,%20ThermalMeter%20y%20Orchestrator%20(P1).md)
   - Consumo de `_sys_lang` en `src/app/orchestrator/page.tsx`.
   - Conexión de `HybridCanvas` y `ThermalMeter` con el diccionario declarativo `UI_DICTIONARY`.
   - Localización de botones de afiliados (TheFork, Cabify, Civitatis, etc.) y badges tácticos de carteristas.
   - Verificación de renderizado reactivo sin recarga de página.

---

## 7. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

Todo incremento forjado bajo esta historia de usuario deberá validar la Santa Trinidad de Oráculos antes de su aprobación:

1. **Compilador TypeScript (`tsc --noEmit`):** Exit code 0 (Cero errores de tipado, cero aserciones ciegas `any` o `!`).
2. **Linter AST (`eslint`):** Exit code 0 (Cero warnings, cero imports circulares, reglas estrictas de imports).
3. **Oráculo de Pruebas Unitarias (`vitest run`):** 100% de tests en verde en suites de i18n, templates, triaje y componentes UI asociados.
