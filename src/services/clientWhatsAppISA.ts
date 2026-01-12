// Client WhatsApp ISA Service - HTTP API Client
// Uses Supabase Edge Function as proxy to avoid Mixed Content (HTTPS -> HTTP) issues

import { supabase } from "@/integrations/supabase/client";

// Supabase proxy URL (required for HTTPS -> HTTP requests)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mcmkzimvkomfytfaybpz.supabase.co";
const PROXY_URL = `${SUPABASE_URL}/functions/v1/whatsapp-proxy`;

// Fallback to direct backend URL for other APIs
const DIRECT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://148.230.76.60:3001';
const API_BASE_URL = `${DIRECT_BACKEND_URL}/api`;

export interface WhatsAppISAClientSession {
  client_id: string;
  client_name: string;
  status: string;
  qr_code?: string;
  phone_info?: any;
  connection_time?: string;
  last_activity?: string;
  stats?: {
    messages_today: number;
    active_contacts: number;
    response_rate: number;
  };
}

export interface PublicStatusResponse {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'open' | 'close' | 'authenticating' | 'initializing' | 'authenticated' | 'auth_failure';
  qrCode?: string;
  qrHtml?: string;
  messagesToday?: number;
  activeContacts?: number;
  user?: {
    id?: string;
    name?: string;
  };
}

class ClientWhatsAppISAService {
  // Helper to make proxy requests
  private async proxyRequest(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${PROXY_URL}/${path}`;

    const apiKey =
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA";

    console.log(`[WhatsApp Proxy] Requesting: ${url}`);

    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        ...options.headers,
      },
    });
  }

  // Get QR Code from proxy
  async getQRCode(): Promise<{ qrCode?: string; status: string }> {
    try {
      const response = await this.proxyRequest("qr");
      
      if (!response.ok) {
        console.error('Failed to fetch QR:', response.status);
        return { status: 'disconnected' };
      }
      
      const data = await response.json();
      console.log('[WhatsApp Proxy] QR Response:', data);
      
      return {
        qrCode: data.qrCode,
        status: data.status || 'qr_ready'
      };
    } catch (error) {
      console.error('Error fetching QR code:', error);
      return { status: 'disconnected' };
    }
  }

  // Get QR Code image URL (legacy compatibility)
  getQRImageUrl(cpf: string): string {
    return `${PROXY_URL}/qr`;
  }

  // Check connection status via proxy
  async getApiStatus(): Promise<'connected' | 'connecting' | 'disconnected'> {
    try {
      const response = await this.proxyRequest("status");
      
      if (!response.ok) {
        return 'disconnected';
      }
      
      const data = await response.json();
      console.log('[WhatsApp Proxy] Status Response:', data);
      
      // Map API status
      if (data.status === 'open' || data.status === 'connected') {
        return 'connected';
      } else if (data.status === 'connecting') {
        return 'connecting';
      }
      
      return 'disconnected';
    } catch (error) {
      console.error('Error checking API status:', error);
      return 'disconnected';
    }
  }

  // Connect / Start session - triggers QR generation
  async connect(cpf: string): Promise<{ status: string; qrCode?: string }> {
    try {
      // First check status
      const apiStatus = await this.getApiStatus();
      
      if (apiStatus === 'connected') {
        return { status: 'connected' };
      }
      
      // Fetch QR code
      const qrResult = await this.getQRCode();
      return qrResult;
    } catch (error) {
      console.error("Error connecting:", error);
      throw error;
    }
  }

  // Get status - combines API status with QR availability
  async getPublicStatus(cpf: string): Promise<PublicStatusResponse> {
    try {
      // Check status first
      const apiStatus = await this.getApiStatus();
      
      if (apiStatus === 'connected') {
        return { status: 'connected' };
      }
      
      // Try to get QR code
      const qrResult = await this.getQRCode();
      
      if (qrResult.qrCode) {
        return { 
          status: 'qr_ready',
          qrCode: qrResult.qrCode
        };
      }
      
      return { status: apiStatus === 'connecting' ? 'connecting' : 'disconnected' };
    } catch (error) {
      console.error("Error getting public status:", error);
      return { status: "disconnected" };
    }
  }

  // Send message via proxy
  async sendWhatsAppMessage(number: string, message: string): Promise<{ status: string; message: string }> {
    try {
      const response = await this.proxyRequest("send", {
        method: 'POST',
        body: JSON.stringify({ number, message }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Disconnect (returns success - API doesn't support disconnect)
  async disconnect(cpf: string): Promise<{ success: boolean }> {
    console.warn('Disconnect not implemented in current API');
    return { success: true };
  }

  // ===== Legacy methods for compatibility =====

  async createSession(clientId: string, clientName: string): Promise<WhatsAppISAClientSession> {
    const result = await this.connect(clientId);
    return {
      client_id: clientId,
      client_name: clientName,
      status: result.status || 'connecting',
      qr_code: result.qrCode,
    };
  }

  async getSessionStatus(clientId: string): Promise<{
    dbStatus: WhatsAppISAClientSession;
    isConnected: boolean;
  }> {
    const data = await this.getPublicStatus(clientId);

    const dbStatus: WhatsAppISAClientSession = {
      client_id: clientId,
      client_name: clientId,
      status: data.status || 'disconnected',
      qr_code: data.qrCode,
      stats: {
        messages_today: data.messagesToday || 0,
        active_contacts: data.activeContacts || 0,
        response_rate: 0,
      },
    };

    return {
      dbStatus,
      isConnected: data.status === 'connected',
    };
  }

  async generateQR(clientId: string): Promise<{ qr_code?: string; qr_image_url?: string }> {
    const result = await this.getQRCode();
    return {
      qr_code: result.qrCode,
    };
  }

  async disconnectSession(clientId: string): Promise<void> {
    await this.disconnect(clientId);
  }

  async deleteSession(cpf: string): Promise<{ success: boolean }> {
    console.warn('Delete session not implemented in current API');
    return { success: true };
  }

  async resetSessionWithRetry(clientId: string): Promise<void> {
    await this.deleteSession(clientId);
  }

  // ===== Chat & Other Methods (using standard API) =====

  async getContacts(clientId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/${clientId}/contacts`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.contacts || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  async getMessages(clientId: string, contactPhone: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/${clientId}/messages/${contactPhone}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async getIAConfig(clientId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/ia/config/${clientId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching IA config:', error);
      return {};
    }
  }

  async saveIAConfig(clientId: string, config: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/memory/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: clientId, config }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error saving IA config:', error);
      throw error;
    }
  }

  async testIAConfig(clientId: string, message: string): Promise<{ response: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/ia/test/${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error testing IA config:', error);
      throw error;
    }
  }

  async sendMessage(clientId: string, contactPhone: string, content: string): Promise<any> {
    return this.sendWhatsAppMessage(contactPhone, content);
  }

  async addProduct(clientId: string, product: any) {
    const res = await fetch(`${API_BASE_URL}/products/${clientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return await res.json();
  }

  async updateProduct(clientId: string, prodId: string, product: any) {
    const res = await fetch(`${API_BASE_URL}/products/${clientId}/${prodId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return await res.json();
  }

  async deleteProduct(clientId: string, prodId: string) {
    const res = await fetch(`${API_BASE_URL}/products/${clientId}/${prodId}`, {
      method: 'DELETE',
    });
    return await res.json();
  }

  async testAI(clientId: string, message: string, config: any) {
    const res = await fetch(`${API_BASE_URL}/ai/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: clientId, message, config }),
    });
    return await res.json();
  }

  async getMemory(clientId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/memory/${clientId}`);
      if (!res.ok) {
        console.warn(`Memory fetch returned ${res.status}, returning empty object`);
        return {};
      }
      const text = await res.text();
      if (!text || text.trim() === '') return {};
      return JSON.parse(text);
    } catch (error) {
      console.error('Error fetching memory:', error);
      return {};
    }
  }

  async saveMemory(clientId: string, config: any) {
    const res = await fetch(`${API_BASE_URL}/memory/${clientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await res.json();
  }

  async listAllSessions(): Promise<Array<{ client_id: string; client_name: string }>> {
    console.warn('listAllSessions not implemented in backend');
    return [];
  }

  async resetAllSessions(): Promise<{ success: number; failed: number; total: number }> {
    console.warn('resetAllSessions not implemented in backend');
    return { success: 0, failed: 0, total: 0 };
  }
}

export const clientWhatsAppISA = new ClientWhatsAppISAService();
