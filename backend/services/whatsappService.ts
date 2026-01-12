/**
 * ISA Panel Service - AI Testing & Memory Management
 * (WhatsApp real connection removed - Panel only mode)
 */

import productSearchEngine from './productSearchEngine.js';
import supabaseProductService, { supabase } from './supabaseProductService.js';
import { OpenRouterService } from './openRouterService.js';
import promptBuilder from './promptBuilder.js';

class WhatsappService {
    private openRouter: OpenRouterService;

    constructor() {
        const openRouterKey = process.env.OPENROUTER_API_KEY || '';
        console.log(`[WhatsappService] OPENROUTER_API_KEY loaded: ${openRouterKey ? 'YES' : 'NO'}`);
        this.openRouter = new OpenRouterService(openRouterKey);
    }

    private formatPrice(price: number): string {
        return `R$ ${price.toFixed(2).replace('.', ',')}`;
    }

    private buildSystemPrompt(memory: any, productContext: string, vitrineLink: string): string {
        return promptBuilder.buildSystemPrompt(memory, productContext, vitrineLink);
    }

    // Mock session methods (no real WhatsApp connection)
    async createSession(cpf: string) {
        console.log(`[WhatsappService] Mock session created for ${cpf}`);
        return { status: 'mock', message: 'WhatsApp real connection disabled. Use ISA Test for AI simulation.' };
    }

    async deleteSession(cpf: string) {
        console.log(`[WhatsappService] Mock session deleted for ${cpf}`);
        return { success: true };
    }

    getSessionStatus(cpf: string) {
        return {
            status: 'disconnected',
            isPaused: false,
            messagesToday: 0,
            activeContacts: 0,
            responseRate: 'N/A',
            lastMessage: null,
            message: 'WhatsApp real connection disabled. Use ISA Test.'
        };
    }

    togglePause(cpf: string) {
        return false;
    }

    getContacts(cpf: string) {
        return [];
    }

    getMessages(cpf: string, jid: string) {
        return [];
    }

    async sendMessage(cpf: string, to: string, text: string, isAi: boolean = false) {
        console.log(`[WhatsappService] Mock sendMessage to ${to}: ${text}`);
        return { success: true, mock: true };
    }

    async restoreSessions() {
        console.log('[WhatsappService] No sessions to restore (panel only mode)');
    }

    async saveMemoryToLocal(cpf: string, config: any) {
        return await supabaseProductService.saveMemory(cpf, config);
    }

    public async getMemory(cpf: string): Promise<any> {
        try {
            const cleanCpf = cpf.replace(/\D/g, '');
            console.log(`[WhatsappService] Getting memory for CPF: ${cleanCpf}`);

            // Buscar matrícula do cliente pelo CPF ou phone
            const { data: clientData } = await supabase
                .from('clients')
                .select('matricula, user_id')
                .or(`phone.eq.${cleanCpf},cpf.eq.${cleanCpf}`)
                .maybeSingle();

            if (!clientData?.matricula) {
                console.warn(`[WhatsappService] No matricula found for ${cleanCpf}`);
                return { products: [] };
            }

            console.log(`[WhatsappService] Found matricula: ${clientData.matricula}`);

            // Buscar configuração de memória do Supabase
            const memoryConfig = await supabaseProductService.getMemory(cleanCpf);

            // Buscar produtos direto do Supabase por matrícula (fallback para user_id)
            let products = await supabaseProductService.getProductsByMatricula(clientData.matricula);
            if (products.length === 0 && clientData.user_id) {
                console.log(`[WhatsappService] No products by matricula ${clientData.matricula}, trying user_id ${clientData.user_id}`);
                products = await supabaseProductService.getProductsByUserId(clientData.user_id);
            }

            console.log(`[WhatsappService] ✅ Loaded ${products.length} products from Supabase for matricula ${clientData.matricula}`);

            // Retornar config + produtos
            return {
                ...memoryConfig,
                products: products
            };
        } catch (error: any) {
            console.error('[WhatsappService] Error getting memory:', error.message);
            return { products: [] };
        }
    }

    async saveMemory(cpf: string, cfg: any) { 
        return await supabaseProductService.saveMemory(cpf, cfg); 
    }

    async getProducts(cpf: string) { 
        return await supabaseProductService.getProductsByCpf(cpf); 
    }

    async addProduct(cpf: string, prod: any) { 
        return await supabaseProductService.addProduct(cpf, prod); 
    }

    async updateProduct(cpf: string, id: string, prod: any) { 
        return await supabaseProductService.updateProduct(id, prod); 
    }

    async deleteProduct(cpf: string, id: string) { 
        return await supabaseProductService.deleteProduct(id); 
    }

    async testAI(cpf: string, msg: string, cfg: any) {
        console.log(`[TestAI] Generating response for ${cpf}...`);

        const memory = await this.getMemory(cpf);
        const cleanCpf = cpf.replace(/\D/g, '');
        const { data: clientData } = await supabase
            .from('clients')
            .select('matricula')
            .or(`phone.eq.${cleanCpf},cpf.eq.${cleanCpf}`)
            .maybeSingle();

        const matriculaResolved = clientData?.matricula || '000000';
        const allProducts = memory.products || [];
        const { focusedProduct, relatedProducts } = await productSearchEngine.findProducts(matriculaResolved, msg, allProducts);

        const vitrineLink = (memory as any)?.vitrine_link || `https://isa.inovapro.cloud/vitrine/${matriculaResolved}`;
        let productContext = '';

        if (focusedProduct) {
            const desc = focusedProduct.description || 'Produto sem descrição detalhada.';
            productContext = `PRODUTO EM FOCO (Solicitado explicitamente): ${focusedProduct.name} - ${this.formatPrice(focusedProduct.price)}\nDescrição: ${desc}`;
            if (allProducts.length > 0) {
                productContext += `\n\n--- OUTROS PRODUTOS DISPONÍVEIS ---\n${allProducts.filter((p: any) => p.id !== focusedProduct.id).map((p: any) => `- ${p.name}: ${this.formatPrice(p.price)}`).join('\n')}`;
            }
        } else if (relatedProducts.length > 0) {
            productContext = `Produtos Encontrados na Busca:\n${relatedProducts.map((p: any) => `- ${p.name}: ${this.formatPrice(p.price)}`).join('\n')}`;
            if (allProducts.length > 0) {
                const relatedIds = new Set(relatedProducts.map((p: any) => p.id));
                const others = allProducts.filter((p: any) => !relatedIds.has(p.id));
                if (others.length > 0) {
                    productContext += `\n\n--- OUTROS PRODUTOS ---\n${others.map((p: any) => `- ${p.name}: ${this.formatPrice(p.price)}`).join('\n')}`;
                }
            }
            productContext += `\nLink: ${vitrineLink}`;
        } else {
            productContext = '';
        }

        const systemPrompt = this.buildSystemPrompt(memory, productContext, vitrineLink);
        console.log('[TestAI] System Prompt Length:', systemPrompt.length);

        try {
            const reply = await this.openRouter.generateResponse(msg, systemPrompt, cpf);
            return reply;
        } catch (e: any) {
            console.error('AI Error', e);
            return `Erro: ${e.message}`;
        }
    }
}

export { WhatsappService };
