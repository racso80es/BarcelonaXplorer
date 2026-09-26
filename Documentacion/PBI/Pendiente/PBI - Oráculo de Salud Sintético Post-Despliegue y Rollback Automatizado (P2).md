# [OPERATIVO] Oráculo de Salud Sintético Post-Despliegue y Rollback Automatizado (P2)

**Identificador:** PBI-OPS-HEALTHCHECK-MONITOR-001  
**Historia de Usuario Vinculada:** [HU-KAIZEN-002](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Hardening%20del%20Pipeline%20de%20Despliegue,%20Resiliencia%20IaaC%20e%20Higiene%20de%20Almacenamiento%20v2.2.0.md)  
**Auditoría de Origen:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Prioridad:** P2 (Media)  
**Estimación:** 1 Story Point  
**Estatus:** 📋 Pendiente  
**Módulos Afectados:** `ansible/hooks/after_symlink.yml`, `ansible/rollback.yml`  
**Marco Normativo:** Protocolo de Acero — Grado S+ · Axiomas II y IV  

---

## 1. Contexto y Justificación

Tras la recreación de contenedores en Ansistrano, el pipeline consideraba el despliegue completado simplemente si el comando Docker finalizaba con código 0, sin validar si la aplicación Next.js estaba realmente respondiendo peticiones HTTP o si la conexión a la base de datos funcionaba de extremo a extremo.

Se requiere un **Oráculo de Despliegue** que ejecute una sonda sintética (HTTP POST a `/api/telemetry/log`) y, en caso de fallo persistente tras un umbral de reintentos, active automáticamente el playbook de reversión [`ansible/rollback.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/rollback.yml) restaurando la release anterior.

---

## 2. Requerimientos Técnicos

1. Incorporar en [`ansible/hooks/after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml) una tarea con el módulo `ansible.builtin.uri` que sondee `http://127.0.0.1:8080/api/telemetry/log`.
2. Validar que la respuesta contenga `status: 200` o `202` y el cuerpo JSON esperado.
3. Si el sondeo agota los reintentos (ej. 10 intentos con delay de 3s), disparar el bloque de rescate (`rescue`) que devuelva el symlink `current` a la versión anterior y recargue los contenedores de esa versión.

---

## 3. Criterios de Aceptación (BDD)

- **Dado** una release desplegada con un fallo interno que impide a Next.js arrancar.
- **Cuando** el sondeo sintético detecta fallo persistente.
- **Entonces** Ansible intercepta el fallo en la fase de verificación y revierte automáticamente a la release inmediatamente anterior, garantizando cero tiempo de indisponibilidad para los usuarios.
