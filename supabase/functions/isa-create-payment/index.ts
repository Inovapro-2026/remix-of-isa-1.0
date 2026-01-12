import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePaymentRequest {
  matricula: string;
  customer_phone: string;
  customer_name?: string;
  customer_email?: string;
  customer_cpf?: string;
  payment_method?: 'pix' | 'credit_card' | 'debit_card' | 'boleto';
  total?: number;
  items: Array<{
    product_id: string;
    code?: string;
    name: string;
    quantity: number;
    price?: number;
    unit_price?: number;
  }>;
}

// Enviar notificação WhatsApp via ISA
async function sendWhatsAppNotification(
  supabase: any,
  phone: string,
  message: string,
  instanceId?: string
): Promise<boolean> {
  try {
    if (!instanceId) {
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('status', 'connected')
        .limit(1)
        .maybeSingle();
      
      instanceId = instance?.id;
    }

    if (!instanceId) {
      console.log('[ISA-Payment] No WhatsApp instance found, skipping notification');
      return false;
    }

    const formattedPhone = phone.replace(/\D/g, '');
    const fullPhone = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

    const isaBaseUrl = Deno.env.get('ISA_API_URL') || 'https://isa-api.com';
    const isaApiKey = Deno.env.get('ISA_API_KEY');

    if (!isaApiKey) {
      console.log('[ISA-Payment] ISA_API_KEY not configured, logging message instead');
      console.log(`[ISA-Payment] Would send to ${fullPhone}: ${message}`);
      return true;
    }

    const response = await fetch(`${isaBaseUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${isaApiKey}`,
      },
      body: JSON.stringify({
        phone: fullPhone,
        message,
        instanceId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[ISA-Payment] WhatsApp notification error:', error);
    return false;
  }
}

function formatCartMessage(items: any[], total: number): string {
  let message = '🛒 *Resumo do seu pedido:*\n\n';
  
  items.forEach((item, index) => {
    const price = item.price ?? item.unit_price ?? 0;
    const subtotal = price * item.quantity;
    message += `${index + 1}. *${item.name}*\n`;
    message += `   Qtd: ${item.quantity} x R$ ${price.toFixed(2).replace('.', ',')} = R$ ${subtotal.toFixed(2).replace('.', ',')}\n\n`;
  });
  
  message += `━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
  
  return message;
}

// Função para criar pagamento PIX no Mercado Pago com retry
async function createPixPayment(
  accessToken: string,
  paymentId: string,
  total: number,
  description: string,
  customerEmail: string,
  customerName: string,
  customerCpf: string,
  notificationUrl: string,
  retryCount = 0
): Promise<{ success: boolean; data?: any; error?: string }> {
  
  // Clean CPF - remove non-digits
  const cleanCpf = customerCpf?.replace(/\D/g, '') || '';
  
  const payload: any = {
    transaction_amount: total,
    description,
    payment_method_id: 'pix',
    external_reference: paymentId,
    notification_url: notificationUrl,
    payer: {
      email: customerEmail,
      first_name: customerName.split(' ')[0] || 'Cliente',
      last_name: customerName.split(' ').slice(1).join(' ') || 'Cliente',
      // CPF is REQUIRED for PIX payments in Mercado Pago
      identification: cleanCpf.length === 11 ? {
        type: 'CPF',
        number: cleanCpf,
      } : undefined,
    },
  };

  console.log(`[ISA-Payment] Creating PIX payment (attempt ${retryCount + 1}):`, JSON.stringify(payload));

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': retryCount > 0 ? `${paymentId}-retry-${retryCount}` : paymentId,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('[ISA-Payment] MP Response:', JSON.stringify(data));

    // Check for valid PIX data
    if (data.id && data.point_of_interaction?.transaction_data?.qr_code) {
      return {
        success: true,
        data: {
          mp_payment_id: data.id,
          status: data.status,
          qr_code: data.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
          ticket_url: data.point_of_interaction.transaction_data.ticket_url,
        },
      };
    }

    // Handle policy errors - retry with different approach
    if (data.code === 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES' && retryCount < 2) {
      console.log('[ISA-Payment] Policy error, retrying...');
      return createPixPayment(
        accessToken,
        paymentId,
        total,
        description,
        customerEmail,
        customerName,
        customerCpf,
        notificationUrl,
        retryCount + 1
      );
    }

    // If we got a payment ID but no QR code, try to fetch it
    if (data.id && !data.point_of_interaction?.transaction_data?.qr_code) {
      console.log('[ISA-Payment] Payment created but no QR code, fetching payment details...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fetchResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      const fetchedData = await fetchResponse.json();
      console.log('[ISA-Payment] Fetched payment:', JSON.stringify(fetchedData));
      
      if (fetchedData.point_of_interaction?.transaction_data?.qr_code) {
        return {
          success: true,
          data: {
            mp_payment_id: fetchedData.id,
            status: fetchedData.status,
            qr_code: fetchedData.point_of_interaction.transaction_data.qr_code,
            qr_code_base64: fetchedData.point_of_interaction.transaction_data.qr_code_base64,
            ticket_url: fetchedData.point_of_interaction.transaction_data.ticket_url,
          },
        };
      }
    }

    return {
      success: false,
      error: data.message || 'Erro ao criar pagamento PIX - QR Code não gerado',
    };
  } catch (error) {
    console.error('[ISA-Payment] PIX creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao conectar com Mercado Pago',
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = "https://mcmkzimvkomfytfaybpz.supabase.co";
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado. Configure nas secrets do projeto.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CreatePaymentRequest = await req.json();
    console.log('[ISA-Payment] Creating payment:', JSON.stringify(body));

    const paymentMethod = body.payment_method || 'pix';

    // Validate request
    if (!body.matricula || !body.customer_phone || !body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos: matricula, telefone e itens são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find seller
    let client = null;
    const { data: clientByMatricula } = await supabase
      .from('clients')
      .select('user_id, full_name, company_name')
      .eq('matricula', body.matricula)
      .single();
    
    if (clientByMatricula?.user_id) {
      client = clientByMatricula;
    } else {
      const { data: clientByVitrine } = await supabase
        .from('clients')
        .select('user_id, full_name, company_name')
        .eq('vitrine_id', body.matricula)
        .single();
      
      if (clientByVitrine?.user_id) {
        client = clientByVitrine;
      }
    }

    if (!client?.user_id) {
      console.error('[ISA-Payment] Client not found:', body.matricula);
      return new Response(
        JSON.stringify({ error: 'Vendedor não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sellerId = client.user_id;
    const sellerName = client.company_name || client.full_name;

    // Calculate total
    const calculatedTotal = body.items.reduce((sum, item) => {
      const itemPrice = item.price ?? item.unit_price ?? 0;
      return sum + (item.quantity * itemPrice);
    }, 0);
    const total = body.total || calculatedTotal;

    if (total <= 0) {
      return new Response(
        JSON.stringify({ error: 'Valor total deve ser maior que zero' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get platform commission
    const { data: commissionSettings } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'commission_rate')
      .single();

    const settingValue = commissionSettings?.setting_value as { percentage?: number } | null;
    const commissionRate = settingValue?.percentage || 10;
    const platformFee = (total * commissionRate) / 100;
    const sellerAmount = total - platformFee;

    const paymentId = crypto.randomUUID();
    const customerName = body.customer_name || 'Cliente';
    const customerEmail = body.customer_email || `${body.customer_phone.replace(/\D/g, '')}@cliente.local`;

    // Create sale record first
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        id: paymentId,
        seller_id: sellerId,
        customer_phone: body.customer_phone,
        customer_name: customerName,
        items: body.items,
        subtotal: total,
        platform_fee: platformFee,
        seller_amount: sellerAmount,
        total: total,
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (saleError) {
      console.error('[ISA-Payment] Error creating sale:', saleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar registro de venda' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle PIX payment
    if (paymentMethod === 'pix') {
      const customerCpf = body.customer_cpf || '';
      const pixResult = await createPixPayment(
        accessToken,
        paymentId,
        total,
        `Compra - ${sellerName}`,
        customerEmail,
        customerName,
        customerCpf,
        `${supabaseUrl}/functions/v1/mercadopago-webhook`
      );

      if (!pixResult.success || !pixResult.data?.qr_code) {
        // Update sale as failed
        await supabase
          .from('sales')
          .update({ 
            status: 'failed', 
            payment_status: 'failed' 
          })
          .eq('id', paymentId);

        console.error('[ISA-Payment] PIX creation failed:', pixResult.error);
        return new Response(
          JSON.stringify({ 
            error: pixResult.error || 'Não foi possível gerar o PIX. Tente novamente.',
            payment_id: paymentId
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update sale with valid PIX data
      await supabase
        .from('sales')
        .update({
          mp_payment_id: pixResult.data.mp_payment_id?.toString(),
          payment_status: pixResult.data.status || 'pending',
          pix_qr_code: pixResult.data.qr_code,
          pix_qr_code_base64: pixResult.data.qr_code_base64,
          pix_copy_paste: pixResult.data.qr_code,
        })
        .eq('id', paymentId);

      // Log payment creation
      await supabase.from('payment_logs').insert({
        payment_id: paymentId,
        mp_payment_id: pixResult.data.mp_payment_id?.toString(),
        event_type: 'pix_created_success',
        payload: { 
          matricula: body.matricula, 
          items: body.items, 
          has_qr_code: true,
          has_qr_code_base64: !!pixResult.data.qr_code_base64,
        },
      });

      // Send WhatsApp notification
      const cartMessage = formatCartMessage(body.items, total);
      const whatsappMessage = `🎉 Olá *${customerName}*!\n\nObrigado por comprar na *${sellerName}*!\n\n${cartMessage}\n\n📱 *Forma de pagamento:* PIX\n\n🔑 *Código PIX (copia e cola):*\n\`\`\`${pixResult.data.qr_code}\`\`\`\n\n⏳ O pagamento expira em 30 minutos.\n\n🙏 Agradecemos a preferência!`;
      await sendWhatsAppNotification(supabase, body.customer_phone, whatsappMessage);

      // Return success with valid PIX data
      return new Response(
        JSON.stringify({
          success: true,
          payment_id: paymentId,
          payment_method: 'pix',
          payment: {
            payment_id: paymentId,
            mp_payment_id: pixResult.data.mp_payment_id,
            pix_qr_code: pixResult.data.qr_code,
            pix_qr_code_base64: pixResult.data.qr_code_base64,
            pix_copy_paste: pixResult.data.qr_code,
            expires_at: sale.expires_at,
            total: total,
          },
          total: total,
          message: `PIX gerado com sucesso! Total: R$ ${total.toFixed(2).replace('.', ',')}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Credit Card
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      const preferencePayload = {
        items: body.items.map(item => ({
          id: item.product_id,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price ?? item.unit_price ?? 0,
          currency_id: 'BRL',
        })),
        payer: {
          email: customerEmail,
          name: customerName,
        },
        payment_methods: paymentMethod === 'credit_card' ? {
          default_payment_method_id: 'visa',
          excluded_payment_types: [{ id: 'ticket' }],
          installments: 12,
        } : {
          default_payment_method_id: 'debvisa',
          excluded_payment_types: [{ id: 'ticket' }, { id: 'credit_card' }],
        },
        back_urls: {
          success: `${supabaseUrl}/functions/v1/mercadopago-webhook?status=success&payment_id=${paymentId}`,
          failure: `${supabaseUrl}/functions/v1/mercadopago-webhook?status=failure&payment_id=${paymentId}`,
          pending: `${supabaseUrl}/functions/v1/mercadopago-webhook?status=pending&payment_id=${paymentId}`,
        },
        auto_return: 'approved',
        external_reference: paymentId,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      };

      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencePayload),
      });

      const data = await response.json();
      console.log('[ISA-Payment] Card preference:', JSON.stringify(data));

      if (data.id && data.init_point) {
        await supabase
          .from('sales')
          .update({
            mp_preference_id: data.id,
            payment_status: 'awaiting_payment',
          })
          .eq('id', paymentId);

        const cartMessage = formatCartMessage(body.items, total);
        const methodLabel = paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito';
        const whatsappMessage = `🎉 Olá *${customerName}*!\n\nObrigado por comprar na *${sellerName}*!\n\n${cartMessage}\n\n💳 *Forma de pagamento:* ${methodLabel}\n\n🔗 Clique no link abaixo para finalizar:\n${data.init_point}\n\n⏳ Link válido por 24 horas.\n\n🙏 Agradecemos a preferência!`;
        await sendWhatsAppNotification(supabase, body.customer_phone, whatsappMessage);

        return new Response(
          JSON.stringify({
            success: true,
            payment_id: paymentId,
            payment_method: paymentMethod,
            payment: {
              payment_id: paymentId,
              preference_id: data.id,
              checkout_url: data.init_point,
              total: total,
            },
            message: 'Redirecionando para pagamento...',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao criar checkout - tente novamente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Boleto
    if (paymentMethod === 'boleto') {
      const boletoPayload = {
        transaction_amount: total,
        description: `Compra - ${sellerName}`,
        payment_method_id: 'bolbradesco',
        external_reference: paymentId,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        payer: {
          email: customerEmail,
          first_name: customerName.split(' ')[0],
          last_name: customerName.split(' ').slice(1).join(' ') || 'Cliente',
        },
      };

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': paymentId,
        },
        body: JSON.stringify(boletoPayload),
      });

      const data = await response.json();
      console.log('[ISA-Payment] Boleto response:', JSON.stringify(data));

      if (data.id && data.transaction_details?.external_resource_url) {
        await supabase
          .from('sales')
          .update({
            mp_payment_id: data.id?.toString(),
            payment_status: data.status || 'pending',
          })
          .eq('id', paymentId);

        const cartMessage = formatCartMessage(body.items, total);
        const whatsappMessage = `🎉 Olá *${customerName}*!\n\nObrigado por comprar na *${sellerName}*!\n\n${cartMessage}\n\n🧾 *Forma de pagamento:* Boleto Bancário\n\n🔗 Acesse o boleto:\n${data.transaction_details.external_resource_url}\n\n📅 Vencimento: 3 dias úteis\n\n🙏 Agradecemos a preferência!`;
        await sendWhatsAppNotification(supabase, body.customer_phone, whatsappMessage);

        return new Response(
          JSON.stringify({
            success: true,
            payment_id: paymentId,
            payment_method: 'boleto',
            payment: {
              payment_id: paymentId,
              boleto_url: data.transaction_details.external_resource_url,
              barcode: data.barcode?.content,
              total: total,
            },
            message: 'Boleto gerado com sucesso!',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao gerar boleto - tente novamente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método de pagamento não suportado' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ISA-Payment] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
