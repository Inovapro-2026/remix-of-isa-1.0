import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenRouter models with fallback order
const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
];

// Create Supabase client
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Get matricula and user_id from CPF or Matricula identifier
async function getUserInfoFromIdentifier(identifier: string): Promise<{ userId: string | null; matricula: string | null }> {
  const supabase = getSupabaseClient();
  const cleanIdentifier = identifier.replace(/\D/g, '');
  
  // Try clients table first (CPF or Matricula)
  const { data: client } = await supabase
    .from('clients')
    .select('user_id, matricula')
    .or(`cpf.eq.${identifier},cpf.eq.${cleanIdentifier},matricula.eq.${identifier},matricula.eq.${cleanIdentifier}`)
    .maybeSingle();
  
  if (client?.matricula) {
    return { userId: client.user_id, matricula: client.matricula };
  }
  
  // Try profiles table (CPF or Matricula)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, matricula')
    .or(`cpf.eq.${identifier},cpf.eq.${cleanIdentifier},matricula.eq.${identifier},matricula.eq.${cleanIdentifier}`)
    .maybeSingle();
  
  if (profile?.matricula) {
    return { userId: profile.id, matricula: profile.matricula };
  }

  // Try admins table (CPF or Matricula)
  const { data: admin } = await supabase
    .from('admins')
    .select('user_id, matricula')
    .or(`cpf.eq.${identifier},cpf.eq.${cleanIdentifier},matricula.eq.${identifier},matricula.eq.${cleanIdentifier}`)
    .maybeSingle();
  
  if (admin?.matricula) {
    return { userId: admin.user_id, matricula: admin.matricula };
  }

  return { userId: null, matricula: null };
}

// Legacy function for compatibility - returns just userId
async function getUserIdFromIdentifier(identifier: string): Promise<string | null> {
  const { userId } = await getUserInfoFromIdentifier(identifier);
  return userId;
}

// Get all products for a user by matricula OR user_id (fallback for legacy data)
async function getAllUserProducts(matricula: string, userId?: string | null): Promise<any[]> {
  const supabase = getSupabaseClient();
  
  // Try by matricula first
  let { data, error } = await supabase
    .from('products')
    .select('id, code, name, price, description, category, image_url')
    .eq('matricula', matricula)
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    console.error('Error fetching products by matricula:', error);
  }
  
  // Fallback to user_id if no products found by matricula
  if ((!data || data.length === 0) && userId) {
    console.log(`No products by matricula ${matricula}, trying user_id ${userId}`);
    const result = await supabase
      .from('products')
      .select('id, code, name, price, description, category, image_url')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name');
    
    if (result.error) {
      console.error('Error fetching products by user_id:', result.error);
    }
    data = result.data;
  }
  
  console.log(`Found ${data?.length || 0} products`);
  return data || [];
}

// Get products by code using matricula OR user_id
async function getProductsByCode(matricula: string, codes: string[], userId?: string | null): Promise<any[]> {
  const supabase = getSupabaseClient();
  const products: any[] = [];
  
  for (const code of codes) {
    // Try by matricula first
    let { data, error } = await supabase
      .from('products')
      .select('id, code, name, price, description, category')
      .eq('matricula', matricula)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();
    
    // Fallback to user_id
    if (!data && userId) {
      const result = await supabase
        .from('products')
        .select('id, code, name, price, description, category')
        .eq('user_id', userId)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      data = result.data;
    }
    
    if (data) {
      products.push(data);
    }
  }
  
  return products;
}

// Search products by name or description using matricula OR user_id
async function searchProducts(matricula: string, query: string, userId?: string | null): Promise<any[]> {
  const supabase = getSupabaseClient();
  const searchTerm = query.toLowerCase().trim();
  
  // Try by matricula first
  let { data, error } = await supabase
    .from('products')
    .select('id, code, name, price, description, category')
    .eq('matricula', matricula)
    .eq('is_active', true)
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
    .limit(10);
  
  if (error) {
    console.error('Error searching products by matricula:', error);
  }
  
  // Fallback to user_id
  if ((!data || data.length === 0) && userId) {
    const result = await supabase
      .from('products')
      .select('id, code, name, price, description, category')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .limit(10);
    
    if (result.error) {
      console.error('Error searching products by user_id:', result.error);
    }
    data = result.data;
  }
  
  return data || [];
}

// Get behavior rules for user
async function getBehaviorRules(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  const { data } = await supabase
    .from('ai_behavior_rules')
    .select('rules')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.rules || null;
}

// Get company knowledge for user
async function getCompanyKnowledge(userId: string): Promise<any | null> {
  const supabase = getSupabaseClient();
  
  const { data } = await supabase
    .from('company_knowledge')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data || null;
}

// Get AI memory config for user
async function getAIMemoryConfig(userId: string): Promise<any | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('client_ai_memory')
    .select('config')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching AI memory config:', error);
  }
  
  console.log('AI Memory config loaded:', data?.config ? 'Yes' : 'No');
  return data?.config || null;
}

// Extract product codes from message (6 alphanumeric characters)
function extractProductCodes(message: string): string[] {
  const codePattern = /\b[A-Z0-9]{6}\b/gi;
  const matches = message.match(codePattern);
  return matches ? [...new Set(matches.map(m => m.toUpperCase()))] : [];
}

// Format price
function formatPrice(price: number): string {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

// Format products for prompt - organized list for WhatsApp
function formatProductsForPrompt(products: any[], title: string): string {
  if (products.length === 0) return '';
  
  let formatted = `\n\n*${title}*\n`;
  formatted += `━━━━━━━━━━━━━━━━━━━━`;
  
  products.forEach((product, index) => {
    formatted += `\n\n🛒 *${index + 1}. ${product.name}*`;
    formatted += `\n   📋 Código: \`${product.code}\``;
    formatted += `\n   💰 Preço: *${formatPrice(product.price)}*`;
    if (product.category) formatted += `\n   📁 Categoria: ${product.category}`;
    if (product.description) formatted += `\n   📝 ${product.description}`;
  });
  
  formatted += `\n\n━━━━━━━━━━━━━━━━━━━━`;
  
  return formatted;
}

// Build system prompt based on user configuration
async function buildSystemPrompt(userId: string, allProducts: any[], isFirstInteraction: boolean = false): Promise<{ 
  prompt: string; 
  welcomeMedia: { url: string; type: string } | null;
  fixedFirstMessage: string | null;
}> {
  const [behaviorRules, company, aiMemory] = await Promise.all([
    getBehaviorRules(userId),
    getCompanyKnowledge(userId),
    getAIMemoryConfig(userId),
  ]);

  console.log('Building prompt with:', {
    hasBehaviorRules: !!behaviorRules,
    hasCompany: !!company,
    hasAiMemory: !!aiMemory,
    productCount: allProducts.length,
    aiMemoryIdentity: aiMemory?.identity?.name || 'none',
    aiMemoryCompany: aiMemory?.company?.name || 'none',
    isFirstInteraction
  });

  // Get AI identity from memory config
  const identity = aiMemory?.identity;
  const aiName = identity?.name || 'ISA';
  const aiFunction = identity?.function || 'assistente virtual de atendimento';

  // Get tone of voice
  const toneMap: Record<string, string> = {
    'formal': 'formal e profissional',
    'vendedor': 'persuasivo e focado em vendas',
    'amigavel': 'amigável e acolhedor',
    'premium': 'sofisticado e premium',
    'tecnico': 'técnico e especializado',
    'jovem': 'jovem e descontraído'
  };
  const behavior = aiMemory?.behavior;
  const tone = behavior?.tone ? toneMap[behavior.tone] || behavior.tone : 'amigável e profissional';

  let prompt = `Você é ${aiName}, ${aiFunction}.

📌 INSTRUÇÕES GERAIS:
- Seu tom de voz deve ser ${tone}
- Use emojis moderadamente para tornar a conversa agradável
- Responda sempre em português do Brasil
- Quando o cliente perguntar sobre produtos, use as informações do catálogo fornecido`;

  // Handle first interaction - check for fixed message
  const firstInteraction = aiMemory?.first_interaction;
  let welcomeMedia: { url: string; type: string } | null = null;
  let fixedFirstMessage: string | null = null;
  
  // Always check for welcome media (even if not first interaction for caching purposes)
  if (firstInteraction) {
    if (firstInteraction.media_url && firstInteraction.media_type) {
      welcomeMedia = {
        url: firstInteraction.media_url,
        type: firstInteraction.media_type
      };
      console.log('Welcome media configured:', welcomeMedia.type);
    }
  }
  
  // For first interaction, check for fixed message
  if (isFirstInteraction && firstInteraction) {
    // If there's a fixed first message configured, return it directly (not as prompt)
    const fixedMessage = firstInteraction.message_prompt || firstInteraction.fixed_message;
    if (fixedMessage && typeof fixedMessage === 'string' && fixedMessage.trim()) {
      fixedFirstMessage = fixedMessage.trim();
      console.log('First interaction: Will use fixed message');
    }
  }

  // Add company info from AI memory config OR company_knowledge table
  const companyData = aiMemory?.company || company;
  if (companyData) {
    prompt += `\n\n🏢 INFORMAÇÕES DA EMPRESA:`;
    if (companyData.name) prompt += `\n- Nome da empresa: ${companyData.name}`;
    if (companyData.industry) prompt += `\n- Ramo/Nicho: ${companyData.industry}`;
    if (companyData.segment) prompt += `\n- Segmento: ${companyData.segment}`;
    if (companyData.target_audience) prompt += `\n- Público-alvo: ${companyData.target_audience}`;
    if (companyData.differentials) prompt += `\n- Diferenciais: ${companyData.differentials}`;
    if (companyData.mission) prompt += `\n- Missão: ${companyData.mission}`;
    if (companyData.business_hours || companyData.hours) prompt += `\n- Horário de atendimento: ${companyData.business_hours || companyData.hours}`;
    if (companyData.location || companyData.address) prompt += `\n- Localização: ${companyData.location || companyData.address}`;
    if (companyData.promotions) prompt += `\n- Promoções ativas: ${companyData.promotions}`;
    if (companyData.vitrine_link) prompt += `\n- Link da vitrine: ${companyData.vitrine_link}`;
    if (companyData.official_links) prompt += `\n- Links oficiais:\n${companyData.official_links}`;
    if (companyData.additional_info) prompt += `\n- Instruções adicionais:\n${companyData.additional_info}`;
  }

  // Add policies from AI memory config
  const policies = aiMemory?.policies;
  if (policies) {
    prompt += `\n\n📋 POLÍTICAS DA EMPRESA:`;
    if (policies.delivery) prompt += `\n- Política de Entrega: ${policies.delivery}`;
    if (policies.warranty) prompt += `\n- Política de Garantia: ${policies.warranty}`;
    if (policies.exchange) prompt += `\n- Política de Trocas/Devoluções: ${policies.exchange}`;
  }

  // Add payment info from AI memory config
  const payments = aiMemory?.payments;
  if (payments) {
    prompt += `\n\n💳 FORMAS DE PAGAMENTO:`;
    if (payments.methods) prompt += `\n- Métodos aceitos: ${payments.methods}`;
    if (payments.fees) prompt += `\n- Taxas e prazos: ${payments.fees}`;
  }

  // Add behavior rules from ai_behavior_rules OR from AI memory config
  const rules = behaviorRules || behavior?.custom_rules || behavior?.rules;
  if (rules) {
    prompt += `\n\n📋 REGRAS DE COMPORTAMENTO CUSTOMIZADAS:\n${rules}`;
  }

  // Add product catalog summary
  if (allProducts.length > 0) {
    prompt += `\n\n📦 CATÁLOGO DE PRODUTOS (${allProducts.length} itens disponíveis):`;
    
    // Group by category
    const categories = new Map<string, any[]>();
    allProducts.forEach(p => {
      const cat = p.category || 'Sem categoria';
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(p);
    });
    
    categories.forEach((prods, cat) => {
      prompt += `\n\n📁 *${cat}*`;
      prompt += `\n━━━━━━━━━━━━━━━━`;
      prods.forEach(p => {
        prompt += `\n• *${p.name}*`;
        prompt += `\n  📋 Código: ${p.code}`;
        prompt += `\n  💰 ${formatPrice(p.price)}`;
        if (p.description) prompt += `\n  📝 ${p.description}`;
        prompt += `\n`;
      });
    });
    
    prompt += `

⚠️⚠️⚠️ REGRAS OBRIGATÓRIAS DE FORMATAÇÃO PARA WHATSAPP ⚠️⚠️⚠️

🚫 PROIBIÇÕES ABSOLUTAS (NUNCA FAÇA ISSO):
- NUNCA use ** para negrito - WhatsApp não renderiza
- NUNCA use formato markdown [texto](url) para links
- NUNCA coloque código entre parênteses ex: "Pizza (PIZ001)"
- NUNCA faça listas com traços simples "- item"
- NUNCA junte nome, código e preço na mesma linha

✅ FORMATO CORRETO PARA LISTAR CATEGORIAS:
Use emojis específicos para cada categoria, exemplo:

👋 Olá! Seja muito bem-vindo(a)!

Sou a ${aiName}, a assistente virtual 🤖, e vou te ajudar com tudo por aqui 😊

✨ Aqui estão algumas opções do nosso cardápio:

🍔 Lanches – Sanduíches e combos deliciosos
🍕 Pizzas – Vários sabores irresistíveis
🍰 Sobremesas – Para adoçar seu dia
🍟 Petiscos e porções – Perfeitos para compartilhar
🥤 Sucos e bebidas – Para se refrescar

🛒 Confira todos os produtos, preços e detalhes na nossa vitrine:
👉 ${companyData?.vitrine_link || 'https://isa.inovapro.cloud/vitrine/'}

Se quiser:
📦 Ver um produto específico
💡 Pedir uma sugestão
🛍️ Ou já fazer seu pedido

👉 É só me dizer aqui mesmo 😉

✅ FORMATO CORRETO PARA MOSTRAR UM PRODUTO ESPECÍFICO:

🛒 Frango Parmegiana
📋 Código: LAN003
💰 R$ 16,00
📝 Acompanha arroz e fritas

(linha em branco entre produtos)

🛒 Bife de Alcatra
📋 Código: LAN002
💰 R$ 18,00
📝 Arroz, feijão e fritas

✅ FORMATO CORRETO PARA LINKS:
🛒 Confira nossa vitrine online:
👉 https://isa.inovapro.cloud/vitrine/123

(sempre URL limpa, sem colchetes)

💡 DICAS DE EMOJIS POR CATEGORIA:
🍔 Lanches, hambúrgueres
🍕 Pizzas
🍰 Sobremesas, doces
🍟 Petiscos, porções
🥤 Bebidas, sucos
🍝 Massas
🥗 Saladas
🍖 Carnes, churrascos`;
    
    prompt += `\n\n💡 Quando o cliente enviar um código de 6 caracteres, busque o produto correspondente e apresente no formato organizado acima.`;
  } else {
    prompt += `\n\n📦 PRODUTOS: Nenhum produto cadastrado ainda.`;
  }

  prompt += `\n\n⚠️ REGRAS FINAIS:
- Seja sempre simpático e use emojis de forma moderada
- Se o cliente perguntar algo que você não sabe, diga que vai verificar com a equipe
- Nunca invente informações sobre produtos que não estão no catálogo
- Se um código de produto não for encontrado, informe gentilmente
- Ao listar categorias, use apenas o nome e uma descrição curta (sem códigos/preços)
- Ao mostrar produto específico, use o formato com código e preço em linhas separadas
- NUNCA use ** ou [] - WhatsApp não renderiza markdown`;

  return { prompt, welcomeMedia, fixedFirstMessage };
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, cpf, matricula: providedMatricula, userId: providedUserId, isFirstInteraction: clientFirstInteraction } = await req.json();
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Get user info (userId and matricula) from CPF, Matricula or use provided values
    let userId = providedUserId;
    let userMatricula = providedMatricula;
    
    if (!userId || !userMatricula) {
      const identifier = cpf || providedMatricula;
      if (identifier) {
        const userInfo = await getUserInfoFromIdentifier(identifier);
        userId = userId || userInfo.userId;
        userMatricula = userMatricula || userInfo.matricula;
      }
    }

    console.log('Processing request for userId:', userId, 'matricula:', userMatricula, 'cpf:', cpf);

    // Get all products for this user by matricula (with user_id fallback)
    let allProducts: any[] = [];
    if (userMatricula || userId) {
      allProducts = await getAllUserProducts(userMatricula || '', userId);
      console.log(`Found ${allProducts.length} products for matricula ${userMatricula} / userId ${userId}`);
    }

    // Detect if this is the first interaction (only 1 user message in the conversation)
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const isFirstInteraction = clientFirstInteraction === true || userMessages.length <= 1;
    
    console.log('Is first interaction:', isFirstInteraction, 'User messages count:', userMessages.length);

    // Build system prompt with user's configuration and products
    let systemPrompt = `Você é a ISA, uma assistente de IA. Seja prestativa e amigável.`;
    let welcomeMedia: { url: string; type: string } | null = null;
    let fixedFirstMessage: string | null = null;
    
    if (userId) {
      const result = await buildSystemPrompt(userId, allProducts, isFirstInteraction);
      systemPrompt = result.prompt;
      welcomeMedia = result.welcomeMedia;
      fixedFirstMessage = result.fixedFirstMessage;
    }

    // If this is first interaction and there's a fixed message, return it directly without AI processing
    if (isFirstInteraction && fixedFirstMessage) {
      console.log('Returning fixed first message directly');
      
      const responseData: any = { 
        message: fixedFirstMessage,
        isFixedFirstMessage: true
      };
      
      if (welcomeMedia) {
        responseData.welcomeMedia = welcomeMedia;
      }

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the last user message to check for product codes
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
    let productContext = '';
    
    if (lastUserMessage && userMatricula) {
      const messageContent = lastUserMessage.content;
      
      // Check for product codes
      const codes = extractProductCodes(messageContent);
      if (codes.length > 0) {
        console.log('Extracted product codes:', codes);
        const foundProducts = await getProductsByCode(userMatricula, codes, userId);
        
        if (foundProducts.length > 0) {
          productContext = formatProductsForPrompt(foundProducts, '📦 PRODUTOS ENCONTRADOS');
          productContext += '\n\nApresente estes produtos de forma amigável ao cliente!';
        } else {
          productContext = `\n\n⚠️ Código(s) não encontrado(s): ${codes.join(', ')}\nInforme gentilmente que o código não foi localizado.`;
        }
      } else {
        // Search for products by keywords
        const searchTerms = ['preço', 'quanto custa', 'tem', 'quero', 'cardápio', 'produtos', 'menu'];
        const shouldSearch = searchTerms.some(term => 
          messageContent.toLowerCase().includes(term)
        );
        
        if (shouldSearch) {
          // Extract potential product name from message
          const words = messageContent.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
          for (const word of words) {
            if (!searchTerms.includes(word)) {
              const searchResults = await searchProducts(userMatricula, word, userId);
              if (searchResults.length > 0) {
                productContext = formatProductsForPrompt(searchResults, '🔍 PRODUTOS RELACIONADOS');
                break;
              }
            }
          }
        }
      }
    }

    const fullSystemPrompt = systemPrompt + productContext;

    console.log('System prompt length:', fullSystemPrompt.length);
    console.log('Product context:', productContext ? 'Added' : 'None');
    console.log('Welcome media:', welcomeMedia ? `${welcomeMedia.type}: ${welcomeMedia.url}` : 'None');

    // Build messages for AI
    const aiMessages = [
      { role: 'system', content: fullSystemPrompt },
      ...messages,
    ];

    // Call OpenRouter with fallback
    const reply = await callOpenRouterWithFallback(aiMessages, openRouterApiKey);

    // Return response with optional welcome media
    const responseData: any = { message: reply };
    
    if (welcomeMedia && isFirstInteraction) {
      responseData.welcomeMedia = welcomeMedia;
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in isa-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
