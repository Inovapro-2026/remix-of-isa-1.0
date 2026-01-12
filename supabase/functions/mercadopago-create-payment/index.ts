import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  seller_id: string;
  customer_phone: string;
  customer_name?: string;
  items: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  total: number;
}

serve(async (req) => {
  // Handle CORS preflight
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

    const body: PaymentRequest = await req.json();
    console.log('[MercadoPago] Creating payment:', JSON.stringify(body));

    // Validate request
    if (!body.seller_id || !body.customer_phone || !body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos para criar pagamento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get platform commission rate
    const { data: commissionSettings } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'commission_rate')
      .single();

    const commissionRate = commissionSettings?.setting_value?.percentage || 10;
    const platformFee = (body.total * commissionRate) / 100;
    const sellerAmount = body.total - platformFee;

    // Generate unique payment ID
    const paymentId = crypto.randomUUID();

    // Create sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        id: paymentId,
        seller_id: body.seller_id,
        customer_phone: body.customer_phone,
        customer_name: body.customer_name || null,
        items: body.items,
        subtotal: body.total,
        platform_fee: platformFee,
        seller_amount: sellerAmount,
        total: body.total,
        status: 'pending',
        payment_method: 'pix',
        payment_status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      })
      .select()
      .single();

    if (saleError) {
      console.error('[MercadoPago] Error creating sale:', saleError);
      throw new Error('Erro ao criar registro de venda');
    }

    // Create PIX payment in Mercado Pago
    const mpPayment = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': paymentId,
      },
      body: JSON.stringify({
        transaction_amount: body.total,
        description: `Compra - ${body.items.map(i => i.name).join(', ')}`,
        payment_method_id: 'pix',
        payer: {
          email: `${body.customer_phone}@placeholder.com`,
          first_name: body.customer_name || 'Cliente',
          identification: {
            type: 'CPF',
            number: '00000000000'
          }
        },
        external_reference: paymentId,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      }),
    });

    const mpResponse = await mpPayment.json();
    console.log('[MercadoPago] Payment response:', JSON.stringify(mpResponse));

    if (mpResponse.error) {
      console.error('[MercadoPago] MP Error:', mpResponse);
      throw new Error(mpResponse.message || 'Erro ao criar pagamento PIX');
    }

    // Update sale with MP payment data
    const { error: updateError } = await supabase
      .from('sales')
      .update({
        mp_payment_id: mpResponse.id?.toString(),
        pix_qr_code: mpResponse.point_of_interaction?.transaction_data?.qr_code,
        pix_qr_code_base64: mpResponse.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_copy_paste: mpResponse.point_of_interaction?.transaction_data?.qr_code,
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('[MercadoPago] Error updating sale:', updateError);
    }

    // Log payment creation
    await supabase.from('payment_logs').insert({
      payment_id: paymentId,
      mp_payment_id: mpResponse.id?.toString(),
      event_type: 'payment_created',
      payload: mpResponse,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent'),
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentId,
        mp_payment_id: mpResponse.id,
        qr_code: mpResponse.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpResponse.point_of_interaction?.transaction_data?.qr_code_base64,
        expires_at: sale.expires_at,
        total: body.total,
        platform_fee: platformFee,
        seller_amount: sellerAmount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[MercadoPago] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
