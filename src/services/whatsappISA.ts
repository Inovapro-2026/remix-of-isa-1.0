// Service for communication with WhatsApp ISA API
const API_BASE_URL = '/api/whatsapp';

export interface WhatsAppStatus {
  connected: boolean;
  phone?: string;
  since?: string;
  qr_code?: string; // Some backends might return QR in status if not connected
  session_exists?: boolean;
  stats?: {
    messages_today: number;
    active_contacts: number;
    response_rate: string;
  };
}

export interface QRCodeResponse {
  qr_image_url?: string; // If backend returns URL
  qr_code?: string;      // If backend returns raw string data
  expires_at?: string;
}

export const whatsappISA = {
  // Generate QR Code
  async generateQR(cpf: string): Promise<QRCodeResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating QR:', error);
      throw error;
    }
  },

  // Get current status
  async getStatus(cpf: string): Promise<WhatsAppStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/status?cpf=${cpf}`);
      
      if (!response.ok) {
        // If 404, maybe session doesn't exist, which is a valid state
        if (response.status === 404) {
            return { connected: false, session_exists: false };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting status:', error);
      throw error;
    }
  },

  // Reconnect existing session
  async reconnect(cpf: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/reconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error reconnecting:', error);
      throw error;
    }
  },

  // Disconnect or Pause
  async disconnect(cpf: string, action: 'pause' | 'disconnect' | 'delete' = 'disconnect'): Promise<{ success: boolean }> {
    try {
        // 'delete' might be a separate endpoint or same endpoint with different action, 
        // prompt said "Excluir Conta: Remove toda a pasta".
        // The prompt listed: POST /api/whatsapp/disconnect -> { action: "pause" | "disconnect" }
        // It didn't specify the delete endpoint explicitly in the API list but in the functionality list.
        // I'll assume 'delete' might need a different handling or extends this.
        // Let's stick to the prompt's API list for disconnect/pause.
        
        // For delete, I might need another endpoint or use this one.
        // Prompt says: "Limpar Sessão" and "Excluir Conta".
        
        // Let's implement disconnect/pause as requested.
      const response = await fetch(`${API_BASE_URL}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf, action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error disconnecting:', error);
      throw error;
    }
  },
  
  // Clean Session (Cache) - Optional based on prompt "Limpar Sessão"
  async cleanSession(cpf: string): Promise<{ success: boolean }> {
      // Assuming there is an endpoint for this or we use disconnect with a specific flag
      // If not specified, we can try a specific endpoint or just warn.
      // For now, I'll assume a DELETE method on the resource or similar.
      // But let's stick to what's defined. I will add a method that calls a likely endpoint
      // or use the disconnect with action 'clean' if the backend supports it.
      // Given the prompt didn't specify the URL for "Limpar Sessão" explicitly in the API block,
      // but listed it in the button table.
      
      // Let's try to map it to DELETE /api/whatsapp/session?cpf=... or similar if I had to guess,
      // but to be safe, I'll implement a `deleteSession` method that sends a DELETE request.
      try {
        const response = await fetch(`${API_BASE_URL}/session?cpf=${cpf}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete session');
        return await response.json();
      } catch (error) {
          console.error('Error deleting session:', error);
          throw error;
      }
  }
};

export default whatsappISA;
