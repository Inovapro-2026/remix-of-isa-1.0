import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to send WhatsApp notification
async function sendWhatsAppNotification(supabase: any, phone: string, message: string) {
  try {
    const supabaseUrl = "https://mcmkzimvkomfytfaybpz.supabase.co";
    
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55') && formattedPhone.length <= 11) {
      formattedPhone = '55' + formattedPhone;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-proxy/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    if (response.ok) {
      console.log('[MP Webhook] WhatsApp notification sent to:', formattedPhone);
      return true;
    } else {
      console.log('[MP Webhook] Failed to send WhatsApp notification:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('[MP Webhook] Error sending WhatsApp notification:', error);
    return false;
  }
}

// Format cart items for message
function formatCartItems(items: any[]): string {
  return items.map(item => {
    const price = item.price || item.unit_price || 0;
    const total = price * item.quantity;
    return `• ${item.quantity}x ${item.name} - R$ ${total.toFixed(2)}`;
  }).join('\n');
}

// Buscar informações de entrega digital do produto
async function getProductDeliveryInfo(supabase: any, productId: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('name, delivery_type, delivery_content, delivery_file_url')
      .eq('id', productId)
      .single();

    if (error) {
      console.log('[MP Webhook] Product not found:', productId);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[MP Webhook] Error fetching product:', error);
    return null;
  }
}

// Enviar entrega digital automática
async function sendDigitalDelivery(
  supabase: any,
  phone: string,
  items: any[],
  customerName: string,
  sellerName: string
): Promise<{ sent: boolean; deliveryCount: number }> {
  let deliveryCount = 0;
  let allSent = true;

  for (const item of items) {
    const product = await getProductDeliveryInfo(supabase, item.product_id);
    
    if (!product || !product.delivery_type || product.delivery_type === 'none') {
      continue;
    }

    let deliveryMessage = '';

    switch (product.delivery_type) {
      case 'text':
        if (product.delivery_content) {
          deliveryMessage = `📦 *Entrega do Produto: ${product.name}*\n\n${product.delivery_content}`;
        }
        break;

      case 'link':
        if (product.delivery_content) {
          deliveryMessage = `📦 *Entrega do Produto: ${product.name}*\n\n🔗 *Acesse seu produto:*\n${product.delivery_content}\n\n💡 Guarde este link, ele é o seu acesso ao produto!`;
        }
        break;

      case 'file':
        if (product.delivery_file_url) {
          deliveryMessage = `📦 *Entrega do Produto: ${product.name}*\n\n📄 *Baixe seu arquivo:*\n${product.delivery_file_url}\n\n💡 Clique no link para baixar seu produto!`;
        }
        break;
    }

    if (deliveryMessage) {
      const sent = await sendWhatsAppNotification(supabase, phone, deliveryMessage);
      if (sent) {
        deliveryCount++;
      } else {
        allSent = false;
      }
    }
  }

  return { sent: allSent, deliveryCount };
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
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    const body = await req.json();
    console.log('[MP Webhook] Received:', JSON.stringify(body));

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (body.type !== 'payment' && body.action !== 'payment.updated' && body.action !== 'payment.created') {
      console.log('[MP Webhook] Ignoring non-payment event:', body.type, body.action);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const mpPaymentId = body.data?.id;
    if (!mpPaymentId) {
      console.log('[MP Webhook] No payment ID in webhook');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validar pagamento com API do Mercado Pago
    console.log('[MP Webhook] Validating payment with MP API:', mpPaymentId);
    const mpValidation = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const paymentData = await mpValidation.json();
    console.log('[MP Webhook] Payment data from MP:', JSON.stringify(paymentData));

    if (paymentData.error) {
      console.error('[MP Webhook] Invalid payment:', paymentData);
      
      await supabase.from('antifraud_logs').insert({
        event_type: 'invalid_payment_validation',
        ip_address: ipAddress,
        details: { mp_payment_id: mpPaymentId, error: paymentData },
        is_blocked: true,
      });

      return new Response(JSON.stringify({ error: 'Payment validation failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const externalReference = paymentData.external_reference;
    const paymentStatus = paymentData.status;

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', externalReference)
      .single();

    if (saleError || !sale) {
      console.error('[MP Webhook] Sale not found:', externalReference);
      
      const { data: existingPayment } = await supabase
        .from('sales')
        .select('id')
        .eq('mp_payment_id', mpPaymentId.toString())
        .single();

      if (existingPayment) {
        console.log('[MP Webhook] Duplicate payment detected:', mpPaymentId);
        await supabase.from('antifraud_logs').insert({
          event_type: 'duplicate_payment',
          ip_address: ipAddress,
          details: { mp_payment_id: mpPaymentId, existing_sale: existingPayment.id },
          is_blocked: true,
        });
      }

      return new Response(JSON.stringify({ error: 'Sale not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar duplicata
    if (sale.payment_status === 'approved' && paymentStatus === 'approved') {
      console.log('[MP Webhook] Payment already processed:', sale.id);
      
      await supabase.from('payment_logs').insert({
        payment_id: sale.id,
        mp_payment_id: mpPaymentId.toString(),
        event_type: 'duplicate_webhook',
        payload: body,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log do evento
    await supabase.from('payment_logs').insert({
      payment_id: sale.id,
      mp_payment_id: mpPaymentId.toString(),
      event_type: `payment_${paymentStatus}`,
      payload: paymentData,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Atualizar status da venda
    const updateData: Record<string, any> = {
      payment_status: paymentStatus,
      mp_payment_id: mpPaymentId.toString(),
    };

    if (paymentStatus === 'approved') {
      updateData.status = 'completed';
      updateData.paid_at = new Date().toISOString();

      // Atualizar saldo do vendedor
      const { data: existingBalance } = await supabase
        .from('seller_balances')
        .select('*')
        .eq('user_id', sale.seller_id)
        .single();

      if (existingBalance) {
        await supabase
          .from('seller_balances')
          .update({
            available_balance: existingBalance.available_balance + sale.seller_amount,
            total_earned: existingBalance.total_earned + sale.seller_amount,
          })
          .eq('user_id', sale.seller_id);
      } else {
        await supabase
          .from('seller_balances')
          .insert({
            user_id: sale.seller_id,
            available_balance: sale.seller_amount,
            total_earned: sale.seller_amount,
          });
      }

      // Registrar comissão da plataforma
      await supabase.from('platform_commissions').insert({
        sale_id: sale.id,
        commission_type: 'sale',
        amount: sale.platform_fee,
        percentage: (sale.platform_fee / sale.total) * 100,
      });

      console.log('[MP Webhook] Payment approved, seller balance updated:', sale.seller_id);

      // Buscar info do vendedor
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', sale.seller_id)
        .single();

      const sellerName = sellerProfile?.company_name || sellerProfile?.full_name || 'Nossa Loja';
      const customerName = sale.customer_name || 'Cliente';
      
      // Parse items
      const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || []);
      const itemsList = formatCartItems(items);

      const trackingUrl = `https://mcmkzimvkomfytfaybpz.lovableproject.com/rastrear/${sale.id}`;

      // 1. Enviar mensagem de confirmação de pagamento
      const approvedMessage = `🎉 *PAGAMENTO CONFIRMADO!* 🎉

Olá *${customerName}*!

Seu pagamento foi aprovado com sucesso!

📦 *Detalhes do Pedido:*
${itemsList}

💰 *Total:* R$ ${sale.total.toFixed(2)}

🔗 *Acompanhe seu pedido:*
${trackingUrl}

📋 *ID do Pedido:* ${sale.id.slice(0, 8)}...

Obrigado por comprar na *${sellerName}*! 🙏`;

      await sendWhatsAppNotification(supabase, sale.customer_phone, approvedMessage);

      // 2. ENVIAR ENTREGA DIGITAL AUTOMÁTICA
      console.log('[MP Webhook] Sending digital delivery for items:', items.length);
      
      const deliveryResult = await sendDigitalDelivery(
        supabase,
        sale.customer_phone,
        items,
        customerName,
        sellerName
      );

      if (deliveryResult.deliveryCount > 0) {
        updateData.delivery_status = deliveryResult.sent ? 'sent' : 'failed';
        updateData.delivery_sent_at = new Date().toISOString();

        // Enviar mensagem de agradecimento final
        const thankYouMessage = `✨ *Entrega Concluída!* ✨

Olá *${customerName}*!

${deliveryResult.deliveryCount > 1 
  ? `Seus ${deliveryResult.deliveryCount} produtos foram entregues acima!` 
  : 'Seu produto foi entregue acima!'}

📱 Guarde essas mensagens - elas contêm seu acesso aos produtos.

Em caso de dúvidas, estamos à disposição!

*${sellerName}* agradece sua preferência! 💚`;

        await sendWhatsAppNotification(supabase, sale.customer_phone, thankYouMessage);

        console.log('[MP Webhook] Digital delivery sent:', deliveryResult);

        // 3. ENVIAR EMAIL DE CONFIRMAÇÃO (se configurado)
        try {
          // Buscar email do cliente (se tiver)
          const { data: payerData } = await supabase
            .from('sales')
            .select('customer_phone')
            .eq('id', sale.id)
            .single();

          // Coletar informações de entrega digital para o email
          const digitalDeliveries = [];
          for (const item of items) {
            const product = await getProductDeliveryInfo(supabase, item.product_id);
            if (product && product.delivery_type && product.delivery_type !== 'none') {
              digitalDeliveries.push({
                productName: product.name,
                deliveryType: product.delivery_type,
                content: product.delivery_type === 'file' ? product.delivery_file_url : product.delivery_content,
              });
            }
          }

          // Buscar email do cliente via perfil (se existir)
          const { data: customerProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('phone', sale.customer_phone)
            .single();

          if (customerProfile?.email) {
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to: customerProfile.email,
                customerName,
                orderId: sale.id,
                items: items.map((item: any) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price || item.unit_price || 0,
                })),
                total: sale.total,
                sellerName,
                trackingUrl,
                digitalDeliveries,
              }),
            });

            if (emailResponse.ok) {
              console.log('[MP Webhook] Confirmation email sent');
            }
          }
        } catch (emailError) {
          console.log('[MP Webhook] Email sending skipped or failed (non-critical):', emailError);
        }
      } else {
        // Sem produtos digitais para entregar
        updateData.delivery_status = 'not_required';
      }

    } else if (paymentStatus === 'cancelled' || paymentStatus === 'rejected') {
      updateData.status = 'cancelled';
      updateData.delivery_status = 'not_required';

      const customerName = sale.customer_name || 'Cliente';
      
      const cancelMessage = `❌ *Pagamento não confirmado*

Olá *${customerName}*,

Infelizmente seu pagamento não foi aprovado.

📋 *ID do Pedido:* ${sale.id.slice(0, 8)}...

Se desejar tentar novamente, entre em contato conosco.`;

      await sendWhatsAppNotification(supabase, sale.customer_phone, cancelMessage);

    } else if (paymentStatus === 'pending' || paymentStatus === 'in_process') {
      const customerName = sale.customer_name || 'Cliente';
      
      const pendingMessage = `⏳ *Pagamento em processamento*

Olá *${customerName}*,

Seu pagamento está sendo processado. Você receberá uma confirmação assim que for aprovado.

📋 *ID do Pedido:* ${sale.id.slice(0, 8)}...

🔗 *Acompanhe seu pedido:*
https://mcmkzimvkomfytfaybpz.lovableproject.com/rastrear/${sale.id}`;

      await sendWhatsAppNotification(supabase, sale.customer_phone, pendingMessage);
    }

    await supabase
      .from('sales')
      .update(updateData)
      .eq('id', sale.id);

    console.log('[MP Webhook] Sale updated:', sale.id, paymentStatus);

    return new Response(
      JSON.stringify({ received: true, status: paymentStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[MP Webhook] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
