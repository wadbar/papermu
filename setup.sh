#!/bin/bash

# ============================================================================
# PAPERCREEPER SETUP ENGINE - SUPREMO V9
# ============================================================================

set -e

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> Inicializando Motor de Setup PaperCreeper AI...${NC}"

# Detectar Sistema
OS_TYPE=$(uname -s)
IS_WSL=false
if grep -q "Microsoft" /proc/version 2>/dev/null; then
    IS_WSL=true
fi

echo -e "Detectado: ${GREEN}${OS_TYPE}${NC} (WSL: ${IS_WSL})"

# 1. Criação de Estrutura de Diretórios Industriais
DIRECTORIES=("logs" "data" "servers" "uploads" "dist")

for dir in "${DIRECTORIES[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "Produzindo diretório: ${BLUE}[$dir]${NC}"
        mkdir -p "$dir"
    fi
done

# 2. Ajuste de Permissões (Modo Industrial)
echo -e "Ajustando permissões de execução..."
if [ "$OS_TYPE" == "Linux" ]; then
    chmod -R 755 .
fi

# 3. Validação de Dependências de Sistema
echo -e "Auditando binários críticos..."
command -v node >/dev/null 2>&1 || { echo -e "${RED}Erro: Node.js não localizado.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Erro: NPM não localizado.${NC}" >&2; exit 1; }

# 4. Sincronização de Banco de Dados Local (SQLite/PaperCreeper DB)
if [ ! -f "muonline.db" ]; then
    echo -e "Provisionando Base de Dados Neural..."
    # Placeholder para criação silenciosa ou download de template
    touch muonline.db
fi

echo -e "${GREEN}>>> ESTRUTURA SUPREMA PRONTA PARA OPERAÇÃO. <<<${NC}"
echo -e "Execute 'npm run dev' para ligar o Motor AI."
