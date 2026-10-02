---
document_id: PBI-BX-LINEAR-CONFIG-001
title: "[OPERATIVO] Configuración de Entorno y Desacople Documental hacia Linear Tracker"
format: markdown
version: "1.0.0"
created: "2026-10-01"
status: "abierto"
priority: alta
process: infrastructure
related:
  - .SddIA/.dev/.env.example
---

### [OPERATIVO] Configuración de Entorno y Desacople Documental hacia Linear Tracker

#### 1. Descripción General
**Como** Vértice Biológico y Operador Técnico de BarcelonaXplorer,
**Quiero** preparar la infraestructura del repositorio local y configurar las equivalencias ontológicas de Linear,
**Para** que la instancia del proyecto pueda consumir la nueva cápsula de SddIA de forma inmediata, cerrando el ciclo de la gestión de requerimientos (HUs y PBIs) basados en archivos Markdown físicos.

#### 2. Pasos de Configuración Manual (Vértice Biológico)
1. **Forja en Linear:** Crear un Workspace/Team en Linear específico para el proyecto `BarcelonaXplorer` (ej. prefijo `BX`).
2. **Extracción de Llaves:** Generar una Personal API Key en la configuración de Linear.
3. **Auditoría de Estados:** Identificar los UUIDs internos de GraphQL de Linear correspondientes a los estados del flujo del equipo (ej. *Todo*, *In Progress*, *Done*).

#### 3. Criterios de Aceptación (Validación de Instancia)
- [ ] **Higiene de la Bóveda Local:** La clave `LINEAR_API_KEY` ha sido inyectada exitosamente en la bóveda de instancia `.SddIA/.dev/.env` de BarcelonaXplorer. El archivo `.dev/.env.example` global del clon se ha actualizado para reflejar esta nueva dependencia.
- [ ] **Mapeo de Matriz de Estados:** Se ha creado un artefacto de configuración local (ej. `.SddIA/config/linear-mapping.json`) que establece la relación biyectiva entre los estados lógicos que usan los agentes de SddIA (ej. `status_completed`) y los UUIDs del tablero de Linear.
- [ ] **Poda Ontológica de Archivos:** Las carpetas del repositorio que actuaban como base de datos documental (`Documentacion/HistoriasDeUsuario/` y `Documentacion/PBI/Pendiente/`) se han sometido a una Poda Ontológica. Sus contenidos activos están migrados a tickets de Linear, y los archivos en Git archivados en `/Historico` o eliminados.
- [ ] **Test de Fricción (Prueba de Vida):** Desde el cliente de interacción desacoplado (Kalma2), se ha ejecutado un prompt de prueba que invoca a la herramienta de lectura sobre un ticket recién creado (ej. "Extrae los datos del ticket BX-1"). El retorno valida la extracción exitosa del payload.
