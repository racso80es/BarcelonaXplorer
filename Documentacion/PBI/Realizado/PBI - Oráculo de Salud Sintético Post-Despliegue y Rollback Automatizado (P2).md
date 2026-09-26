# [OPERATIVO] Oráculo de Salud Sintético Post-Despliegue y Rollback Automatizado (P2)

**Identificador:** PBI-OPS-HEALTHCHECK-MONITOR-001  
**Historia de Usuario Vinculada:** [HU-KAIZEN-002](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Hardening%20del%20Pipeline%20de%20Despliegue,%20Resiliencia%20IaaC%20e%20Higiene%20de%20Almacenamiento%20v2.2.0.md)  
**Auditoría de Origen:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Prioridad:** P2 (Media)  
**Estimación:** 1 Story Point  
**Estatus:** ✅ Realizado  
**Fecha de Implementación:** 2026-09-26  
**Módulos Afectados:** `ansible/hooks/after_symlink.yml`, `ansible/rollback.yml`  
**Marco Normativo:** Protocolo de Acero — Grado S+ · Axiomas II y IV  

---

## 1. Contexto y Justificación

Tras la recreación de contenedores en Ansistrano, el pipeline consideraba el despliegue completado simplemente si el comando Docker finalizaba con código 0, sin validar si la aplicación Next.js estaba realmente respondiendo peticiones HTTP o si la conexión a la base de datos MySQL funcionaba de extremo a extremo.

Se implementó el **Oráculo de Despliegue**: una sonda sintética HTTP POST a `/api/telemetry/log` en `http://127.0.0.1:8080/api/telemetry/log`. Si tras 10 intentos (delay 3s) la sonda no recibe una confirmación válida (`status_code` 200/202 con `status: accepted`), el bloque `rescue` activa la reversión automática del symlink `current` a la release previa y restaura los contenedores estables.

---

## 2. Requerimientos Técnicos Implementados

1. **Sondeo Sintético con `ansible.builtin.uri` en `ansible/hooks/after_symlink.yml`:**
   - Despacho de evento sintético tipado a `/api/telemetry/log`.
   - Validación estricta de código de respuesta HTTP `200` o `202`.
   - Inspección del cuerpo JSON recibido (`json.status == 'accepted'`).
   - Política de reintentos: 10 intentos con intervalo de 3 segundos (ventana máxima de tolerancia: 30 segundos).
2. **Mitigación y Rollback Automatizado (`rescue`):**
   - Captura determinista de cualquier fallo de conexión o HTTP no-200/202.
   - Localización de la release inmediatamente anterior en `{{ ansistrano_deploy_to }}/releases/`.
   - Conmutación atómica del enlace simbólico `current`.
   - Levantamiento de los contenedores de la versión anterior vía `docker compose up -d --remove-orphans`.
   - Emisión de fallo explícito (`ansible.builtin.fail`) para registrar la incidencia sin dejar el entorno inoperativo.
3. **Simetría Operativa en `ansible/rollback.yml`:**
   - Adaptación formal con trazabilidad de axiomas II y IV.

---

## 3. Criterios de Aceptación (BDD) — Verificación Empírica

- **Dado** una release desplegada en el nodo de producción.
- **Cuando** el pipeline culmina la ignición de contenedores.
- **Entonces** Ansistrano ejecuta el sondeo sintético sobre `/api/telemetry/log`; valida la respuesta JSON `status: accepted`; y en caso de degradación severa, revierte automáticamente a la release inmediatamente anterior, garantizando cero tiempo de indisponibilidad para los usuarios.

---

## 4. Registro de Evidencias de Ejecución

- **Verificación de Sintaxis Ansible:** `deploy.yml` y `rollback.yml` validados con `ansible-playbook --syntax-check` -> Exit Code `0`.
- **Validación Empírica del Módulo URI en Nodo 11:**
  ```text
  10.0.10.11 | SUCCESS => {
      "status": 202,
      "json": {
          "status": "accepted",
          "message": "Evento de telemetría encolado para persistencia."
      }
  }
  ```
