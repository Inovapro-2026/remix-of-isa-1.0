import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function is PUBLIC - no JWT verification required
// Deploy with: --no-verify-jwt

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || "https://mcmkzimvkomfytfaybpz.supabase.co";
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const {
      customerPhone,
      productId,
      productName,
      productPrice,
      productDescription,
      productCode,
      matricula,
      storeName,
    } = body;

    console.log('[ISA Start] Received request:', { customerPhone, productName, matricula });

    if (!customerPhone || !productName) {
      return new Response(
        JSON.stringify({ error: 'customerPhone e productName são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number
    let formattedPhone = customerPhone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55') && formattedPhone.length <= 11) {
      formattedPhone = '55' + formattedPhone;
    }

    // Format price
    const formatPrice = (price: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

    // Build ISA's initial message
    const initialMessage = `👋 *Olá! Sou a ISA*, assistente virtual da *${storeName || 'nossa loja'}*.

Você pediu informações sobre o produto:

🛒 *${productName}*
${productCode ? `📋 Código: ${productCode}` : ''}
💰 *Preço: ${formatPrice(productPrice || 0)}*

${productDescription ? `📝 ${productDescription}\n` : ''}
Se quiser, posso:
✅ Explicar melhor sobre o produto
✅ Enviar o link para compra
✅ Gerar o pagamento PIX
✅ Finalizar sua compra agora mesmo

Como posso te ajudar? 😊`;

    // Send message via WhatsApp proxy
    const whatsappResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-proxy/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: initialMessage,
      }),
    });

    const whatsappResult = await whatsappResponse.json();
    console.log('[ISA Start] WhatsApp response:', whatsappResult);

    if (!whatsappResponse.ok) {
      console.error('[ISA Start] Failed to send WhatsApp:', whatsappResult);
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar mensagem no WhatsApp', details: whatsappResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store conversation context for ISA (optional - for future AI responses)
    try {
      // Try to find an existing instance for this seller
      const { data: clientData } = await supabase
        .from('clients')
        .select('user_id')
        .eq('matricula', matricula)
        .single();

      if (clientData?.user_id) {
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('id')
          .eq('user_id', clientData.user_id)
          .single();

        if (instance?.id) {
          // Store or update conversation memory with product context
          await supabase
            .from('whatsapp_conversation_memory')
            .upsert({
              instance_id: instance.id,
              phone_number: formattedPhone,
              customer_name: null,
              context: {
                source: 'vitrine',
                product_interest: {
                  id: productId,
                  name: productName,
                  price: productPrice,
                  code: productCode,
                  description: productDescription,
                },
                initiated_at: new Date().toISOString(),
              },
              last_message_at: new Date().toISOString(),
              first_contact_at: new Date().toISOString(),
            }, {
              onConflict: 'instance_id,phone_number',
            });

          console.log('[ISA Start] Conversation context saved');
        }
      }
    } catch (contextError) {
      console.log('[ISA Start] Could not save context (non-critical):', contextError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conversa iniciada com sucesso',
        phone: formattedPhone,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ISA Start] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});