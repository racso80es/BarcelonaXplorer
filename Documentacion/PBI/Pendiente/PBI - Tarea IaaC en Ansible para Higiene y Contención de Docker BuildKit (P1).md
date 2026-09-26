# [OPERATIVO] Tarea IaaC en Ansible para Higiene y Contención de Docker BuildKit (P1)

**Identificador:** PBI-OPS-CLEAN-BUILDCACHE-001  
**Historia de Usuario Vinculada:** [HU-KAIZEN-002](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Hardening%20del%20Pipeline%20de%20Despliegue,%20Resiliencia%20IaaC%20e%20Higiene%20de%20Almacenamiento%20v2.2.0.md)  
**Auditoría de Origen:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Prioridad:** P1 (Alta)  
**Estimación:** 2 Story Points  
**Estatus:** 📋 Pendiente  
**Módulos Afectados:** `ansible/deploy.yml`, `src/deploy.sh`  
**Marco Normativo:** Protocolo de Acero — Grado S+ · Axiomas I y II  

---

## 1. Contexto y Justificación

La partición raíz `/dev/nvme0n1p5` del nodo `10.0.10.11` colapsó al 100% de uso (0 bytes libres) debido a que Docker BuildKit acumuló más de 7.6 GB de capas de compilación en `/var/lib/docker/buildkit`. Actualmente los playbooks no ejecutan ninguna política de saneamiento del almacenamiento.

Para evitar futuros colapsos:
1. Ansible debe verificar el espacio libre en disco en sus `pre_tasks`. Si el disco libre en `/` es `< 3 GB`, debe purgar el BuildKit cache (`docker builder prune -a -f`).
2. Implementar una tarea rutinaria de poda de caché preservando un umbral razonable (`docker builder prune -f --keep-storage 2GB`) tras cada despliegue.

---

## 2. Requerimientos Técnicos

1. Incorporar en `pre_tasks` de [`ansible/deploy.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/deploy.yml) la verificación y purga preventiva de BuildKit.
2. Añadir en `src/deploy.sh` un control preliminar por SSH que compruebe que el nodo destino dispone de al menos un 10% de espacio libre en su partición raíz antes de iniciar la transferencia de archivos.

---

## 3. Criterios de Aceptación (BDD)

- **Dado** un nodo de producción que ha acumulado capas de caché Docker.
- **Cuando** se dispara el pipeline con `src/deploy.sh`.
- **Entonces** Ansible asegura automáticamente que el espacio en `/` mantenga un remanente seguro $\ge 4\text{ GB}$, evitando fallos de I/O por "no space left on device".
