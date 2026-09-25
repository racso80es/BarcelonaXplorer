# Historia de Usuario 3: Persistencia Vectorial Embebida y Aislamiento IaaC (LanceDB)

**Identificador:** HU-INFRA-LANCE-003  
**Estatus:** Implementado y Validado S+ Grade (Certificado en Nodo 11)  
**Fecha de Certificación:** 2026-09-25  
**PBI Asociado:** [PBI - Persistencia Vectorial Embebida y Aislamiento IaaC (LanceDB)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Persistencia%20Vectorial%20Embebida%20y%20Aislamiento%20IaaC%20%28LanceDB%29.md)  
**Módulo:** Infraestructura, Persistencia Vectorial y Tubería IaaC  
**Entorno:** Next.js 16.3+ Standalone, Node.js 20 (Alpine Linux musl), `@lancedb/lancedb`, Apache Arrow, Docker Compose v2, Nodo 11 (`10.0.10.11`)

---

### Matriz de Indexación Tridimensional

- **Naturaleza:** Aprovisionamiento de Persistencia Vectorial Embebida (In-Process Arrow Engine), Bind Mount Inmutable en Infraestructura como Código (Ansible/Ansistrano), Blindaje de Permisos POSIX Multi-UID y Adaptador Hexagonal de Dominio.
- **Entorno:** Directorio [`src/`](file:///home/racso/Proyectos/BarcelonaXplorer/src) ([`docker-compose.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/src/docker-compose.yml), [`Dockerfile`](file:///home/racso/Proyectos/BarcelonaXplorer/src/Dockerfile), [`next.config.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/next.config.ts), [`package.json`](file:///home/racso/Proyectos/BarcelonaXplorer/src/package.json)), subsistema Ansible ([`ansible/deploy.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/deploy.yml), [`ansible/hooks/after_symlink.yml`](file:///home/racso/Proyectos/BarcelonaXplorer/ansible/hooks/after_symlink.yml)), y host de producción `10.0.10.11` (Nodo 11).
- **Entropía Asimilada:** Supresión total de sobrecarga por microservicios o clústeres vectoriales externos (Qdrant, Milvus, Chroma). Aislamiento térmico inmutable en disco anfitrión para sobrevivir a los ciclos de despliegue Ansistrano sin amnesia cognitiva. Permisos POSIX `0777` sin elevación de privilegios `sudo`.

---

## 1. Descripción General (INVEST)

**Como** Operador Técnico y Arquitecto de Software del Nodo 11 (Racso),  
**Quiero** instanciar la base de datos vectorial (LanceDB) como un motor embebido dentro del proceso de Next.js y persistir sus índices a través de un mapeo de volumen local (Bind Mount) en el servidor de producción,  
**Para** garantizar una latencia de red cero en el cruce de vectores contextuales (RAG), evitar la sobrecarga térmica de administrar contenedores paralelos y asegurar que el historial conversacional y los itinerarios de los usuarios sobrevivan íntegros a los ciclos de despliegue automatizados.

---

## 2. Justificación Arquitectónica (La Vía del Yunque)

Bajo el patrón BFF (Backend For Frontend) y la disciplina de Código Único de BarcelonaXplorer, se rechaza la fragmentación prematura en microservicios:
1. **Cero Contenedores Paralelos:** Desplegar un contenedor paralelo exclusivo para tareas vectoriales añade latencia HTTP interna y complejidad en la orquestación. LanceDB, al operar directamente sobre Apache Arrow en el mismo hilo de Node.js, erradica esa latencia.
2. **Inmunidad Cognitiva frente a Ansistrano:** Dado que el sistema se despliega mediante Ansistrano (que altera los enlaces simbólicos `current -> releases/...` y recarga los contenedores con `docker compose down && docker compose up -d`), la memoria vectorial debe externalizarse al sistema anfitrión para evitar amnesia masiva en cada actualización.
3. **Poda Higiénica y Amnesia Táctica:** El puerto vectorial incorpora la firma `delete()` para purgar vectores caducos y dar cumplimiento estricto al borrado seguro de datos.

---

## 3. Coreografía de Infraestructura y Despliegue

1. **Forja Embebida:** LanceDB se integra como dependencia en `package.json` (`@lancedb/lancedb` y `apache-arrow`), aislado en `serverExternalPackages` dentro de `next.config.ts`.
2. **Volumen de Inmunidad (Táctica del Refugio):** Se forja un volumen local en el sistema anfitrión del Nodo 11 (`/home/racso/Despliegues/BarcelonaXplorer/lancedb_data`), replicando exactamente la misma estrategia de aislamiento utilizada para el contenedor estático de MySQL.
3. **Declaración en Docker Compose:** El manifiesto `docker-compose.yml` mapea este directorio físico directamente a la ruta interna de almacenamiento del contenedor Next.js (`/app/vector_storage`), con fallback relativo local `./data/lancedb`.
4. **Independencia de la Tubería IaaC:** Cuando Ansible ejecuta un nuevo pase a producción, el enlace simbólico `current` apunta a la nueva versión del código, pero el motor embebido de la nueva compilación retoma la lectura de la carpeta inmutable en el disco, manteniendo intacta la memoria de todos los identificadores sombra (UUIDs).

---

## 4. Criterios de Aceptación (Verificación Empírica S+ Grade)

### Escenario 1: Eficiencia de Orquestación (Cero Contenedores Paralelos)
- **Dado** el despliegue del proyecto BarcelonaXplorer en el Nodo 11.
- **Cuando** el operador ejecuta `docker ps` para auditar la topología.
- **Entonces** el sistema muestra exactamente dos contenedores activos: `barcelonaxplorer_nginx` y `barcelonaxplorer_mysql`.
- **Y** las operaciones de lectura/escritura vectorial se ejecutan in-process sin llamadas a puertos de red externos.

### Escenario 2: Persistencia Inmutable frente a Ciclos de Despliegue
- **Dado** un conjunto de itinerarios hiper-personalizados y contextos de usuarios ya vectorizados en disco.
- **Cuando** el operador dispara el script `./src/deploy.sh` de Ansistrano para desplegar una nueva versión del código.
- **Entonces** el hook `after_symlink.yml` recarga el contenedor de Next.js.
- **Y** al arrancar, el nuevo contenedor reconoce de forma inmediata los vectores preexistentes en el volumen `/app/vector_storage`, garantizando la continuidad cognitiva para todos los usuarios activos.

### Escenario 3: Inmunidad ante Permisos POSIX y Resiliencia en Nodo 11
- **Dado** el contenedor web ejecutando bajo usuario sin privilegios `nextjs` (UID 1001 en Alpine Linux).
- **Cuando** el proceso abre el descriptor de ficheros en `/app/vector_storage`.
- **Entonces** la tarea previa de Ansible ha configurado permisos `0777` en el host anfitrión sin requerir elevación de privilegios `sudo`.
- **Y** ningún fallo `EACCES` es arrojado, garantizando operaciones atómicas de lectura, escritura y búsqueda.

---

## 5. Certificación Empírica Final

- **Fecha de Validación:** 2026-09-25
- **Nodo de Producción:** 10.0.10.11 (Linux Mint / Ubuntu Server)
- **Topología Confirmada:** Exactamente 2 contenedores en ejecución (`docker ps`).
- **Persistencia Física Certificada:** Tabla `health_probe.lance` creada y validada en `/home/racso/Despliegues/BarcelonaXplorer/lancedb_data` con UID `1001`.
- **Sala de Control:** Tarjeta sensorial `Persistencia Vectorial` integrada en `/Admin/System` con semáforo verde (`ok`), `7 Sondas Activas`.
- **Suite de Pruebas:** 53 suites de prueba superadas, 279 pruebas unitarias y de integración pasando con éxito (100%).
