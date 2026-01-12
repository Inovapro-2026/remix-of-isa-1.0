/**
 * ISA Panel Server - AI Testing & Memory Management
 * (WhatsApp real connection removed - Panel only mode)
 */

import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env');
console.log(`[server.ts] Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('[server.ts] Error loading .env:', result.error);
} else {
    console.log('[server.ts] .env loaded successfully');
    console.log('[server.ts] OPENROUTER_API_KEY present:', !!process.env.OPENROUTER_API_KEY);
}

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { WhatsappService } from './backend/services/whatsappService.js';

// Create service instance AFTER env is loaded
const whatsappService = new WhatsappService();
console.log('[server.ts] WhatsappService instance created (Panel Only Mode)');

// Export for use in other services
export { whatsappService };

const app = express();
const httpServer = createServer(app);

// Configure CORS - allow requests from any origin for external access
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*';

// Configure Express CORS
app.use(cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json());

// ================= API ROUTES =================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: 'panel-only', timestamp: new Date().toISOString() });
});

// Memory Management
app.get('/api/memory/:cpf', async (req, res) => {
    try {
        const memory = await whatsappService.getMemory(req.params.cpf);
        res.json(memory);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/memory/save', async (req, res) => {
    const { cpf, config } = req.body;
    await whatsappService.saveMemory(cpf, config);
    res.json({ success: true });
});

// Products Management
app.get('/api/products/:cpf', async (req, res) => {
    try {
        const products = await whatsappService.getProducts(req.params.cpf);
        res.json(products);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/products/:cpf', async (req, res) => {
    try {
        const products = await whatsappService.addProduct(req.params.cpf, req.body);
        res.json(products);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/products/:cpf/:id', async (req, res) => {
    try {
        const products = await whatsappService.updateProduct(req.params.cpf, req.params.id, req.body);
        res.json(products);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/products/:cpf/:id', async (req, res) => {
    try {
        const products = await whatsappService.deleteProduct(req.params.cpf, req.params.id);
        res.json(products);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// AI Test Simulation (Main functionality)
app.post('/api/ai/test', async (req, res) => {
    try {
        const { cpf, message, config } = req.body;
        const result = await whatsappService.testAI(cpf, message, config);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// AI Config
app.get('/api/ia/config/:cpf', async (req, res) => {
    const { cpf } = req.params;
    const config = await whatsappService.getMemory(cpf);
    res.json(config);
});

// Admin Logs (if PM2 is running)
app.get('/api/admin/logs/:service', async (req, res) => {
    const { service } = req.params;
    const { type = 'out' } = req.query;
    const logPath = `/root/.pm2/logs/${service}-${type}.log`;

    try {
        if (!fs.existsSync(logPath)) {
            return res.status(404).json({ error: 'Log not found' });
        }
        const data = fs.readFileSync(logPath, 'utf8');
        const lines = data.trim().split('\n');
        const lastLines = lines.slice(-100).join('\n');
        res.json({ logs: lastLines });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ================= MOCK WHATSAPP ROUTES (Return disabled message) =================

app.post('/api/session/connect', async (req, res) => {
    res.json({ 
        status: 'disabled', 
        message: 'WhatsApp real connection disabled. Use ISA Test for AI simulation.' 
    });
});

app.get('/api/session/status/:cpf', (req, res) => {
    res.json(whatsappService.getSessionStatus(req.params.cpf));
});

app.post('/api/session/disconnect', async (req, res) => {
    res.json({ success: true, message: 'No active WhatsApp session (panel only mode)' });
});

app.delete('/api/session/:cpf/reset', async (req, res) => {
    res.json({ success: true, message: 'No active WhatsApp session (panel only mode)' });
});

app.post('/api/chat/send', async (req, res) => {
    res.json({ 
        success: false, 
        message: 'WhatsApp real connection disabled. Use ISA Test for AI simulation.' 
    });
});

app.get('/api/whatsapp/:cpf/contacts', (req, res) => {
    res.json({ contacts: [] });
});

app.get('/api/whatsapp/:cpf/messages/:jid', (req, res) => {
    res.json({ messages: [] });
});

app.post('/api/admin/bot/:cpf/toggle', (req, res) => {
    res.json({ success: true, isPaused: false, message: 'Bot toggle disabled (panel only mode)' });
});

app.post('/api/whatsapp/:cpf/save-memory', async (req, res) => {
    const { cpf } = req.params;
    const { config } = req.body;

    try {
        const success = await whatsappService.saveMemoryToLocal(cpf, config);
        if (success) {
            res.json({ success: true, message: 'Memory saved' });
        } else {
            res.status(500).json({ error: 'Failed to save memory' });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Public API (disabled)
app.post('/api/public/connect', async (req, res) => {
    res.json({ status: 'disabled', message: 'WhatsApp connection disabled' });
});

app.get('/api/public/status/:cpf', (req, res) => {
    res.json(whatsappService.getSessionStatus(req.params.cpf));
});

app.get('/api/public/qr/:cpf', async (req, res) => {
    res.status(404).json({ error: 'QR Code not available (WhatsApp connection disabled)' });
});

app.post('/api/public/disconnect', async (req, res) => {
    res.json({ success: true, message: 'No active session' });
});

app.delete('/api/public/reset/:cpf', async (req, res) => {
    res.json({ success: true, message: 'No active session' });
});

// ================= START SERVER =================

const PORT = parseInt(process.env.PORT || '3001', 10);

httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log(`ISA Panel Server running on port ${PORT} (Panel Only Mode)`);
    console.log(`CORS configured for origins: ${corsOrigins}`);
});
