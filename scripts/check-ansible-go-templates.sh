#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Oráculo de Plantillas Go en Playbooks Ansible
# PBI-OPS-027 (Protocolo de Acero - Grado S+)
# Axioma IV: El Peaje del Oráculo
# Detecta plantillas Go ({{.X}}, {{ .X }}, {{json .X}}, etc.) fuera de {% raw %}
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-${SCRIPT_DIR}/../ansible}"

if [[ ! -d "$TARGET_DIR" ]]; then
    echo "[ERROR] Directorio objetivo no encontrado: $TARGET_DIR"
    exit 1
fi

EXIT_CODE=0

# Buscar todos los archivos .yml y .yaml dentro del directorio objetivo
while IFS= read -r -d '' file; do
    line_num=0
    in_raw=0

    while IFS= read -r line || [ -n "$line" ]; do
        line_num=$((line_num + 1))
        working_line="$line"

        # Si estamos dentro de un bloque raw multilínea anterior
        if [[ $in_raw -eq 1 ]]; then
            if [[ "$working_line" =~ \{%-?[[:space:]]*endraw[[:space:]]*-?%\} ]]; then
                in_raw=0
                working_line=$(echo "$working_line" | sed -E "s/^.*\{%-?[[:space:]]*endraw[[:space:]]*-?%\}//")
            else
                continue
            fi
        fi

        # Eliminar todos los bloques {% raw %}...{% endraw %} cerrados en la misma línea
        while [[ "$working_line" =~ \{%-?[[:space:]]*raw[[:space:]]*-?%\}.*\{%-?[[:space:]]*endraw[[:space:]]*-?%\} ]]; do
            working_line=$(echo "$working_line" | sed -E "s/\{%-?[[:space:]]*raw[[:space:]]*-?%\}.*\{%-?[[:space:]]*endraw[[:space:]]*-?%\}//g")
        done

        # Si se abre un bloque {% raw %} no cerrado en esta línea
        if [[ "$working_line" =~ \{%-?[[:space:]]*raw[[:space:]]*-?%\} ]]; then
            in_raw=1
            working_line=$(echo "$working_line" | sed -E "s/\{%-?[[:space:]]*raw[[:space:]]*-?%\}.*$//")
        fi

        # Comprobar si hay plantillas Go en la porción no protegida:
        # 1. Acceso a campo Go: {{-?\s*\.
        # 2. Funciones/acciones Go: {{-?\s*(json|index|range|printf|len|with|if)\s+\.
        if echo "$working_line" | grep -q -E '\{\{-?[[:space:]]*\.' || \
           echo "$working_line" | grep -q -E '\{\{-?[[:space:]]*(json|index|range|printf|len|with|if)[[:space:]]+\.'; then
            echo "[ERROR] Plantilla Go sin escapar encontrada en $file:$line_num"
            echo "        Linea: $line"
            echo "        Usa {% raw %}...{% endraw %} para escapar plantillas Go en Ansible."
            EXIT_CODE=1
        fi
    done < "$file"
done < <(find "$TARGET_DIR" -type f \( -name "*.yml" -o -name "*.yaml" \) -print0)

if [[ $EXIT_CODE -eq 0 ]]; then
    echo "[OK] Ninguna plantilla Go sin escapar encontrada en $TARGET_DIR."
fi

exit $EXIT_CODE
