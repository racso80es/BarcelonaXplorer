# [OPERATIVO] Historia de Usuario: Hardening del Pipeline de Despliegue, Resiliencia IaaC e Higiene de Almacenamiento v2.2.0

**Identificador:** HU-KAIZEN-002  
**Estatus:** Planificada / Pendiente de Implementación  
**Fecha de Creación:** 2026-09-26  
**Última Actualización:** 2026-09-26  
**Naturaleza:** Infraestructura como Código (IaaC), Resiliencia Operativa, Continuidad de Negocio (Zero-Downtime) y Mantenimiento Kaizen Continuo  
**Auditoría Base Vinculada:** [AUD-OPS-PROD-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Incidente%20de%20Despliegue%20y%20Estado%20del%20Nodo%20de%20Produccion.md)  
**Marco Normativo:** Protocolo de Acero — Grado S+ · [`CONSTITUTION.md`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.md) · [Anexo Constitucional: Axiomas de Forja S+ Grade](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/norms/%5BARQUITECTURA%5D%20Anexo%20Constitucional:%20Axiomas%20de%20Forja%20S+%20Grade%20%28Optimizaci%C3%B3n%20para%20IA%29.md)  
**Módulos Afectados:** `ansible/`, `ansible/hooks/`, `src/app/`, `src/public/fonts/`, `scripts/`  
**Prioridad:** Alta (P1)  
**Estimación Global:** 8 Story Points (4 PBIs proyectados)  

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
   - La verificación previa del espacio en disco disponible y la salud de los servicios post-despliegue se rigen por aserciones deterministas: la tarea falla explícitamente si el disco libre es `< 3 GB` o si el endpoint HTTP no responde `200 OK` en el tiempo umbral.

3. **Axioma III — Diseño Declarativo sobre Lógica Imperativa:**  
   - Eliminación de secuencias destructivas imperativas (`docker compose down && docker compose up`). Se adopta la convergencia declarativa nativa de Docker Compose (`docker compose up -d --no-deps --build web`), donde Docker sustituye únicamente los contenedores cuya imagen ha cambiado.

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
- **Entonces** una tarea `pre_task` de Ansible ejecuta la purga de caché huérfana preservando un límite seguro (`--keep-storage 2GB`), asegurando que la partición raíz `/` mantenga un umbral mínimo de al menos 4 GB disponibles antes de iniciar el nuevo build.

### Escenario 4: Compilación Aislada e Inmutable sin Acceso a Google Fonts
- **Dado** el proceso de compilación `RUN npm run build` dentro del Dockerfile.
- **Cuando** Turbopack empaqueta el diseño tipográfico global en `app/layout.tsx`.
- **Entonces** resuelve las fuentes `Geist` y `Geist Mono` desde archivos locales estáticos empaquetados en `public/fonts/` vía `next/font/local`, completando la compilación con 0 peticiones salientes a `fonts.googleapis.com`.

### Escenario 5: Sincronización Relacional Exhaustiva e Idempotente
- **Dado** la base de datos `barcelonaxplorer_db` en el contenedor `barcelonaxplorer_mysql`.
- **Cuando** se ejecuta el hook de migración DDL en `after_symlink.yml`.
- **Entonces** se verifican y crean idempotentemente todas las tablas del modelo Prisma, incluyendo `tactical_itineraries` y `tactical_itinerary_nodes`, sin requerir intervención manual.

---

## 4. Desglose Operativo en Ítems del Backlog (PBIs Proyectados)

| Prioridad | Identificador | Título del PBI | Módulos Principales | Estimación | Estatus |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **P1** | `PBI-OPS-DEPLOY-BUILD-FIRST-001` | Refactorización de Hook `after_symlink.yml` para Despliegue Zero-Downtime (*Build-Before-Swap*) | `ansible/hooks/after_symlink.yml` | 2 SP | 📋 Pendiente |
| **P1** | `PBI-OPS-CLEAN-BUILDCACHE-001` | Tarea IaaC en Ansible para Higiene y Contención de Docker BuildKit y Disco | `ansible/deploy.yml` | 2 SP | 📋 Pendiente |
| **P2** | `PBI-ASSET-FONT-LOCAL-001` | Localización Inmutable de Tipografías con `next/font/local` en Build de Docker | `src/app/layout.tsx`, `src/public/fonts/` | 2 SP | 📋 Pendiente |
| **P2** | `PBI-OPS-DDL-SYNC-TACTICAL-001` | Sincronización Declarativa Idempotente de Entidades Tácticas en Hook DDL | `ansible/hooks/after_symlink.yml` | 1 SP | 📋 Pendiente |
| **P2** | `PBI-OPS-HEALTHCHECK-MONITOR-001` | Oráculo de Salud Sintético Post-Despliegue y Rollback Automatizado | `ansible/hooks/after_symlink.yml`, `scripts/` | 1 SP | 📋 Pendiente |

---

## 5. Acciones Kaizen de Mantenimiento Continuo a Incorporar

Adicionalmente a los PBIs de software e infraestructura, se formulan las siguientes acciones de mantenimiento continuo para la gobernanza operativa:

1. **Monitoreo de Snapshots Timeshift en Nodo 11:**
   - La herramienta Timeshift mantiene copias del sistema de archivos en `/timeshift`. Se recomienda programar una política de rotación que limite el número de snapshots a un máximo de 2 copias locales para preservar el volumen NVMe del sistema operativo.
2. **Despliegue de un Alerta Temprana de Espacio en Disco:**
   - Configurar una alerta o comprobación en el script `deploy.sh` que detenga el inicio del despliegue si el espacio libre en `/dev/nvme0n1p5` es inferior al 10% (umbral de seguridad de 7.3 GB).
3. **Métricas de Despliegue en la Sala de Control (`/Admin/System`):**
   - Incorporar en el panel de telemetría un sensor que reporte la versión activa, la fecha del último release y el estado de salud del nodo 11 consultado mediante la API interna.
