
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import promptBuilder from './promptBuilder.js';

const mockConfig = {
    identity: {
        name: "ISA",
        tone: "friendly",
        greeting: "Olá! Como posso ajudar?"
    },
    company: {
        name: "InovaPro Tech",
        segment: "Tecnologia"
    },
    products: [
        { id: "1", name: "Bot WhatsApp", price: 299.9, description: "Automação completa", code: "WWBOT", category: "Software" },
        { id: "2", name: "Consultoria IA", price: 1500.0, description: "Estratégia personalizada", code: "IACONS", category: "Serviço" }
    ]
};

const prompt = promptBuilder.buildSystemPrompt(mockConfig, "Produto solicitado: Bot WhatsApp", "https://isa.inovapro.cloud/vitrine/123");

console.log("=== GENERATED PROMPT ===");
console.log(prompt);
console.log("=========================");

if (prompt.includes("CATÁLOGO DE PRODUTOS COMPLETO") && prompt.includes("WWBOT")) {
    console.log("✅ Prompt looks good!");
} else {
    console.error("❌ Prompt missing information!");
}
