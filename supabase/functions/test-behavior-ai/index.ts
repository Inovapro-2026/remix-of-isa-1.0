import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OpenRouter models with fallback order
const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
];

// Conhecimento base sobre o painel ISA 3.0
const ISA_PANEL_KNOWLEDGE = `
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

// Format price
function formatPrice(price: number): string {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

// Try calling OpenRouter with a specific model
async function tryOpenRouterModel(
  model: string, 
  messages: any[], 
  apiKey: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    console.log(`[OpenRouter] Trying model: ${model}`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://isa-whatsapp-bot.com',
        'X-Title': 'ISA WhatsApp Bot'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[OpenRouter] Model ${model} failed: ${response.status} - ${errorText}`);
      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
      console.log(`[OpenRouter] Model ${model} succeeded`);
      return { success: true, content: data.choices[0].message.content };
    }
    
    return { success: false, error: 'No content in response' };
  } catch (error) {
    console.error(`[OpenRouter] Error with model ${model}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Call OpenRouter with fallback
async function callOpenRouterWithFallback(messages: any[], apiKey: string): Promise<string> {
  for (const model of OPENROUTER_MODELS) {
    const result = await tryOpenRouterModel(model.id, messages, apiKey);
    if (result.success && result.content) {
      return result.content;
    }
  }
  throw new Error('All AI models failed');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, config } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt based on config
    let systemPrompt = `Você é a ISA, uma IA assistente virtual inteligente de atendimento ao cliente.

${ISA_PANEL_KNOWLEDGE}`;

    if (config?.identity?.name) {
      systemPrompt += `\n\n🏷️ SEU NOME: ${config.identity.name}`;
    }

    if (config?.identity?.tone) {
      const toneDescriptions: Record<string, string> = {
        friendly: "Seja amigável, acolhedor e use linguagem informal.",
        formal: "Seja profissional, respeitoso e use linguagem formal.",
        casual: "Seja descontraído, leve e use gírias moderadas.",
        technical: "Seja preciso, técnico e use termos específicos do setor."
      };
      systemPrompt += `\n\n🎤 TOM DE VOZ: ${toneDescriptions[config.identity.tone] || ""}`;
    }

    if (config?.identity?.greeting) {
      systemPrompt += `\n\n👋 SAUDAÇÃO: ${config.identity.greeting}`;
    }

    if (config?.identity?.farewell) {
      systemPrompt += `\n\n🙋 DESPEDIDA: ${config.identity.farewell}`;
    }

    if (config?.company?.name) {
      systemPrompt += `\n\n🏢 EMPRESA: ${config.company.name}`;
      if (config.company.segment) systemPrompt += `\n- Segmento: ${config.company.segment}`;
      if (config.company.mission) systemPrompt += `\n- Missão: ${config.company.mission}`;
      if (config.company.hours) systemPrompt += `\n- Horário: ${config.company.hours}`;
      if (config.company.payment) systemPrompt += `\n- Pagamento: ${config.company.payment}`;
      if (config.company.address) systemPrompt += `\n- Endereço: ${config.company.address}`;
      if (config.company.policies) systemPrompt += `\n- Políticas: ${config.company.policies}`;
    }

    if (config?.behavior?.rules) {
      systemPrompt += `\n\n📋 REGRAS DE COMPORTAMENTO:\n${config.behavior.rules}`;
    }

    // Add products from config (already loaded from Supabase on frontend)
    if (config?.products?.length > 0) {
      systemPrompt += `\n\n📦 CATÁLOGO DE PRODUTOS (${config.products.length} itens):`;
      
      // Group by category
      const categories = new Map<string, any[]>();
      config.products.forEach((p: any) => {
        const cat = p.category || 'Sem categoria';
        if (!categories.has(cat)) categories.set(cat, []);
        categories.get(cat)!.push(p);
      });
      
      categories.forEach((prods, cat) => {
        systemPrompt += `\n\n📁 ${cat}:`;
        prods.forEach((p: any) => {
          const price = typeof p.price === 'number' ? formatPrice(p.price) : p.price;
          systemPrompt += `\n  • ${p.name} (${p.code || 'S/C'}) - ${price}`;
          if (p.description) systemPrompt += `\n    ${p.description}`;
        });
      });
      
      systemPrompt += `\n\n💡 Quando o cliente perguntar sobre produtos, use as informações acima.`;
    } else {
      systemPrompt += `\n\n📦 PRODUTOS: Nenhum produto cadastrado ainda.`;
    }

    if (config?.vitrine?.config) {
      const v = config.vitrine.config;
      systemPrompt += `\n\n🏪 VITRINE CONFIGURADA:`;
      if (v.name) systemPrompt += `\n- Nome: ${v.name}`;
      if (v.theme) systemPrompt += `\n- Tema: ${v.theme}`;
      if (v.whatsappNumber) systemPrompt += `\n- WhatsApp: ${v.whatsappNumber}`;
      if (v.companyName) systemPrompt += `\n- Empresa: ${v.companyName}`;
    }

    systemPrompt += `

📌 INSTRUÇÕES FINAIS:
- Responda de forma natural, útil e seguindo o tom de voz configurado
- Use as informações da empresa e produtos para responder perguntas
- Se perguntarem sobre funcionalidades do painel, use o conhecimento do ISA 3.0
- Sempre seja prestativo e ofereça ajuda adicional
- Use emojis moderadamente para tornar a conversa mais amigável`;

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY not configured");
      return new Response(
        JSON.stringify({ reply: "API de IA não configurada. Configure a chave OPENROUTER_API_KEY nas secrets do Supabase." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("System prompt length:", systemPrompt.length);
    console.log("Products in config:", config?.products?.length || 0);
    console.log("Calling OpenRouter API with fallback...");

    const aiMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    const reply = await callOpenRouterWithFallback(aiMessages, OPENROUTER_API_KEY);

    console.log("AI response received successfully");

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ reply: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
