import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCode() {
    const code = '9F1F0A';
    console.log(`🔍 Buscando produtos com código: ${code}`);

    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('code', code)
        .maybeSingle();

    if (product) {
        console.log(`✅ Produto encontrado no SUPABASE:`);
        console.log(`   Nome: ${product.name}`);
        console.log(`   Preço: ${product.price}`);
        console.log(`   User ID: ${product.user_id}`);
    } else {
        console.log(`❌ Produto não encontrado no Supabase.`);
    }
}

checkCode();
