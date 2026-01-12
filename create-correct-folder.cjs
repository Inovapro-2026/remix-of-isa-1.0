const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

// TELEFONE CORRETO da matrícula 666058
const TELEFONE = '11937728973';
const USER_ID = '810f7a82-1bd7-4999-86a1-ddb4194b7254';

async function createCorrectFolder() {
    console.log('=== CRIANDO PASTA CORRETA PARA MATRÍCULA 666058 ===\n');
    console.log(`📱 Telefone correto: ${TELEFONE}`);
    console.log(`🆔 User ID: ${USER_ID}\n`);

    // 1. Criar pasta com o telefone correto
    const memoriaDir = path.resolve(`/root/INOVAPRO/isa-1.0-de9193c7/memoria/${TELEFONE}`);
    if (!fs.existsSync(memoriaDir)) {
        fs.mkdirSync(memoriaDir, { recursive: true });
        console.log(`✅ Pasta criada: ${memoriaDir}`);
    } else {
        console.log(`ℹ️  Pasta já existe: ${memoriaDir}`);
    }

    // 2. Buscar produtos
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('is_active', true);

    if (error) {
        console.error('❌ Erro ao buscar produtos:', error.message);
        return;
    }

    console.log(`\n📦 Produtos encontrados: ${products?.length || 0}`);

    if (!products || products.length === 0) {
        console.log('❌ Nenhum produto para sincronizar.');
        return;
    }

    // 3. Criar banco SQLite
    const dbPath = path.join(memoriaDir, 'memoria_ia.db');
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
        
        CREATE TABLE IF NOT EXISTS ai_behavior_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            matricula TEXT NOT NULL,
            rules TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log(`✅ Banco SQLite criado: ${dbPath}\n`);

    // 4. Inserir produtos
    db.prepare('DELETE FROM products').run();

    const insert = db.prepare(`
        INSERT INTO products (id, name, description, price, image_url, code, category, active, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((prods) => {
        for (const p of prods) {
            insert.run(
                p.id,
                p.name,
                p.description || '',
                p.price,
                p.image_url || null,
                p.code || null,
                p.category || null,
                1,
                USER_ID
            );
        }
    });

    insertMany(products);

    console.log(`✅ ${products.length} produtos inseridos!\n`);

    // 5. Verificar
    const count = db.prepare('SELECT COUNT(*) as total FROM products WHERE active = 1').get();
    console.log(`📊 Total de produtos no SQLite: ${count.total}\n`);

    const samples = db.prepare('SELECT name, code, price, category FROM products LIMIT 5').all();
    console.log('📦 Primeiros 5 produtos:');
    samples.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} (${p.code || 'S/C'}) - R$ ${p.price.toFixed(2)} [${p.category || 'Sem categoria'}]`);
    });

    db.close();

    console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA!');
    console.log(`\n📱 Telefone do WhatsApp: ${TELEFONE}`);
    console.log(`🔗 Link da vitrine: https://isa.inovapro.cloud/vitrine/${USER_ID}`);
    console.log(`\n✅ Agora conecte o WhatsApp com o número ${TELEFONE} e teste!`);
}

createCorrectFolder().catch(console.error);
