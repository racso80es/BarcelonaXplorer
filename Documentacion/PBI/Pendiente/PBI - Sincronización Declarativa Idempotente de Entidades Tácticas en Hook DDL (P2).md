# [OPERATIVO] Sincronización Declarativa Idempotente de Entidades Tácticas en Hook DDL (P2)

**Identificador:** PBI-OPS-DDL-SYNC-TACTICAL-001  
**Historia de Usuario Vinculada:** [HU-KAIZEN-002](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Hardening%20del%20Pipeline%20de%20Despliegue,%20Resiliencia%20IaaC%20e%20Higiene%20de%20Almacenamiento%20v2.2.0.md)  
**Auditoría de Origen:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Prioridad:** P2 (Media)  
**Estimación:** 1 Story Point  
**Estatus:** 📋 Pendiente  
**Módulos Afectados:** `ansible/hooks/after_symlink.yml`  
**Marco Normativo:** Protocolo de Acero — Grado S+ · Axiomas I y III  

---

## 1. Contexto y Justificación

El archivo de migración DDL embebido en [`ansible/hooks/after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml) contenía únicamente las sentencias `CREATE TABLE IF NOT EXISTS` para `SystemConfig`, `TelemetryLog`, `user_anchors` y `magic_link_nonces`.

Con la evolución del módulo de orquestación híbrida en [`schema.prisma`](file:///home/racso/Proyectos/BarcelonaXplorer/src/prisma/schema.prisma), se introdujeron las entidades `TacticalItinerary` y `TacticalItineraryNode` (`tactical_itineraries` y `tactical_itinerary_nodes`). Al no estar incluidas en el hook de Ansible, dependían de una migración manual, violando el principio de infraestructura declarativa automatizada.

---

## 2. Requerimientos Técnicos

1. Actualizar la tarea de sincronización de esquemas en [`ansible/hooks/after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml) incorporando las sentencias DDL completas con índices y foreign keys en cascada para:
   - `tactical_itineraries`
   - `tactical_itinerary_nodes`
2. Garantizar idempotencia estricta mediante cláusulas `CREATE TABLE IF NOT EXISTS`.

---

## 3. Criterios de Aceptación (BDD)

- **Dado** una base de datos recién inicializada o preexistente.
- **Cuando** se ejecuta la tarea de sincronización DDL de Ansistrano.
- **Entonces** las tablas `tactical_itineraries` y `tactical_itinerary_nodes` quedan creadas con sus índices foráneos sin alterar registros existentes ni emitir errores.
