#!/usr/bin/env bash
set -euo pipefail

EXIT_CODE=0

# Buscar todos los archivos .yml dentro de ansible/
while IFS= read -r -d '' file; do
    line_num=0
    in_raw=0

    while IFS= read -r line || [ -n "$line" ]; do
        line_num=$((line_num + 1))

        # Check if line opens raw block
        if [[ "$line" == *"{% raw %}"* ]]; then
            in_raw=1
        fi

        # If not in raw block and contains {{.
        if [[ $in_raw -eq 0 && "$line" == *"{{."* ]]; then
            echo "[ERROR] Plantilla Go sin escapar encontrada en $file:$line_num"
            echo "        Linea: $line"
            echo "        Usa {% raw %}...{% endraw %} para escapar plantillas Go en Ansible."
            EXIT_CODE=1
        fi

        # Check if line closes raw block
        if [[ "$line" == *"{% endraw %}"* ]]; then
            in_raw=0
        fi
    done < "$file"
done < <(find ansible -type f -name "*.yml" -print0)

if [[ $EXIT_CODE -eq 0 ]]; then
    echo "[OK] Ninguna plantilla Go sin escapar encontrada en ansible/."
fi

exit $EXIT_CODE
