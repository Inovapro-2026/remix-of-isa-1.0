import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// WhatsApp ISA API
const WHATSAPP_API_URL = "http://148.230.76.60:3333";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenRouter models with fallback
const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
];

// Maximum messages to keep in conversation history
const MAX_CONVERSATION_HISTORY = 20;

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseKey);
}

// Get user info from user_id (UUID) or matricula/cpf
async function getUserInfo(identifier: string) {
  const supabase = getSupabaseClient();
  
  // First, check if identifier is a UUID (user_id)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  if (isUUID) {
    // Try profiles first with user_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, matricula, full_name, company_name, cpf')
      .eq('id', identifier)
      .maybeSingle();
    
    if (profile) {
      console.log('Found profile by user_id:', profile.full_name, 'matricula:', profile.matricula);
      // Get vitrine_id from clients
      const { data: client } = await supabase
        .from('clients')
        .select('vitrine_id')
        .eq('user_id', identifier)
        .maybeSingle();
      
      return { 
        userId: profile.id, 
        matricula: profile.matricula || profile.cpf, 
        name: profile.full_name || profile.company_name,
        vitrineId: client?.vitrine_id
      };
    }
    
    // Try clients with user_id
    const { data: client } = await supabase
      .from('clients')
      .select('user_id, matricula, full_name, company_name, cpf, vitrine_id')
      .eq('user_id', identifier)
      .maybeSingle();
    
    if (client) {
      console.log('Found client by user_id:', client.full_name, 'matricula:', client.matricula, 'vitrine_id:', client.vitrine_id);
      return { 
        userId: client.user_id || identifier, 
        matricula: client.matricula || client.cpf, 
        name: client.full_name || client.company_name,
        vitrineId: client.vitrine_id
      };
    }
  }
  
  // Fallback: search by cpf/matricula/phone
  const clean = identifier.replace(/\D/g, '');
  
  // Try clients table
  const { data: client } = await supabase
    .from('clients')
    .select('user_id, matricula, full_name, company_name, cpf, vitrine_id')
    .or(`cpf.eq.${identifier},cpf.eq.${clean},matricula.eq.${identifier},matricula.eq.${clean},phone.ilike.%${clean}%`)
    .maybeSingle();
  
  if (client?.matricula) {
    console.log('Found client by cpf/matricula:', client.full_name, 'vitrine_id:', client.vitrine_id);
    return { userId: client.user_id, matricula: client.matricula, name: client.full_name || client.company_name, vitrineId: client.vitrine_id };
  }
  
  // Try profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, matricula, full_name, company_name, cpf')
    .or(`cpf.eq.${identifier},cpf.eq.${clean},matricula.eq.${identifier},matricula.eq.${clean}`)
    .maybeSingle();
  
  if (profile) {
    console.log('Found profile by cpf/matricula:', profile.full_name);
    // Get vitrine_id from clients
    const { data: clientData } = await supabase
      .from('clients')
      .select('vitrine_id')
      .eq('user_id', profile.id)
      .maybeSingle();
    
    return { userId: profile.id, matricula: profile.matricula || profile.cpf, name: profile.full_name || profile.company_name, vitrineId: clientData?.vitrine_id };
  }
  
  console.log('No user found for identifier:', identifier);
  return null;
}

// Get AI memory config
async function getAIMemory(userId: string) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('client_ai_memory')
    .select('config')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.config || null;
}

// Get company knowledge
async function getCompanyKnowledge(userId: string) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('company_knowledge')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

// Get behavior rules
async function getBehaviorRules(userId: string) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('ai_behavior_rules')
    .select('rules')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.rules || null;
}

// Get products
async function getProducts(matricula: string, userId?: string) {
  const supabase = getSupabaseClient();
  
  let { data } = await supabase
    .from('products')
    .select('id, code, name, price, description, category')
    .eq('matricula', matricula)
    .eq('is_active', true)
    .order('name');
  
  if ((!data || data.length === 0) && userId) {
    const result = await supabase
      .from('products')
      .select('id, code, name, price, description, category')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name');
    data = result.data;
  }
  
  return data || [];
}

// Get or create conversation memory
async function getConversationMemory(instanceId: string, phoneNumber: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('whatsapp_conversation_memory')
    .select('*')
    .eq('instance_id', instanceId)
    .eq('phone_number', phoneNumber)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching conversation memory:', error);
    return null;
  }
  
  return data;
}

// Create conversation memory
async function createConversationMemory(instanceId: string, phoneNumber: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('whatsapp_conversation_memory')
    .insert({
      instance_id: instanceId,
      phone_number: phoneNumber,
      conversation_history: [],
      context: {},
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating conversation memory:', error);
    return null;
  }
  
  return data;
}

// Update conversation memory
async function updateConversationMemory(
  instanceId: string, 
  phoneNumber: string, 
  updates: { 
    customer_name?: string; 
    conversation_history?: any[];
    context?: any;
  }
) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('whatsapp_conversation_memory')
    .update({
      ...updates,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('instance_id', instanceId)
    .eq('phone_number', phoneNumber);
  
  if (error) {
    console.error('Error updating conversation memory:', error);
  }
}

// Add message to conversation history
function addToConversationHistory(
  history: any[], 
  role: 'user' | 'assistant', 
  content: string
): any[] {
  const newHistory = [...history, { role, content, timestamp: new Date().toISOString() }];
  
  // Keep only the last N messages
  if (newHistory.length > MAX_CONVERSATION_HISTORY) {
    return newHistory.slice(-MAX_CONVERSATION_HISTORY);
  }
  
  return newHistory;
}

// Extract name from message if user is responding to name question
function extractNameFromMessage(message: string): string | null {
  const cleanMessage = message.trim();
  
  // Common patterns for name responses
  const patterns = [
    /^(?:me chamo|meu nome é|sou o|sou a|pode me chamar de|é)\s+(.+)$/i,
    /^(.+)$/i, // If it's a single word/name, assume it's their name
  ];
  
  // Only use simple pattern if message is short (likely just a name)
  if (cleanMessage.split(/\s+/).length <= 3 && !cleanMessage.includes('?')) {
    // Remove common greeting words
    const withoutGreetings = cleanMessage.replace(/^(oi|olá|ola|bom dia|boa tarde|boa noite|ei|opa)\s*/i, '');
    if (withoutGreetings.length > 0 && withoutGreetings.length <= 50) {
      return withoutGreetings.split(/\s+/)[0]; // Get first word as name
    }
  }
  
  for (const pattern of patterns.slice(0, -1)) {
    const match = cleanMessage.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

// Build system prompt
function buildSystemPrompt(
  aiMemory: any,
  company: any,
  behaviorRules: string | null,
  products: any[],
  vitrineLink?: string,
  customerName?: string,
  conversationHistory?: any[]
): string {
  let prompt = `Você é ISA, uma assistente virtual inteligente de vendas via WhatsApp.

INSTRUÇÕES GERAIS:
- Responda APENAS em português brasileiro
- Seja natural, simpática e objetiva
- Use emojis com moderação para tornar a conversa mais humana
- Nunca revele que você é uma IA a menos que perguntado diretamente
- Foque em ajudar o cliente e vender os produtos/serviços
- Respostas devem ser curtas e diretas (máximo 3 parágrafos)
`;

  // Add customer name instruction
  if (customerName) {
    prompt += `\n🧑 CLIENTE ATUAL:
- Nome do cliente: ${customerName}
- SEMPRE chame o cliente pelo nome de forma natural (ex: "Oi ${customerName}!", "${customerName}, que bom te ver!")
- Personalize as mensagens usando o nome do cliente
- Lembre-se de detalhes das conversas anteriores se houver
`;
  } else {
    prompt += `\n🧑 CLIENTE NÃO IDENTIFICADO:
- Este cliente ainda não informou o nome
- Na sua PRIMEIRA resposta, pergunte o nome do cliente de forma amigável
- Exemplo: "Oi! 😊 Para eu te atender melhor, como posso te chamar?"
- Depois que ele responder o nome, sempre use-o nas conversas
`;
  }

  // Add AI identity from memory config
  if (aiMemory?.identity) {
    const identity = aiMemory.identity;
    prompt += `\n\n🤖 SUA IDENTIDADE:`;
    if (identity.name) prompt += `\n- Seu nome: ${identity.name}`;
    if (identity.function) prompt += `\n- Sua função: ${identity.function}`;
    if (identity.tone) {
      const tones: Record<string, string> = {
        friendly: 'Amigável e acolhedor',
        formal: 'Profissional e respeitoso',
        casual: 'Descontraído e leve',
        technical: 'Técnico e preciso'
      };
      prompt += `\n- Tom de voz: ${tones[identity.tone] || identity.tone}`;
    }
    if (identity.greeting) prompt += `\n- Saudação inicial: ${identity.greeting}`;
    if (identity.farewell) prompt += `\n- Despedida: ${identity.farewell}`;
  }

  // Add company info - prefer aiMemory.company, fallback to company_knowledge
  const companyData = aiMemory?.company || company;
  if (companyData) {
    prompt += `\n\n🏢 SOBRE A EMPRESA:`;
    if (companyData.name) prompt += `\n- Nome: ${companyData.name}`;
    if (companyData.industry) prompt += `\n- Ramo: ${companyData.industry}`;
    if (companyData.segment) prompt += `\n- Segmento: ${companyData.segment}`;
    if (companyData.target_audience) prompt += `\n- Público-alvo: ${companyData.target_audience}`;
    if (companyData.business_hours) prompt += `\n- Horário: ${companyData.business_hours}`;
    if (companyData.hours) prompt += `\n- Horário: ${companyData.hours}`;
    if (companyData.location) prompt += `\n- Localização: ${companyData.location}`;
    if (companyData.address) prompt += `\n- Endereço: ${companyData.address}`;
    if (companyData.payment) prompt += `\n- Formas de pagamento: ${companyData.payment}`;
    if (companyData.policies) prompt += `\n- Políticas: ${companyData.policies}`;
    if (companyData.promotions) prompt += `\n- Promoções: ${companyData.promotions}`;
    if (companyData.mission) prompt += `\n- Missão: ${companyData.mission}`;
  }

  // Add behavior tone
  if (aiMemory?.behavior?.tone) {
    prompt += `\n\n🎯 TOM DE VOZ: ${aiMemory.behavior.tone}`;
  }

  // Add behavior rules - prefer aiMemory.behavior.custom_rules or rules, fallback to ai_behavior_rules
  const rulesText = aiMemory?.behavior?.custom_rules || aiMemory?.behavior?.rules || behaviorRules;
  if (rulesText) {
    prompt += `\n\n📋 REGRAS DE COMPORTAMENTO:\n${rulesText}`;
  }

  // Add products from memory or products table
  const productsList = (aiMemory?.products && aiMemory.products.length > 0) ? aiMemory.products : products;
  if (productsList.length > 0) {
    prompt += `\n\n📦 CATÁLOGO DE PRODUTOS/SERVIÇOS:`;
    productsList.forEach((p: any) => {
      const price = typeof p.price === 'number' 
        ? `R$ ${p.price.toFixed(2).replace('.', ',')}` 
        : p.price;
      prompt += `\n- ${p.code ? `[${p.code}] ` : ''}${p.name}: ${price}`;
      if (p.description) prompt += ` - ${p.description.substring(0, 100)}`;
    });
  }

  // Add vitrine link instruction - ALWAYS include when talking about products
  const vitrineUrl = companyData?.vitrine_link || vitrineLink;
  if (vitrineUrl) {
    prompt += `\n\n🛒 LINK DA VITRINE VIRTUAL:
- Link: ${vitrineUrl}
- IMPORTANTE: Sempre que falar sobre produtos, mostrar preços, ou o cliente perguntar sobre catálogo/produtos/preços, INCLUA o link da vitrine no final da sua resposta.
- Exemplo de uso: "Confira todos os nossos produtos em: ${vitrineUrl}"
- Seja proativo em compartilhar o link para facilitar a compra do cliente.`;
  }

  // Add CART/SACOLA instructions
  prompt += `\n\n🛒 SACOLA (CARRINHO DE COMPRAS):
- Sempre que um cliente demonstrar interesse em um produto, pergunte: "Deseja adicionar este produto à sua sacola?"
- Quando confirmar, considere adicionado e diga: "Produto adicionado à sacola com sucesso!"
- Após adicionar, informe o valor parcial e pergunte: "Deseja adicionar mais algum produto ou prefere finalizar?"
- Sempre que pedirem "ver sacola", "meu carrinho" ou "o que já escolhi", liste a sacola completa
- Se o cliente colar um código de produto da vitrine, explique sobre o produto e pergunte se deseja adicionar à sacola
- A sacola pertence ao cliente atual e deve ser mantida durante toda a conversa`;

  // Add product interest instructions - CRITICAL: these are custom instructions from the user
  const productInterestInstructions = companyData?.additional_info;
  if (productInterestInstructions) {
    prompt += `\n\n🎯 INSTRUÇÕES PARA INTERESSE EM PRODUTOS (SEGUIR OBRIGATORIAMENTE):
${productInterestInstructions}

IMPORTANTE: Após informar o valor total da sacola, SEMPRE siga as instruções acima para conduzir o cliente no próximo passo.`;
  }

  // Add conversation context
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `\n\n💬 CONTEXTO DA CONVERSA:
- Você já conversou com este cliente antes
- Use as informações das mensagens anteriores para dar continuidade à conversa
- Lembre-se do que foi discutido e seja consistente
- Se o cliente mencionou preferências ou interesses, lembre-se deles
- Mantenha o contexto da sacola se houver produtos adicionados`;
  }

  console.log('System prompt built with:', {
    hasIdentity: !!aiMemory?.identity,
    identityName: aiMemory?.identity?.name,
    hasCompany: !!companyData,
    companyName: companyData?.name,
    hasRules: !!rulesText,
    rulesLength: rulesText?.length,
    productsCount: productsList.length,
    hasVitrineLink: !!vitrineUrl,
    hasProductInterestInstructions: !!productInterestInstructions,
    customerName: customerName || 'not set',
    historyMessages: conversationHistory?.length || 0
  });

  return prompt;
}

// Generate AI response using OpenRouter with conversation history
async function generateAIResponse(
  systemPrompt: string, 
  userMessage: string,
  conversationHistory?: any[]
): Promise<string> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  // Build messages array with history
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history (limited to last messages)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10); // Last 10 messages for context
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current message
  messages.push({ role: 'user', content: userMessage });

  for (const model of OPENROUTER_MODELS) {
    try {
      console.log(`Trying model: ${model.name} with ${messages.length} messages`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://isa.inovapro.cloud',
          'X-Title': 'ISA WhatsApp Bot',
        },
        body: JSON.stringify({
          model: model.id,
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        console.error(`Model ${model.name} failed:`, await response.text());
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        console.log(`✅ Response generated with ${model.name}`);
        return content;
      }
    } catch (error) {
      console.error(`Error with model ${model.name}:`, error);
    }
  }

  return "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes! 🙏";
}

// Send message via WhatsApp API
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    // Normalize phone number
    let phone = to.replace(/\D/g, '');
    if (phone.includes('@')) {
      phone = phone.split('@')[0];
    }
    
    const response = await fetch(`${WHATSAPP_API_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: phone,
        message: message
      }),
    });

    const result = await response.json();
    console.log(`Message sent to ${phone}:`, result);
    return result.status === 'success';
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

// Log message to database
async function logMessage(instanceId: string, from: string, content: string, isFromMe: boolean, isAI: boolean = false) {
  const supabase = getSupabaseClient();
  
  try {
    // Get or create contact
    let { data: contact } = await supabase
      .from('whatsapp_contacts')
      .select('id')
      .eq('instance_id', instanceId)
      .eq('phone_number', from)
      .maybeSingle();
    
    if (!contact) {
      const { data: newContact } = await supabase
        .from('whatsapp_contacts')
        .insert({
          instance_id: instanceId,
          phone_number: from,
          name: from,
        })
        .select('id')
        .single();
      contact = newContact;
    }
    
    if (contact) {
      await supabase.from('whatsapp_messages').insert({
        instance_id: instanceId,
        contact_id: contact.id,
        content: content,
        is_from_me: isFromMe,
        is_ai_response: isAI,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error logging message:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET requests (health check)
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', message: 'Webhook is running' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Try to parse body, handle empty or invalid JSON
    let body: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      } else {
        console.log('Empty request body received');
        return new Response(
          JSON.stringify({ status: 'ignored', reason: 'empty body' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Support multiple webhook formats
    // Format 1: Direct Baileys format { from, message, pushName, key }
    // Format 2: Wrapped format { instance, event, data: { key, message, pushName } }
    
    let from: string | undefined;
    let message: any;
    let pushName: string | undefined;
    let key: any;
    let isGroup = false;

    if (body.data) {
      // Wrapped format from ISA server
      const data = body.data;
      key = data.key;
      message = data.message;
      pushName = data.pushName;
      from = key?.remoteJid;
      isGroup = from?.endsWith('@g.us') || false;
    } else if (body.key || body.from) {
      // Direct format
      from = body.from || body.key?.remoteJid;
      message = body.message;
      pushName = body.pushName;
      key = body.key;
      isGroup = body.isGroup || from?.endsWith('@g.us') || false;
    } else {
      console.log('Unknown webhook format:', Object.keys(body));
      return new Response(
        JSON.stringify({ status: 'ignored', reason: 'unknown format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Ignore group messages and own messages
    if (isGroup || key?.fromMe) {
      return new Response(
        JSON.stringify({ status: 'ignored', reason: 'group or own message' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get message content from various Baileys message types
    const messageContent = message?.conversation || 
                          message?.extendedTextMessage?.text ||
                          message?.imageMessage?.caption ||
                          message?.videoMessage?.caption ||
                          message?.buttonsResponseMessage?.selectedDisplayText ||
                          message?.listResponseMessage?.title;
    
    if (!messageContent) {
      console.log('No text content in message:', Object.keys(message || {}));
      return new Response(
        JSON.stringify({ status: 'ignored', reason: 'no text content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const senderPhone = from?.split('@')[0] || from || 'unknown';
    console.log(`📩 Message from ${pushName || senderPhone}: ${messageContent}`);

    // Get WhatsApp instance info
    const supabase = getSupabaseClient();
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id, user_id, is_ai_active')
      .eq('status', 'connected')
      .maybeSingle();

    if (!instance) {
      console.log('No active WhatsApp instance found');
      return new Response(
        JSON.stringify({ status: 'error', message: 'No active instance' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if AI is active
    if (!instance.is_ai_active) {
      console.log('AI is disabled for this instance');
      await logMessage(instance.id, senderPhone, messageContent, false, false);
      return new Response(
        JSON.stringify({ status: 'logged', ai_active: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log incoming message
    await logMessage(instance.id, senderPhone, messageContent, false, false);

    // Get or create conversation memory
    let memory = await getConversationMemory(instance.id, senderPhone);
    if (!memory) {
      memory = await createConversationMemory(instance.id, senderPhone);
    }

    let customerName = memory?.customer_name || null;
    let conversationHistory = memory?.conversation_history || [];

    // Check if this might be a name response (if we don't have a name yet)
    if (!customerName && conversationHistory.length > 0) {
      // Check if last AI message was asking for name
      const lastAiMessage = [...conversationHistory].reverse().find(m => m.role === 'assistant');
      if (lastAiMessage && (
        lastAiMessage.content.toLowerCase().includes('como posso te chamar') ||
        lastAiMessage.content.toLowerCase().includes('qual seu nome') ||
        lastAiMessage.content.toLowerCase().includes('qual o seu nome')
      )) {
        // User is likely responding with their name
        const extractedName = extractNameFromMessage(messageContent);
        if (extractedName) {
          customerName = extractedName;
          console.log(`📝 Extracted customer name: ${customerName}`);
        }
      }
    }

    // Also try pushName from WhatsApp if no name yet
    if (!customerName && pushName) {
      customerName = pushName;
      console.log(`📝 Using pushName as customer name: ${customerName}`);
    }

    // Get user context for AI
    const userInfo = await getUserInfo(instance.user_id);
    if (!userInfo) {
      console.log('No user info found');
      return new Response(
        JSON.stringify({ status: 'error', message: 'User not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch AI context
    const [aiMemory, company, behaviorRules, products] = await Promise.all([
      getAIMemory(userInfo.userId!),
      getCompanyKnowledge(userInfo.userId!),
      getBehaviorRules(userInfo.userId!),
      getProducts(userInfo.matricula!, userInfo.userId),
    ]);

    // Build vitrine link using the random vitrine_id
    const vitrineLink = userInfo.vitrineId 
      ? `https://isa.inovapro.cloud/vitrine/${userInfo.vitrineId}`
      : undefined;

    // Build prompt and generate response
    const systemPrompt = buildSystemPrompt(
      aiMemory, 
      company, 
      behaviorRules, 
      products, 
      vitrineLink,
      customerName,
      conversationHistory
    );
    
    const aiResponse = await generateAIResponse(systemPrompt, messageContent, conversationHistory);

    // Update conversation history
    conversationHistory = addToConversationHistory(conversationHistory, 'user', messageContent);
    conversationHistory = addToConversationHistory(conversationHistory, 'assistant', aiResponse);

    // Update memory with new history and possibly new name
    await updateConversationMemory(instance.id, senderPhone, {
      customer_name: customerName,
      conversation_history: conversationHistory,
    });

    // Send response via WhatsApp
    const sent = await sendWhatsAppMessage(senderPhone, aiResponse);
    
    // Log AI response
    await logMessage(instance.id, senderPhone, aiResponse, true, true);

    console.log(`✅ AI response sent to ${customerName || senderPhone}`);

    return new Response(
      JSON.stringify({
        status: 'success',
        from: senderPhone,
        customerName: customerName,
        message: messageContent,
        response: aiResponse,
        sent: sent,
        historyLength: conversationHistory.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
