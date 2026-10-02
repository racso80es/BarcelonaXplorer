# [ARQUITECTURA] Documento Destilado: PBI - Estudio Empírico de Fuentes de Contexto y Veredicto del Parser HTML

**Identificador:** PBI-CTX-001  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-30  
**Fecha de Finalización:** 2026-10-02  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §2, §2.1, §4.3, Anexo A · Escenario 0  
**Módulo:** Documentación (`Documentacion/Fuentes/`), seed `src/features/context-sources/context-sources.seed.yml`  
**Entorno:** Peticiones HTTP reales contra las fuentes candidatas; medición local de librerías npm  
**Prioridad:** Crítica (P0 — desbloquea PBI-CTX-004 a PBI-CTX-011)  
**Estimación Táctica:** 5 Story Points  
**Depende de:** —  
**Bloquea:** PBI-CTX-004, PBI-CTX-005, PBI-CTX-006, PBI-CTX-007, PBI-CTX-008 (y transitivamente el resto del núcleo)  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Validación empírica de las once fuentes candidatas del Anexo A y búsqueda de fuentes adicionales, con muestras crudas reales. Veredicto arquitectónico sobre la librería de parseo HTML de servidor. Producción del seed YAML con solo fuentes viables.
- **Entorno:** `Documentacion/Fuentes/[ESTUDIO] Viabilidad de Fuentes de Contexto Hiperlocal.md`, carpeta de muestras adjunta, seed YAML.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Cero Alucinación):* Ningún veredicto sin evidencia: respuesta HTTP real, cabeceras de *rate limit*, enlace a licencia/ToS y muestra cruda. Los estados documentales del Anexo A (p. ej. Eventbrite, Meetup, `?municipi=Barcelona`) se confirman o refutan con peticiones, no se copian.
  - *Filtro B (Determinismo):* Cada fuente se evalúa con la misma matriz de cuatro criterios (Acceso, Licencia, Estructura, Valor) de la HU §2.
  - *Filtro C (Eficiencia Térmica):* Se priorizan fuentes estructuradas (JSON, Socrata, iCal, RSS, SPARQL, JSON-LD) frente a `HTML_LLM`, que consume tokens.

---

## 1. Declaración de Intención (INVEST)

**Como** Arquitecto del motor de contexto,  
**Quiero** un estudio empírico, con muestras reales, de qué fuentes de datos de Barcelona son accesibles, reutilizables legalmente, parseables y útiles, y qué parser HTML usar en servidor,  
**Para** forjar el pipeline de ingesta sobre datos verificados y no sobre suposiciones.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Informe):** Existe `Documentacion/Fuentes/[ESTUDIO] Viabilidad de Fuentes de Contexto Hiperlocal.md` con una fila por fuente A1–A11 y veredicto `Viable` / `No viable` / `Requiere clave` / `Requiere pago`.
- [x] **CA-2 (Evidencia por fuente):** Cada fila incluye: URL exacta del endpoint o dataset (ID de dataset en Socrata/CKAN), código HTTP obtenido, límites de peticiones (cabecera o documentación enlazada), licencia/ToS enlazados, formato real y conteo de entradas útiles en la muestra.
- [x] **CA-3 (Muestras crudas):** Una muestra cruda por fuente viable guardada junto al informe (se reutilizará como *fixture* en los tests de adaptadores). Sin credenciales en las muestras.
- [x] **CA-4 (Mapeo al contrato):** Para cada fuente viable, tabla de mapeo campo-a-campo hacia `ContextEntrySchema` (HU §4.1), marcando campos ausentes. Si algún campo obligatorio del esquema no existe en ninguna fuente viable, se propone su relajación con justificación (el esquema definitivo lo cierra PBI-CTX-005).
- [x] **CA-5 (Ampliación del catálogo):** Al menos una búsqueda documentada de fuentes no listadas (agendas de distrito, centros cívicos, bibliotecas, mercados, festivales), evaluadas con la misma matriz.
- [x] **CA-6 (Veredicto legal):** Las fuentes comerciales (A5 Ticketmaster) y las de extracción desde webs (A8 JSON-LD) tienen veredicto explícito sobre ToS y `robots.txt` antes de poder entrar en el seed.
- [x] **CA-7 (Veredicto del parser HTML):** Comparativa entre `cheerio` (incluye `htmlparser2` y `parse5`), `htmlparser2` directo, `node-html-parser` y `linkedom`, midiendo tamaño instalado y tiempo de parseo sobre las muestras HTML reales. Decisión final registrada con justificación. `jsdom` queda descartado en runtime.
- [x] **CA-8 (Necesidad de `HTML_LLM`):** El informe declara si alguna fuente viable requiere `HTML_LLM` (HTML sin JSON-LD). Si ninguna lo requiere, PBI-CTX-008 se marca como **Cancelado**.
- [x] **CA-9 (Enum de tipos):** Lista cerrada de `ContextSourceType` necesarios según las fuentes viables (puede reducir el enum de la HU §3.1).
- [x] **CA-10 (Seed YAML):** `context-sources.seed.yml` en YAML canónico comentado ([`Estandar-Formato-Configuracion.yml`](../../../.SddIA/library/norms/Estandar-Formato-Configuracion.yml)) con **solo** fuentes `Viable`. Este fichero se crea aquí pero no se carga hasta PBI-CTX-004.

---

## 3. Evidencia de Cumplimiento

- **Informe Canónico:** `Documentacion/Fuentes/[ESTUDIO] Viabilidad de Fuentes de Contexto Hiperlocal.md` consolidado con la evaluación empírica de fuentes candidatas (A1-A11) y ampliadas (E1-E2).
- **Muestras Crudas Consolidadas:** Carpeta `Documentacion/Fuentes/muestras-contexto/` con 7 archivos crudos (`socrata-agenda-cultural.json`, `socrata-equipaments-culturals.json`, `wikidata-monuments.json`, `beteve-agenda.rss`, `bcn-festes.ics`, `bcn-opendata-ckan.json`, `timeout-jsonld.html`).
- **Veredicto Parser HTML:** `node-html-parser` (661 KB, 2 dependencias, ~3.2 ms) seleccionado como analizador ligero de servidor, con `cheerio` como alternativa certificada. `jsdom` formalmente vetado.
- **Veredicto HTML_LLM:** El 100% de las fuentes viables disponen de endpoints estructurados nativos; `HTML_LLM` queda descartado por economía térmica y PBI-CTX-008 cancelado.
- **Catálogo Semilla Canónico:** `src/features/context-sources/context-sources.seed.yml` creado con 6 fuentes `Viable` en YAML canónico validado por el oráculo `yaml`.
