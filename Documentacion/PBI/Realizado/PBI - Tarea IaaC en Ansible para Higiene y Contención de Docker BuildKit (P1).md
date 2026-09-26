# [OPERATIVO] Tarea IaaC en Ansible para Higiene y Contención de Docker BuildKit (P1)

**Identificador:** PBI-OPS-CLEAN-BUILDCACHE-001  
**Historia de Usuario Vinculada:** [HU-KAIZEN-002](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Hardening%20del%20Pipeline%20de%20Despliegue,%20Resiliencia%20IaaC%20e%20Higiene%20de%20Almacenamiento%20v2.2.0.md)  
**Auditoría de Origen:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Prioridad:** P1 (Alta)  
**Estimación:** 2 Story Points  
**Estatus:** ✅ Realizado  
**Fecha de Implementación:** 2026-09-26  
**Módulos Afectados:** `ansible/deploy.yml`, `src/deploy.sh`  
**Marco Normativo:** Protocolo de Acero — Grado S+ · Axiomas I, II y III  

---

## 1. Contexto y Justificación

Durante el incidente registrado en `AUD-OPS-PROD-001`, la partición raíz `/dev/nvme0n1p5` del nodo de producción colapsó al 100% de uso debido a la acumulación de más de 7.6 GB de capas de compilación en `/var/lib/docker/buildkit`.

Para garantizar contención continua e ininterrumpida de almacenamiento:
1. Se dotó a Ansible de comprobación y purga preventiva de BuildKit en sus `pre_tasks` y `post_tasks`.
2. Se incorporó una aserción determinista que detiene el pipeline si el espacio disponible en `/` tras el saneamiento es inferior a 3 GB.
3. Se integró en `src/deploy.sh` una aduana preliminar SSH que bloquea la transferencia de artefactos si el nodo destino tiene menos del 10% de espacio libre en `/`.

---

## 2. Requerimientos Técnicos Implementados

1. **Aduana de Almacenamiento en `src/deploy.sh`:**
   - Consulta SSH sin fricción con timeout estricto.
   - Cálculo determinista del espacio libre (`REMOTE_DISK_FREE_PCT`).
   - Aborto inmediato si el porcentaje libre es `< 10%`.
2. **Tareas IaaC en `ansible/deploy.yml`:**
   - `pre_tasks`: Medición de espacio libre con `df -m`.
   - Purga de contingencia si el espacio libre es `< 3072 MB` (`docker builder prune -a -f`).
   - Poda rutinaria preventiva con límite acotado (`docker builder prune -f --keep-storage 2GB`).
   - Aserción determinista (`ansible.builtin.assert`) exigiendo $\ge 3072\text{ MB}$ libres.
   - `post_tasks`: Poda rutinaria final tras la construcción para purgar capas efímeras.

---

## 3. Criterios de Aceptación (BDD) — Verificación Empírica

- **Dado** un nodo de producción que acumula capas de caché de Docker BuildKit.
- **Cuando** se dispara el pipeline con `src/deploy.sh` o `ansible-playbook ansible/deploy.yml`.
- **Entonces** se audita el espacio disponible, se purga la caché no esencial preservando el límite de 2 GB y se valida que la partición raíz mantenga $\ge 3\text{ GB}$ libres antes de orquestar la conmutación de contenedores.

---

## 4. Registro de Evidencias de Ejecución

- **Verificación de Sintaxis Ansible:** `ansible-playbook -i ansible/inventory.ini ansible/deploy.yml --syntax-check` -> Exit Code `0`.
- **Prueba SSH Preliminar:** Ejecución determinista en nodo `10.0.10.11` reportando 78% libre (22% usado) -> Validación en VERDE.
- **Tipado y Calidad:** Verificado sin regresiones en el pipeline.
