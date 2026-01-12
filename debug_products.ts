import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProducts() {
    console.log('🔍 Buscando produtos no Supabase...');

    // Buscar todos os produtos
    const { data: products, error } = await supabase
        .from('products')
        .select('user_id, name')
        .limit(50);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    // Agrupar por user_id
    const grouped: any = {};
    products?.forEach(p => {
        if (!grouped[p.user_id]) grouped[p.user_id] = [];
        grouped[p.user_id].push(p.name);
    });

    console.log('📦 Produtos encontrados por User ID:');
    for (const [userId, names] of Object.entries(grouped)) {
        console.log(`\nUser ID: ${userId}`);
        console.log(`Quantidade: ${(names as any[]).length}`);
        console.log(`Exemplos: ${(names as any[]).slice(0, 3).join(', ')}...`);
    }
}

debugProducts();
