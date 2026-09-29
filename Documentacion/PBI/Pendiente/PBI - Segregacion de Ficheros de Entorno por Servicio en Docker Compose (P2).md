# [OPERATIVO] Documento Destilado: PBI - Segregación de Ficheros de Entorno por Servicio en Docker Compose

**Identificador:** PBI-GW-014
**Estatus:** Pendiente
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md) · Escenario 3
**Origen:** [`AUD-INFRA-GW-001`](../../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) · F-11
**Módulo:** `src/docker-compose.yml`, `ansible/deploy.yml`, `src/deploy.sh`, `src/.env.example`
**Entorno:** Nodo de Producción 11 y ficheros de entorno locales (fuera de git)
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points
**Depende de:** Ninguno
**Decisión de diseño (D-2, confirmada 2026-09-29):** [RESUELTO] Ficheros de entorno separados por servicio (`src/.env.web` y `src/.env.ia-gateway`), sincronizados por Ansible a `shared/`. No se adopta un único `.env.production` con listas `environment` explícitas en Compose como mecanismo principal. Ver HU-KAIZEN-003 §7.

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Cumplir la custodia de secretos de la HU-16 §2.1: cada servicio recibe solo las claves que consume.
- **Entorno:** `src/docker-compose.yml:25` carga `.env.production` completo en `web` y el bloque de `ia-gateway` repite la misma carga. `web` necesita `GEMINI_API_KEY` para los embeddings (HU-16 §2.5, fuera de alcance de la migración); `GROQ_API_KEY` y `JEV_API_KEY` ya no tienen ningún consumidor en el monolito.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Excepción real):* la afirmación de la HU-16 §2.1 de que `web` deja de necesitar las tres claves es falsa para `GEMINI_API_KEY`. Hay que corregir el documento, no forzar la retirada de esa clave.
  - *Filtro B (Secreto compartido):* `IA_GATEWAY_SECRET` debe ser idéntico en ambos ficheros; si divergen, todas las peticiones reciben `401` y el monolito degrada en silencio.
  - *Filtro C (Un solo origen hoy):* Ansible copia `src/.env.production` a `shared/.env.production` (`ansible/deploy.yml`) y `ansistrano_shared_files` lo enlaza. El cambio toca esa tarea y la aduana de `src/deploy.sh`.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el contenedor `web` no reciba las claves de Groq ni de Jev AI,
**Para** que una vulnerabilidad en el monolito no exponga credenciales que solo el gateway utiliza.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Dos ficheros):** existen `src/.env.web` y `src/.env.ia-gateway`, ambos cubiertos por `.gitignore` con el mismo patrón que `.env.production`. `web` contiene lo que el monolito consume, incluida `GEMINI_API_KEY` y excluídas `GROQ_API_KEY` y `JEV_API_KEY`. `ia-gateway` contiene las tres claves de proveedor, los anclajes, `GEMINI_REASONING_MODEL`, `GROQ_FAST_MODEL` y las variables `IA_GATEWAY_*`. La migración inicial se hace partiendo del `.env.production` vigente, sin regenerar secretos.
- [ ] **CA-2 (Aduana de igualdad):** `src/deploy.sh` verifica que `IA_GATEWAY_SECRET` existe, tiene al menos 32 caracteres y es **idéntico** en ambos ficheros, y aborta con mensaje explícito si no. Mantiene el resto de verificaciones actuales, apuntándolas al fichero que corresponda.
- [ ] **CA-3 (Compose y Ansible):** `src/docker-compose.yml` usa `env_file` distinto por servicio. `ansible/deploy.yml` copia ambos ficheros a `shared/` con modo `0600` y `ansistrano_shared_files` los enlaza en cada release. `docker compose config` resultante muestra `web` sin `GROQ_API_KEY` ni `JEV_API_KEY`.
- [ ] **CA-4 (Arranque local intacto):** el desarrollo local sigue usando un único `src/.env.local` (el proceso del gateway y `next dev` corren en el host, no en Compose). `src/.env.example` documenta qué variables pertenecen a cada servicio.
- [ ] **CA-5 (Documentación):** la HU-16 §2.1 queda anotada con la excepción de `GEMINI_API_KEY` por los embeddings y con la referencia a este PBI.
- [ ] **CA-6 (Verificación en nodo):** tras el primer despliegue se comprueba dentro de los contenedores, sin imprimir valores, que `GROQ_API_KEY` y `JEV_API_KEY` están `UNSET` en `web` y `SET` en `ia-gateway`, y que una inferencia real (`/api/ai/test` o equivalente) sigue respondiendo.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **No se rotan secretos en este PBI.** La segregación copia los valores vigentes. Rotar es una operación distinta y queda fuera.
- **`db` no cambia.** Su bloque `environment` sigue interpolando `MYSQL_*` desde el entorno de Compose, que hoy proviene de `--env-file .env.production` en la línea de `docker compose` de `after_symlink.yml`. Esa invocación debe pasar a leer las variables de base de datos del fichero de `web` (o de un tercer mecanismo) sin dejar `MYSQL_PASSWORD` solo en un fichero que Compose no carga. Verificarlo con `docker compose config` antes de desplegar.
- **El fichero `.env.production` vigente no se borra** hasta que el primer despliegue con los ficheros nuevos quede verificado (CA-6); mientras tanto permanece como respaldo local fuera de git.
