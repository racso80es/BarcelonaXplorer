# [OPERATIVO] Historia de Usuario: Hardening del Pipeline de Despliegue, Resiliencia IaaC e Higiene de Almacenamiento v2.2.0

**Identificador:** HU-KAIZEN-002  
**Estatus:** Realizada / Certificada (5/5 PBIs Completados — 8/8 SP — Protocolo de Acero S+)  
**Fecha de Creación:** 2026-09-26  
**Última Actualización:** 2026-09-26  
**Naturaleza:** Infraestructura como Código (IaaC), Resiliencia Operativa, Continuidad de Negocio (Zero-Downtime) y Mantenimiento Kaizen Continuo  
**Auditoría Base Vinculada:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Marco Normativo:** Protocolo de Acero — Grado S+ · [`CONSTITUTION.md`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md) · [Anexo Constitucional: Axiomas de Forja S+ Grade](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/%5BARQUITECTURA%5D%20Anexo%20Constitucional:%20Axiomas%20de%20Forja%20S+%20Grade%20%28Optimizaci%C3%B3n%20para%20IA%29.md)  
**Módulos Afectados:** `ansible/`, `ansible/hooks/`, `src/app/`, `src/public/fonts/`, `src/deploy.sh`  
**Prioridad:** Alta (P1)  
**Estimación Global:** 8 Story Points (5/5 PBIs culminados exitosamente)  

---

## 1. Descripción General (INVEST)

**Como** Arquitecto de Infraestructura y Operador Táctico (Vértice Biológico),  
**Quiero** refactorizar integralmente el pipeline de orquestación Ansistrano (`deploy.yml` y `after_symlink.yml`), integrando una política estricta de compilación previa antes de la sustitución de contenedores (*Build-Before-Swap*), higiene automatizada de almacenamiento Docker en cada despliegue, aislamiento de dependencias de red en tiempo de construcción (fuentes tipográficas locales) y sondeos de salud con reversión automática,  
**Para** garantizar el despliegue continuo con cero tiempo de inactividad (Zero-Downtime), erradicar interrupciones por saturación de disco en la partición raíz del nodo de producción y asegurar que ningún fallo en la compilación afecte los servicios actualmente en servicio.

---

## 2. Justificación Arquitectónica (Los Cinco Axiomas S+ Grade)

1. **Axioma I — Ley de Economía Termodinámica (Localidad y Eficiencia de Recursos):**  
   - La contención activa del espacio en disco (`docker builder prune -f --keep-storage 2GB`) erradica el crecimiento descontrolado de la caché de BuildKit, evitando el desbordamiento de la partición raíz de 73 GB.
   - Las fuentes se alojan localmente (`next/font/local`), eliminando peticiones HTTP redundantes a Google Fonts durante cada compilación de contenedor.

2. **Axioma II — Tolerancia Cero a la Inferencia (Fronteras Deterministas):**  
   - La verificación previa del espacio en disco disponible y la salud de los servicios post-despliegue se rigen por aserciones deterministas: la tarea falla explícitamente si el disco libre es `< 3 GB` o si el endpoint HTTP no responde `200 OK` o `202 Accepted` en el tiempo umbral.

3. **Axioma III — Diseño Declarativo sobre Lógica Imperativa:**  
   - Eliminación de secuencias destructivas imperativas (`docker compose down && docker compose up`). Se adopta la convergencia declarativa nativa de Docker Compose (`docker compose up -d --remove-orphans`), donde Docker sustituye únicamente los contenedores cuya imagen ha cambiado.

4. **Axioma IV — El Peaje del Oráculo (Santa Trinidad de Despliegue):**  
   - Introducción de un Oráculo de Despliegue en Ansible: tras la recreación de contenedores, un sondeo sintético sobre `/api/telemetry/log` valida el funcionamiento integral del stack (Next.js + MySQL + Prisma) antes de dar por sellada la release.

5. **Axioma V — Ejecución Encapsulada y Aislamiento de Fallos:**  
   - Principio *Build-Before-Swap*: la fase de construcción de la imagen se aísla de la fase de ignición. Si la compilación aborta por cualquier motivo, los contenedores anteriores continúan sirviendo tráfico sin degradación ni corte.

---

## 3. Criterios de Aceptación (Verificación Empírica BDD)

### Escenario 1: Sustitución Atómica Zero-Downtime (*Build-Before-Swap*)
- **Dado** una versión en producción preexistente sirviendo tráfico en el puerto 8080 del nodo 11.
- **Cuando** se ejecuta `ansible-playbook -i ansible/inventory.ini ansible/deploy.yml`.
- **Entonces** Ansistrano compila la nueva imagen `barcelonaxplorer-web:latest` mientras la versión previa permanece activa, y únicamente tras la salida exitosa del build se recrea el contenedor web con un tiempo de conmutación `< 2 segundos`, sin reiniciar ni alterar el contenedor `barcelonaxplorer_mysql`.

### Escenario 2: Protección ante Fallos de Compilación (Continuidad de Servicio)
- **Dado** una modificación errónea en el código fuente que rompe `npm run build`.
- **Cuando** el pipeline de despliegue llega a la fase de construcción de la imagen.
- **Entonces** el playbook de Ansible aborta de inmediato con error, la release activa previa permanece intacta y los contenedores en ejecución no sufren reinicio ni interrupción de servicio.

### Escenario 3: Higiene Automatizada de Almacenamiento Docker (Prevención de Disco Lleno)
- **Dado** un historial de múltiples despliegues acumulando capas intermedias en `/var/lib/docker/buildkit`.
- **Cuando** se inicia la ejecución de `deploy.yml`.
- **Entonces** una tarea `pre_task` de Ansible ejecuta la purga de caché huérfana preservando un límite seguro (`--keep-storage 2GB`), asegurando que la partición raíz `/` mantenga un umbral mínimo de al menos 3 GB disponibles antes de iniciar el nuevo build.

### Escenario 4: Compilación Aislada e Inmutable sin Acceso a Google Fonts
- **Dado** el proceso de compilación `RUN npm run build` dentro del Dockerfile.
- **Cuando** Turbopack empaqueta el diseño tipográfico global en `app/layout.tsx`.
- **Entonces** resuelve las fuentes `Geist` y `Geist Mono` desde archivos locales estáticos empaquetados en `public/fonts/` vía `next/font/local`, completando la compilación con 0 peticiones salientes a `fonts.googleapis.com`.

### Escenario 5: Sincronización Relacional Exhaustiva e Idempotente
- **Dado** la base de datos `barcelonaxplorer_db` en el contenedor `barcelonaxplorer_mysql`.
- **Cuando** se ejecuta el hook de migración DDL en `after_symlink.yml`.
- **Entonces** se verifican y crean idempotentemente todas las tablas del modelo Prisma, incluyendo `tactical_itineraries` y `tactical_itinerary_nodes`, sin requerir intervención manual.

---

## 4. Desglose Operativo en Ítems del Backlog (PBIs Ejecutados y Certificados)

| Prioridad | Identificador | Título del PBI | Módulos Principales | Estimación | Commit | Estatus |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| **P1** | `PBI-OPS-DEPLOY-BUILD-FIRST-001` | [Refactorización de Hook after_symlink para Despliegue Zero-Downtime (P1)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Refactorizaci%C3%B3n%20de%20Hook%20after_symlink%20para%20Despliegue%20Zero-Downtime%20%28P1%29.md) | `ansible/hooks/after_symlink.yml` | 2 SP | `880cb4d` | ✅ Realizado |
| **P1** | `PBI-OPS-CLEAN-BUILDCACHE-001` | [Tarea IaaC en Ansible para Higiene y Contención de Docker BuildKit (P1)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Tarea%20IaaC%20en%20Ansible%20para%20Higiene%20y%20Contenci%C3%B3n%20de%20Docker%20BuildKit%20%28P1%29.md) | `ansible/deploy.yml`, `src/deploy.sh` | 2 SP | `3304acd` | ✅ Realizado |
| **P2** | `PBI-ASSET-FONT-LOCAL-001` | [Localización Inmutable de Tipografías con next-font-local en Build de Docker (P2)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Localizaci%C3%B3n%20Inmutable%20de%20Tipograf%C3%ADas%20con%20next-font-local%20en%20Build%20de%20Docker%20%28P2%29.md) | `src/app/layout.tsx`, `src/public/fonts/` | 2 SP | `7d9d86e` | ✅ Realizado |
| **P2** | `PBI-OPS-DDL-SYNC-TACTICAL-001` | [Sincronización Declarativa Idempotente de Entidades Tácticas en Hook DDL (P2)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Sincronizaci%C3%B3n%20Declarativa%20Idempotente%20de%20Entidades%20T%C3%A1cticas%20en%20Hook%20DDL%20%28P2%29.md) | `ansible/hooks/after_symlink.yml` | 1 SP | `51d3ba3` | ✅ Realizado |
| **P2** | `PBI-OPS-HEALTHCHECK-MONITOR-001` | [Oráculo de Salud Sintético Post-Despliegue y Rollback Automatizado (P2)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Or%C3%A1culo%20de%20Salud%20Sint%C3%A9tico%20Post-Despliegue%20y%20Rollback%20Automatizado%20%28P2%29.md) | `ansible/hooks/after_symlink.yml`, `ansible/rollback.yml` | 1 SP | `80d8cb5` | ✅ Realizado |

---

## 5. Acciones Kaizen de Mantenimiento Continuo Incorporadas

Adicionalmente a los PBIs de software e infraestructura, se formalizaron las siguientes directivas de mantenimiento continuo:

1. **Monitoreo de Snapshots Timeshift en Nodo 11:**
   - Mantener política de rotación con un máximo de 2 snapshots locales para preservar el volumen NVMe del sistema operativo (`/timeshift`).
2. **Aduana de Espacio en Disco en `deploy.sh`:**
   - Verificación automatizada por SSH que bloquea la transferencia si la partición raíz dispone de menos del 10% de espacio libre (umbral de 7.3 GB).
3. **Oráculo Sintético Post-Despliegue en `after_symlink.yml`:**
   - Sondeo recurrente mediante `ansible.builtin.uri` contra el endpoint `/api/telemetry/log` con mitigación automática mediante reversión de symlink y recreación de contenedores estables.
