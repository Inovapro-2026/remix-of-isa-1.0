import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface WhatsAppStore {
  activeCpf: string | null;
  connectionStatus: { [cpf: string]: 'connected' | 'disconnected' | 'qr_ready' | 'connecting' | 'error' };
  sessions: WhatsAppSession[];
  currentSession: WhatsAppSession | null;
  
  // Actions
  setActiveCpf: (cpf: string | null) => void;
  setConnectionStatus: (cpf: string, status: 'connected' | 'disconnected' | 'qr_ready' | 'connecting' | 'error') => void;
  addSession: (session: WhatsAppSession) => void;
  updateSession: (clientId: string, updates: Partial<WhatsAppSession>) => void;
  removeSession: (clientId: string) => void;
  setCurrentSession: (session: WhatsAppSession | null) => void;
  clearAllSessions: () => void;
}

export const useWhatsAppStore = create<WhatsAppStore>()(
  persist(
    (set, get) => ({
      activeCpf: null,
      connectionStatus: {},
      sessions: [],
      currentSession: null,

      setActiveCpf: (cpf) => {
        set({ activeCpf: cpf });
      },

      setConnectionStatus: (cpf, status) => {
        set((state) => ({
          connectionStatus: {
            ...state.connectionStatus,
            [cpf]: status
          }
        }));
      },

      addSession: (session) => {
        set((state) => ({
          sessions: [...state.sessions, session]
        }));
      },

      updateSession: (clientId, updates) => {
        set((state) => ({
          sessions: state.sessions.map(session =>
            session.client_id === clientId
              ? { ...session, ...updates }
              : session
          ),
          currentSession: state.currentSession?.client_id === clientId
            ? { ...state.currentSession, ...updates }
            : state.currentSession
        }));
      },

      removeSession: (clientId) => {
        set((state) => ({
          sessions: state.sessions.filter(session => session.client_id !== clientId),
          connectionStatus: Object.fromEntries(
            Object.entries(state.connectionStatus).filter(([cpf]) => cpf !== clientId)
          ),
          currentSession: state.currentSession?.client_id === clientId ? null : state.currentSession,
          activeCpf: state.activeCpf === clientId ? null : state.activeCpf
        }));
      },

      setCurrentSession: (session) => {
        set({ currentSession: session });
      },

      clearAllSessions: () => {
        set({
          activeCpf: null,
          connectionStatus: {},
          sessions: [],
          currentSession: null
        });
      }
    }),
    {
      name: 'whatsapp-store',
      partialize: (state) => ({
        activeCpf: state.activeCpf,
        connectionStatus: state.connectionStatus,
        sessions: state.sessions
      })
    }
  )
);