import { createClient } from '@supabase/supabase-js';
import localMemoryService from './backend/services/localMemoryService.js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProductSync() {
    console.log('🔧 Iniciando correção de sincronização de produtos...');

    const matricula = '758322';
    const correctUserId = '82a578cd-86ee-49ca-8b48-b45db1aa345d'; // User com produtos "isa"

    // 1. Atualizar user_id no Supabase
    console.log(`\n1️⃣  Vinculando Matrícula ${matricula} ao User ID ${correctUserId}...`);
    const { error: updateError } = await supabase
        .from('clients')
        .update({ user_id: correctUserId })
        .eq('matricula', matricula);

    if (updateError) {
        console.error('❌ Erro ao atualizar clients:', updateError);
        return;
    }
    console.log('✅ Vínculo atualizado no Supabase.');

    // 2. Limpar produtos antigos do SQLite
    console.log(`\n2️⃣  Limpando produtos incorretos do SQLite local...`);
    // O método deleteProduct requer ID, mas quero deletar todos.
    // Vou fazer um hack: listar todos e deletar um por um, ou adicionar método clearProducts.
    // Como não tenho clearProducts, vou listar e deletar.

    // NOTA: Como saveProduct faz UPSERT, se eu apenas salvar os novos, os velhos (comida) continuam lá se tiverem IDs diferentes.
    // Produtos de comida têm IDs UUID. Produtos isa têm IDs UUID. São diferentes.
    // Então PRECISO deletar os antigos.

    // Vou pegar a lista atual do SQLite
    const currentProducts = await localMemoryService.getProducts(matricula);
    console.log(`   Encontrados ${currentProducts.length} produtos no SQLite.`);

    for (const p of currentProducts) {
        await localMemoryService.deleteProduct(matricula, p.id);
        // console.log(`   🗑️  Deletado: ${p.name}`);
    }
    console.log(`✅ SQLite limpo.`);

    // 3. Buscar produtos corretos do Supabase
    console.log(`\n3️⃣  Buscando produtos corretos do User ${correctUserId}...`);
    const { data: correctProducts } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', correctUserId);

    if (!correctProducts || correctProducts.length === 0) {
        console.log('⚠️  Nenhum produto correto encontrado.');
        return;
    }

    console.log(`📥 Encontrados ${correctProducts.length} produtos (Ex: ${correctProducts[0].name})`);

    // 4. Salvar no SQLite
    console.log(`\n4️⃣  Migrando para SQLite...`);
    for (const prod of correctProducts) {
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
        await localMemoryService.saveProduct(matricula, productLocal);
        console.log(`   ✅ Migrado: [${prod.code}] ${prod.name}`);
    }

    console.log('\n🎉 Correção concluída! O Bot agora deve identificar "isa 2.7" pelo código.');
    await localMemoryService.closeAll();
}

fixProductSync();
