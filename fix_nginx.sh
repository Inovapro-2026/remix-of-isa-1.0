#!/bin/bash

# Define the Nginx config file path
NGINX_CONF="/etc/nginx/sites-available/isa.inovapro.cloud"

# Backup existing config
echo "📦 Fazendo backup da configuração atual..."
sudo cp $NGINX_CONF "${NGINX_CONF}.backup_$(date +%s)"

# New configuration content
echo "📝 Atualizando configuração do Nginx..."
cat << 'EOF' | sudo tee $NGINX_CONF
server {
    server_name isa.inovapro.cloud;
    
    # Logs
    access_log /var/log/nginx/isa.inovapro.cloud.access.log;
    error_log /var/log/nginx/isa.inovapro.cloud.error.log;
    
    # Frontend React
    location / {
        proxy_pass http://localhost:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API Backend (General) - FIX: Captura todas as chamadas de API
    location /api/ {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket para WhatsApp (Socket.IO) - FIX: Adicionado suporte a Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # WebSocket Legacy/Specific (Manter por compatibilidade)
    location /whatsapp {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    # Static files optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:9001;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/isa.inovapro.cloud/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/isa.inovapro.cloud/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}
server {
    if ($host = isa.inovapro.cloud) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name isa.inovapro.cloud;
    return 404; # managed by Certbot
}
EOF

# Test config
echo "🔍 Verificando configuração..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração válida! Reiniciando Nginx..."
    sudo systemctl reload nginx
    echo "🎉 Correção aplicada com sucesso!"
else
    echo "❌ Erro na configuração. Restaurando backup..."
    sudo cp "${NGINX_CONF}.backup_$(date +%s)" $NGINX_CONF
fi
