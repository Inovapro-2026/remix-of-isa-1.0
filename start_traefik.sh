#!/bin/bash

echo "🛑 Parando Nginx..."
sudo systemctl stop nginx
sudo systemctl disable nginx

echo "🚀 Iniciando Traefik..."
docker compose -f docker-compose.traefik.yml up -d

echo "✅ Traefik iniciado!"
echo "📊 Dashboard: http://isa.inovapro.cloud:8080"
echo "🌐 Site: https://isa.inovapro.cloud"
