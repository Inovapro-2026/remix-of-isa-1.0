# Prompt para Gemini - Configuração ISA WhatsApp Server

Cole este prompt no Gemini para configurar o servidor WhatsApp ISA:

---

## CONTEXTO

Tenho um servidor WhatsApp ISA rodando em `http://148.230.76.60:3333` que usa Baileys para conexão com WhatsApp. Preciso modificar o código para enviar todas as mensagens recebidas para um webhook externo que processa com IA e responde automaticamente.

## WEBHOOK ENDPOINT

```
POST https://mcmkzimvkomfytfaybpz.supabase.co/functions/v1/whatsapp-webhook
```

## ESTRUTURA DO PAYLOAD QUE O WEBHOOK ESPERA

```json
{
  "instance": "nome-da-instancia",
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "message-id-unique"
    },
    "message": {
      "conversation": "Texto da mensagem aqui"
    },
    "pushName": "Nome do Contato",
    "messageTimestamp": 1234567890
  }
}
```

## O QUE PRECISO QUE VOCÊ FAÇA

1. **Localize o arquivo principal do servidor** (provavelmente `src/index.ts`, `server.ts`, ou similar)

2. **Encontre onde o Baileys recebe mensagens** - geralmente é um evento como:
```typescript
sock.ev.on('messages.upsert', async (m) => { ... })
```

3. **Adicione código para enviar ao webhook** dentro desse evento:

```typescript
// Adicionar no início do arquivo
import axios from 'axios';

const WEBHOOK_URL = 'https://mcmkzimvkomfytfaybpz.supabase.co/functions/v1/whatsapp-webhook';

// Dentro do evento messages.upsert, adicione:
sock.ev.on('messages.upsert', async (m) => {
  const msg = m.messages[0];
  
  // Ignorar mensagens enviadas por mim ou de status/broadcast
  if (msg.key.fromMe) return;
  if (msg.key.remoteJid === 'status@broadcast') return;
  if (msg.key.remoteJid?.endsWith('@g.us')) return; // Ignorar grupos
  
  // Enviar para webhook de IA
  try {
    await axios.post(WEBHOOK_URL, {
      instance: 'isa-principal', // ou o nome da sua instância
      event: 'messages.upsert',
      data: {
        key: msg.key,
        message: msg.message,
        pushName: msg.pushName || 'Desconhecido',
        messageTimestamp: msg.messageTimestamp
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    console.log('✅ Mensagem enviada para webhook IA');
  } catch (error) {
    console.error('❌ Erro ao enviar para webhook:', error.message);
  }
  
  // ... resto do código existente
});
```

4. **Se não tiver axios instalado**, instale:
```bash
npm install axios
# ou
yarn add axios
```

5. **Reinicie o servidor** após as alterações:
```bash
pm2 restart all
# ou
docker-compose restart
# ou
npm run start
```

## EXEMPLO COMPLETO DE INTEGRAÇÃO

Se o arquivo atual for algo como:

```typescript
import makeWASocket from '@whiskeysockets/baileys';

const sock = makeWASocket({ /* config */ });

sock.ev.on('messages.upsert', async (m) => {
  console.log('Nova mensagem:', m);
});
```

Deve ficar assim:

```typescript
import makeWASocket from '@whiskeysockets/baileys';
import axios from 'axios';

const WEBHOOK_URL = 'https://mcmkzimvkomfytfaybpz.supabase.co/functions/v1/whatsapp-webhook';

const sock = makeWASocket({ /* config */ });

sock.ev.on('messages.upsert', async (m) => {
  const msg = m.messages[0];
  
  // Log da mensagem
  console.log('Nova mensagem:', m);
  
  // Filtros
  if (msg.key.fromMe) return;
  if (msg.key.remoteJid === 'status@broadcast') return;
  if (msg.key.remoteJid?.endsWith('@g.us')) return;
  
  // Enviar para IA
  try {
    const response = await axios.post(WEBHOOK_URL, {
      instance: 'isa-principal',
      event: 'messages.upsert',
      data: {
        key: msg.key,
        message: msg.message,
        pushName: msg.pushName || 'Desconhecido',
        messageTimestamp: msg.messageTimestamp
      }
    });
    console.log('✅ Webhook respondeu:', response.status);
  } catch (error) {
    console.error('❌ Webhook erro:', error.message);
  }
});
```

## TESTE

Após configurar, envie uma mensagem de teste para o WhatsApp conectado. Verifique:

1. O console do servidor deve mostrar "✅ Mensagem enviada para webhook IA"
2. O webhook irá processar e responder automaticamente

## NOTAS IMPORTANTES

- O webhook já cuida de buscar configurações de IA, produtos e regras de comportamento
- O webhook também salva as conversas no banco de dados automaticamente
- Para ativar/desativar IA, defina `is_ai_active = true/false` na tabela `whatsapp_instances`

---

**Por favor, analise o código do servidor ISA WhatsApp e implemente essas alterações. Me mostre o código modificado completo.**
