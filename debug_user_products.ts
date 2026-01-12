import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserProducts() {
    const userId = '82a578cd-86ee-49ca-8b48-b45db1aa345d'; // User da URL da vitrine

    console.log(`🔍 Buscando produtos para User ID: ${userId}`);

    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log(`📦 Encontrados ${products.length} produtos:`);
    products.forEach(p => {
        console.log(`- [${p.code}] ${p.name} (ID: ${p.id})`);
    });

    // Também verificar a qual matrícula esse user pertence
    const { data: client } = await supabase
        .from('clients')
        .select('matricula, name, phone')
        .eq('user_id', userId)
        .maybeSingle();

    if (client) {
        console.log(`\n👤 Cliente vinculado:`);
        console.log(`   Nome: ${client.name}`);
        console.log(`   Matrícula: ${client.matricula}`);
        console.log(`   Telefone: ${client.phone}`);
    } else {
        console.log(`\n⚠️  Nenhum cliente encontrado para este User ID.`);
    }
}

checkUserProducts();
