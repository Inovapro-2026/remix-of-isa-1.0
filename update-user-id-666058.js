import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUserIdFor666058() {
    const MATRICULA = '666058';
    const VITRINE_UUID = '810f7a82-1bd7-4999-86a1-ddb4194b7254';

    console.log('=== ATUALIZANDO USER_ID PARA MATRÍCULA 666058 ===\n');

    // Atualizar o user_id do cliente
    const { data, error } = await supabase
        .from('clients')
        .update({ user_id: VITRINE_UUID })
        .eq('matricula', MATRICULA)
        .select();

    if (error) {
        console.error('❌ Erro ao atualizar:', error.message);
        return;
    }

    console.log('✅ User ID atualizado com sucesso!');
    console.log(`   Matrícula: ${MATRICULA}`);
    console.log(`   User ID: ${VITRINE_UUID}\n`);

    // Verificar produtos
    const { data: products } = await supabase
        .from('products')
        .select('id, name, code, price')
        .eq('user_id', VITRINE_UUID)
        .eq('is_active', true);

    console.log(`📦 Produtos encontrados: ${products?.length || 0}\n`);

    if (products && products.length > 0) {
        console.log('Primeiros 3 produtos:');
        products.slice(0, 3).forEach(p => {
            console.log(`   - ${p.name} (${p.code || 'S/C'}) - R$ ${p.price}`);
        });
    }

    console.log('\n✅ PRÓXIMO PASSO: Salve qualquer configuração no dashboard para disparar a sincronização automática.');
}

updateUserIdFor666058().catch(console.error);
