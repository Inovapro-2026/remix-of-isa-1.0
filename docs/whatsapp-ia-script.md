# Script de Integração WhatsApp ISA com IA

Este guia mostra como configurar a API WhatsApp ISA para responder automaticamente com IA.

## Webhook Endpoint

A Edge Function está disponível em:
```
https://mcmkzimvkomfytfaybpz.supabase.co/functions/v1/whatsapp-webhook
```

## Opção 1: Modificar o código da API WhatsApp ISA

Adicione este código no arquivo `src/index.ts` da sua API WhatsApp (no servidor 148.230.76.60):

```typescript
// Adicione no início do arquivo
const WEBHOOK_URL = 'https://mcmkzimvkomfytfaybpz.supabase.co/functions/v1/whatsapp-webhook';

// Localize o evento 'messages.upsert' e adicione:
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  for (const msg of messages) {
    // Ignorar mensagens próprias e de grupos
    if (msg.key.fromMe) continue;
    if (msg.key.remoteJid?.endsWith('@g.us')) continue;
    
    // Extrair conteúdo da mensagem
    const messageContent = msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text ||
                          msg.message?.imageMessage?.caption ||
                          msg.message?.videoMessage?.caption;
    
    if (!messageContent) continue;
    
    console.log(`📩 Nova mensagem de ${msg.key.remoteJid}: ${messageContent}`);
    
    // Enviar para o webhook da IA
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: msg.key.remoteJid,
          message: msg.message,
          pushName: msg.pushName,
          key: msg.key,
          isGroup: msg.key.remoteJid?.endsWith('@g.us') || false,
        }),
      });
      
      const result = await response.json();
      console.log('✅ Webhook response:', result);
    } catch (error) {
      console.error('❌ Erro ao chamar webhook:', error);
    }
  }
});
```

## Opção 2: Script Standalone (Polling)

Se não puder modificar a API, crie um script separado que monitora mensagens:

```javascript
// whatsapp-ia-handler.js
const WHATSAPP_API = 'http://148.230.76.60:3333';
const WEBHOOK_URL = 'https://mcmkzimvkomfytfaybpz.supabase.co/functions/v1/whatsapp-webhook';

// Este script precisa ser integrado com o Baileys ou monitorar logs
// Recomendamos a Opção 1 para melhor performance
```

## Opção 3: Usar Docker Logs + Script

Monitore os logs do container e parse mensagens:

```bash
#!/bin/bash
# monitor-whatsapp.sh

docker logs -f whatsapp-isa-api 2>&1 | while read line; do
  # Parse mensagens recebidas e envie para o webhook
  if echo "$line" | grep -q "message received"; then
    curl -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "$line"
  fi
done
```

## Configuração Necessária no Supabase

1. **Ativar IA na instância**: No banco de dados, defina `is_ai_active = true` na tabela `whatsapp_instances`

2. **Configurar Comportamento da IA**:
   - Vá em "Comportamento IA" no dashboard
   - Configure nome, tom de voz, regras

3. **Adicionar Produtos**:
   - Cadastre produtos na seção "Produtos"
   - A IA usará para recomendar aos clientes

## Testando

Após configurar, envie uma mensagem para o WhatsApp conectado. A IA deve:
1. Receber via webhook
2. Gerar resposta contextualizada
3. Enviar resposta automaticamente

## Logs

Veja logs da Edge Function:
```
Dashboard Supabase → Edge Functions → whatsapp-webhook → Logs
```

## Formato do Webhook

O webhook espera este formato JSON:

```json
{
  "from": "5511999999999@s.whatsapp.net",
  "message": {
    "conversation": "Olá, quero saber sobre produtos"
  },
  "pushName": "Nome do Cliente",
  "key": {
    "fromMe": false,
    "remoteJid": "5511999999999@s.whatsapp.net"
  },
  "isGroup": false
}
```

## Resposta do Webhook

```json
{
  "status": "success",
  "from": "5511999999999",
  "message": "Olá, quero saber sobre produtos",
  "response": "Olá! 👋 Que bom ter você aqui...",
  "sent": true
}
```
