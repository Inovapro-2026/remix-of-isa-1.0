import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);
const MATRICULA = '666058';
const VITRINE_UUID = '810f7a82-1bd7-4999-86a1-ddb4194b7254';

async function syncProducts() {
    console.log('=== SINCRONIZAÇÃO MANUAL - MATRÍCULA 666058 ===\n');

    // 1. Buscar produtos pelo UUID da vitrine
    console.log(`🔍 Buscando produtos para user_id: ${VITRINE_UUID}...\n`);

    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', VITRINE_UUID)
        .eq('is_active', true);

    if (productsError) {
        console.error('❌ Erro ao buscar produtos:', productsError.message);
        return;
    }

    if (!products || products.length === 0) {
        console.log('❌ Nenhum produto encontrado.');
        return;
    }

    console.log(`✅ ${products.length} produtos encontrados no Supabase:\n`);
    products.slice(0, 3).forEach(p => {
        console.log(`   - ${p.name} (${p.code || 'S/C'}) - R$ ${p.price}`);
    });
    if (products.length > 3) {
        console.log(`   ... e mais ${products.length - 3} produtos\n`);
    }

    // 2. Criar pasta e banco SQLite
    const memoriaDir = path.resolve(`/root/INOVAPRO/isa-1.0-de9193c7/memoria/${MATRICULA}`);
    const dbPath = path.join(memoriaDir, 'memoria_ia.db');

    if (!fs.existsSync(memoriaDir)) {
        fs.mkdirSync(memoriaDir, { recursive: true });
        console.log(`✅ Pasta criada: ${memoriaDir}`);
    }

    // 3. Criar/abrir banco SQLite
    const db = new Database(dbPath);

    // Criar tabelas
    db.exec(`
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
            greeting TEXT,
            behavior_rules TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log(`✅ Banco SQLite criado/aberto: ${dbPath}\n`);

    // 4. Limpar produtos existentes e inserir novos
    db.prepare('DELETE FROM products').run();

    const insertStmt = db.prepare(`
        INSERT INTO products (id, name, description, price, image_url, code, category, active, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((products) => {
        for (const p of products) {
            insertStmt.run(
                p.id,
                p.name,
                p.description || '',
                p.price,
                p.image_url || null,
                p.code || null,
                p.category || null,
                1,
                VITRINE_UUID
            );
        }
    });

    insertMany(products);

    console.log(`✅ ${products.length} produtos inseridos no SQLite!\n`);

    // 5. Verificar
    const count = db.prepare('SELECT COUNT(*) as total FROM products WHERE active = 1').get();
    console.log(`📊 Total de produtos ativos no SQLite: ${count.total}\n`);

    const sampleProducts = db.prepare('SELECT name, code, price, category FROM products WHERE active = 1 LIMIT 3').all();
    console.log('📦 Amostra de produtos no banco:');
    sampleProducts.forEach(p => {
        console.log(`   - ${p.name} (${p.code || 'S/C'}) - R$ ${p.price} [${p.category || 'Sem categoria'}]`);
    });

    db.close();

    console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log(`\n✅ Agora o WhatsApp pode acessar os produtos da matrícula ${MATRICULA}`);
}

syncProducts().catch(console.error);
