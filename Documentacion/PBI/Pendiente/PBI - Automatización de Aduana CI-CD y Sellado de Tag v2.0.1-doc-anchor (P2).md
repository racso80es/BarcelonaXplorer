# [OPERATIVO] Documento Destilado: PBI - Automatización de Aduana CI-CD y Sellado de Tag v2.0.1-doc-anchor

**Identificador:** PBI-OPS-CI-001  
**Estatus:** Pendiente / Listo para Forja (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario: Estabilización Evolutiva y Saneamiento Post-Anclaje v2.0.1](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Estabilizaci%C3%B3n%20Evolutiva%20y%20Saneamiento%20Post-Anclaje%20v2.0.1.md)  
**Auditoría Vinculada:** [AUD-OPS-ANCHOR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Módulo:** Gobernanza Git, Automatización CI/CD y Espejo Canónico (`README.md`)  
**Entorno:** GitHub Actions, Git 2.x, Bash Shell Scripting, Linux Mint / Ubuntu Server  
**Prioridad:** Media (P2 - Gobernanza y Certificación Inmutable)  
**Estimación Táctica:** 1 Story Point  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Integración del script de aduana determinista `scripts/audit-anchor.sh` en el flujo de integración continua, ejecución del sellado canónico de Git (`v2.0.1-doc-anchor`), y actualización integral de los badges del espejo canónico (`README.md`) tras la culminación de los saneamientos P1.
- **Entorno:** Raíz del repositorio Git, `.github/workflows/`, [`scripts/audit-anchor.sh`](file:///home/racso/Proyectos/BarcelonaXplorer/scripts/audit-anchor.sh), [`README.md`](file:///home/racso/Proyectos/BarcelonaXplorer/README.md).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Verificación automática de la Santa Trinidad (`tsc`, `eslint`, `vitest`) como compuerta de bloqueo (*blocking gate*) ante cualquier commit o PR.
  - *Filtro B (Determinismo y Soberanía):* Creación física del tag anotado `v2.0.1-doc-anchor` en Git referenciando la culminación de la auditoría y los saneamientos, evitando la deriva temporal del repositorio.
  - *Filtro C (Eficiencia Operativa):* Sincronización exacta de badges y enlaces en `README.md` sin discrepancias de nombres ni rutas.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio de la Arquitectura y Operador del Repositorio (Vértice Biológico),  
**Quiero** sellar canónicamente el tag Git `v2.0.1-doc-anchor` tras la validación de los oráculos y asegurar la ejecución de `scripts/audit-anchor.sh` en la tubería de CI/CD,  
**Para** garantizar una frontera histórica inmutable y evitar regresiones de linter o desalineación del espejo canónico en futuras iteraciones Kaizen.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Pipeline de Oráculos Integrado):** El script `scripts/audit-anchor.sh` se ejecuta como paso de verificación en CI o hook local previo al commit.
- [ ] **CA-2 (Sellado Canónico Git):** Se genera y publica el tag anotado `v2.0.1-doc-anchor` apuntando al commit de cierre de saneamiento.
- [ ] **CA-3 (Sincronización de README.md):** El badge de Linter y Tests en `README.md` refleja el estado 100% verde (0 advertencias de linter y suites de pruebas actualizadas).
- [ ] **CA-4 (Verificación de Integridad):** Cero enlaces rotos y verificación de rutas sensibles a mayúsculas/minúsculas en la documentación raíz.
