[OPERATIVO] Proyecto BarcelonaXplorer: Arquitectura de Despliegue Continuo (IaaC)

Matriz de Indexación Tridimensional:
Naturaleza: Implementación de tubería de despliegue inmutable (IaaC) y versionado táctico.
Entorno: Repositorio Local -> Producción (Nodo 11).
Entropía Asimilada: Superación de fricciones de autenticación SSH desatendida y ajuste de sintaxis rsync (trailing slash) para volcados limpios de directorio.

1. Orquestación y Herramientas
El proyecto descarta los despliegues manuales (FTP/SCP) a favor de una arquitectura de "Infraestructura como Código" operada localmente y ejecutada remotamente.

Motor: Ansible (instalación completa en el entorno local del Vértice Biológico).

Módulo de Despliegue: Ansistrano (ansistrano.deploy y ansistrano.rollback). Aporta la lógica industrial de despliegue mediante enlaces simbólicos (symlinks), permitiendo cambios de versión sin tiempo de inactividad (Zero Downtime Deployment).

2. Estructura de la Forja (Directorio ansible/)
El control del despliegue reside íntegramente en el repositorio del proyecto bajo la carpeta ansible/, asegurando que la infraestructura se versiona junto con el código.

inventory.ini: Declara el objetivo de producción (10.0.10.11 ansible_user=racso).

deploy.yml: Playbook maestro que parametriza a Ansistrano. Define la transferencia vía rsync, la retención de las 3 últimas versiones (ansistrano_keep_releases: 3) y especifica el origen estricto del código (ansistrano_deploy_from: "../src/"). El uso de la barra diagonal (trailing slash) es vital para volcar el contenido de src en lugar del propio directorio.

hooks/after_symlink.yml: Tarea quirúrgica ejecutada automáticamente tras actualizar el symlink a la nueva release. Su función es recargar el motor Docker en el Nodo 11 (docker compose down && docker compose up -d --remove-orphans) operando directamente desde la carpeta current.

3. Autenticación y Seguridad (Zero-Trust al Nodo 11)
Para habilitar la tubería IaaC, se estableció un canal de confianza criptográfica asimétrica:

Se generó un par de claves Ed25519 locales sin passphrase.

La clave pública se inyectó en el Nodo 11 mediante ssh-copy-id.

Esto blinda el puerto 22 del nodo mientras permite que Ansible ejecute comandos sudo-delegados (vía el grupo docker) de forma 100% desatendida.

4. Táctica del Refugio (Rollbacks)
Gracias a la estructura de Ansistrano (releases, shared, current), cualquier versión defectuosa desplegada en producción puede ser revertida instantáneamente ejecutando un playbook de rollback, el cual simplemente reconecta el symlink current a la carpeta de la versión anterior y dispara el hook de recarga de Docker.