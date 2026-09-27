# [OPERATIVO] Historia de Usuario 11: Ecosistema Reactivo y Drops de Alivio (Fase de Ejecución en Tiempo Real)

- **Estatus:** Realizado (S+ Grade) · Forja Culminada y Validada  
- **Fecha de Aprobación & Culminación:** 2026-09-27  
- **Autor:** Operador Técnico / Arquitectura BarcelonaXplorer  
- **Módulo:** Motor Reactivo (EDA), Bot de Telegram y Centinela de Patrulla (`src/features/telegram/reactive/`, `src/app/api/telegram/patrol/`)  
- **Marco Normativo & Diseño:** [AGENTS.md (Protocolo de Acero S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/AGENTS.md) · [ADR-001 (Vertical Slicing)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md) · [HU-2.2 (Anclaje Táctico Telegram Bridge)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/Historia%20de%20Usuario%202.2:%20Anclaje%20T%C3%A1ctico%20y%20Persistencia%20de%20Larga%20Duraci%C3%B3n%20%28Telegram%20Bridge%29.md) · [HU-10 (Gamificación Logística y Escudo de Supervivencia)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2010:%20Gamificaci%C3%B3n%20Log%C3%ADstica%20y%20Escudo%20de%20Supervivencia%20%28Fase%20de%20Generaci%C3%B3n%29.md)  

---

## Matriz de Indexación Tridimensional

- **Naturaleza:** Arquitectura Dirigida por Eventos (EDA), Proactividad Sensorial en Tiempo Real, Táctica del Refugio y Monetización Asimétrica Preventiva (CPA de Movilidad y Cultura Techada).
- **Entorno:** Servidor Next.js 16 App Router, MySQL 8 / Prisma ORM (`UserAnchor`, `TacticalItinerary`), Sensor Meteorológico OpenMeteo (`IWeatherPort`), Gateway Telegram (`TelegramBotGatewayPort`), Value Object Geodésico Haversine inmutable (`GeometricFatigueVo`).
- **Entropía Asimilada:**
  1. **Transición del Modelo Pasivo al Modelo Proactivo (Filtro A):** El sistema deja de limitarse a responder consultas para patrullar proactivamente el estado del usuario mediante un centinela reactivo periódico o bajo demanda (`/api/telegram/patrol`).
  2. **Cálculo Determinista de Desgaste Termodinámico (Filtro B - Fatiga Geométrica):** Se erradica la estimación imprecisa de distancia. Mediante `GeometricFatigueVo` se calcula de forma inmutable la distancia Haversine acumulada entre coordenadas consecutivas de la ruta activa. Al superar 5.0 km, se despacha un drop CPA de movilidad con descuento (Cabify/FreeNow).
  3. **Táctica del Refugio por Entropía Ambiental (Filtro B - Clima):** Detección en vivo de lluvia inminente o clima adverso mediante `IWeatherPort`. Reevaluación inmediata de los waypoints exteriores y asignación determinista del refugio interior techado más cercano de Barcelona (`findNearestIndoorShelter`), enviando la alerta con enlace CPA cultural directo.
  4. **Resiliencia Operativa y Aislamiento por Bulkhead (Filtro C):** Si un usuario falla en el envío o carece de ruta activa, el bucle de patrulla no interrumpe el servicio para el resto de usuarios anclados. Caídas de APIs externas degradan elegantemente en sobres `OperationEnvelope`.

---

## 1. Descripción General

**Como** turista ejecutando activamente mi ruta S+ Grade en las calles de Barcelona,  
**Quiero** que el sistema actúe como un compañero reactivo que detecte mi fatiga acumulada o cambios en el entorno (lluvia repentina),  
**Para** recibir "drops" tácticos en mi teléfono que me ofrezcan soluciones inmediatas a mis problemas físicos o logísticos en tiempo real.

---

## 2. Justificación Arquitectónica (Táctica del Refugio y Vía de la Red)

Aquí es donde el sistema abandona el concepto de "Guía" y se convierte en "Ecosistema de Supervivencia". Utilizando la identidad anclada al smartphone (el bot de Telegram de la Historia de Usuario 2.2), el servidor pasa de un modelo pasivo (esperar consultas) a un modelo proactivo basado en eventos (EDA).

El sistema calcula el desgaste termodinámico del usuario (kilómetros caminados acumulados en el itinerario) y cruza esa variable con las condiciones atmosféricas en vivo. Si detecta fricción crítica, lanza un salvavidas comercializado (CPA):
- **Fatiga:** Ofrece transporte motorizado inmediato con descuento para el último tramo empinado o distante.
- **Entropía Climática:** Redirige al turista hacia espacios museísticos o gastronómicos techados con acceso directo para evitar la desorientación bajo la lluvia.

---

## 3. Criterios de Aceptación (Verificación Empírica Culminada)

### Escenario 1: Drop de Alivio por Fatiga Geométrica

- [x] **Dado** un usuario con anclaje activo de Telegram (`UserAnchor`) ejecutando una ruta a pie continua calculada internamente en más de 5 kilómetros.
- [x] **Cuando** el reloj del sistema o centinela de patrulla evalúa el avance hacia el siguiente nodo lejano.
- [x] **Entonces** el servidor dispara un evento asíncrono y mensaje vía `TelegramBotGatewayPort` al Telegram del usuario.
- [x] **Y** el mensaje inyecta un enlace CPA de movilidad con botón interactivo: *"Llevas mucha tralla en las piernas. Si quieres saltarte la caminata hasta Montjuïc, aquí tienes un Cabify con descuento para el último tramo."*

### Escenario 2: Refugio Táctico por Entropía Ambiental (Clima)

- [x] **Dado** un usuario en medio de una ruta planificada mayoritariamente al aire libre.
- [x] **Cuando** el centinela de patrulla detecta una alerta de lluvia inminente en Barcelona mediante la API meteorológica (`IWeatherPort`).
- [x] **Entonces** el sistema reevalúa el itinerario actual del usuario en tiempo real.
- [x] **Y** le envía una notificación empujando el nodo interior techado más cercano (calculado geodésicamente desde el catálogo táctico `INDOOR_TACTICAL_SHELTERS`) con su respectivo enlace de afiliación: *"Lluvia inminente en 15 minutos en Barcelona. Cancela el mirador y refúgiate en Casa Batlló; saca el ticket rápido aquí."*

---

## 4. Trazabilidad de PBIs Implementados Secuencialmente

1. [`PBI-EDA-DROPS-CONTRACTS-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Esquemas%20Deterministas,%20Value%20Objects%20y%20Contratos%20de%20Drops%20de%20Alivio%20y%20Refugio%20%28P1%29.md):
   - Value Object `GeometricFatigueVo` con fórmula Haversine inmutable.
   - Esquemas Zod `FatigueReliefDropPayloadSchema`, `WeatherShelterDropPayloadSchema`, `ReactiveDropEventSchema`.
   - Catálogo `INDOOR_TACTICAL_SHELTERS` y algoritmo determinista `findNearestIndoorShelter`.
   - Commit: `f2a0fba`
2. [`PBI-EDA-REACTIVE-PATROL-002`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Caso%20de%20Uso%20de%20Patrulla%20Reactiva,%20Inyecci%C3%B3n%20de%20Salvavidas%20y%20Adaptador%20de%20Telegram%20%28P1%29.md):
   - Caso de uso `ReactivePatrolUseCase` con Pure DI (`TelegramBotGatewayPort`, `IWeatherPort`).
   - Lógica de bifurcación de rescate: lluvia inminente y fatiga > 5km.
   - Encapsulación en sobre canónico `OperationEnvelope<ReactiveDropResult>` con tolerancia Fail-Soft.
   - Commit: `60516d2`
3. [`PBI-EDA-DISPATCH-ENDPOINT-003`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Endpoint%20de%20Patrulla%20T%C3%A1ctica%20Reactiva%20y%20Sincronizaci%C3%B3n%20con%20Rutas%20Activas%20%28P1%29.md):
   - API Route `POST /api/telegram/patrol` protegida por token secreto.
   - Sincronización con Prisma (`UserAnchor`, `TacticalItinerary`, `TacticalItineraryNode`).
   - Bucle de patrulla resiliente con patrón Bulkhead y reporte de telemetría de drops emitidos.
   - Commit: `7312057`

---

## 5. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

- **Compilador TypeScript (`tsc --noEmit`):** Exit code 0 (Cero errores de compilación).
- **Linter AST (`eslint`):** Exit code 0 (0 warnings, 0 errores).
- **Oráculo de Pruebas Unitarias (`vitest`):** 53 tests en vertical de telegram y rutas asociadas en VERDE al 100%.
