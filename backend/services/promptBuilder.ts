
export interface PromptConfig {
    identity?: {
        name?: string;
        tone?: string;
        greeting?: string;
        farewell?: string;
        function?: string;
    };
    behavior?: {
        rules?: string;
        tone?: string;
    };
    company?: {
        name?: string;
        segment?: string;
        mission?: string;
        hours?: string;
        payment?: string;
        address?: string;
        policies?: string;
        industry?: string;
        business_hours?: string;
        location?: string;
        additional_info?: string;
        promotions?: string;
    };
    products?: any[];
    vitrine?: {
        config?: any;
    };
    behavior_rules?: string;
}

export class PromptBuilderService {
    private formatPrice(price: number): string {
        return `R$ ${price.toFixed(2).replace('.', ',')}`;
    }

    private readonly ISA_PANEL_KNOWLEDGE = `
CONHECIMENTO DO PAINEL ISA 3.0:

O ISA 3.0 é uma plataforma completa de atendimento automatizado via WhatsApp com IA. Aqui estão todas as funcionalidades disponíveis:

📱 MEU WHATSAPP (/client/whatsapp)
- Conectar o WhatsApp da empresa via QR Code
- Visualizar status da conexão (Conectado/Desconectado)
- Ativar/desativar a IA para atendimento automático

💬 CHAT (/client/chat)
- Visualizar todas as conversas dos clientes
- Responder mensagens manualmente
- Ver histórico de mensagens

🧠 MEMÓRIA DE COMPORTAMENTO (/client/memory-behavior)
- Definir regras gerais de comportamento da IA
- Criar prompts personalizados para o atendimento

📦 PRODUTOS E SERVIÇOS (/client/products)
- Cadastrar produtos com nome, preço e descrição
- A IA usa esses produtos para informar clientes

🏪 VITRINE (/client/vitrine)
- Criar uma loja virtual pública
- Personalizar tema e cores
- Link público para compartilhar

🧪 ISA DE TESTE (/client/isa-test)
- Ambiente de teste para verificar como a IA responde
- Simular conversas como se fosse um cliente
`;

    buildSystemPrompt(config: PromptConfig, productContext?: string, vitrineLink?: string): string {
        let systemPrompt = `Você é a ISA, uma IA assistente virtual inteligente de atendimento ao cliente.\n\n${this.ISA_PANEL_KNOWLEDGE}`;

        if (config?.identity?.name) {
            systemPrompt += `\n\n🏷️ SEU NOME: ${config.identity.name}`;
        }

        if (config?.identity?.tone || config?.behavior?.tone) {
            const tone = config.identity?.tone || config.behavior?.tone;
            const toneDescriptions: Record<string, string> = {
                friendly: "Seja amigável, acolhedor e use linguagem informal.",
                formal: "Seja profissional, respeitoso e use linguagem formal.",
                casual: "Seja descontraído, leve e use gírias moderadas.",
                technical: "Seja preciso, técnico e use termos específicos do setor."
            };
            systemPrompt += `\n\n🎤 TOM DE VOZ: ${toneDescriptions[tone!] || ""}`;
        }

        if (config?.identity?.greeting) {
            systemPrompt += `\n\n👋 SAUDAÇÃO: ${config.identity.greeting}`;
        }

        if (config?.identity?.farewell) {
            systemPrompt += `\n\n🙋 DESPEDIDA: ${config.identity.farewell}`;
        }

        const company = config.company || {};
        if (company.name || (config as any).company_name) {
            systemPrompt += `\n\n🏢 EMPRESA: ${company.name || (config as any).company_name}`;
            if (company.segment || company.industry) systemPrompt += `\n- Segmento: ${company.segment || company.industry}`;
            if (company.mission) systemPrompt += `\n- Missão: ${company.mission}`;
            if (company.business_hours || company.hours) systemPrompt += `\n- Horário: ${company.business_hours || company.hours}`;
            if (company.payment) systemPrompt += `\n- Pagamento: ${company.payment}`;
            if (company.location || company.address) systemPrompt += `\n- Endereço: ${company.location || company.address}`;
            if (company.policies || company.additional_info) systemPrompt += `\n- Políticas/Infos: ${company.policies || company.additional_info}`;
            if (company.promotions) systemPrompt += `\n- Promoções: ${company.promotions}`;
        }

        if (config?.behavior?.rules || config.behavior_rules) {
            systemPrompt += `\n\n📋 REGRAS DE COMPORTAMENTO:\n${config.behavior?.rules || config.behavior_rules}`;
        }

        // Add explicit product context if provided (e.g. from search engine)
        if (productContext) {
            systemPrompt += `\n\n🔍 CONTEXTO DE PRODUTOS ENCONTRADOS:\n${productContext}`;
        }

        // Add products from list
        const products = config.products || [];
        if (products.length > 0) {
            systemPrompt += `\n\n📦 CATÁLOGO DE PRODUTOS COMPLETO (${products.length} itens):`;

            // Group by category
            const categories = new Map<string, any[]>();
            products.forEach((p: any) => {
                const cat = p.category || 'Sem categoria';
                if (!categories.has(cat)) categories.set(cat, []);
                categories.get(cat)!.push(p);
            });

            categories.forEach((prods, cat) => {
                systemPrompt += `\n\n📁 *CATEGORIA: ${cat}*`;
                systemPrompt += `\n━━━━━━━━━━━━━━━━`;
                prods.forEach((p: any) => {
                    const price = typeof p.price === 'number' ? this.formatPrice(p.price) : p.price;
                    systemPrompt += `\n• *${p.name}*`;
                    systemPrompt += `\n  📋 Código: ${p.code || 'S/C'}`;
                    systemPrompt += `\n  💰 ${price}`;
                    if (p.description) systemPrompt += `\n  📝 ${p.description}`;
                    systemPrompt += `\n`;
                });
            });

            systemPrompt += `\n\n💡 INSTRUÇÕES DE FORMATAÇÃO:
- Ao listar produtos, apresente cada um em linhas separadas
- Use emojis para organizar (🛒 produto, 💰 preço, 📋 código)
- NUNCA liste códigos separados por vírgula
- Sempre formate de forma clara e organizada`;
            
            systemPrompt += `\n\n💡 Quando o cliente perguntar sobre produtos, use os dados acima. Se o produto não estiver na lista, informe educadamente.`;
        } else if (!productContext) {
            systemPrompt += `\n\n📦 PRODUTOS: Nenhum produto cadastrado no catálogo ainda. Peça para o cliente retornar em breve ou aguardar um atendente humano.`;
        }

        if (config?.vitrine?.config) {
            const v = config.vitrine.config;
            systemPrompt += `\n\n🏪 VITRINE ONLINE:`;
            if (v.name) systemPrompt += `\n- Nome: ${v.name}`;
            if (v.theme) systemPrompt += `\n- Tema: ${v.theme}`;
            if (v.companyName) systemPrompt += `\n- Empresa: ${v.companyName}`;
        }

        if (vitrineLink) {
            systemPrompt += `\n\n🔗 LINK DA VITRINE: ${vitrineLink}`;
            systemPrompt += `\nConvide o cliente para ver nossa vitrine completa de produtos no link acima.`;
        }

        systemPrompt += `
\n📌 INSTRUÇÕES FINAIS:
- Responda de forma natural, útil e seguindo o tom de voz configurado.
- Use as informações da empresa e produtos para responder perguntas.
- Se perguntarem sobre funcionalidades do painel, use o conhecimento do ISA 3.0.
- SEMPRE envie o Link da Vitrine se o cliente perguntar por produtos ou preços.
- Nunca diga que não existem produtos se houver itens no catálogo acima.
- Use emojis moderadamente para tornar a conversa mais amigável.`;

        return systemPrompt;
    }
}

export default new PromptBuilderService();
