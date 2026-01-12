import { createClient } from '@supabase/supabase-js';
import localMemoryService from './backend/services/localMemoryService.js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateProducts() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  MIGRAÇÃO DE PRODUTOS: Supabase → SQLite Local');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        const sourceUserId = '810f7a82-1bd7-4999-86a1-ddb4194b7254'; // ID com os produtos reais
        const matriculas = ['758322', '666058'];

        console.log(`🔍 User ID Fonte: ${sourceUserId}`);

        // 1. Buscar produtos do Supabase (uma única vez)
        const { data: products } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', sourceUserId);

        if (!products || products.length === 0) {
            console.log(`⚠️  Nenhum produto encontrado no Supabase.`);
            return;
        }

        console.log(`📥 Encontrados ${products.length} produtos para migrar.\n`);

        for (const matricula of matriculas) {
            console.log(`\n📦 Migrando para Matrícula: ${matricula}`);

            // 2. Salvar no SQLite Local
            let successCount = 0;
            for (const prod of products) {
                const productLocal = {
                    id: prod.id,
                    name: prod.name,
                    description: prod.description || '',
                    price: prod.price || 0,
                    image_url: prod.image_url || '',
                    code: prod.code || '',
                    category: prod.category || '',
                    active: prod.active ?? true
                };

                const saved = await localMemoryService.saveProduct(matricula, productLocal);
                if (saved) {
                    // console.log(`      ✅ Produto migrado: ${prod.name}`); // Reduzir log
                    successCount++;
                } else {
                    console.log(`      ❌ Falha ao migrar: ${prod.name}`);
                }
            }
            console.log(`   ✅ ${successCount}/${products.length} produtos salvos em /contas/${matricula}/memoria_ia.db`);
        }

    } catch (error) {
        console.error('❌ Erro durante migração:', error);
    } finally {
        await localMemoryService.closeAll();
    }
}

migrateProducts();
