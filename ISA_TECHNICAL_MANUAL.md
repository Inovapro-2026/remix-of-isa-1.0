# ISA 1.0 - Technical System Documentation

This document provides a complete technical overview of the ISA 1.0 system (also referred to as ISA 2.5 in some legacy contexts). It is designed to give an autonomous AI agent or developer a full understanding of the architecture, features, and integrations.

## 1. System Overview

ISA (Intelligent Service Assistant) is a hybrid WhatsApp automation platform that combines traditional chatbot mechanics with generative AI. It allows businesses to connect their WhatsApp numbers, manage products, and have an AI agent handle customer service, sales, and catalog queries automatically.

### Key Capabilities
- **Hybrid AI Engine**: Uses a multi-tier fallback system (OpenRouter → Groq) to ensure high availability and low cost.
- **Dual Database Architecture**: Combines Supabase (Cloud PostgreSQL) for authentication/billing with local SQLite for high-performance bot memory and message storage.
- **Product Search Engine**: Proprietary hybrid search (Regex Code Match + Semantic/Text Search) to let the AI "know" about inventory.
- **Multi-Tenant**: Supports distinct roles (Super Admin, Admin, Client).
- **Public Vitrine**: Auto-generated e-commerce catalog page for each client.

## 2. Architecture

### Tech Stack
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, ShadcnUI.
- **Backend Service**: Node.js, Express, Socket.io.
- **WhatsApp Engine**: `whatsapp-web.js` (Puppeteer-based) running in a headless Chrome instance.
- **Databases**:
    - **PostgreSQL (Supabase)**: User management, RLS, Cloud sync.
    - **SQLite (Local)**: `memoria_ia.db` (per-user/matricula) for fast AI context retrieval.

### Infrastructure
- **Services (PM2 managed)**:
    - `isa-frontend`: Vite server (Port 9001).
    - `isa-whatsapp`: Main Backend API & Bot Engine (Port 3001).
    - `traefik`: Reverse proxy (Port 80/443 mapping to internal services).

## 3. Core Modules & Services

### 3.1 Backend Services (`/backend/services`)
*   **`whatsappService.ts`**: The central orchestrator. It handles:
    *   Session creation/deletion.
    *   Message processing pipeline (`processMessage`).
    *   Auto-reply logic (Rate limiting, context assembly, AI generation).
    *   Memory synchronization (Supabase ↔ SQLite).
*   **`localMemoryService.ts`**: Handles local SQLite operations.
    *   Manages per-user databases in `contas/<matricula>/memoria_ia.db`.
    *   Tables: `products`, `ai_behavior_rules`, `ai_memory_config`.
*   **`productSearchEngine.ts`**: Intelligent retrieval system.
    *   **Strategy 1**: Regex match for Product Codes (e.g., "PROD-123").
    *   **Strategy 2**: Text search implementation for product names/descriptions.
    *   Injects relevant product data into the AI's system prompt dynamically.
*   **`groqService.ts` & `openRouterService.ts`**: AI Clients.
    *   Implements a tiered fallback strategy (Tier 1: High Quality → Tier 2: Fast → Tier 3: Cheap/Free).
*   **`socketService.ts`**: Real-time communication for QR code transmission and message updates to the frontend.

### 3.2 Frontend Structure (`/src`)
*   **Public Routes**:
    *   `/` (Landing), `/login`, `/cadastro`, `/vitrine/:identifier` (Public Catalog).
*   **Client Dashboard (`/client/*`)**:
    *   `ClientWhatsApp`: Connection status, QR Code view.
    *   `ClientChat`: Live chat interface (Human takeover).
    *   `ClientProducts`: CRUD for inventory.
    *   `ClientAIIdentity` & `ClientMemoryBehavior`: Fine-tune the AI's personality and rules.
    *   `ClientIsaTest`: Sandbox to chat with the configured AI.
*   **Admin Dashboard (`/dashboard/*`)**:
    *   User management, approval queues, global system monitoring.

## 4. Data Model

### 4.1 Supabase (Cloud Source of Truth)
Authenticated via `supabase-js`.
*   **`profiles`**: User metadata (Link to Auth).
*   **`products`**: Cloud backup of merchandise.
*   **`clients`**: subscription details.

### 4.2 SQLite (Local Bot Execution)
Stored in `backend/contas/<MATRICULA>/memoria_ia.db`.
*   **`products`**: Local copy for < 10ms retrieval during chat.
    *   Columns: `id`, `name`, `description`, `price`, `code`, `active`.
*   **`ai_behavior_rules`**: Raw text rules defined by the user.
*   **`ai_memory_config`**: JSON-like structure for Identity (Name, Tone, Greeting).

## 5. Integrations

### WhatsApp
*   Uses `whatsapp-web.js` to simulate a real client.
*   **Capabilities**: Text, QR Generation, Session Restoration (LocalAuth).

### Artificial Intelligence
*   **System Prompt Construction**:
    1.  Base Persona (Name, Tone).
    2.  Company Info (Hours, Address).
    3.  Behavior Rules.
    4.  **Dynamic Context**: Products found by `productSearchEngine` are injected into the context window *only* when relevant to the query to save tokens and improve accuracy.
*   **Providers**:
    *   **Groq**: Llama 3.3/3.1 (High speed).
    *   **OpenRouter**: Aggregator for free/open models.

### External APIs
*   **Evolution API**: (Legacy/Alternative) support exists in `evolutionService.ts` but is secondary to the native `whatsapp-web.js` implementation.
*   **Lovable / Public API**:
    *   `GET /api/public/qr/:cpf`: Returns PNG image of QR Code.
    *   `GET /api/public/status/:cpf`: Returns JSON status.
    *   `POST /api/public/connect`: Triggers connection flow.

## 6. Usage Guide for AI Agents

To manipulate this system code-wise:

1.  **Adding Features**: Always update both `supabaseProductService` (Cloud) and `localMemoryService` (Local) to ensure data consistency.
2.  **Debugging AI**: Check `isa-whatsapp-out.log`. It logs the full "System Prompt Length" and which model (Groq/OpenRouter) was used.
3.  **Port Configuration**:
    *   Backend currently hardcoded to default to `3001` in `server.ts` to fallback if `.env` fails.
    *   Frontend expects backend at `http://localhost:3001` (or configured IP).
4.  **New Dependencies**: If adding native modules, remember to rebuild inside the environment or container, as this is a Linux environment.

## 7. Configuration Files
*   `.env`: API Keys (GROQ, OPENROUTER, SUPABASE).
*   `ecosystem.config.js`: PM2 process definition.
*   `backend/server.ts`: Entry point for the API/Bot server.
