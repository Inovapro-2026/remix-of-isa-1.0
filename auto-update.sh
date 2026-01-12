#!/bin/bash

# Diretório do projeto
PROJECT_DIR="/root/INOVAPRO/isa-1.0-de9193c7"
LOG_FILE="$PROJECT_DIR/logs/auto-update.log"

# Garantir que o diretório de logs existe
mkdir -p "$PROJECT_DIR/logs"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Verificando atualizações no GitHub..." >> "$LOG_FILE"

cd "$PROJECT_DIR" || exit

# Buscar atualizações do remoto
git fetch origin main

# Comparar HEAD local com o remoto
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Nova atualização detectada! Iniciando deploy..." >> "$LOG_FILE"
    
    # Fazer o pull das mudanças
    git pull origin main >> "$LOG_FILE" 2>&1
    
    # Instalar dependências (npm install)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Instalando dependências..." >> "$LOG_FILE"
    npm install >> "$LOG_FILE" 2>&1
    
    # Reiniciar processos no PM2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Reiniciando serviços no PM2..." >> "$LOG_FILE"
    # Reinicia todos os processos que o PM2 já está gerenciando
    pm2 restart all >> "$LOG_FILE" 2>&1
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Atualização concluída com sucesso!" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Nenhuma atualização pendente." >> "$LOG_FILE"
fi
