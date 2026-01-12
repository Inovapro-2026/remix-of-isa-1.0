import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORIA_DIR = path.resolve(__dirname, '../../memoria');

export interface AIMemoryConfig {
    identity?: {
        name?: string;
        function?: string;
        description?: string;
        greeting?: string;
        tone?: string;
    };
    behavior?: {
        tone?: string;
        custom_rules?: string;
        rules?: string;
    };
    behavior_rules?: string;
    company?: {
        name?: string;
        industry?: string;
        target_audience?: string;
        business_hours?: string;
        location?: string;
        promotions?: string;
        additional_info?: string;
        segment?: string;
        hours?: string;
        address?: string;
        policies?: string;
        mission?: string;
    };
    products?: Product[];
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    code?: string;
    category?: string;
    active: boolean;
}

export class LocalMemoryService {
    private dbCache: Map<string, Database> = new Map();

    constructor() {
        // Criar diretório de memoria se não existir
        if (!fs.existsSync(MEMORIA_DIR)) {
            fs.mkdirSync(MEMORIA_DIR, { recursive: true });
            console.log(`[LocalMemoryService] Created directory: ${MEMORIA_DIR}`);
        }
    }

    private getDbPath(matricula: string): string {
        const matriculaDir = path.join(MEMORIA_DIR, matricula);
        if (!fs.existsSync(matriculaDir)) {
            fs.mkdirSync(matriculaDir, { recursive: true });
        }
        return path.join(matriculaDir, 'memoria_ia.db');
    }

    private async getDb(matricula: string): Promise<Database> {
        // Verificar cache
        if (this.dbCache.has(matricula)) {
            return this.dbCache.get(matricula)!;
        }

        const dbPath = this.getDbPath(matricula);
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Criar tabelas conforme solicitado (client_info e products)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS client_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ai_name TEXT,
                ai_function TEXT,
                company_name TEXT,
                company_industry TEXT,
                target_audience TEXT,
                tone_of_voice TEXT,
                business_hours TEXT,
                location TEXT,
                promotions TEXT,
                additional_info TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price REAL DEFAULT 0,
                image_url TEXT,
                code TEXT,
                category TEXT,
                active BOOLEAN DEFAULT 1,
                user_id TEXT, 
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Mantendo compatibilidade com código existente se necessário, mas client_info é a principal
            CREATE TABLE IF NOT EXISTS ai_behavior_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                matricula TEXT NOT NULL,
                rules TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Adicionar ao cache
        this.dbCache.set(matricula, db);
        return db;
    }

    // --- PRODUCTS METHODS ---

    async getProducts(matricula: string): Promise<Product[]> {
        try {
            console.log(`[LocalMemoryService] Getting products for matricula: ${matricula}`);
            const db = await this.getDb(matricula);

            const products = await db.all<Product[]>(
                'SELECT * FROM products WHERE active = 1 ORDER BY name'
            );

            // Converter active (0/1) para boolean, caso necessário (sqlite retorna 0/1)
            return products.map(p => ({
                ...p,
                active: Boolean(p.active)
            }));
        } catch (error: any) {
            console.error(`[LocalMemoryService] Error getting products:`, error.message);
            return [];
        }
    }

    async saveProduct(matricula: string, product: Product): Promise<boolean> {
        try {
            console.log(`[LocalMemoryService] Saving product for matricula: ${matricula}, id: ${product.id}`);
            const db = await this.getDb(matricula);

            const existing = await db.get('SELECT id FROM products WHERE id = ?', [product.id]);

            if (existing) {
                await db.run(`
                    UPDATE products SET 
                        name = ?, description = ?, price = ?, image_url = ?, 
                        code = ?, category = ?, active = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [
                    product.name, product.description, product.price, product.image_url,
                    product.code, product.category, product.active ? 1 : 0, product.id
                ]);
            } else {
                await db.run(`
                    INSERT INTO products (
                        id, name, description, price, image_url, code, category, active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    product.id, product.name, product.description, product.price, product.image_url,
                    product.code, product.category, product.active ? 1 : 0
                ]);
            }
            return true;
        } catch (error: any) {
            console.error(`[LocalMemoryService] Error saving product:`, error.message);
            return false;
        }
    }

    async deleteProduct(matricula: string, id: string): Promise<boolean> {
        try {
            console.log(`[LocalMemoryService] Deleting product ${id} for matricula: ${matricula}`);
            const db = await this.getDb(matricula);
            await db.run('DELETE FROM products WHERE id = ?', [id]);
            return true;
        } catch (error: any) {
            console.error(`[LocalMemoryService] Error deleting product:`, error.message);
            return false;
        }
    }

    async getProductByCode(matricula: string, code: string): Promise<Product | null> {
        try {
            const db = await this.getDb(matricula);
            const product = await db.get<Product>(
                'SELECT * FROM products WHERE code = ? AND active = 1',
                [code]
            );
            if (!product) return null;
            return { ...product, active: Boolean(product.active) };
        } catch (error: any) {
            console.error(`[LocalMemoryService] Error getting product by code:`, error.message);
            return null;
        }
    }

    async searchProducts(matricula: string, query: string): Promise<Product[]> {
        try {
            const db = await this.getDb(matricula);
            const term = `%${query}%`;
            // Search in name, description, code. Limit 5 to avoid noise.
            const products = await db.all<Product[]>(
                'SELECT * FROM products WHERE (name LIKE ? OR description LIKE ? OR code LIKE ?) AND active = 1 LIMIT 5',
                [term, term, term]
            );
            return products.map(p => ({
                ...p,
                active: Boolean(p.active)
            }));
        } catch (error: any) {
            console.error(`[LocalMemoryService] Error searching products:`, error.message);
            return [];
        }
    }

    async syncProductsToAllClients(products: Product[]): Promise<void> {
        // Warning: This syncs to ALL clients. Use with caution.
        try {
            if (!fs.existsSync(MEMORIA_DIR)) return;

            const entries = fs.readdirSync(MEMORIA_DIR, { withFileTypes: true });
            const matriculas = entries
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            console.log(`[LocalMemoryService] Syncing products to ${matriculas.length} clients...`);

            for (const matricula of matriculas) {
                await this.syncProductsToClient(matricula, products);
            }
        } catch (error: any) {
            console.error(`[LocalMemoryService] Critical error in syncProductsToAllClients:`, error.message);
        }
    }

    async syncProductsToClient(matricula: string, products: Product[]): Promise<void> {
        try {
            console.log(`[LocalMemoryService] Syncing products for ${matricula}`);
            const db = await this.getDb(matricula);

            // Transaction for safety
            await db.run('BEGIN TRANSACTION');

            // Clear existing products to ensure full sync
            await db.run('DELETE FROM products');

            // Insert all new products
            const stmt = await db.prepare(`
                INSERT INTO products (
                    id, name, description, price, image_url, code, category, active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const p of products) {
                await stmt.run(
                    p.id, p.name, p.description, p.price, p.image_url,
                    p.code, p.category, p.active ? 1 : 0
                );
            }

            await stmt.finalize();
            await db.run('COMMIT');
            console.log(`[LocalMemoryService] ✅ Products synced for ${matricula}`);
        } catch (e: any) {
            console.error(`[LocalMemoryService] Error syncing for ${matricula}:`, e.message);
            // If error, try to rollback
            try {
                const db = await this.getDb(matricula);
                await db.run('ROLLBACK');
            } catch (r) { }
        }
    }

    // --- MEMORY METHODS ---

    async getBehaviorRules(matricula: string): Promise<string> {
        try {
            console.log(`[LocalMemoryService] Getting behavior rules for matricula: ${matricula}`);
            const db = await this.getDb(matricula);

            const row = await db.get(
                'SELECT rules FROM ai_behavior_rules WHERE matricula = ? ORDER BY id DESC LIMIT 1',
                [matricula]
            );

            return row?.rules || '';
        } catch (error: any) {
            console.error(`[LocalMemoryService] Error getting behavior rules:`, error.message);
            return '';
        }
    }

    async saveBehaviorRules(matricula: string, rules: string): Promise<boolean> {
        try {
            console.log(`[LocalMemoryService] Saving behavior rules for matricula: ${matricula}`);
            const db = await this.getDb(matricula);

            // Verificar se já existe
            const existing = await db.get(
                'SELECT id FROM ai_behavior_rules WHERE matricula = ?',
                [matricula]
            );

            if (existing) {
                // Atualizar
                await db.run(
                    'UPDATE ai_behavior_rules SET rules = ?, updated_at = CURRENT_TIMESTAMP WHERE matricula = ?',
                    [rules, matricula]
                );
            } else {
                // Inserir
                await db.run(
                    'INSERT INTO ai_behavior_rules (matricula, rules) VALUES (?, ?)',
                    [matricula, rules]
                );
            }

            return true;
        } catch (error: any) {
            console.error(`[LocalMemoryService] Error saving behavior rules:`, error.message);
            return false;
        }
    }

    async getMemoryConfig(matricula: string): Promise<AIMemoryConfig> {
        try {
            console.log(`[LocalMemoryService] Getting memory config (client_info) for matricula: ${matricula}`);
            const db = await this.getDb(matricula);

            const row = await db.get(
                'SELECT * FROM client_info ORDER BY id DESC LIMIT 1'
            );

            // Fetch products as well to conform to AIMemoryConfig structure if needed by consumer
            const products = await this.getProducts(matricula);

            // Map client_info to AIMemoryConfig
            return {
                identity: {
                    name: row?.ai_name || '',
                    function: row?.ai_function || '',
                    greeting: row?.greeting || '', // Ensure we support greeting
                    tone: row?.tone_of_voice || ''  // Map tone from tone_of_voice
                },
                behavior: {
                    tone: row?.tone_of_voice || '',
                    custom_rules: row?.behavior_rules || ''
                },
                company: {
                    name: row?.company_name || '',
                    industry: row?.company_industry || '',
                    target_audience: row?.target_audience || '',
                    business_hours: row?.business_hours || '',
                    location: row?.location || '',
                    promotions: row?.promotions || '',
                    additional_info: row?.additional_info || ''
                },
                products: products // Inject products into config
            };
        } catch (error: any) {
            console.error(`[LocalMemoryService] Error getting memory config:`, error.message);
            return {};
        }
    }

    async saveMemoryConfig(matricula: string, config: AIMemoryConfig): Promise<boolean> {
        try {
            console.log(`[LocalMemoryService] Saving memory config to client_info for matricula: ${matricula}`);
            const db = await this.getDb(matricula);

            // Verificar se já existe
            const existing = await db.get('SELECT id FROM client_info LIMIT 1');

            if (existing) {
                // Atualizar
                await db.run(`
                    UPDATE client_info SET 
                        ai_name = ?,
                        ai_function = ?,
                        company_name = ?,
                        company_industry = ?,
                        target_audience = ?,
                        tone_of_voice = ?,
                        business_hours = ?,
                        location = ?,
                        promotions = ?,
                        additional_info = ?,
                        greeting = ?,
                        behavior_rules = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [
                    config.identity?.name || '',
                    config.identity?.function || '',
                    config.company?.name || '',
                    config.company?.industry || config.company?.segment || '',
                    config.company?.target_audience || '',
                    config.behavior?.tone || config.identity?.tone || '',
                    config.company?.business_hours || config.company?.hours || '',
                    config.company?.location || config.company?.address || '',
                    config.company?.promotions || '',
                    config.company?.additional_info || config.company?.policies || '',
                    config.identity?.greeting || '',
                    config.behavior?.rules || config.behavior_rules || '',
                    existing.id
                ]);
            } else {
                // Inserir
                await db.run(`
                    INSERT INTO client_info (
                        ai_name, ai_function, company_name, company_industry,
                        target_audience, tone_of_voice, business_hours, location,
                        promotions, additional_info
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    config.identity?.name || '',
                    config.identity?.function || '',
                    config.company?.name || '',
                    config.company?.industry || '',
                    config.company?.target_audience || '',
                    config.behavior?.tone || '',
                    config.company?.business_hours || '',
                    config.company?.location || '',
                    config.company?.promotions || '',
                    config.company?.additional_info || ''
                ]);
            }

            return true;
        } catch (error: any) {
            console.error(`[LocalMemoryService] Error saving memory config:`, error.message);
            return false;
        }
    }

    async closeAll(): Promise<void> {
        for (const [matricula, db] of this.dbCache.entries()) {
            await db.close();
            console.log(`[LocalMemoryService] Closed database for matricula: ${matricula}`);
        }
        this.dbCache.clear();
    }
}

export default new LocalMemoryService();
