import { createClient } from '@supabase/supabase-js';
import localMemoryService from './localMemoryService.js';

// Use hardcoded values since VITE_* env vars don't work in backend
const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface SupabaseProduct {
    id: string;
    user_id: string;
    name: string;
    price: number;
    description: string | null;
    image_url: string | null;
    category: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    cpf?: string;
    code?: string | null;
}

export interface AIMemoryConfig {
    identity?: {
        name?: string;
        description?: string;
        greeting?: string;
        farewell?: string;
        tone?: string;
        function?: string;
    };
    behavior?: {
        tone?: string;
        custom_rules?: string;
        rules?: string;
    };
    products?: SupabaseProduct[];
    vitrine_link?: string;
    behavior_rules?: string;
    company?: {
        name?: string;
        segment?: string;
        industry?: string;
        mission?: string;
        target_audience?: string;
        business_hours?: string;
        hours?: string;
        location?: string;
        address?: string;
        payment?: string;
        promotions?: string;
        policies?: string;
        additional_info?: string;
    };
}

export class SupabaseProductService {
    async getProductsByMatricula(matricula: string): Promise<SupabaseProduct[]> {
        try {
            console.log(`[SupabaseProductService] Getting products by matricula: ${matricula}`);

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('matricula', matricula)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[SupabaseProductService] Error fetching products by matricula:', error);
                return [];
            }

            console.log(`[SupabaseProductService] Found ${data?.length || 0} products for matricula ${matricula}`);
            return data || [];
        } catch (error) {
            console.error('[SupabaseProductService] Exception:', error);
            return [];
        }
    }

    async getProductsByUserId(userId: string): Promise<SupabaseProduct[]> {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[SupabaseProductService] Error fetching products by UserID:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[SupabaseProductService] Exception:', error);
            return [];
        }
    }

    async getProductsByCpf(identifier: string): Promise<SupabaseProduct[]> {
        try {
            console.log(`[SupabaseProductService] Resolving identifier: ${identifier}`);
            const cleanIdentifier = identifier.replace(/\D/g, '');

            // Strategy 1: Find client by CPF/phone/matricula to get user_id
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('user_id, cpf, phone, matricula')
                .or(`phone.eq.${cleanIdentifier},cpf.eq.${cleanIdentifier},matricula.eq.${cleanIdentifier}`)
                .maybeSingle();

            if (clientData && clientData.user_id) {
                console.log(`[SupabaseProductService] Resolved identifier ${identifier} to user_id ${clientData.user_id}`);
                return await this.getProductsByUserId(clientData.user_id);
            }

            if (clientError) {
                console.warn(`[SupabaseProductService] Warning checking clients table: ${clientError.message}`);
            }

            // Strategy 2: Try to find products directly by cpf column
            console.log(`[SupabaseProductService] Searching products directly by cpf=${cleanIdentifier}`);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('cpf', cleanIdentifier)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[SupabaseProductService] Error fetching products by CPF:', error.message);
                return [];
            }

            return data || [];
        } catch (error: any) {
            console.error('[SupabaseProductService] Exception:', error.message);
            return [];
        }
    }

    async addProduct(cpf: string, product: Partial<SupabaseProduct>): Promise<SupabaseProduct | null> {
        try {
            const cleanCpf = cpf.replace(/\D/g, '');

            // Find user_id by cpf
            const { data: clientData } = await supabase
                .from('clients')
                .select('user_id')
                .eq('cpf', cleanCpf)
                .maybeSingle();

            if (!clientData?.user_id) {
                console.error('[SupabaseProductService] Cannot add product - user_id not found for cpf:', cpf);
                return null;
            }

            const { data, error } = await supabase
                .from('products')
                .insert({
                    user_id: clientData.user_id,
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    image_url: product.image_url,
                    category: product.category,
                    cpf: cleanCpf,
                    is_active: true
                })
                .select()
                .single();

            if (error) {
                console.error('[SupabaseProductService] Error adding product:', error);
                return null;
            }

            return data;
        } catch (error: any) {
            console.error('[SupabaseProductService] Exception adding product:', error.message);
            return null;
        }
    }

    async updateProduct(id: string, product: Partial<SupabaseProduct>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('products')
                .update({
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    image_url: product.image_url,
                    category: product.category,
                    is_active: product.is_active
                })
                .eq('id', id);

            if (error) {
                console.error('[SupabaseProductService] Error updating product:', error);
                return false;
            }

            return true;
        } catch (error: any) {
            console.error('[SupabaseProductService] Exception updating product:', error.message);
            return false;
        }
    }

    async deleteProduct(id: string): Promise<boolean> {
        try {
            // Soft delete by setting is_active = false
            const { error } = await supabase
                .from('products')
                .update({ is_active: false })
                .eq('id', id);

            if (error) {
                console.error('[SupabaseProductService] Error deleting product:', error);
                return false;
            }

            return true;
        } catch (error: any) {
            console.error('[SupabaseProductService] Exception deleting product:', error.message);
            return false;
        }
    }

    async getProductByCode(code: string): Promise<SupabaseProduct | null> {
        try {
            console.log(`[SupabaseProductService] Searching product by code: ${code}`);

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('code', code)
                .eq('is_active', true)
                .maybeSingle();

            if (error) {
                console.error('[SupabaseProductService] Error fetching product by code:', error.message);
                return null;
            }

            if (data) {
                console.log(`[SupabaseProductService] ✅ Found product: ${data.name}`);
            } else {
                console.log(`[SupabaseProductService] ⚠️ No product found with code: ${code}`);
            }

            return data;
        } catch (error: any) {
            console.error('[SupabaseProductService] Exception getting product by code:', error.message);
            return null;
        }
    }

    // Memory/AI Config methods
    async getMemory(identifier: string): Promise<AIMemoryConfig> {
        try {
            const cleanIdentifier = identifier.replace(/\D/g, '');
            console.log(`[SupabaseProductService] Getting memory for identifier: ${cleanIdentifier}`);

            // Strategy 1: Find user_id by matricula first (most reliable)
            let clientData = null;
            
            const { data: byMatricula } = await supabase
                .from('clients')
                .select('user_id, matricula')
                .eq('matricula', cleanIdentifier)
                .not('user_id', 'is', null)
                .maybeSingle();
            
            if (byMatricula?.user_id) {
                console.log(`[SupabaseProductService] Found by matricula: ${cleanIdentifier} -> user_id: ${byMatricula.user_id}`);
                clientData = byMatricula;
            }

            // Strategy 2: Find by phone
            if (!clientData) {
                const { data: byPhone } = await supabase
                    .from('clients')
                    .select('user_id, matricula')
                    .eq('phone', cleanIdentifier)
                    .not('user_id', 'is', null)
                    .maybeSingle();
                
                if (byPhone?.user_id) {
                    console.log(`[SupabaseProductService] Found by phone: ${cleanIdentifier} -> user_id: ${byPhone.user_id}`);
                    clientData = byPhone;
                }
            }

            // Strategy 3: Find by CPF
            if (!clientData) {
                const { data: byCpf } = await supabase
                    .from('clients')
                    .select('user_id, matricula')
                    .eq('cpf', cleanIdentifier)
                    .not('user_id', 'is', null)
                    .maybeSingle();
                
                if (byCpf?.user_id) {
                    console.log(`[SupabaseProductService] Found by cpf: ${cleanIdentifier} -> user_id: ${byCpf.user_id}`);
                    clientData = byCpf;
                }
            }

            // Strategy 4: Find by instance_name in whatsapp_instances
            if (!clientData) {
                console.log(`[SupabaseProductService] Trying to find by whatsapp instance_name: ${cleanIdentifier}`);
                const { data: instance } = await supabase
                    .from('whatsapp_instances')
                    .select('user_id')
                    .eq('instance_name', cleanIdentifier)
                    .not('user_id', 'is', null)
                    .maybeSingle();
                
                if (instance?.user_id) {
                    // Get matricula from clients table using user_id
                    const { data: clientByUserId } = await supabase
                        .from('clients')
                        .select('user_id, matricula')
                        .eq('user_id', instance.user_id)
                        .maybeSingle();
                    
                    if (clientByUserId) {
                        console.log(`[SupabaseProductService] Found by instance -> user_id: ${instance.user_id}, matricula: ${clientByUserId.matricula}`);
                        clientData = clientByUserId;
                    }
                }
            }

            if (!clientData?.user_id) {
                console.warn(`[SupabaseProductService] No user found with valid user_id for identifier: ${cleanIdentifier}`);
                return {};
            }

            const userId = clientData.user_id;
            const matricula = clientData.matricula;

            console.log(`[SupabaseProductService] Fetching memory and rules for user_id: ${userId}, matricula: ${matricula}`);
            
            // Get AI memory config
            const { data: memoryData, error: memoryError } = await supabase
                .from('client_ai_memory')
                .select('config')
                .eq('user_id', userId)
                .maybeSingle();

            if (memoryError) {
                console.error('[SupabaseProductService] Error fetching memory:', memoryError);
            }

            const config = memoryData?.config || {};

            // Get Behavior Rules by user_id first
            let { data: rulesData } = await supabase
                .from('ai_behavior_rules')
                .select('rules')
                .eq('user_id', userId)
                .maybeSingle();

            // If no rules found by user_id, try by matricula
            if (!rulesData?.rules && matricula) {
                console.log(`[SupabaseProductService] No rules found by user_id, trying matricula: ${matricula}`);
                const { data: rulesByMatricula } = await supabase
                    .from('ai_behavior_rules')
                    .select('rules')
                    .eq('matricula', matricula)
                    .maybeSingle();
                rulesData = rulesByMatricula;
            }

            // Get products by matricula first, fallback to user_id
            let products = [];
            if (matricula) {
                products = await this.getProductsByMatricula(matricula);
                console.log(`[SupabaseProductService] Found ${products.length} products by matricula ${matricula}`);
            }
            
            if (products.length === 0) {
                products = await this.getProductsByUserId(userId);
                console.log(`[SupabaseProductService] Found ${products.length} products by user_id ${userId}`);
            }

            // Construct Vitrine Link using matricula
            const vitrineLink = matricula 
                ? `https://isa.inovapro.cloud/vitrine/${matricula}`
                : `https://isa.inovapro.cloud/vitrine/${cleanIdentifier}`;

            return {
                identity: config.identity || {},
                behavior: config.behavior || {},
                company: config.company || {},
                products,
                vitrine_link: vitrineLink,
                behavior_rules: rulesData?.rules || ''
            };
        } catch (error: any) {
            console.error('[SupabaseProductService] Exception getting memory:', error.message);
            return {};
        }
    }

    async saveMemory(cpf: string, config: AIMemoryConfig): Promise<boolean> {
        try {
            const cleanCpf = cpf.replace(/\D/g, '');
            console.log(`[SupabaseProductService] Saving memory for cpf: ${cleanCpf}`);

            // Find user_id by cpf
            const { data: clientData } = await supabase
                .from('clients')
                .select('user_id')
                .eq('cpf', cleanCpf)
                .maybeSingle();

            if (!clientData?.user_id) {
                console.error('[SupabaseProductService] Cannot save memory - user_id not found for cpf:', cpf);
                return false;
            }

            // Remove products from config before saving (they're stored separately)
            const { products, ...configWithoutProducts } = config;

            const { error } = await supabase
                .from('client_ai_memory')
                .upsert({
                    user_id: clientData.user_id,
                    config: configWithoutProducts,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) {
                console.error('[SupabaseProductService] Error saving memory:', error);
                return false;
            }

            return true;
        } catch (error: any) {
            console.error('[SupabaseProductService] Exception saving memory:', error.message);
            return false;
        }
    }
}

export default new SupabaseProductService();
