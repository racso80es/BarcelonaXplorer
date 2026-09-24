[OPERATIVO] Documento Destilado: PBI - Pulido de Telemetría e Higiene Operativa en Tubería IaaC Ansistrano (Nodo 11)
Identificador: PBI-DEVOPS-IAAC-003

Estatus: Refinado / Listo para Implementación (S+ Grade)

Historia de Usuario Relacionada: HU 1.x: Infraestructura Inmutable y Despliegue Continuo (IaaC - Ansistrano)

Módulo: Automatización de Despliegues y Gobernanza de Infraestructura (ansible/)

Entorno: Ansible Core (entorno local Vértice Biológico), Ansistrano, Docker Compose, Nodo de Producción 11 (10.0.10.11, Linux Mint / Ubuntu Server, Python 3.12)

Prioridad: Media-Baja (P2 - Higiene Operativa, Reducción de Ruido en Terminal y Determinismo IaaC)

Estimación Táctica: 2 Story Points

Matriz de Indexación Tridimensional
Naturaleza: Endurecimiento de Configuración IaaC, Silenciado de Avisos de Deprecación, Determinismo de Intérprete Remoto y Sincronización Térmica de Servicios Contenerizados.

Entorno: Directorio ansible/ (inventory.ini, ansible.cfg, deploy.yml, hooks/after_symlink.yml) y definición de salud en src/docker-compose.yml contra el host de producción 10.0.10.11.

Entropía Asimilada: Erradicación del ruido visual y falsos positivos durante la ejecución de ./deploy.sh o ansible-playbook ansible/deploy.yml.

Fijación del Intérprete: Desactivación de la fase de descubrimiento dinámico de Python en el Nodo 11 fijando la ruta canónica del sistema (/usr/bin/python3).

Silenciado de Deprecaciones Externas: Configuración centralizada de ansible.cfg para suprimir advertencias internas del rol de Ansistrano frente al runtime moderno de Ansible.

Amortiguación de Ignición de MySQL: Introducción de una pausa táctica inicial o tolerancia de estado en la tarea de espera del motor de base de datos para evitar que los reintentos naturales se registren como fallos alarmistas en el log de despliegue.

1. Declaración de Intención (INVEST)
Como Operador Técnico y Arquitecto del Sistema (Racso),

Quiero calibrar la configuración de Ansible (ansible.cfg, inventory.ini) y ajustar la tarea de sondeo de salud del contenedor MySQL en los playbooks de Ansistrano,

Para ejecutar despliegues con cero advertencias de deprecación, eliminar la latencia del descubrimiento de intérprete de Python y suprimir las alertas espurias de fallo en terminal mientras la base de datos completa su arranque en el Nodo 11, alcanzando una tubería de despliegue limpia, silenciosa y determinista.

2. Justificación Arquitectónica (La Vía del Yunque)
Determinismo Absoluto en Ejecución Remota (Axioma de la Vía del Yunque):

Permitir que Ansible "adivine" el intérprete de Python en cada ejecución introduce latencia innecesaria en la fase de setup y abre la puerta a inconsistencias si coexisten múltiples versiones de Python en el sistema operativo del Nodo 11. Fijar ansible_python_interpreter = /usr/bin/python3 convierte la ejecución en un proceso predecible y reproducible.

Aislamiento de la Obsolescencia de Terceros (ansible.cfg):

Ansistrano es un rol consolidado, pero ciertas llamadas internas a la API de conexión entran en colisión con la política de deprecación de ansible-core 2.16+. Como el Vértice Biológico no debe mantener un fork innecesario de un rol probado, la buena práctica industrial dicta gobernar las advertencias perimetralmente mediante la directiva deprecation_warnings = False en el archivo local de configuración de Ansible.

Prevención de Fatiga de Alerta (Amortiguación Térmica en Sondeos):

El motor MySQL requiere entre 3 y 6 segundos para levantar su socket InnoDB y responder a las consultas de ping en frío. Un ciclo until que sondea el contenedor inmediatamente después del comando up -d emite mensajes FAILED - RETRYING que confunden al operador simulando un incidente de infraestructura. Introducir un retardo inicial o calibrar el intervalo del sondeo elimina este ruido sin sacrificar la seguridad de la barrera.

3. Diagnóstico y Plan de Corrección Técnica
3.1. Advertencia de Intérprete Python (interpreter_discovery)
Causa: Ansible detecta automáticamente /usr/bin/python3.12, pero emite un warning recomendando fijar la variable de host.

Solución: Declarar ansible_python_interpreter=/usr/bin/python3 directamente en ansible/inventory.ini para el host 10.0.10.11.

3.2. Advertencia de Deprecación de Stdin en Rsync
Causa: El módulo interno de Ansistrano interactúa con la conexión SSH mediante un método marcado para eliminación en Ansible 2.19.

Solución: Crear o actualizar ansible/ansible.cfg con deprecation_warnings = False y interpreter_python = auto_silent para garantizar ejecuciones concisas.

3.3. Reintento Ruidoso en la Salud de MySQL
Causa: La tarea Esperar a que el motor MySQL esté saludable se ejecuta milisegundos después de levantar los contenedores, encontrando el contenedor en estado health: starting o no listo, marcando el primer intento como FAILED.

Solución:

Incorporar una pausa táctica de 4 a 6 segundos (ansible.builtin.pause) inmediatamente tras el encendido de los contenedores Docker en el hook after_symlink.yml (o antes del sondeo).

Asegurar que la tarea de sondeo utilice delay: 3 y gestione el fallo transitorio de forma limpia (ej. failed_when: false durante la evaluación intermedia o comprobación del socket TCP en el puerto 3306 mediante wait_for).

4. Especificación Técnica de Archivos a Modificar
4.1. Archivo: ansible/inventory.ini
Añadir la fijación explícita del intérprete:

Ini, TOML
[production]
10.0.10.11 ansible_user=racso ansible_python_interpreter=/usr/bin/python3
4.2. Archivo: ansible/ansible.cfg (Nuevo o Actualizado)
Centralizar los parámetros de ejecución en la raíz de la forja Ansible:

Ini, TOML
[defaults]
inventory = inventory.ini
deprecation_warnings = False
interpreter_python = /usr/bin/python3
stdout_callback = yaml
callbacks_enabled = timer, profile_tasks
host_key_checking = True

[ssh_connection]
pipelining = True
4.3. Archivo: ansible/hooks/after_symlink.yml (o donde resida la tarea de espera de MySQL)
Ajustar la coreografía de ignición:

YAML
- name: Recargar servicios Docker en el Nodo 11
  ansible.builtin.command:
    cmd: docker compose down && docker compose up -d --remove-orphans
    chdir: "{{ ansistrano_deploy_to }}/current"
  changed_when: true

- name: Pausa táctica para ignición de servicios de persistencia (MySQL)
  ansible.builtin.pause:
    seconds: 5
    prompt: "Aguardando estabilización del socket de InnoDB..."

- name: Esperar a que el motor MySQL esté saludable
  ansible.builtin.command:
    cmd: docker inspect --format="{% raw %}{{{% endraw %}.State.Health.Status{% raw %}}}{% endraw %}" barcelona_mysql
  register: mysql_health
  until: mysql_health.stdout == "healthy"
  retries: 15
  delay: 2
  changed_when: false
5. Criterios de Aceptación (Verificación Empírica - Gherkin)
Escenario 1: Ejecución sin Advertencias de Intérprete Python
Gherkin
Dado que el operador ejecuta el despliegue mediante "./deploy.sh" o "ansible-playbook ansible/deploy.yml"
Cuando Ansible recopila los facts o ejecuta tareas sobre el host "10.0.10.11"
Entonces la tarea se completa con estado "ok"
Y la consola no muestra ningún aviso de tipo "[WARNING]: Platform linux on host 10.0.10.11 is using the discovered Python interpreter"
Escenario 2: Supresión de Advertencias de Deprecación de Ansistrano
Gherkin
Dado el archivo de configuración "ansible/ansible.cfg" con "deprecation_warnings = False"
Cuando la tarea "ANSISTRANO | RSYNC | Rsync application files to remote shared copy" transfiere los archivos
Entonces la sincronización concluye con éxito
Y no se inyectan avisos "[DEPRECATION WARNING]: The connection's stdin object is deprecated" en el flujo de salida
Escenario 3: Ignición Silenciosa y Convergencia de MySQL
Gherkin
Dado el reinicio de los contenedores Docker en la release activa del Nodo 11
Cuando se activa la pausa de estabilización de 5 segundos previa al sondeo
Entonces la tarea "Esperar a que el motor MySQL esté saludable" encuentra el contenedor en estado "healthy" en su primer o segundo intento
Y no se satura el terminal con mensajes de "FAILED - RETRYING" innecesarios
6. Plan de Implementación Táctico
[ ] Tarea 1: Actualizar ansible/inventory.ini para asociar ansible_python_interpreter=/usr/bin/python3 a la IP 10.0.10.11.

[ ] Tarea 2: Crear o afinar ansible/ansible.cfg configurando deprecation_warnings = False, interpreter_python y formateo de salida yaml.

[ ] Tarea 3: Localizar en los playbooks (deploy.yml o hooks/after_symlink.yml) la tarea de espera de salud de barcelona_mysql e intercalar la pausa táctica de 5 segundos.

[ ] Tarea 4: Ejecutar una prueba de despliegue en seco o real contra el Nodo 11 (./deploy.sh) y verificar que la bitácora termine limpia con failed=0 y warnings=0.

7. Definición de Hecho (DoD)
[ ] La ejecución de ansible-playbook ansible/deploy.yml transcurre de inicio a fin sin emitir advertencias de Python ni de deprecación en la consola.

[ ] El contenedor MySQL se reporta como healthy de forma limpia y transparente antes de aplicar las migraciones de Prisma.

[ ] El tiempo total del pipeline no sufre penalizaciones apreciables (se mantiene por debajo del umbral operativo habitual).

[ ] Todos los cambios quedan versionados bajo el directorio ansible/ del repositorio.
