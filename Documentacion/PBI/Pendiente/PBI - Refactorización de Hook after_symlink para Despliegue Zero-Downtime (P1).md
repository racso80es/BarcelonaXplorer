# [OPERATIVO] Refactorización de Hook after_symlink para Despliegue Zero-Downtime (P1)

**Identificador:** PBI-OPS-DEPLOY-BUILD-FIRST-001  
**Historia de Usuario Vinculada:** [HU-KAIZEN-002](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Hardening%20del%20Pipeline%20de%20Despliegue,%20Resiliencia%20IaaC%20e%20Higiene%20de%20Almacenamiento%20v2.2.0.md)  
**Auditoría de Origen:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Prioridad:** P1 (Alta)  
**Estimación:** 2 Story Points  
**Estatus:** 📋 Pendiente  
**Módulos Afectados:** `ansible/hooks/after_symlink.yml`  
**Marco Normativo:** Protocolo de Acero — Grado S+ · Axiomas I, III y V  

---

## 1. Contexto y Justificación

Durante el incidente documentado en [`AUD-OPS-PROD-001`](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md), se constató que [`after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml) ejecutaba `docker compose down` previo a la construcción de la nueva imagen Docker. Esto destruyó los contenedores en servicio, y al fallar la compilación, provocó un corte total de servicio (100% downtime).

Es imperativo implementar la estrategia *Build-Before-Swap*:
1. Compilar primero la imagen `barcelonaxplorer-web:latest` en la release candidata (`docker compose build web`).
2. Si y sólo si el build resulta exitoso, orquestar la convergencia declarativa con `docker compose up -d --remove-orphans`.
3. Preservar intacto el contenedor `barcelonaxplorer_mysql` para evitar reinicios innecesarios de las conexiones activas e InnoDB.

---

## 2. Requerimientos Técnicos

1. Reemplazar la tarea imperativa destructiva de [`after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml) por dos pasos atómicos:
   - **Paso 1 (Construcción Previa):** `docker compose --env-file .env.production -p barcelonaxplorer build web`.
   - **Paso 2 (Convergencia Declarativa):** `docker compose --env-file .env.production -p barcelonaxplorer up -d --remove-orphans`.
2. Asegurar que si el Paso 1 falla, Ansible aborte la ejecución de inmediato sin tocar los contenedores en ejecución.

---

## 3. Criterios de Aceptación (BDD)

- **Dado** una versión en producción activa.
- **Cuando** se despliega una nueva versión con el hook refactorizado.
- **Entonces** la imagen se compila en segundo plano; el contenedor previo permanece respondiendo peticiones HTTP; y la conmutación al nuevo contenedor ocurre en menos de 2 segundos sin invocar `docker compose down`.
