# 🚀 Configuração WhatsApp ISA - Acesso Externo

## 📋 Resumo das Alterações

Configurei o sistema para permitir que o painel frontend acesse o backend da VPS remotamente, substituindo localhost pelo IP da VPS.

## 🔧 Configurações Aplicadas

### 1. IP da VPS
- **IP Público**: `148.230.76.60`
- **Porta**: `3001`

### 2. Arquivos Modificados

#### ✅ Backend (server.ts)
```typescript
// Configuração CORS para aceitar requisições de qualquer origem
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*';

// Servidor escuta em todas as interfaces de rede
httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server accessible at http://148.230.76.60:${PORT}`);
});
```

#### ✅ Frontend (ClientWhatsApp.tsx)
```typescript
// Usa variável de ambiente ou fallback para localhost
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
```

#### ✅ Socket Service
```typescript
// Prioriza VITE_BACKEND_URL sobre localhost
const backendUrl = import.meta.env.VITE_BACKEND_URL;
if (backendUrl) {
  return backendUrl;
}
```

## 📝 Arquivo .env Criado

```bash
# Backend Configuration
VITE_BACKEND_URL=http://148.230.76.60:3001
CORS_ORIGINS=*
```

## 🚀 Como Usar

### Para desenvolvimento local:
```bash
# O sistema funcionará normalmente com localhost
npm run dev
npm run start:server
```

### Para acesso externo:
1. **Na VPS**: Execute o backend normalmente
   ```bash
   npm run start:server
   ```

2. **No frontend externo**: Configure o arquivo `.env` com:
   ```
   VITE_BACKEND_URL=http://148.230.76.60:3001
   ```

3. **Acesse o painel**: O frontend em outro localhost agora se conectará ao IP da VPS

## 🔒 Segurança

⚠️ **IMPORTANTE**: Em produção, configure CORS específico:
```bash
# Substitua pelo domínio real do seu frontend
CORS_ORIGINS=https://seu-painel.com,https://app.seudominio.com
```

## 🧪 Testar Conexão

Para verificar se está funcionando:
```bash
# Testar conexão com o backend
curl http://148.230.76.60:3001/api/session/status/teste

# Verificar se o servidor está rodando
telnet 148.230.76.60 3001
```

## 📱 URLs de Acesso

- **Backend API**: `http://148.230.76.60:3001/api/`
- **WebSocket**: `ws://148.230.76.60:3001`
- **QR Code**: Será gerado e exibido no frontend remoto

## 🔄 Próximos Passos

1. Configure o firewall da VPS para permitir porta 3001
2. Configure HTTPS com certificado SSL (recomendado)
3. Defina CORS específico para maior segurança
4. Teste o acesso do frontend remoto

O sistema agora está configurado para permitir que qualquer frontend acesse o backend da VPS usando o IP `148.230.76.60:3001`! 🎉