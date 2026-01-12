import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { clientWhatsAppISA } from "@/services/clientWhatsAppISA";

export interface WhatsAppSession {
  client_id: string;
  client_name: string;
  status: 'connected' | 'disconnected' | 'qr_ready' | 'connecting' | 'error';
  qr_code?: string;
  phone_info?: {
    phone: string;
    device_model: string;
    battery: number;
  };
  connection_time?: string;
  last_activity?: string;
  stats?: {
    messages_sent: number;
    messages_received: number;
    contacts: number;
    response_rate: number;
    last_24h: number;
  };
}

interface UseWhatsAppManagerReturn {
  sessions: WhatsAppSession[];
  currentSession: WhatsAppSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  connectSession: (clientId: string, clientName?: string) => Promise<void>;
  disconnectSession: (clientId: string) => Promise<void>;
  deleteSession: (clientId: string) => Promise<void>;
  refreshSession: (clientId: string) => Promise<void>;
  createSession: (clientId: string, clientName: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  setCurrentSession: (session: WhatsAppSession | null) => void;
  
  // Utils
  validateCPF: (cpf: string) => boolean;
  formatCPF: (value: string) => string;
}

export const useWhatsAppManager = (): UseWhatsAppManagerReturn => {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [currentSession, setCurrentSession] = useState<WhatsAppSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all sessions
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically call an API endpoint to get all sessions
      // For now, we'll simulate with the current session
      if (currentSession) {
        setSessions([currentSession]);
      } else {
        setSessions([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar sessões';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  // Connect to existing session
  const connectSession = useCallback(async (clientId: string, clientName?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if session exists first
      let sessionData;
      try {
        sessionData = await clientWhatsAppISA.getSessionStatus(clientId);
      } catch (error) {
        // If session doesn't exist, create it
        if (clientName) {
          await clientWhatsAppISA.createSession(clientId, clientName);
          sessionData = await clientWhatsAppISA.getSessionStatus(clientId);
        } else {
          throw new Error('Sessão não encontrada. Forneça um nome para criar uma nova sessão.');
        }
      }

      // Map the API response to our session interface
      const dbStatus = sessionData?.dbStatus || {};
      
      // Se não estiver conectado e não tiver QR Code, tenta gerar um novo
      let qrCode = dbStatus.qr_code;
      if (!sessionData?.isConnected && !qrCode) {
        try {
          const qrData = await clientWhatsAppISA.generateQR(clientId);
          qrCode = qrData.qr_code || qrData.qr_image_url;
        } catch (e) {
          console.error('Falha ao gerar QR Code inicial:', e);
        }
      }

      const session: WhatsAppSession = {
        client_id: clientId,
        client_name: clientName || dbStatus.client_name || clientId,
        status: sessionData?.isConnected ? 'connected' : (qrCode ? 'qr_ready' : 'disconnected'),
        qr_code: qrCode,
        phone_info: dbStatus?.phone_info,
        connection_time: dbStatus?.connection_time,
        last_activity: dbStatus?.last_activity,
        stats: {
          messages_sent: dbStatus?.messages_sent || 0,
          messages_received: dbStatus?.messages_received || 0,
          contacts: dbStatus?.contacts || 0,
          response_rate: dbStatus?.response_rate || 0,
          last_24h: dbStatus?.last_24h || 0
        }
      };

      setCurrentSession(session);
      
      if (sessionData?.isConnected) {
        toast.success("Sessão conectada com sucesso!");
      } else if (qrCode) {
        toast.info("QR Code gerado! Escaneie para conectar.");
      } else {
        toast.warning("Não foi possível gerar o QR Code. Tente novamente.");
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar sessão';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect session
  const disconnectSession = useCallback(async (clientId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await clientWhatsAppISA.disconnectSession(clientId);
      
      if (currentSession?.client_id === clientId) {
        setCurrentSession(prev => prev ? { ...prev, status: 'disconnected' } : null);
      }
      
      toast.success("Sessão desconectada com sucesso!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desconectar sessão';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  // Delete session
  const deleteSession = useCallback(async (clientId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await clientWhatsAppISA.deleteSession(clientId);
      
      if (currentSession?.client_id === clientId) {
        setCurrentSession(null);
      }
      
      toast.success("Sessão removida com sucesso!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover sessão';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  // Refresh session
  const refreshSession = useCallback(async (clientId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sessionData = await clientWhatsAppISA.getSessionStatus(clientId);
      
      if (currentSession?.client_id === clientId) {
        const updatedSession: WhatsAppSession = {
          ...currentSession,
          status: sessionData.isConnected ? 'connected' : (sessionData.dbStatus?.qr_code ? 'qr_ready' : 'disconnected'),
          qr_code: sessionData.dbStatus?.qr_code,
          phone_info: sessionData.dbStatus?.phone_info,
          connection_time: sessionData.dbStatus?.connection_time,
          last_activity: sessionData.dbStatus?.last_activity
        };
        setCurrentSession(updatedSession);
      }
      
      toast.success("Sessão atualizada com sucesso!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar sessão';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  // Create new session
  const createSession = useCallback(async (clientId: string, clientName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await clientWhatsAppISA.createSession(clientId, clientName);
      
      const session: WhatsAppSession = {
        client_id: clientId,
        client_name: clientName,
        status: 'disconnected',
        stats: {
          messages_sent: 0,
          messages_received: 0,
          contacts: 0,
          response_rate: 0,
          last_24h: 0
        }
      };
      
      setCurrentSession(session);
      toast.success("Sessão criada com sucesso!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar sessão';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // CPF validation
  const validateCPF = useCallback((cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers[10])) return false;
    
    return true;
  }, []);

  // CPF formatting
  const formatCPF = useCallback((value: string): string => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }, []);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    currentSession,
    isLoading,
    error,
    connectSession,
    disconnectSession,
    deleteSession,
    refreshSession,
    createSession,
    loadSessions,
    setCurrentSession,
    validateCPF,
    formatCPF
  };
};