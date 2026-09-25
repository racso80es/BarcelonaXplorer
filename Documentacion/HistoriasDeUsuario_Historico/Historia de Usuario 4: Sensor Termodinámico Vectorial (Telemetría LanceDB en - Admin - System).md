# Historia de Usuario 4: Sensor Termodinámico Vectorial (Telemetría LanceDB en /Admin/System)

**Estatus:** Implementado y Validado S+ Grade (Certificado en Nodo 11)  
**Fecha de Certificación:** 2026-09-25  
**PBI Asociado:** [PBI - Sensor Termodinámico Vectorial (Telemetría LanceDB en Admin System)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Sensor%20Termodin%C3%A1mico%20Vectorial%20%28Telemetr%C3%ADa%20LanceDB%20en%20Admin%20System%29.md)  
**Módulo:** Administración, Telemetría y Órganos Sensoriales ([`/Admin/System`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/System/page.tsx))  

---

## 1. Descripción General

**Como** Operador Técnico y centinela del Nodo 11,  
**Quiero** ampliar la topología del panel de control `/Admin/System` incorporando un sensor dedicado exclusivamente a auditar la salud del motor vectorial embebido (LanceDB) y su volumen de persistencia,  
**Para** anticipar fallos de permisos en el sistema de archivos (Bind Mount), detectar degradación de latencia en disco y garantizar que el cerebro cognitivo de la IA orquestadora esté operando en estado S+ Grade antes de inyectar tráfico real.

---

## 2. Justificación Arquitectónica (Vía del Yunque)

El módulo `/Admin/System` ya opera como la sala de máquinas del monolito, evaluando la persistencia híbrida (MySQL), la aduana de red externa (DNS) y los motores de IA (Gemini, Groq, Jev AI y Telegram). Sin embargo, al ser LanceDB una base de datos embebida que carece de puertos de red externos, no puede monitorizarse mediante un simple ping TCP o SELECT 1. Su punto de fallo crítico no es la red, sino la latencia de disco y los permisos del sistema de archivos anfitrión del Nodo 11.

Por tanto, la telemetría debe inyectar una sonda lógica de I/O que evalúe la integridad física y permisos POSIX del volumen `/app/vector_storage` montado por Docker.

---

## 3. Coreografía de Telemetría (Sensor Vectorial)

- **Inmutabilidad Temporal Absoluta:** La evaluación se ejecuta bajo la directiva estricta `export const dynamic = 'force-dynamic';` de la ruta `/Admin/System`. Esto garantiza que Next.js no devuelva un estado cacheado del motor vectorial; la sonda se dispara en tiempo real con cada recarga del navegador.
- **Prueba de Conocimiento Vectorial (Healthcheck Interno):** El sensor no se limita a verificar si el directorio existe. Ejecuta una operación atómica: conecta con la base de datos LanceDB, valida descriptores mediante `tableNames()` y evalúa el tiempo de respuesta (latencia en ms).
- **Auditoría de Permisos (Bind Mount Fallback):** Evalúa proactivamente los derechos de lectura y escritura del usuario `nextjs` (UID 1001) sobre el directorio externo mapeado para prevenir colapsos silenciosos (`EACCES`).
- **Volcado de Fricción en Telemetría:** Si el sensor detecta una anomalía (ej. base de datos bloqueada o permisos denegados), el error no solo cambia el semáforo visual del panel a Rojo / Ámbar, sino que emite un log reactivo de nivel `WARN` o `ERROR` con el contexto `SYSTEM`, inmediatamente inspeccionable en `/Admin/Logs` mediante `DataTable<TelemetryLogItem>`.

---

## 4. Criterios de Aceptación (Verificación Empírica)

### Escenario 1: Resonancia Vectorial S+ Grade (Estado Óptimo)
- **Dado** el panel `/Admin/System` cargado por el operador.
- **Cuando** el sensor ejecuta la sonda hacia el directorio local de LanceDB.
- **Entonces** el sistema valida permisos de lectura/escritura y comprueba descriptores.
- **Y** la interfaz visualiza el sensor "Persistencia Vectorial" en estado Verde / OK mostrando el número de tablas y la latencia en milisegundos (ej. `Tablas: 2 | 8ms`).

### Escenario 2: Asfixia por Permisos (Error de Bind Mount)
- **Dado** un despliegue donde el directorio físico en el Nodo 11 carece de permisos de escritura para UID 1001.
- **Cuando** el sensor intenta inicializar la conexión en `/Admin/System`.
- **Entonces** la sonda falla por `EACCES` (Permission denied).
- **Y** el semáforo cambia a Rojo / CRÍTICO, emitiendo una alerta visual explícita con la ruta del fallo.
- **Y** el registro del fallo se inyecta en la bitácora reactiva de MySQL bajo el nivel `ERROR` y contexto `SYSTEM`.

### Escenario 3: Volumen Vacío (Primera Instanciación sin Tablas)
- **Dado** un entorno virgen donde el volumen de LanceDB está vacío (primera instanciación).
- **Cuando** el sensor detecta que no existen tablas creadas (`db.tableNames() === []`).
- **Entonces** el sensor se muestra en estado Verde / OK indicando "Tablas: 0 | Xms".
- **Y** no lanza excepciones ni corrompe el sistema de archivos con tablas ficticias.

---

## 5. Puntos de Fricción Resueltos y Ajustes de Forja

- **Normalización Arquitectónica de Tipos:** Se mantuvo la pureza de Clean Architecture ([`CONSTITUTION.MD`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.MD)). La entidad de dominio [`TelemetryEntry`](file:///home/racso/Proyectos/BarcelonaXplorer/src/domain/entities/telemetry-entry.entity.ts) gobierna los casos de uso y puertos, mientras que [`TelemetryLogItem`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/System/TelemetryTableClient.tsx) actúa como DTO en la capa de interfaz.
- **Segregación Térmica de UI:** Conforme a [PBI-ADMIN-CORE-002](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Forja%20de%20la%20Sala%20de%20Control%20y%20Dashboard%20T%C3%A1ctico%20%28Admin%29.md), la visualización tabular reside en `/Admin/Logs` preservando `/Admin/System` descargado de operaciones pesadas de DOM.
- **Auditoría de I/O POSIX:** En [`LanceDbVectorAdapter`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/vector/lancedb-vector.adapter.ts), la sonda `ping()` valida `fs.accessSync(path, R_OK | W_OK)`, detectando problemas de propiedad POSIX en tiempo de carga.
