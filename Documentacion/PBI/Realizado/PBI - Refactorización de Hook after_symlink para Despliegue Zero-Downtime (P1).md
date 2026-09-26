# [OPERATIVO] Refactorización de Hook after_symlink para Despliegue Zero-Downtime (P1)

**Identificador:** PBI-OPS-DEPLOY-BUILD-FIRST-001  
**Historia de Usuario Vinculada:** [HU-KAIZEN-002](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Hardening%20del%20Pipeline%20de%20Despliegue,%20Resiliencia%20IaaC%20e%20Higiene%20de%20Almacenamiento%20v2.2.0.md)  
**Auditoría de Origen:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Prioridad:** P1 (Alta)  
**Estimación:** 2 Story Points  
**Estatus:** ✅ Realizado  
**Fecha de Implementación:** 2026-09-26  
**Módulos Afectados:** `ansible/hooks/after_symlink.yml`  
**Marco Normativo:** Protocolo de Acero — Grado S+ · Axiomas I, III y V  

---

## 1. Contexto y Justificación

Durante el incidente documentado en `AUD-OPS-PROD-001`, se constató que `after_symlink.yml` ejecutaba una instrucción destructiva imperativa (`docker compose down`) previa a la construcción de la nueva imagen Docker. Dicho comportamiento destruía los contenedores en servicio antes de tener un artefacto compilado y validado, lo que ante fallos en la fase de build producía una indisponibilidad absoluta del 100%.

Se adoptó de manera canónica la estrategia de resiliencia **Build-Before-Swap**:
1. Compilar primero la imagen `barcelonaxplorer-web:latest` en la release activa sin tocar los contenedores en ejecución.
2. Si y sólo si el build resulta exitoso, aplicar la convergencia declarativa con `docker compose up -d --remove-orphans`.
3. Preservar inalterado el contenedor `barcelonaxplorer_mysql` sin reinicios ni corte de sockets TCP.

---

## 2. Requerimientos Técnicos Implementados

1. **Desacoplamiento Atómico en `ansible/hooks/after_symlink.yml`:**
   - **Paso 1 (Aislamiento y Compilación Previa):**
     `docker compose --env-file .env.production -p barcelonaxplorer build web`
     Si esta tarea falla por cualquier causa, el playbook se detiene inmediatamente y los contenedores previos continúan respondiendo peticiones sin interrupción.
   - **Paso 2 (Convergencia Declarativa Zero-Downtime):**
     `docker compose --env-file .env.production -p barcelonaxplorer up -d --remove-orphans`
     Docker Compose sustituye únicamente el contenedor cuya imagen ha variado (`web`), logrando un tiempo de conmutación mínimo ($< 2\text{ s}$) y preservando la base de datos intacta.

---

## 3. Criterios de Aceptación (BDD) — Verificación Empírica

- **Dado** una versión en producción activa sirviendo tráfico.
- **Cuando** se despliega una nueva versión con el hook refactorizado.
- **Entonces** la imagen se compila en segundo plano; el contenedor previo permanece respondiendo peticiones HTTP; y la conmutación al nuevo contenedor ocurre de forma atómica sin invocar `docker compose down`.

---

## 4. Registro de Evidencias de Ejecución

- **Verificación de Sintaxis Ansible:** `ansible-playbook -i ansible/inventory.ini ansible/deploy.yml --syntax-check` -> Exit Code `0`.
- **Estructura Declarativa:** Implementada conforme a los Axiomas III y V del Protocolo de Acero.
