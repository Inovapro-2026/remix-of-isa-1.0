export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_requests: {
        Row: {
          birth_date: string | null
          company_name: string | null
          cpf: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          matricula: string | null
          message: string | null
          phone: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          segmento: string | null
          status: Database["public"]["Enums"]["request_status"] | null
        }
        Insert: {
          birth_date?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          matricula?: string | null
          message?: string | null
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          segmento?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
        }
        Update: {
          birth_date?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          matricula?: string | null
          message?: string | null
          phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          segmento?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          matricula: string
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          matricula: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          matricula?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_behavior_rules: {
        Row: {
          created_at: string
          id: string
          matricula: string | null
          rules: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          matricula?: string | null
          rules?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          matricula?: string | null
          rules?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_configs: {
        Row: {
          ai_name: string | null
          allowed_emojis: string[] | null
          business_hours: Json | null
          created_at: string | null
          faqs: Json | null
          formality_level: number | null
          id: string
          knowledge_base: Json | null
          tone: string | null
          triggers: Json | null
          updated_at: string | null
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          ai_name?: string | null
          allowed_emojis?: string[] | null
          business_hours?: Json | null
          created_at?: string | null
          faqs?: Json | null
          formality_level?: number | null
          id?: string
          knowledge_base?: Json | null
          tone?: string | null
          triggers?: Json | null
          updated_at?: string | null
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          ai_name?: string | null
          allowed_emojis?: string[] | null
          business_hours?: Json | null
          created_at?: string | null
          faqs?: Json | null
          formality_level?: number | null
          id?: string
          knowledge_base?: Json | null
          tone?: string | null
          triggers?: Json | null
          updated_at?: string | null
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string | null
          created_by: string
          id: string
          priority: Database["public"]["Enums"]["announcement_priority"] | null
          scheduled_at: string | null
          sent_at: string | null
          target_all: boolean | null
          target_plans: string[] | null
          target_users: string[] | null
          title: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          priority?: Database["public"]["Enums"]["announcement_priority"] | null
          scheduled_at?: string | null
          sent_at?: string | null
          target_all?: boolean | null
          target_plans?: string[] | null
          target_users?: string[] | null
          title: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          priority?: Database["public"]["Enums"]["announcement_priority"] | null
          scheduled_at?: string | null
          sent_at?: string | null
          target_all?: boolean | null
          target_plans?: string[] | null
          target_users?: string[] | null
          title?: string
        }
        Relationships: []
      }
      antifraud_logs: {
        Row: {
          created_at: string
          customer_phone: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          is_blocked: boolean | null
          seller_id: string | null
        }
        Insert: {
          created_at?: string
          customer_phone?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          seller_id?: string | null
        }
        Update: {
          created_at?: string
          customer_phone?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          seller_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_ai_memory: {
        Row: {
          config: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          birth_date: string | null
          company_name: string | null
          cpf: string
          created_at: string | null
          data_ultima_renovacao: string | null
          email: string
          expiration_date: string | null
          full_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          matricula: string
          observations: string | null
          phone: string | null
          plan: string | null
          segmento: string | null
          start_date: string | null
          status: string | null
          trial_days: number | null
          updated_at: string | null
          user_id: string | null
          vitrine_id: string | null
        }
        Insert: {
          birth_date?: string | null
          company_name?: string | null
          cpf: string
          created_at?: string | null
          data_ultima_renovacao?: string | null
          email: string
          expiration_date?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          matricula: string
          observations?: string | null
          phone?: string | null
          plan?: string | null
          segmento?: string | null
          start_date?: string | null
          status?: string | null
          trial_days?: number | null
          updated_at?: string | null
          user_id?: string | null
          vitrine_id?: string | null
        }
        Update: {
          birth_date?: string | null
          company_name?: string | null
          cpf?: string
          created_at?: string | null
          data_ultima_renovacao?: string | null
          email?: string
          expiration_date?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          matricula?: string
          observations?: string | null
          phone?: string | null
          plan?: string | null
          segmento?: string | null
          start_date?: string | null
          status?: string | null
          trial_days?: number | null
          updated_at?: string | null
          user_id?: string | null
          vitrine_id?: string | null
        }
        Relationships: []
      }
      company_knowledge: {
        Row: {
          address: string | null
          created_at: string
          hours: string | null
          id: string
          mission: string | null
          name: string | null
          payment: string | null
          policies: string | null
          schedule_config: Json | null
          segment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          mission?: string | null
          name?: string | null
          payment?: string | null
          policies?: string | null
          schedule_config?: Json | null
          segment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          mission?: string | null
          name?: string | null
          payment?: string | null
          policies?: string | null
          schedule_config?: Json | null
          segment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          mp_payment_id: string | null
          payload: Json | null
          payment_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          mp_payment_id?: string | null
          payload?: Json | null
          payment_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          mp_payment_id?: string | null
          payload?: Json | null
          payment_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      plan_renewals: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          matricula: string
          receipt_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          client_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          matricula: string
          receipt_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          matricula?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_renewals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_commissions: {
        Row: {
          amount: number
          commission_type: string
          created_at: string
          id: string
          percentage: number | null
          sale_id: string | null
          withdrawal_id: string | null
        }
        Insert: {
          amount: number
          commission_type: string
          created_at?: string
          id?: string
          percentage?: number | null
          sale_id?: string | null
          withdrawal_id?: string | null
        }
        Update: {
          amount?: number
          commission_type?: string
          created_at?: string
          id?: string
          percentage?: number | null
          sale_id?: string | null
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string
          id: string
          is_verified_purchase: boolean | null
          is_visible: boolean | null
          product_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          product_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          code: string | null
          cpf: string | null
          created_at: string
          delivery_content: string | null
          delivery_file_url: string | null
          delivery_type: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          matricula: string | null
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          code?: string | null
          cpf?: string | null
          created_at?: string
          delivery_content?: string | null
          delivery_file_url?: string | null
          delivery_type?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          matricula?: string | null
          name: string
          price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          code?: string | null
          cpf?: string | null
          created_at?: string
          delivery_content?: string | null
          delivery_file_url?: string | null
          delivery_type?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          matricula?: string | null
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          company_name: string | null
          cpf: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          matricula: string | null
          phone: string | null
          plan: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          matricula?: string | null
          phone?: string | null
          plan?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          matricula?: string | null
          phone?: string | null
          plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string
          delivery_sent_at: string | null
          delivery_status: string | null
          expires_at: string | null
          id: string
          items: Json
          mp_payment_id: string | null
          mp_preference_id: string | null
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          pix_copy_paste: string | null
          pix_qr_code: string | null
          pix_qr_code_base64: string | null
          platform_fee: number
          seller_amount: number
          seller_id: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          delivery_sent_at?: string | null
          delivery_status?: string | null
          expires_at?: string | null
          id?: string
          items?: Json
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          platform_fee?: number
          seller_amount?: number
          seller_id: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          delivery_sent_at?: string | null
          delivery_status?: string | null
          expires_at?: string | null
          id?: string
          items?: Json
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          platform_fee?: number
          seller_amount?: number
          seller_id?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      seller_balances: {
        Row: {
          available_balance: number
          created_at: string
          id: string
          pending_balance: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_pix_info: {
        Row: {
          created_at: string
          holder_document: string | null
          holder_name: string
          id: string
          is_verified: boolean | null
          pix_key: string
          pix_key_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          holder_document?: string | null
          holder_name: string
          id?: string
          is_verified?: boolean | null
          pix_key: string
          pix_key_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          holder_document?: string | null
          holder_name?: string
          id?: string
          is_verified?: boolean | null
          pix_key?: string
          pix_key_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          is_system_message: boolean | null
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_system_message?: boolean | null
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_system_message?: boolean | null
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_admin_id: string | null
          category: string | null
          created_at: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_admin_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_admin_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_mappings: {
        Row: {
          cpf: string
          user_id: string
        }
        Insert: {
          cpf: string
          user_id: string
        }
        Update: {
          cpf?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vitrine_visits: {
        Row: {
          id: string
          referrer: string | null
          seller_id: string | null
          session_id: string | null
          user_agent: string | null
          visited_at: string
          visitor_ip: string | null
          vitrine_id: string
        }
        Insert: {
          id?: string
          referrer?: string | null
          seller_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          visited_at?: string
          visitor_ip?: string | null
          vitrine_id: string
        }
        Update: {
          id?: string
          referrer?: string | null
          seller_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          visited_at?: string
          visitor_ip?: string | null
          vitrine_id?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string
          is_online: boolean | null
          last_seen_at: string | null
          name: string | null
          phone_number: string
          profile_pic_url: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_id: string
          is_online?: boolean | null
          last_seen_at?: string | null
          name?: string | null
          phone_number: string
          profile_pic_url?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          name?: string | null
          phone_number?: string
          profile_pic_url?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversation_memory: {
        Row: {
          context: Json | null
          conversation_history: Json | null
          created_at: string
          customer_name: string | null
          first_contact_at: string | null
          id: string
          instance_id: string
          last_message_at: string | null
          phone_number: string
          updated_at: string
        }
        Insert: {
          context?: Json | null
          conversation_history?: Json | null
          created_at?: string
          customer_name?: string | null
          first_contact_at?: string | null
          id?: string
          instance_id: string
          last_message_at?: string | null
          phone_number: string
          updated_at?: string
        }
        Update: {
          context?: Json | null
          conversation_history?: Json | null
          created_at?: string
          customer_name?: string | null
          first_contact_at?: string | null
          id?: string
          instance_id?: string
          last_message_at?: string | null
          phone_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversation_memory_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string | null
          id: string
          instance_name: string
          is_ai_active: boolean | null
          last_connected_at: string | null
          phone_number: string | null
          qr_code: string | null
          session_data: Json | null
          status: Database["public"]["Enums"]["whatsapp_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_name: string
          is_ai_active?: boolean | null
          last_connected_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: Database["public"]["Enums"]["whatsapp_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_name?: string
          is_ai_active?: boolean | null
          last_connected_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: Database["public"]["Enums"]["whatsapp_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          contact_id: string
          content: string | null
          created_at: string | null
          id: string
          instance_id: string
          is_ai_response: boolean | null
          is_from_me: boolean | null
          media_type: string | null
          media_url: string | null
          status: string | null
          timestamp: string | null
        }
        Insert: {
          contact_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          instance_id: string
          is_ai_response?: boolean | null
          is_from_me?: boolean | null
          media_type?: string | null
          media_url?: string | null
          status?: string | null
          timestamp?: string | null
        }
        Update: {
          contact_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string
          is_ai_response?: boolean | null
          is_from_me?: boolean | null
          media_type?: string | null
          media_url?: string | null
          status?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_shopping_cart: {
        Row: {
          created_at: string
          customer_name: string | null
          id: string
          instance_id: string
          items: Json
          phone_number: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          id?: string
          instance_id: string
          items?: Json
          phone_number: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          id?: string
          instance_id?: string
          items?: Json
          phone_number?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_shopping_cart_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          mp_transfer_id: string | null
          pix_key: string
          pix_key_type: string
          processed_at: string | null
          processed_by: string | null
          receipt_url: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          mp_transfer_id?: string | null
          pix_key: string
          pix_key_type?: string
          processed_at?: string | null
          processed_by?: string | null
          receipt_url?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          mp_transfer_id?: string | null
          pix_key?: string
          pix_key_type?: string
          processed_at?: string | null
          processed_by?: string | null
          receipt_url?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_matricula: { Args: never; Returns: string }
      generate_vitrine_id: { Args: never; Returns: string }
      get_public_vitrine: { Args: { identifier: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      announcement_priority: "normal" | "important" | "urgent"
      app_role: "super_admin" | "admin" | "client"
      request_status: "pending" | "approved" | "rejected"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      whatsapp_status: "disconnected" | "connecting" | "connected" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      announcement_priority: ["normal", "important", "urgent"],
      app_role: ["super_admin", "admin", "client"],
      request_status: ["pending", "approved", "rejected"],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      whatsapp_status: ["disconnected", "connecting", "connected", "error"],
    },
  },
} as const
