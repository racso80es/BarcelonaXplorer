---
document_id: PBI-BX-LINEAR-002
uuid: "4a23d2f9-d977-44ad-ae6e-edadd5defb74"
title: "[OPERATIVO] Bóveda LINEAR_API_TOKEN sin valor en git"
status: done
process: feature
created: "2026-10-13"
project_slug: barcelonaxplorer
historia_ref: "Documentacion/HistoriasDeUsuario/HU 19 : [OPERATIVO] Configuración de Entorno y Desacople Documental hacia Linear Tracker.md"
priority: alta
---

# [OPERATIVO] PBI - Bóveda LINEAR_API_TOKEN sin Valor en Git

**Identificador:** PBI-BX-LINEAR-002
**Ref. de historia:** PBI-BX-LINEAR-CONFIG-001
**Estatus:** Realizado
**Fecha de creación:** 2026-10-13
**Historia de usuario:** [HU 19](../../HistoriasDeUsuario/HU%2019%20%3A%20%5BOPERATIVO%5D%20Configuraci%C3%B3n%20de%20Entorno%20y%20Desacople%20Documental%20hacia%20Linear%20Tracker.md) · §3.2 y criterio 1
**Prioridad:** Alta (P1)
**Estimación táctica:** 2 story points
**Depende de:** una personal API key que el Vértice crea en Linear. La forja no la genera.
**Bloquea:** [PBI-BX-LINEAR-004](./PBI%20-%20Prueba%20de%20Vida%20fetch_issue%20sin%20Filtrar%20el%20Token%20%28P1%29.md)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Declarar `LINEAR_API_TOKEN` en la bóveda del proyecto y versionar solo el nombre vacío.
- **Entorno:** `.SddIA/.dev/.env` (no existe hoy) y `.SddIA/.dev/.env.example`. El manifiesto ya declara `env_ref: .SddIA/.dev/.env`.
- **Entropía asimilada:**
  - *Filtro A (Nombre):* La cápsula lee `LINEAR_API_TOKEN`. `LINEAR_API_KEY` no es el nombre y no se declara.
  - *Filtro B (Precedencia):* El motor aplica la bóveda solo si la clave no está ya en el entorno del proceso (`apply_env` en `core/env.rs`). Dentro de la bóveda, `.SddIA/.dev/.env` pisa a `.dev/.env` de la raíz del repo. El secreto de este proyecto vive en la bóveda local.
  - *Filtro C (Git):* `.gitignore` ya contiene el patrón `.env`, que cubre `.SddIA/.dev/.env` en cualquier directorio. No hace falta otro patrón. El ejemplo sí se versiona, con la variable vacía.

---

## 1. Declaración de intención (INVEST)

**Como** operador de BarcelonaXplorer,
**quiero** el secreto solo en la bóveda local y el nombre de la variable en un ejemplo vacío,
**para** que la cápsula arranque con `LINEAR_API_TOKEN` y el valor no entre en git.

---

## 2. Hechos que fijan el diseño

1. `resolve_token()` usa `std::env::LINEAR_API_TOKEN`. Si falta y no hay mock de laboratorio, la cápsula sale con `LINEAR_AUTH_MISSING` y el mensaje `LINEAR_API_TOKEN ausente`.
2. `load_hierarchical_env` lee primero `{repo}/.dev/.env` y después `{repo}/.SddIA/.dev/.env`. La segunda pisa claves repetidas. `apply_env` no pisa una clave que el proceso ya traiga.
3. Hoy no existe `.SddIA/.dev/`. El patrón `.env` de `.gitignore` ignora el fichero secreto. `.env.example` no coincide con ese patrón.
4. El valor no se escribe en el manifiesto, en envelopes, en este PBI ni en el mensaje de commit.

---

## 3. Corte

Archivos: `.SddIA/.dev/.env` (fuera de git) y `.SddIA/.dev/.env.example` (versionado).

El ejemplo queda así, sin valor:

```bash
# Bóveda de proyecto. El valor vive solo en .env, ignorado por git.
# Nombre canónico: LINEAR_API_TOKEN. LINEAR_API_KEY no se usa.
LINEAR_API_TOKEN=
```

El Vértice copia esa línea a `.SddIA/.dev/.env` y escribe ahí la personal API key. La forja no inventa el secreto, no lo imprime y no lo pega en el chat. Modo del fichero secreto: `0600`.

Comprobación, sin volcar el valor:

```bash
git check-ignore -v .SddIA/.dev/.env
git ls-files --error-unmatch .SddIA/.dev/.env
```

La primera debe atribuir el ignore a `.gitignore`. La segunda debe fallar (el fichero no está en el índice). `git grep -n LINEAR_API_KEY` no devuelve coincidencias. `git grep -n '^LINEAR_API_TOKEN=.'` no devuelve coincidencias: la única línea versionada es `LINEAR_API_TOKEN=` vacía.

---

## 4. Criterios de aceptación

- [x] **CA-1 (Bóveda):** `.SddIA/.dev/.env` existe, modo `0600`, y define `LINEAR_API_TOKEN` con valor no vacío. El fichero no está en el índice.
- [x] **CA-2 (Ejemplo):** `.SddIA/.dev/.env.example` está versionado y contiene `LINEAR_API_TOKEN=` sin valor. No contiene `LINEAR_API_KEY`.
- [x] **CA-3 (Barrido):** `git grep` sobre el árbol no encuentra un valor de token ni la clave `LINEAR_API_KEY`.

---

## 5. Fuera de alcance

- Crear el equipo o los estados (PBI-BX-LINEAR-001).
- Subir `contract_version` ni añadir `tracker` (PBI-BX-LINEAR-003).
- Llamar a Linear (PBI-BX-LINEAR-004).
- Poner el secreto en `.dev/.env` de la raíz, en `src/.env*` o en el entorno de Docker.

---

## 6. Orden

Independiente del equipo y del manifiesto. La prueba de vida lo necesita cargado en el entorno, o en su lugar el mock de laboratorio que esa prueba admite.

---

## 7. Resolución y Evidencias de Validación

- **Creación de bóveda:** Archivo `.SddIA/.dev/.env` configurado con permisos octales `0600` conteniendo `LINEAR_API_TOKEN` no vacío.
- **Ignorado por Git:** `git check-ignore -v .SddIA/.dev/.env` responde `.gitignore:4:.env .SddIA/.dev/.env`. Comprobado que `git ls-files --error-unmatch .SddIA/.dev/.env` falla confirmando que no reside en el índice.
- **Plantilla canónica versionada:** `.SddIA/.dev/.env.example` añadido al repositorio declarando `LINEAR_API_TOKEN=` vacío y sin rastro de `LINEAR_API_KEY`.
- **Higiene de secretos:** `git grep -n '^LINEAR_API_TOKEN=.'` no produce coincidencias en el árbol git. Únicamente se versiona la definición sin valor en `.env.example`.
