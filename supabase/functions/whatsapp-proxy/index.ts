// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// WhatsApp ISA API (Baileys) - Port 3333
const WHATSAPP_API_URL = "http://148.230.76.60:3333";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// This function is PUBLIC - no JWT verification required
// Add --no-verify-jwt flag when deploying

// Helper function to fetch QR with retries
async function fetchQRWithRetry(maxRetries = 3, delayMs = 1000): Promise<{ qrCode?: string; status: string; message?: string }> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${WHATSAPP_API_URL}/qr`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        
        if (contentType.includes("text/html")) {
          const html = await response.text();
          const match = html.match(/src="([^"]+)"/);
          if (match && match[1]) {
            return { status: "qr_ready", qrCode: match[1] };
          }
        }
        
        // Try to parse as JSON
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          return { status: "waiting", message: text };
        }
      }
      
      // If 404, wait and retry
      if (response.status === 404 && i < maxRetries - 1) {
        console.log(`QR not ready, retrying in ${delayMs}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      return { status: "waiting", message: "QR Code ainda não gerado. Tente novamente em instantes." };
    } catch (error) {
      console.error(`QR fetch error (attempt ${i + 1}):`, error);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
    }
  }
  
  return { status: "waiting", message: "Não foi possível obter o QR Code. Tente novamente." };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let path = url.pathname.replace("/whatsapp-proxy", "");
    
    // Remove leading slash if present
    if (path.startsWith("/")) {
      path = path.substring(1);
    }
    
    console.log(`Processing path: ${path}`);
    
    // Handle QR endpoint with retry logic
    if (path === "qr") {
      const result = await fetchQRWithRetry(3, 800);
      
      return new Response(
        JSON.stringify(result),
        {
          status: result.qrCode ? 200 : 202, // 202 = Accepted (processing)
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Map paths to WhatsApp ISA API endpoints
    let targetUrl: string;
    
    if (path === "status" || path === "") {
      targetUrl = `${WHATSAPP_API_URL}/status`;
    } else if (path === "send") {
      targetUrl = `${WHATSAPP_API_URL}/send`;
    } else {
      // Fallback for other paths
      targetUrl = `${WHATSAPP_API_URL}/${path}`;
    }

    console.log(`Proxying ${req.method} to: ${targetUrl}`);

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Include body for POST/PUT requests
    if (req.method === "POST" || req.method === "PUT") {
      const body = await req.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    
    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(data);
      // Map API status to our status format
      if (jsonData.status === "open") {
        jsonData.status = "connected";
      } else if (jsonData.status === "close") {
        jsonData.status = "disconnected";
      }
      return new Response(JSON.stringify(jsonData), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch {
      return new Response(data, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Proxy error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: "Failed to connect to WhatsApp backend",
        details: errorMessage,
        status: "disconnected"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
