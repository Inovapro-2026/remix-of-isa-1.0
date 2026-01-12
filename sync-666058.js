import { createClient } from '@supabase/supabase-js';
import localMemoryService from './backend/services/localMemoryService.js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncMatricula666058() {
    console.log('=== SINCRONIZANDO MATRÍCULA 666058 ===\n');

    // 1. Buscar cliente e user_id
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('matricula', '666058')
        .maybeSingle();

    if (clientError || !client) {
        console.error('❌ Erro ao buscar cliente:', clientError?.message);
        return;
    }

    console.log(`✅ Cliente encontrado: ${client.cpf}`);
    console.log(`   User ID: ${client.user_id || 'NULL'}\n`);

    if (!client.user_id) {
        console.log('⚠️ User ID está NULL. Buscando pelo UUID da vitrine...\n');

        // Tentar encontrar user_id pelo link da vitrine
        const vitrineUuid = '810f7a82-1bd7-4999-86a1-ddb4194b7254';

        const { data: userByUuid } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', vitrineUuid)
            .maybeSingle();

        if (userByUuid) {
            console.log(`✅ Encontrado user_id pela vitrine: ${userByUuid.id}`);

            // Atualizar o cliente com o user_id correto
            const { error: updateError } = await supabase
                .from('clients')
                .update({ user_id: userByUuid.id })
                .eq('matricula', '666058');

            if (updateError) {
                console.error('❌ Erro ao atualizar user_id:', updateError.message);
                return;
            }

            client.user_id = userByUuid.id;
            console.log('✅ User ID atualizado no cliente!\n');
        }
    }

    if (!client.user_id) {
        console.error('❌ Não foi possível determinar o user_id. Abortando.');
        return;
    }

    // 2. Buscar produtos do Supabase
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', client.user_id)
        .eq('is_active', true);

    if (productsError) {
        console.error('❌ Erro ao buscar produtos:', productsError.message);
        return;
    }

    console.log(`📦 Produtos encontrados no Supabase: ${products?.length || 0}\n`);

    if (!products || products.length === 0) {
        console.log('❌ Nenhum produto para sincronizar.');
        return;
    }

    // 3. Mapear produtos para o formato do SQLite
    const mappedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: p.price,
        image_url: p.image_url || undefined,
        code: p.code || undefined,
        category: p.category || undefined,
        active: p.is_active
    }));

    // 4. Sincronizar para o SQLite local
    console.log(`🔄 Sincronizando ${mappedProducts.length} produtos para /memoria/${client.matricula}/...\n`);

    try {
        await localMemoryService.syncProductsToClient(client.matricula, mappedProducts);
        console.log('✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!\n');

        // 5. Verificar se foi criado
        const fs = await import('fs');
        const path = await import('path');
        const dbPath = path.resolve(`/root/INOVAPRO/isa-1.0-de9193c7/memoria/${client.matricula}/memoria_ia.db`);

        if (fs.existsSync(dbPath)) {
            console.log(`✅ Banco SQLite criado: ${dbPath}`);

            // Verificar produtos no banco
            const memory = await localMemoryService.getMemoryConfig(client.matricula);
            console.log(`\n📊 Produtos no SQLite: ${memory.products?.length || 0}`);

            if (memory.products && memory.products.length > 0) {
                console.log('\n🎉 SUCESSO! Produtos sincronizados:');
                memory.products.slice(0, 3).forEach(p => {
                    console.log(`   - ${p.name} (${p.code || 'S/C'}) - R$ ${p.price}`);
                });
                if (memory.products.length > 3) {
                    console.log(`   ... e mais ${memory.products.length - 3} produtos`);
                }
            }
        } else {
            console.log('❌ Banco SQLite não foi criado.');
        }

    } catch (error) {
        console.error('❌ Erro na sincronização:', error.message);
    }
}

syncMatricula666058().catch(console.error);
