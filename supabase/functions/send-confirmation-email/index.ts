import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  customerName: string;
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  sellerName: string;
  trackingUrl: string;
  digitalDeliveries?: Array<{
    productName: string;
    deliveryType: string;
    content: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log('[Email] RESEND_API_KEY not configured, skipping email');
      return new Response(
        JSON.stringify({ skipped: true, reason: 'RESEND_API_KEY not configured' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Dynamic import for Resend
    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);
    
    const { to, customerName, orderId, items, total, sellerName, trackingUrl, digitalDeliveries }: EmailRequest = await req.json();

    console.log('[Email] Sending confirmation to:', to);

    // Format items list
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.quantity}x ${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    // Format digital deliveries
    let digitalDeliveriesHtml = '';
    if (digitalDeliveries && digitalDeliveries.length > 0) {
      const deliveriesContent = digitalDeliveries.map(d => {
        if (d.deliveryType === 'link') {
          return `
            <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
              <p style="font-weight: 600; color: #166534; margin: 0 0 8px 0;">📦 ${d.productName}</p>
              <a href="${d.content}" style="color: #22c55e; word-break: break-all;">${d.content}</a>
            </div>
          `;
        } else if (d.deliveryType === 'file') {
          return `
            <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
              <p style="font-weight: 600; color: #166534; margin: 0 0 8px 0;">📄 ${d.productName}</p>
              <a href="${d.content}" style="color: #22c55e; word-break: break-all;">Baixar arquivo</a>
            </div>
          `;
        } else {
          return `
            <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
              <p style="font-weight: 600; color: #166534; margin: 0 0 8px 0;">📝 ${d.productName}</p>
              <p style="color: #374151; white-space: pre-wrap; margin: 0;">${d.content}</p>
            </div>
          `;
        }
      }).join('');

      digitalDeliveriesHtml = `
        <div style="margin-top: 32px;">
          <h2 style="color: #166534; font-size: 18px; margin-bottom: 16px;">🎁 Seus Produtos Digitais</h2>
          ${deliveriesContent}
        </div>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 32px; text-align: center;">
            <div style="width: 64px; height: 64px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px;">✓</span>
            </div>
            <h1 style="color: white; font-size: 24px; margin: 0 0 8px 0;">Pagamento Confirmado!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Obrigado pela sua compra, ${customerName}!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Pedido</p>
              <p style="margin: 0; font-weight: 600; color: #111827; font-size: 16px;">#${orderId.slice(0, 8).toUpperCase()}</p>
            </div>
            
            <h2 style="color: #111827; font-size: 18px; margin: 0 0 16px 0;">Itens do Pedido</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td style="padding: 16px 12px; font-weight: 700; font-size: 18px; color: #111827;">Total</td>
                  <td style="padding: 16px 12px; font-weight: 700; font-size: 18px; text-align: right; color: #22c55e;">R$ ${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            ${digitalDeliveriesHtml}
            
            <div style="margin-top: 32px; text-align: center;">
              <a href="${trackingUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Acompanhar Pedido
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
              Compra realizada em <strong>${sellerName}</strong>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Powered by ISA 2.5 ⚡
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "ISA <onboarding@resend.dev>",
      to: [to],
      subject: `✅ Pagamento Confirmado - Pedido #${orderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    });

    console.log("[Email] Sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[Email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);