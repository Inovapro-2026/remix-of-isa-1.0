# ISA 2.5 - WhatsApp Business Automation Platform

## 🚀 Visão Geral

ISA 2.5 é uma plataforma completa de automação de WhatsApp Business com IA integrada que permite:
- ✅ Conexão de múltiplas contas WhatsApp por CPF
- 🤖 Atendimento automatizado com IA (Groq + OpenRouter)
- 💬 Interface de chat em tempo real
- 🧠 Memória de IA configurável por cliente
- 📊 Dashboard com estatísticas reais
- 🛍️ Vitrine pública de produtos integrada
- 🎨 Identidade visual personalizável
- 🔄 Sistema de fallback inteligente entre modelos de IA
- 👥 Sistema multi-tenant (Admin + Clientes)

---

## 🏗️ Arquitetura Completa

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                     │
│                         Porta 8080                               │
├─────────────────────────────────────────────────────────────────┤
│  • React 18 + TypeScript                                        │
│  • TailwindCSS + shadcn/ui                                      │
│  • React Router DOM (SPA)                                       │
│  • TanStack Query (cache/state)                                 │
│  • Socket.io Client (real-time)                                 │
│  • Supabase Client (auth/database)                              │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (Backend)                           │
├─────────────────────────────────────────────────────────────────┤
│  • Authentication (email/senha com matrícula)                   │
│  • PostgreSQL Database (RLS habilitado)                         │
│  • Edge Functions (serverless)                                  │
│  • Row Level Security (isolamento por user_id)                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIÇOS EXTERNOS                             │
├─────────────────────────────────────────────────────────────────┤
│  • WhatsApp Web (Baileys) - Porta 8081                          │
│  • Groq AI (mixtral-8x7b-32768)                                 │
│  • Supabase (PostgreSQL + Storage + Auth)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 PÁGINAS E ROTAS COMPLETAS

### Páginas Públicas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | `Index.tsx` | Landing page pública com features, testimonials, CTA |
| `/login` | `Login.tsx` | Login com matrícula + senha (Admin 7 dígitos, Cliente 6 dígitos) |
| `/cadastro` | `Cadastro.tsx` | Registro de novos clientes (aguarda aprovação) |
| `/aguardando-aprovacao` | `AguardandoAprovacao.tsx` | Tela de aguardo após cadastro |
| `/vitrine/:identifier` | `Vitrine.tsx` | Vitrine pública de produtos (acessível por CPF ou user_id) |
| `*` | `NotFound.tsx` | Página 404 |

### Painel do Cliente (`/client/*`)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/client/whatsapp` | `ClientWhatsApp.tsx` | Conexão WhatsApp, QR Code, status |
| `/client/chat` | `ClientChat.tsx` | Chat em tempo real com contatos |
| `/client/vitrine` | `ClientVitrine.tsx` | Configuração da vitrine pública |
| `/client/products` | `ClientProducts.tsx` | CRUD de produtos |
| `/client/ai-identity` | `ClientAIIdentity.tsx` | Nome, tom, personalidade da IA |
| `/client/company-knowledge` | `ClientCompanyKnowledge.tsx` | Dados da empresa (nome, horário, endereço) |
| `/client/memoria-ia` | `ClientMemoryBehavior.tsx` | Regras de comportamento da IA |
| `/client/isa-test` | `ClientIsaTest.tsx` | Simulador de conversa com IA |
| `/client/profile` | `ClientProfile.tsx` | Perfil do usuário |
| `/client/support` | `ClientSupport.tsx` | Tickets de suporte |

### Painel do Administrador (`/dashboard/*`)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/dashboard/admin` | `AdminDashboard.tsx` | Dashboard administrativo |
| `/dashboard/clients` | `Clients.tsx` | Gerenciamento de clientes |
| `/dashboard/requests` | `Requests.tsx` | Aprovar/rejeitar cadastros |
| `/dashboard/whatsapp-bot` | `WhatsAppBot.tsx` | Gerenciar bot global |
| `/dashboard/conversations` | `Conversations.tsx` | Visualizar conversas |
| `/dashboard/reports` | `Reports.tsx` | Relatórios e métricas |
| `/dashboard/settings` | `Settings.tsx` | Configurações do sistema |
| `/dashboard/support` | `Support.tsx` | Gerenciar tickets |

---

## 🗃️ BANCO DE DADOS (Supabase PostgreSQL)

### Tabelas Principais

#### `profiles` - Perfis de Usuários
```sql
- id: UUID (PK, = auth.users.id)
- email: TEXT (NOT NULL)
- full_name: TEXT
- cpf: TEXT
- matricula: TEXT (6 dígitos para clientes)
- company_name: TEXT
- phone: TEXT
- birth_date: DATE
- avatar_url: TEXT
- plan: TEXT (default: 'basic')
- is_active: BOOLEAN (default: true)
- created_at, updated_at: TIMESTAMPTZ
```

#### `admins` - Administradores
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- matricula: TEXT (7 dígitos para admins)
- full_name: TEXT (NOT NULL)
- email: TEXT (NOT NULL)
- cpf: TEXT
- phone: TEXT
- is_active: BOOLEAN
- last_login_at: TIMESTAMPTZ
```

#### `clients` - Clientes
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- cpf: TEXT (NOT NULL)
- matricula: TEXT (6 dígitos, NOT NULL)
- full_name: TEXT (NOT NULL)
- email: TEXT (NOT NULL)
- company_name: TEXT
- phone: TEXT
- plan: TEXT (default: 'basic')
- status: TEXT (default: 'active')
- start_date: DATE
- expiration_date: DATE
- trial_days: INTEGER
- is_active: BOOLEAN
```

#### `account_requests` - Solicitações de Cadastro
```sql
- id: UUID (PK)
- full_name: TEXT (NOT NULL)
- email: TEXT (NOT NULL)
- cpf: TEXT
- phone: TEXT
- company_name: TEXT
- matricula: TEXT (auto-gerado)
- status: ENUM ('pending', 'approved', 'rejected')
- rejection_reason: TEXT
- reviewed_by: UUID
- reviewed_at: TIMESTAMPTZ
```

#### `user_roles` - Roles de Usuários
```sql
- id: UUID (PK)
- user_id: UUID (NOT NULL)
- role: ENUM ('super_admin', 'admin', 'client')
```

#### `products` - Produtos
```sql
- id: UUID (PK)
- user_id: UUID (NOT NULL, FK)
- name: TEXT (NOT NULL)
- description: TEXT
- price: NUMERIC (NOT NULL)
- category: TEXT
- image_url: TEXT
- is_active: BOOLEAN (default: true)
- created_at, updated_at: TIMESTAMPTZ
```

#### `ai_configs` - Configurações de IA
```sql
- id: UUID (PK)
- user_id: UUID (NOT NULL)
- ai_name: TEXT (default: 'Assistente IA')
- tone: TEXT (default: 'friendly')
- formality_level: INTEGER (1-5, default: 3)
- welcome_message: TEXT
- allowed_emojis: TEXT[]
- business_hours: JSONB
- knowledge_base: JSONB
- triggers: JSONB
- faqs: JSONB
```

#### `ai_behavior_rules` - Regras de Comportamento da IA ⭐ NOVO
```sql
- id: UUID (PK)
- user_id: UUID (NOT NULL)
- rules: TEXT (regras em texto livre)
- created_at, updated_at: TIMESTAMPTZ
```

#### `company_knowledge` - Conhecimento da Empresa ⭐ NOVO
```sql
- id: UUID (PK)
- user_id: UUID (NOT NULL)
- name: TEXT (nome da empresa)
- segment: TEXT (segmento de atuação)
- mission: TEXT (missão/valores)
- hours: TEXT (horário de funcionamento)
- payment: TEXT (formas de pagamento)
- address: TEXT (endereço)
- policies: TEXT (políticas da empresa)
- schedule_config: JSONB (configuração de horários)
- created_at, updated_at: TIMESTAMPTZ
```

#### `client_ai_memory` - Memória de IA (Legado/Backup)
```sql
- id: UUID (PK)
- user_id: UUID (NOT NULL)
- config: JSONB (configurações diversas, incluindo vitrine)
- created_at, updated_at: TIMESTAMPTZ
```

#### `whatsapp_instances` - Instâncias WhatsApp
```sql
- id: UUID (PK)
- user_id: UUID (NOT NULL)
- instance_name: TEXT (NOT NULL)
- phone_number: TEXT
- status: ENUM ('disconnected', 'connecting', 'connected', 'error')
- qr_code: TEXT
- session_data: JSONB
- is_ai_active: BOOLEAN (default: true)
- last_connected_at: TIMESTAMPTZ
```

#### `whatsapp_contacts` - Contatos WhatsApp
```sql
- id: UUID (PK)
- instance_id: UUID (FK -> whatsapp_instances)
- phone_number: TEXT (NOT NULL)
- name: TEXT
- profile_pic_url: TEXT
- is_online: BOOLEAN
- last_seen_at: TIMESTAMPTZ
- unread_count: INTEGER
```

#### `whatsapp_messages` - Mensagens WhatsApp
```sql
- id: UUID (PK)
- instance_id: UUID (FK -> whatsapp_instances)
- contact_id: UUID (FK -> whatsapp_contacts)
- content: TEXT
- is_from_me: BOOLEAN
- is_ai_response: BOOLEAN
- media_type: TEXT
- media_url: TEXT
- status: TEXT ('sent', 'delivered', 'read')
- timestamp: TIMESTAMPTZ
```

#### `tickets` - Tickets de Suporte
```sql
- id: UUID (PK)
- user_id: UUID (NOT NULL)
- subject: TEXT (NOT NULL)
- category: TEXT
- priority: ENUM ('low', 'normal', 'high', 'urgent')
- status: ENUM ('open', 'in_progress', 'resolved', 'closed')
- assigned_admin_id: UUID
```

#### `ticket_messages` - Mensagens de Tickets
```sql
- id: UUID (PK)
- ticket_id: UUID (FK -> tickets)
- sender_id: UUID (NOT NULL)
- content: TEXT (NOT NULL)
- attachment_url: TEXT
- is_system_message: BOOLEAN
```

#### `announcements` - Comunicados
```sql
- id: UUID (PK)
- created_by: UUID (NOT NULL)
- title: TEXT (NOT NULL)
- content: TEXT (NOT NULL)
- priority: ENUM ('normal', 'important', 'urgent')
- target_all: BOOLEAN
- target_users: UUID[]
- target_plans: TEXT[]
- scheduled_at: TIMESTAMPTZ
- sent_at: TIMESTAMPTZ
```

#### `system_logs` - Logs do Sistema
```sql
- id: UUID (PK)
- user_id: UUID
- action: TEXT (NOT NULL)
- details: JSONB
- ip_address: TEXT
- created_at: TIMESTAMPTZ
```

---

## 🔧 FUNÇÕES DO BANCO (Database Functions)

### `generate_matricula()`
Gera matrícula única de 6 dígitos para novos usuários.

### `handle_new_user()`
Trigger executado ao criar usuário no auth.users:
1. Cria registro em `profiles`
2. Cria role `client` em `user_roles`
3. Cria config padrão em `ai_configs`

### `is_admin(_user_id UUID)`
Retorna TRUE se usuário tem role `admin` ou `super_admin`.

### `has_role(_user_id UUID, _role app_role)`
Verifica se usuário tem uma role específica.

### `get_public_vitrine(identifier TEXT)`
Função pública (SECURITY DEFINER) que retorna dados da vitrine:
- Busca por CPF, user_id ou ID em profiles/clients/admins
- Retorna config da vitrine + produtos ativos
- Usado na rota pública `/vitrine/:identifier`

### `set_admin_for_maicon()`
Trigger que define super_admin para email específico.

---

## 🔒 ROW LEVEL SECURITY (RLS)

Todas as tabelas têm RLS habilitado com políticas:

### Padrão para Dados de Usuário
- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

### Admins
- Admins podem ver todos os registros: `is_admin(auth.uid())`
- Super admins podem gerenciar tudo: `has_role(auth.uid(), 'super_admin')`

### Produtos
- Públicos podem ver produtos ativos: `is_active = true`
- Usuários gerenciam próprios produtos

---

## ⚡ EDGE FUNCTIONS (Supabase)

### `isa-chat`
Chat contextual com IA para WhatsApp.
```typescript
POST /functions/v1/isa-chat
Body: { message, context, clientId, userId }
```

### `isa-support-chat`
Suporte técnico com IA para o painel.
```typescript
POST /functions/v1/isa-support-chat
Body: { issue, clientId }
```

### `test-behavior-ai`
Testa configuração de comportamento da IA.
```typescript
POST /functions/v1/test-behavior-ai
Body: { message, rules, userId }
```

### `provision-user`
Provisiona novo usuário após aprovação.
```typescript
POST /functions/v1/provision-user
Body: { email, password, matricula, ... }
```

---

## 🎣 HOOKS PERSONALIZADOS

| Hook | Arquivo | Descrição |
|------|---------|-----------|
| `useAuth` | `useAuth.tsx` | Autenticação, login, logout, sessão |
| `useProducts` | `useProducts.ts` | CRUD de produtos via Supabase |
| `useBehaviorRules` | `useBehaviorRules.ts` | Regras de comportamento IA ⭐ NOVO |
| `useCompanyKnowledge` | `useCompanyKnowledge.ts` | Dados da empresa ⭐ NOVO |
| `useClientMemory` | `useClientMemory.ts` | Memória legada (client_ai_memory) |
| `useSupport` | `useSupport.ts` | Tickets de suporte |
| `useIsaSupportChat` | `useIsaSupportChat.ts` | Chat com suporte IA |
| `useWhatsappManager` | `use-whatsapp-manager.ts` | Gerenciamento WhatsApp |
| `useWhatsappStore` | `use-whatsapp-store.ts` | Estado do WhatsApp (Zustand) |
| `useMobile` | `use-mobile.tsx` | Detecção de dispositivo mobile |
| `useToast` | `use-toast.ts` | Notificações toast |

---

## 🔌 SERVIÇOS

| Serviço | Arquivo | Descrição |
|---------|---------|-----------|
| `clientWhatsAppISA` | `clientWhatsAppISA.ts` | Cliente API WhatsApp |
| `evolutionService` | `evolutionService.ts` | Integração Evolution API |
| `openRouterService` | `openRouterService.ts` | Fallback multi-modelo IA |
| `supabaseProductService` | `supabaseProductService.ts` | Operações de produtos via Supabase |
| `socket` | `socket.ts` | Cliente Socket.io |
| `socketService` | `socketService.ts` | Gerenciamento WebSocket |
| `whatsappISA` | `whatsappISA.ts` | Lógica WhatsApp |
| `whatsappService` | `whatsappService.ts` | API WhatsApp |

---

## 🔗 API DO WHATSAPP SERVICE (Porta 8081)

### Sessões
```
GET    /api/whatsapp/status/:clientId     - Status da sessão
POST   /api/whatsapp/create-session       - Criar nova sessão
POST   /api/whatsapp/generate-qr/:clientId - Gerar QR Code
POST   /api/whatsapp/disconnect/:clientId  - Desconectar
DELETE /api/whatsapp/delete/:clientId     - Excluir sessão
POST   /api/whatsapp/reset-session        - Resetar sessão
```

### Mensagens
```
GET    /api/whatsapp/contacts/:clientId   - Listar contatos
GET    /api/whatsapp/messages/:clientId   - Histórico
POST   /api/whatsapp/send-message         - Enviar mensagem
POST   /api/whatsapp/send-media           - Enviar mídia
```

### IA e Configurações
```
GET    /api/whatsapp/memory/:clientId     - Obter memória
POST   /api/whatsapp/memory/:clientId     - Salvar memória
POST   /api/whatsapp/test-ia              - Testar IA
GET    /api/whatsapp/config/:clientId     - Obter config
POST   /api/whatsapp/config/:clientId     - Salvar config
```

---

## 🗂️ ESTRUTURA DE PASTAS

```
/
├── src/
│   ├── pages/
│   │   ├── client/                    # Páginas do cliente
│   │   │   ├── ClientWhatsApp.tsx
│   │   │   ├── ClientChat.tsx
│   │   │   ├── ClientVitrine.tsx
│   │   │   ├── ClientProducts.tsx
│   │   │   ├── ClientAIIdentity.tsx
│   │   │   ├── ClientCompanyKnowledge.tsx  ⭐ ATUALIZADO
│   │   │   ├── ClientMemoryBehavior.tsx    ⭐ ATUALIZADO
│   │   │   ├── ClientIsaTest.tsx
│   │   │   ├── ClientProfile.tsx
│   │   │   └── ClientSupport.tsx
│   │   ├── dashboard/                 # Páginas do admin
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── Clients.tsx
│   │   │   ├── Requests.tsx
│   │   │   └── ...
│   │   ├── Index.tsx                  # Landing page
│   │   ├── Login.tsx
│   │   ├── Cadastro.tsx
│   │   ├── Vitrine.tsx                # Vitrine pública
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── dashboard/
│   │   ├── landing/
│   │   ├── whatsapp/
│   │   ├── chat/
│   │   └── ai/
│   ├── hooks/                         # Hooks customizados
│   │   ├── useAuth.tsx
│   │   ├── useProducts.ts
│   │   ├── useBehaviorRules.ts        ⭐ NOVO
│   │   ├── useCompanyKnowledge.ts     ⭐ NOVO
│   │   └── ...
│   ├── services/                      # Serviços e APIs
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts              # Cliente Supabase
│   │       └── types.ts               # Tipos auto-gerados
│   └── lib/
│       └── utils.ts
├── supabase/
│   ├── functions/                     # Edge Functions
│   │   ├── isa-chat/
│   │   ├── isa-support-chat/
│   │   ├── provision-user/
│   │   └── test-behavior-ai/
│   ├── migrations/                    # Migrações SQL
│   └── config.toml
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🔄 ALTERAÇÕES RECENTES

### ⭐ Migração de Dados de IA (NOVO)

**Antes**: Dados de comportamento e empresa salvos em `client_ai_memory.config` (JSON blob)

**Depois**: Tabelas dedicadas com estrutura normalizada:
- `ai_behavior_rules` - Regras de comportamento da IA
- `company_knowledge` - Dados da empresa

**Hooks criados**:
- `useBehaviorRules.ts` - Gerencia `ai_behavior_rules`
- `useCompanyKnowledge.ts` - Gerencia `company_knowledge`

**Páginas atualizadas**:
- `ClientMemoryBehavior.tsx` - Usa `useBehaviorRules`
- `ClientCompanyKnowledge.tsx` - Usa `useCompanyKnowledge`

### ⭐ Correção do Supabase Client

**Problema**: Variáveis `VITE_*` não funcionavam em produção

**Solução**: URLs do Supabase hardcoded em `client.ts`:
```typescript
const SUPABASE_URL = "https://mcmkzimvkomfytfaybpz.supabase.co";
const SUPABASE_ANON_KEY = "eyJ...";
```

### ⭐ Correção de Produtos

**Problema**: Produtos carregavam de API externa com erro 500

**Solução**: Hook `useProducts.ts` atualizado para buscar direto do Supabase:
```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('user_id', user.id);
```

---

## 🔐 SECRETS CONFIGURADOS (Supabase)

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço |
| `SUPABASE_DB_URL` | URL do banco PostgreSQL |
| `GROQ_API_KEY` | API Key do Groq |
| `LXPAY_PUBLIC_KEY` | Chave pública LxPay |
| `LXPAY_SECRET_KEY` | Chave secreta LxPay |
| `LXPAY_WORKSPACE_ID` | ID do workspace LxPay |
| `MERCADOPAGO_ACCESS_TOKEN` | Token MercadoPago |

---

## 🚀 COMO EXECUTAR

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Executar frontend (porta 8080)
npm run dev

# Executar backend WhatsApp (porta 8081)
npm run dev:server
```

### Produção
```bash
npm run build
npm start
```

---

## 📊 MÉTRICAS E LIMITES

- **Rate limit**: 100 req/min por cliente
- **Tamanho mídia**: 16MB máximo
- **Resposta WhatsApp**: 300 caracteres máximo
- **Histórico contexto**: 10 mensagens
- **QR Code expira**: 60 segundos (regeneração automática)

---

## 🛡️ SEGURANÇA

- ✅ RLS em todas as tabelas
- ✅ Sessões isoladas por user_id
- ✅ Validação de entrada
- ✅ Tokens JWT com expiração
- ✅ SECURITY DEFINER em funções públicas
- ✅ Conformidade LGPD

---

**ISA 2.5 - WhatsApp Business Automation Platform**  
*Desenvolvido com ❤️ pela Inovapro*  
*Última atualização: Janeiro 2026*
