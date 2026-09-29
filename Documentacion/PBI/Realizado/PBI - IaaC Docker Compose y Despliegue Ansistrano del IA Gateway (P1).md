# [OPERATIVO] Documento Destilado: PBI - IaaC Docker Compose y Despliegue Ansistrano del IA Gateway

**Identificador:** PBI-GW-008  
**Estatus:** Completado  
**Fecha de Creación:** 2026-09-29  
**Fecha de Culminación:** 2026-09-29  
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)  
**Módulo:** `src/docker-compose.yml`, `ansible/`, `src/.env.example`, `src/deploy.sh`  
**Entorno:** Nodo de Producción 11 (`10.0.10.11`), Docker Compose, Ansible/Ansistrano  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 2 Story Points  
**Depende de:** PBI-GW-001  
**Bloqueo:** Ninguno (Decisión D-1 resuelta)  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Declaración del servicio `ia-gateway` en Docker Compose junto a `web` y `db`. Custodia de secretos de proveedores de IA en el nuevo servicio. Adaptación de Ansistrano/Ansible para compilación atómica y aduana de verificación en `deploy.sh`.
- **Entorno:** `src/docker-compose.yml`, `ansible/deploy.yml`, `ansible/hooks/after_symlink.yml`, `src/deploy.sh`, `src/.env.example`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Aislamiento de Red):* Sin publicación de puertos en el host (`expose: ["3001"]`); alcanzable únicamente por la red interna de Compose (`http://ia-gateway:3001`).
  - *Filtro B (Custodia de Secretos):* `GEMINI_API_KEY`, `GROQ_API_KEY`, `JEV_API_KEY` y anclajes alimentados en `ia-gateway`; `web` solo consume `IA_GATEWAY_URL` e `IA_GATEWAY_SECRET`.
  - *Filtro C (Aduana de Despliegue):* `deploy.sh` valida rigurosamente presencia y longitud mínima (>= 32 caracteres) de `IA_GATEWAY_SECRET` antes de transferir artefactos.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,  
**Quiero** que el servicio `ia-gateway` esté declarado en Docker Compose con aislamiento de red y custodia correcta de secretos,  
**Para** desplegarlo en producción junto a `web` y `db` sin exposición de puertos ni fugas de credenciales.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Servicio Compose):** `ia-gateway` declarado en `src/docker-compose.yml` sin `ports` publicados en el host, con red interna compartida y dependencia desde `web`.
- [x] **CA-2 (Variables):** Variables `GEMINI_API_KEY`, `GROQ_API_KEY`, `JEV_API_KEY`, `DEFAULT_FAST_LLM`, `DEFAULT_REASONING_LLM` inyectadas en `ia-gateway`. `IA_GATEWAY_SECRET` en ambos servicios (`web` e `ia-gateway`).
- [x] **CA-3 (env.example):** Variables documentadas en `src/.env.example` con comentarios semánticos y valores de referencia.
- [x] **CA-4 (Aduana de Despliegue):** `src/deploy.sh` aborta si `IA_GATEWAY_SECRET` no está definido o tiene menos de 32 caracteres en `.env.production`.
- [x] **CA-5 (Ansible):** `ansible/deploy.yml` sincroniza el código de `ia-gateway` a `shared/ia-gateway` y lo enlaza simbólicamente mediante `ansistrano_shared_paths`. Hook `after_symlink.yml` compila ambas imágenes (`ia-gateway` y `web`) con `BX_RELEASE_TAG`.
- [x] **CA-6 (Healthcheck Compose):** Healthcheck del servicio `ia-gateway` configurado contra `GET /healthz` (`wget -q --spider http://127.0.0.1:3001/healthz`).

---

## 3. Evidencia de Certificación de Oráculos

1. **Validación de Sintaxis Docker Compose:**
   - `docker compose config --quiet` verificado sin errores sintácticos.
2. **Oráculo de Linter AST (`eslint`):**
   - 0 advertencias, 0 errores.
3. **Tests de IA Gateway (`vitest`):**
   - 8 archivos de test (34 tests pasando al 100%).
4. **Verificación de Tipos (`tsc --noEmit`):**
   - 0 errores en `src/` e `ia-gateway/`.
